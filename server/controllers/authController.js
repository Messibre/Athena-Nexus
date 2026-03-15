import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { isValidPassword } from '../utils/validators.js';

// Signup (for groups to register themselves)
export const signup = async (req, res) => {
  try {
    const { username, password, displayName, email, members } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and contain both letters and numbers' 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Parse members if provided as string
    let membersArray = [];
    if (members) {
      if (typeof members === 'string') {
        membersArray = members.split(',').map(name => ({ name: name.trim() })).filter(m => m.name);
      } else if (Array.isArray(members)) {
        membersArray = members;
      }
    }

    const user = new User({
      username,
      password_hash: password, // Will be hashed by pre-save hook
      role: 'member',
      displayName: displayName || username,
      email: email || '',
      members: membersArray,
      contactEmail: email || ''
    });

    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: user._id,
      action: 'login',
      detail: 'New user registered'
    });

    // Auto-login after signup
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName
      },
      message: 'Account created successfully!'
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      try {
        await ActivityLog.create({
          action: 'failed_login',
          detail: `Failed login attempt for username: ${username}`
        });
      } catch (logError) {
        console.error('Error logging failed login:', logError);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      try {
        await ActivityLog.create({
          user_id: user._id,
          action: 'failed_login',
          detail: 'Invalid password'
        });
      } catch (logError) {
        console.error('Error logging failed login:', logError);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    // Log successful login
    try {
      await ActivityLog.create({
        user_id: user._id,
        action: 'login',
        detail: 'Successful login'
      });
    } catch (logError) {
      console.error('Error logging successful login:', logError);
      // Don't fail the login if logging fails
    }

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password_hash');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        members: user.members,
        contactEmail: user.contactEmail
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Change password (for first login or password reset)
export const changePassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and contain both letters and numbers' 
      });
    }

    user.password_hash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
