const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.expense.updateMany({
    where: { description: 'Payment Reminder' },
    data: { status: 'REMINDER' }
  });
  console.log('Done');
}
main();
   