// src/infrastructure/database/models/User.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    location?: string;
    birthDate?: Date;
    profilePicture?: string;
    coverPicture?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
  contact: {
    phoneNumber?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  social: {
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    friendRequests: Types.ObjectId[];
    friends: Types.ObjectId[];
    blockedUsers: Types.ObjectId[];
    followRequests: Types.ObjectId[];
  };
  content: {
    posts: Types.ObjectId[];
    stories: Types.ObjectId[];
    savedPosts: Types.ObjectId[];
    likedPosts: Types.ObjectId[];
  };
  security: {
    otp?: string;
    otpExpires?: Date;
    lastPasswordChange?: Date;
    loginAttempts: number;
    lockUntil?: Date;
    twoFactorEnabled: boolean;
  };
  preferences: {
    privacy: {
      profile: 'public' | 'friends' | 'private';
      posts: 'public' | 'friends' | 'private';
      friendsList: 'public' | 'friends' | 'private';
    };
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      newFollower: boolean;
      newMessage: boolean;
      postLikes: boolean;
      postComments: boolean;
    };
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  status: {
    isOnline: boolean;
    lastSeen: Date;
    isActive: boolean;
    deactivationReason?: string;
    suspendedUntil?: Date;
  };
  analytics: {
    postCount: number;
    followerCount: number;
    followingCount: number;
    friendCount: number;
    lastLogin: Date;
    loginCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    profile: {
      firstName: { type: String, trim: true, maxlength: 50 },
      lastName: { type: String, trim: true, maxlength: 50 },
      bio: { type: String, maxlength: 500 },
      website: { type: String },
      location: { type: String, maxlength: 100 },
      birthDate: { type: Date },
      profilePicture: { 
        type: String, 
        default: 'https://i.pinimg.com/736x/76/47/5e/76475ef2f299694fda13ac1b2dfbda8a.jpg' 
      },
      coverPicture: { 
        type: String, 
        default: 'https://example.com/default-cover.jpg' 
      },
      gender: { 
        type: String, 
        enum: ['male', 'female', 'other', 'prefer_not_to_say'] 
      }
    },
    contact: {
      phoneNumber: { 
        type: String, 
        unique: true, 
        sparse: true 
      },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false }
    },
    social: {
      followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      followRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    content: {
      posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
      stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
      savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
      likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
    },
    security: {
      otp: { type: String },
      otpExpires: { type: Date },
      lastPasswordChange: { type: Date },
      loginAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date },
      twoFactorEnabled: { type: Boolean, default: false }
    },
    preferences: {
      privacy: {
        profile: { 
          type: String, 
          enum: ['public', 'friends', 'private'], 
          default: 'public' 
        },
        posts: { 
          type: String, 
          enum: ['public', 'friends', 'private'], 
          default: 'public' 
        },
        friendsList: { 
          type: String, 
          enum: ['public', 'friends', 'private'], 
          default: 'friends' 
        }
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        newFollower: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        postLikes: { type: Boolean, default: true },
        postComments: { type: Boolean, default: true }
      },
      language: { type: String, default: 'fr' },
      theme: { 
        type: String, 
        enum: ['light', 'dark', 'auto'], 
        default: 'auto' 
      }
    },
    status: {
      isOnline: { type: Boolean, default: false },
      lastSeen: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
      deactivationReason: { type: String },
      suspendedUntil: { type: Date }
    },
    analytics: {
      postCount: { type: Number, default: 0 },
      followerCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      friendCount: { type: Number, default: 0 },
      lastLogin: { type: Date, default: Date.now },
      loginCount: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret: Record<string, any>) {
        // Supprimer les champs sensibles
        delete ret.password;
        delete ret.security;
        return ret;
      }
    }
  }
);

// Index pour les recherches
UserSchema.index({ username: 'text', 'profile.firstName': 'text', 'profile.lastName': 'text' });
UserSchema.index({ 'contact.emailVerified': 1 });
UserSchema.index({ 'status.isActive': 1 });

// Middleware pour mettre à jour les compteurs - CORRIGÉ
UserSchema.pre('save', function(next) {
  const user = this as unknown as IUser;
  
  if (user.isModified('social.followers')) {
    user.analytics.followerCount = user.social.followers.length;
  }
  if (user.isModified('social.following')) {
    user.analytics.followingCount = user.social.following.length;
  }
  if (user.isModified('social.friends')) {
    user.analytics.friendCount = user.social.friends.length;
  }
  if (user.isModified('content.posts')) {
    user.analytics.postCount = user.content.posts.length;
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema);