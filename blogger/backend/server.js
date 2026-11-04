import 'dotenv/config';
import connectDB from './config/db.js';
import { createApp } from './app.js';

// Refuse to start with a missing secret instead of failing on the first login
for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env. See README "Getting Started".`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

await connectDB();
createApp().listen(PORT, () => console.log(`Blogify running on http://localhost:${PORT}`));
