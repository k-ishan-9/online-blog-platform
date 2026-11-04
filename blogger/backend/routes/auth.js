import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validation/schemas.js';
import { authCookieOptions, TOKEN_TTL_MS } from '../config/settings.js';
import { audit } from '../utils/audit.js';

const router = express.Router();
const BCRYPT_COST = 10; // 2^10 rounds: slow for attackers, about 70 ms for us

// Compared against when the email doesn't exist, so a wrong email and a wrong password
// take the same time and the response time can't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  const user = await User.create({
    name: name || email.split('@')[0],
    email,
    password: await bcrypt.hash(password, BCRYPT_COST),
  });
  audit(req, 'auth.signup', { target: user._id, actorEmail: email });
  res.status(201).json({ message: 'Account created. Please log in.' });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !valid) {
    audit(req, 'auth.login_failed', { actorEmail: email });
    // Same message for both cases, so attackers can't find out which emails exist
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // The role travels inside the signed token, so requireRole can check it without a DB lookup
  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1h' }
  );
  res.cookie('token', token, { ...authCookieOptions(), maxAge: TOKEN_TTL_MS });
  res.json({ message: 'Login successful', user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

// Who is logged in? Answers { user: null } instead of 401 for visitors, because
// "not logged in" is a normal state for the public site, not an error.
router.get('/me', (req, res) => {
  try {
    const { id, email, name, role } = jwt.verify(req.cookies?.token ?? '', process.env.JWT_SECRET);
    res.json({ user: { id, email, name, role } });
  } catch {
    res.json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', authCookieOptions());
  res.json({ message: 'Logged out' });
});

export default router;
