import jwt from 'jsonwebtoken';

// Authentication: verifies the JWT from the httpOnly cookie and sets req.user = { id, email, name, role }
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Please log in' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
};

export default authMiddleware;
