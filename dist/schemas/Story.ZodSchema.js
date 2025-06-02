"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteStoryZodSchema = exports.StoryZodSchema = void 0;
const zod_1 = require("zod");
exports.StoryZodSchema = zod_1.z.object({
    userId: zod_1.z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "userId doit être un ObjectId valide"), // Assuming authorId is a MongoDB ObjectId
    content: zod_1.z.object({
        type: zod_1.z.enum(["image", "video"]),
        data: zod_1.z.string().url("Le lien doit être une URL valide"),
    }),
    createdAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date().optional(),
});
exports.DeleteStoryZodSchema = zod_1.z.object({
    id: zod_1.z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid ID format"),
});
