import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  week_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Week',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  github_repo_url: {
    type: String,
    required: true,
    trim: true
  },
  github_live_demo_url: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 300,
    trim: true
  },
  screenshotUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    enum: ['web', 'mobile', 'uiux']
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewerNotes: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});


submissionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Submission', submissionSchema);

