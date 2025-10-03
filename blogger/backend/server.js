import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blogs.js';
import path from 'path';

const app = express();

connectDB();

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

const _dirname = path.resolve();
app.use(express.static(path.join(_dirname, '/frontend/dist')));

app.get(/^\/(?!api).*/, (_, res) => {
  res.sendFile(path.resolve(_dirname, 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));