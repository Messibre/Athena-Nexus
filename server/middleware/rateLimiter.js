import rateLimit from 'express-rate-limit';
import ActivityLog from '../models/ActivityLog.js';


export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 3, 
  message: 'Too many login attempts, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  
  validate: {
    xForwardedForHeader: false
  },
  handler: async (req, res) => {
    
    try {
      await ActivityLog.create({
        action: 'failed_login',
        detail: `Rate limit exceeded for IP: ${req.ip || 'unknown'}`
      });
    } catch (error) {
      console.error('Error logging rate limit:', error);
    }
    res.status(429).json({
      message: 'Too many login attempts, please try again after 5 minutes'
    });
  }
});


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later',
  
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  
  validate: {
    xForwardedForHeader: false
  }
});

