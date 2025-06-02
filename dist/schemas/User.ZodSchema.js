"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginZodSchema = exports.UserZodSchema = void 0;
const zod_1 = require("zod");
exports.UserZodSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters long"),
    email: zod_1.z.string().email("Invalid email address").trim().toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
    profilePicture: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().regex(/^(\+?\d{10,20})$/, "Invalid phone number").min(10, "Phone number must be at least 10 digits long").max(20).optional(),
    followers: zod_1.z.array(zod_1.z.string()).optional(), // Array of user IDs (as strings)
    createdAt: zod_1.z.date().optional(), // Date of account creation (optional for validation)
});
exports.LoginZodSchema = zod_1.z.object({
    email: zod_1.z.string().email().trim().toLowerCase().optional(),
    username: zod_1.z.string().optional(),
    contact: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
}).refine(data => data.email || data.username || data.contact, {
    message: "Email, username, or contact is required",
    path: ["email"]
});
