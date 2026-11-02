// Promote an existing user to admin.
// Usage (from the blogger/ folder): npm run make-admin -- someone@example.com
import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from '../models/User.js';

config();

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
await mongoose.disconnect();

if (!user) {
  console.error(`No user found with email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`${email} is now an admin. Log out and log back in so the new role is in the token.`);
