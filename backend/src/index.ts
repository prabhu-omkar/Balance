import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db';
import { simplifyDebts, Transaction } from './utils/simplifyDebts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// AUTHENTICATION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password, upiId, globalOptIn } = req.body;
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, password: hashedPassword, upiId, globalOptIn }
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, upiId: user.upiId, globalOptIn: user.globalOptIn } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, upiId: user.upiId } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// USERS
app.get('/api/users/search', async (req, res) => {
  const { q, currentUserId } = req.query;
  const users = await prisma.user.findMany({
    where: {
      name: { contains: String(q), mode: 'insensitive' },
      id: { not: String(currentUserId) }
    },
    select: { id: true, name: true, upiId: true }
  });
  res.json(users);
});

// DIRECT EXPENSES (1-ON-1)
app.post('/api/expenses/direct', async (req, res) => {
  const { description, totalAmount, paidByUserId, splits, createdByUserId, status } = req.body;
  const expense = await prisma.expense.create({
    data: {
      groupId: null,
      description,
      totalAmount,
      paidByUserId,
      status: status || 'PENDING',
      createdByUserId,
      splits: { create: splits }
    }
  });
  res.json(expense);
});

app.get('/api/expenses/pending/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Received requests (Someone else created it, waiting for me)
  const received = await prisma.expense.findMany({
    where: {
      groupId: null,
      status: { in: ['PENDING', 'REMINDER'] },
      createdByUserId: { not: userId },
      OR: [
        { paidByUserId: userId },
        { splits: { some: { userId } } }
      ]
    },
    include: { splits: true, paidBy: { select: { name: true } } }
  });

  // Sent requests (I created it, waiting for someone else)
  const sent = await prisma.expense.findMany({
    where: {
      groupId: null,
      status: { in: ['PENDING', 'REMINDER'] },
      createdByUserId: userId
    },
    include: { splits: true, paidBy: { select: { name: true } } }
  });

  const allExpenses = [...received, ...sent];
  
  // Manually attach userWhoCreated and the other user involved
  const createdByIds = allExpenses.map(e => e.createdByUserId).filter(Boolean) as string[];
  // Also get split user names so we know who we sent it to
  const splitUserIds = allExpenses.flatMap(e => e.splits.map(s => s.userId));
  
  const usersToFetch = [...new Set([...createdByIds, ...splitUserIds, userId])];
  
  const users = await prisma.user.findMany({
    where: { id: { in: usersToFetch } },
    select: { id: true, name: true }
  });
  
  const mapWithUsers = (expenses: any[]) => expenses.map(e => {
    const creator = users.find(c => c.id === e.createdByUserId) || { name: 'Unknown' };
    const otherUserSplit = e.splits.find((s: any) => s.userId !== e.createdByUserId);
    const otherUser = users.find(c => c.id === otherUserSplit?.userId) || users.find(c => c.id === e.paidByUserId) || { name: 'Unknown' };
    return { ...e, userWhoCreated: creator, otherUser };
  });
  
  res.json({
    received: mapWithUsers(received),
    sent: mapWithUsers(sent)
  });
});

app.post('/api/expenses/:id/approve', async (req, res) => {
  const { id } = req.params;
  const expense = await prisma.expense.update({
    where: { id },
    data: { status: 'APPROVED' }
  });
  res.json(expense);
});

app.post('/api/expenses/:id/reject', async (req, res) => {
  const { id } = req.params;
  await prisma.expense.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/users/:userId/direct-debts', async (req, res) => {
  const { userId } = req.params;
  
  const allGlobalExpenses = await prisma.expense.findMany({
    where: { groupId: null, status: 'APPROVED' },
    include: { splits: true }
  });

  // Collect all unique user IDs involved to fetch their globalOptIn status
  const userIdsSet = new Set<string>();
  allGlobalExpenses.forEach(exp => {
    userIdsSet.add(exp.paidByUserId);
    exp.splits.forEach(s => userIdsSet.add(s.userId));
  });
  
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIdsSet) } },
    select: { id: true, name: true, upiId: true, globalOptIn: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const optInTx: Transaction[] = [];
  const optOutTx: Transaction[] = [];

  for (const exp of allGlobalExpenses) {
    for (const split of exp.splits) {
      if (split.userId !== exp.paidByUserId && split.amountOwed > 0) {
        const fromUser = userMap.get(split.userId);
        const toUser = userMap.get(exp.paidByUserId);
        
        if (fromUser?.globalOptIn && toUser?.globalOptIn) {
          optInTx.push({ from: split.userId, to: exp.paidByUserId, amount: split.amountOwed });
        } else {
          optOutTx.push({ from: split.userId, to: exp.paidByUserId, amount: split.amountOwed });
        }
      }
    }
  }

  // Collapse optOut transactions into net pairwise balances
  const optOutBalances: Record<string, number> = {}; // key: "userA_userB" (alphabetical)
  for (const tx of optOutTx) {
    const sorted = [tx.from, tx.to].sort();
    const key = `${sorted[0]}_${sorted[1]}`;
    if (!optOutBalances[key]) optOutBalances[key] = 0;
    
    // sorted[0] is positive if it is owed money.
    // if tx.from === sorted[0], it means sorted[0] owes money (negative)
    if (tx.from === sorted[0]) {
      optOutBalances[key] -= tx.amount;
    } else {
      optOutBalances[key] += tx.amount;
    }
  }

  const collapsedOptOut: Transaction[] = [];
  for (const [key, bal] of Object.entries(optOutBalances)) {
    if (Math.abs(bal) < 0.01) continue;
    const [u1, u2] = key.split('_');
    if (bal > 0) {
      // u1 is positive -> u2 owes u1
      collapsedOptOut.push({ from: u2, to: u1, amount: bal });
    } else {
      // u1 is negative -> u1 owes u2
      collapsedOptOut.push({ from: u1, to: u2, amount: Math.abs(bal) });
    }
  }

  const simplifiedOptIn = simplifyDebts(optInTx);
  const combinedTransactions = [...simplifiedOptIn, ...collapsedOptOut];

  // Filter for the current user
  const userTransactions = combinedTransactions.filter(t => t.from === userId || t.to === userId);
  
  const finalDebts = userTransactions.map(t => {
    const otherUserId = t.from === userId ? t.to : t.from;
    const otherUser = userMap.get(otherUserId);
    const balance = t.to === userId ? t.amount : -t.amount;
    
    return {
      userId: otherUserId,
      name: otherUser?.name || 'Unknown',
      upiId: otherUser?.upiId || '',
      globalOptIn: otherUser?.globalOptIn,
      balance
    };
  });

  res.json(finalDebts);
});

