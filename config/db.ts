/**
 * config/db.ts
 * Reusable MongoDB connection using Mongoose.
 * Reads MONGO_URI from the .env file via dotenv.
 */

import mongoose from 'mongoose';

/**
 * Opens a Mongoose connection to MongoDB.
 * Calls process.exit(1) on failure so the API never starts without a DB.
 */
const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI as string;

    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Build indexes automatically (safe for most apps)
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

// Close connection gracefully on SIGINT (Ctrl+C / PM2 stop)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed gracefully (SIGINT).');
  process.exit(0);
});

export default connectDB;
