import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  displayName: {
    type: String,
    trim: true,
  },
  profileImageUrl: {
    type: String,
    trim: true,
    default: "",
  },
  coverImageUrl: {
    type: String,
    trim: true,
    default: "",
  },
  headline: {
    type: String,
    trim: true,
    default: "",
  },
  bio: {
    type: String,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    trim: true,
    default: "",
  },
  socialLinks: {
    website: {
      type: String,
      trim: true,
      default: "",
    },
    github: {
      type: String,
      trim: true,
      default: "",
    },
    linkedin: {
      type: String,
      trim: true,
      default: "",
    },
    x: {
      type: String,
      trim: true,
      default: "",
    },
    instagram: {
      type: String,
      trim: true,
      default: "",
    },
  },
  members: [
    {
      name: String,
      role: String,
      githubUsername: String,
      email: String,
      bio: String,
    },
  ],
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  refreshTokens: [
    {
      tokenHash: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      revokedAt: {
        type: Date,
        default: null,
      },
      replacedByTokenHash: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: "",
      },
      ip: {
        type: String,
        default: "",
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  this.updated_at = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

export default mongoose.model("User", userSchema);
