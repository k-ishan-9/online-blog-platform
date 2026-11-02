import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never the real password
    // 'author' manages only their own posts; 'admin' can also moderate and see analytics
    role: { type: String, enum: ['author', 'admin'], default: 'author' },
  },
  { timestamps: true }
);

// Never send the password hash in an API response, even by accident
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
