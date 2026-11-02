import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // 'author' can manage only their own posts; 'admin' can also moderate every post
  role: { type: String, enum: ['author', 'admin'], default: 'author' }
});

export default mongoose.model('User', userSchema);
