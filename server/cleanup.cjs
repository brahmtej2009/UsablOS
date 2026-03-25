const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.window.deleteMany({})
  .then(r => { console.log('Cleared ' + r.count + ' Window rows'); })
  .catch(e => { console.error('Error:', e.message); })
  .finally(() => p.$disconnect());
