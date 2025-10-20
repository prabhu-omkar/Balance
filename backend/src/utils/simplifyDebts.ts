export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(transactions: Transaction[]): Transaction[] {
  // 1. Calculate the Net Balance for every user (Total Paid - Total Owed)
  const balances: Record<string, number> = {};

  for (const t of transactions) {
    if (!balances[t.from]) balances[t.from] = 0;
    if (!balances[t.to]) balances[t.to] = 0;

    balances[t.from] -= t.amount;
    balances[t.to] += t.amount;
  }

  // 2. Separate users into two lists: Debtors (negative balance) and Creditors (positive balance)
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ userId, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  }

  // Sort initially to match the "maximum debtor with maximum creditor" rule
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplified: Transaction[] = [];

  // 3. Uses a Greedy Algorithm to settle the maximum debtor with the maximum creditor
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    simplified.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: parseFloat(settledAmount.toFixed(2)),
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (Math.abs(debtor.amount) < 0.01) {
      i++;
    }
    if (Math.abs(creditor.amount) < 0.01) {
      j++;
    }
  }

  return simplified;
}
