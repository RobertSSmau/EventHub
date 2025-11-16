/**
 * MongoDB connection configuration
 * Used for chat messages (better performance for real-time data)
 */

import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
      console.warn('MONGODB_URL not found, chat features disabled');
      return null;
    }

    await mongoose.connect(mongoUrl, {
      dbName: 'eventhub_chat',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.warn('Chat features will be disabled');
    return null;
  }
}

export async function disconnectMongoDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
}

export function getMongoConnection() {
  return mongoose.connection;
}
