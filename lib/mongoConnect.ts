// src/lib/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Harap setel MONGODB_URI di .env.local');
}

let isConnected: boolean = false;

const mongoConnect = async (): Promise<void> => {
  if (isConnected) {
    console.log('Menggunakan koneksi MongoDB yang sudah ada.');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);

    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected');
  } catch (error: unknown) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default mongoConnect;
