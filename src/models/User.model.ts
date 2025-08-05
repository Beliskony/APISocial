import mongoose, { Schema, Document } from 'mongoose';
import PostModel from './Post.model';

export interface IUser extends Document { 
    _id: string;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
    phoneNumber?: string;
    followers?: mongoose.Types.ObjectId[];
    stories?: mongoose.Types.ObjectId[];
    otp?: string;
    otpExpires?:number;
    createdAt?: Date;
    updatedAt?: Date;
    posts?: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profilePicture: { type: String, default: 'https://i.pinimg.com/736x/76/47/5e/76475ef2f299694fda13ac1b2dfbda8a.jpg' },
        phoneNumber: { type: String, unique: true, sparse: true, required:true },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User references
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
        stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
        otp: { type: String}, // OTP for verification
        otpExpires: { type: Number }, // Expiration time for OTP
    },
    {
        timestamps: true, 
    }
);

export default mongoose.model<IUser>('User', UserSchema);