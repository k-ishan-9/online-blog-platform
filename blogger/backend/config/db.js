import mongoose from 'mongoose';

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // fail fast: an API without its database is worse than no API
  }
};

export default connectDB;
