import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  email: string;
  profilePicture?: string,
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true },
    profilePicture: {type: String},
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);
