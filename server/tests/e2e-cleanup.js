// E2E cleanup helper — removes all artifacts created by tests/e2e.ps1.
// Safe to re-run: patterns are namespaced to the test suite only.
const path = require('path');
const mongoose = require(path.join(__dirname, '..', 'node_modules', 'mongoose'));

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  await mongoose.connect(uri);
  const db = mongoose.connection;

  const users = await db.collection('users').find({ email: /^e2e\..*@test\.local$/ }).toArray();
  const userIds = users.map((u) => u._id);
  console.log(`e2e users found: ${userIds.length}`);

  if (userIds.length > 0) {
    const orderRes = await db.collection('orders').deleteMany({ user: { $in: userIds } });
    console.log(`e2e orders deleted: ${orderRes.deletedCount}`);
    await db.collection('users').deleteMany({ _id: { $in: userIds } });
    console.log(`e2e users deleted: ${userIds.length}`);
  }

  const prodRes = await db.collection('products').deleteMany({ name: /^E2E Product / });
  console.log(`e2e products deleted: ${prodRes.deletedCount}`);

  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
