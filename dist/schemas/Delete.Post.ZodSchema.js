"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePostSchema = void 0;
// DeletePostSchema.ts
const zod_1 = require("zod");
exports.DeletePostSchema = zod_1.z.object({
    postId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid post ID format").nonempty("Post ID is required"),
    user: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid post ID format").nonempty("User ID is required"),
});
