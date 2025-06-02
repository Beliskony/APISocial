"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeZodSchema = void 0;
const zod_1 = require("zod");
exports.LikeZodSchema = zod_1.z.object({
    userId: zod_1.z.string().nonempty("User ID is required"),
    postId: zod_1.z.string().nonempty("Post ID is required"),
    isLiked: zod_1.z.boolean().default(false), // Default to false if not provided
});
