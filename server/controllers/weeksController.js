import Week from '../models/Week.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';


export const getWeeks = async (req, res) => {
  try {
    const weeks = await Week.find().sort({ week_number: -1 });
    res.json(weeks);
  } catch (error) {
    console.error('Get weeks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getActiveWeek = async (req, res) => {
  try {
    const week = await Week.findOne({ isActive: true });
    if (!week) {
      return res.status(404).json({ message: 'No active week found' });
    }
    res.json(week);
  } catch (error) {
    console.error('Get active week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getWeekById = async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }
    res.json(week);
  } catch (error) {
    console.error('Get week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getWeekSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      week_id: req.params.id,
      status: 'approved'
    })
      .populate('user_id', 'username displayName members')
      .sort({ created_at: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get week submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getPublicStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'member' });
    const totalWeeks = await Week.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    res.json({
      totalUsers,
      totalWeeks,
      totalSubmissions
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
