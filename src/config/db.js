const mongoose = require('mongoose');

// cached across invocations on serverless (Vercel reuses warm instances)
let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jahid-capture';
    // explicit dbName so an Atlas URI without a path doesn't land in the shared "test" db
    connecting = mongoose
      .connect(uri, { dbName: process.env.MONGODB_DB || 'jahid-capture' })
      .then(() => {
        console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  await connecting;
}

module.exports = connectDB;
