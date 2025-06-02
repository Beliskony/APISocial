"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCommentZodSchema = exports.UpdateCommentZodSchema = exports.CreateCommentZodSchema = void 0;
const zod_1 = require("zod");
exports.CreateCommentZodSchema = zod_1.z.object({
    user: zod_1.z.string().nonempty("User ID is required"),
    post: zod_1.z.string().nonempty("Post ID is required"),
    content: zod_1.z.string().nonempty("Comment content is required"),
    createdAt: zod_1.z.date().optional(),
});
exports.UpdateCommentZodSchema = zod_1.z.object({
    user: zod_1.z.string().nonempty("User ID is required"),
    commentId: zod_1.z.string().nonempty("Comment ID is required"),
    newCommentId: zod_1.z.string().nonempty("New Comment ID is required"),
    content: zod_1.z.string().nonempty("Comment content is required"),
    createdAt: zod_1.z.date().optional(),
});
exports.DeleteCommentZodSchema = zod_1.z.object({
    user: zod_1.z.string().nonempty("User ID is required"),
    commentId: zod_1.z.string().nonempty("Comment ID is required"),
});
