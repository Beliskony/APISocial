import { z } from 'zod';

export const LikeZodSchema = z.object({
    userId: z.string().nonempty("User ID is required"),
    postId: z.string().nonempty("Post ID is required"),
});

export type LikeValidationType = z.infer<typeof LikeZodSchema>;