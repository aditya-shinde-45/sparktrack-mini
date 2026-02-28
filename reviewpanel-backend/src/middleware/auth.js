import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const JWT_SECRET = config.jwt.secret;

export const authenticateMentor = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is a mentor
    if (decoded.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Mentors only.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
