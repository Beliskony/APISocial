import { z } from 'zod';

export const LikeZodSchema = z.object({
    userId: z.string().min(1),
});

export type LikeValidationType = z.infer<typeof LikeZodSchema>;