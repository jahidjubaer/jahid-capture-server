require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Category = require('./models/Category');

const DEFAULT_CATEGORIES = ['Landscape', 'Portrait', 'Street', 'Travel'];

async function seed() {
  await connectDB();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.findOneAndUpdate(
    { username },
    { username, passwordHash },
    { upsert: true, new: true }
  );
  console.log(`Admin user ready: ${username}`);

  // only on a fresh database, so re-seeding (e.g. to change the password) never
  // brings back categories the owner deleted
  const hasCategories = await Category.exists({});
  for (const [i, name] of (hasCategories ? [] : DEFAULT_CATEGORIES).entries()) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name, order: i });
      console.log(`Category created: ${name}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
