import { Request } from "express";

export interface AuthUser {
 _id: string; // User ID from the JWT token
 username: string; // Username from the JWT token
 phoneNumber: string; // Optional phone number from the JWT token
 email: string; // Optional email from the JWT token
 followers?: string[]; // Optional followers array from the JWT token
 profilePicture?: string; // Optional profile picture from the JWT token
 posts?: string[]; // Optional posts array from the JWT token
}

export interface AuthRequest extends Request {
    user?: AuthUser; // Optional user object from the JWT token
}


