import mongoose, { Schema, Document } from 'mongoose';
import PostModel from './Post.model';
import { ref } from 'process';

export interface IUser extends Document { 
    _id: string;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
    phoneNumber?: string;
    followers?: mongoose.Types.ObjectId[];
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
        profilePicture: { type: String, default: 'https://img.icons8.com/?size=100&id=undefined&format=png&color=000000' },
        phoneNumber: { type: String, unique: true, sparse: true, require:true },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User references
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
        otp: { type: String}, // OTP for verification
        otpExpires: { type: Number }, // Expiration time for OTP
    },
    {
        timestamps: true, 
    }
);

export default mongoose.model<IUser>('User', UserSchema);