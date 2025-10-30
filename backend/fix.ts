import prisma from './src/db';

async function main() {
  const result = await prisma.expense.updateMany({
    where: { description: 'Payment Reminder' },
    data: { status: 'REMINDER' }
  });
  console.log(`Updated ${result.count} rows`);
}
main();
