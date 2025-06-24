import { z } from 'zod';

export const CreateCommentZodSchema = z.object({
    content: z.string().nonempty("Comment content is required"),
});
export type CommentValidationType = z.infer<typeof CreateCommentZodSchema>;


export const UpdateCommentZodSchema = z.object({
    user: z.string().nonempty("User ID is required"),
    commentId: z.string().nonempty("Comment ID is required"),
    newComment: z.string().nonempty("Comment content is required"),
});
export type UpdateCommentValidationType = z.infer<typeof UpdateCommentZodSchema>;


export const DeleteCommentZodSchema = z.object({
    user: z.string().nonempty("User ID is required"),
    commentId: z.string().nonempty("Comment ID is required"),
});
export type DeleteCommentValidationType = z.infer<typeof DeleteCommentZodSchema>;




