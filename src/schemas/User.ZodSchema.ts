import { param } from "express-validator";
import { z } from "zod";

export const UserZodSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
    profilePicture: z.string().optional(),
    phoneNumber: z.string().regex(/^(\+?\d{10,20})$/, "Invalid phone number").min(10, "Phone number must be at least 10 digits long").max(20).optional(),
    followers: z.array(z.string()).optional(), // Array of user IDs (as strings)
    createdAt: z.date().optional(), // Date of account creation (optional for validation)
});





export const LoginZodSchema = z.object({
     identifiant: z.string().min(5, "L'identifiant est requis")
     .refine((val) => {
      // Vérifie si c'est un email valide OU un numéro de téléphone valide
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isPhone = /^(\+?\d{10,20})$/.test(val);
      return isEmail || isPhone;
    }, {
      message: "L'identifiant doit être un email ou un numéro de téléphone valide",
    }),
    password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
})


// schemas/User.ZodSchema.ts
export const FollowZodSchema = z.object({
  params: z.object({
    targetId: z.string().min(1, "targetId is required"),
  }),
  body: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
});



export const UpdateProfileZodSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").optional(),
    email: z.string().email("Invalid email address").trim().toLowerCase().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[@$!%*?&#]/, "Password must contain at least one special character")
      .optional(),
    profilePicture: z.string().optional(),
    phoneNumber: z.string().regex(/^(\+?\d{10,20})$/, "Invalid phone number").min(10, "Phone number must be at least 10 digits long").max(20).optional(),
  })
});