// EXPENSES (GROUP)
app.post('/api/expenses', async (req, res) => {
  const { groupId, description, totalAmount, paidByUserId, splits } = req.body;
  const expense = await prisma.expense.create({
    data: {
      groupId,
      description,
      totalAmount,
      paidByUserId,
      status: 'APPROVED',
      splits: { create: splits }
    }
  });
  res.json(expense);
});

// GROUPS
app.post('/api/groups', async (req, res) => {
  const { name, memberIds, createdById } = req.body;
  const group = await prisma.group.create({
    data: {
      name,
      createdByUserId: createdById,
      members: { create: memberIds.map((id: string) => ({ userId: id })) }
    }
  });
  res.json(group);
});

app.get('/api/groups', async (req, res) => {
  const { userId } = req.query;
  const groups = await prisma.group.findMany({
    where: userId ? { members: { some: { userId: String(userId) } } } : undefined,
    include: { members: { include: { user: true } } }
  });
  res.json(groups);
});

app.get('/api/groups/:id', async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: req.params.id },
    include: { members: { include: { user: { select: { id: true, name: true } } } } }
  });
  res.json(group);
});

app.get('/api/groups/:id/expenses', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { groupId: req.params.id },
    include: { splits: true, paidBy: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' }
  });
  res.json(expenses);
});

app.get('/api/groups/:id/simplified', async (req, res) => {
  const { id } = req.params;
  const expenses = await prisma.expense.findMany({
    where: { groupId: id },
    include: { splits: true }
  });

  const transactions: Transaction[] = [];
  for (const exp of expenses) {
    for (const split of exp.splits) {
      if (split.userId !== exp.paidByUserId && split.amountOwed > 0) {
        transactions.push({ from: split.userId, to: exp.paidByUserId, amount: split.amountOwed });
      }
    }
  }

  const rawDebts = [...transactions];
  const simplified = simplifyDebts(transactions);
  res.json({ rawDebts, simplified });
});

// SETTLE GROUP
app.post('/api/groups/:id/settle', async (req, res) => {
  const { id } = req.params;
  const { endGroup } = req.body;

  const expenses = await prisma.expense.findMany({
    where: { groupId: id },
    include: { splits: true }
  });

  const transactions: Transaction[] = [];
  for (const exp of expenses) {
    for (const split of exp.splits) {
      if (split.userId !== exp.paidByUserId && split.amountOwed > 0) {
        transactions.push({ from: split.userId, to: exp.paidByUserId, amount: split.amountOwed });
      }
    }
  }

  const simplified = simplifyDebts(transactions);

  for (const debt of simplified) {
    await prisma.expense.create({
      data: {
        groupId: null,
        description: `Group Settlement for Group ${id}`,
        totalAmount: debt.amount,
        paidByUserId: debt.to,
        status: 'APPROVED', // auto approve group settlements
        splits: {
          create: [{ userId: debt.from, amountOwed: debt.amount }]
        }
      }
    });
  }

  await prisma.expense.deleteMany({ where: { groupId: id } });

  if (endGroup) {
    await prisma.group.delete({ where: { id } });
    res.json({ message: 'Group settled and ended' });
  } else {
    res.json({ message: 'Group settled, fresh start!' });
  }
});

// Dashboard total net balance
app.get('/api/users/:id/dashboard', async (req, res) => {
  const { id } = req.params;
  const groupMemberships = await prisma.groupMember.findMany({ where: { userId: id } });
  const groupIds = groupMemberships.map((gm: any) => gm.groupId);

  const groupExpenses = await prisma.expense.findMany({
    where: { groupId: { in: groupIds } },
    include: { splits: true }
  });

  const directExpenses = await prisma.expense.findMany({
    where: { groupId: null, status: 'APPROVED', OR: [{ paidByUserId: id }, { splits: { some: { userId: id } } }] },
    include: { splits: true }
  });

  const expenses = [...groupExpenses, ...directExpenses];
  let netBalance = 0;

  for (const exp of expenses) {
    if (exp.paidByUserId === id) netBalance += exp.totalAmount;
    for (const split of exp.splits) {
      if (split.userId === id) netBalance -= split.amountOwed;
    }
  }

  res.json({ netBalance: parseFloat(netBalance.toFixed(2)) });
});

// Serve frontend in production
import path from 'path';
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.use((req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
