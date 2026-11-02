// Promote an existing user to admin.
// Usage (from the blogger/ folder): npm run make-admin -- someone@example.com
// Deliberately a command-line script, not an API: no HTTP request can ever grant admin rights.
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
if (user) {
  await AuditLog.create({ action: 'user.role_change', actorEmail: 'command line', target: email, details: { role: 'admin' } });
}
await mongoose.disconnect();

if (!user) {
  console.error(`No user found with email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`${email} is now an admin. Log out and log back in so the new role is in the token.`);
