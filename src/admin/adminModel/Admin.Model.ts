import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  profilePicture?: string;
  password: string;
  role: 'admin' | 'super_admin';
  permissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewAnalytics: boolean;
    canManageSystem: boolean;
  };
  status: {
    isActive: boolean;
    lastLogin?: Date;
    loginAttempts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true
    },
    profilePicture: { 
      type: String,
      default: 'https://example.com/default-admin.jpg'
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin'
    },
    permissions: {
      canManageUsers: { type: Boolean, default: true },
      canManageContent: { type: Boolean, default: true },
      canViewAnalytics: { type: Boolean, default: true },
      canManageSystem: { type: Boolean, default: false }
    },
    status: {
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date },
      loginAttempts: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);