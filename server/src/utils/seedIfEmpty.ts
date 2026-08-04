import { User } from "../models/User";
import { Product } from "../models/Product";
import { DiscountCode } from "../models/DiscountCode";
import { seedUsers, productData, discountCodes } from "../data/seedData";

// Idempotent auto-seed: populates demo data only when collections are empty.
// This guarantees a freshly provisioned database (e.g. a new docker-compose
// volume) produces a working app without a manual `npm run seed` step.
export const seedIfEmpty = async (): Promise<boolean> => {
  let seeded = false;

  if ((await User.countDocuments()) === 0) {
    await User.create(seedUsers);
    console.log(`Auto-seed: created ${seedUsers.length} users`);
    seeded = true;
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(productData);
    console.log(`Auto-seed: created ${productData.length} products`);
    seeded = true;
  }

  if ((await DiscountCode.countDocuments()) === 0) {
    await DiscountCode.insertMany(discountCodes);
    console.log(`Auto-seed: created ${discountCodes.length} discount codes`);
    seeded = true;
  }

  if (!seeded) {
    console.log("Auto-seed: database already populated, skipping");
  }

  return seeded;
};
