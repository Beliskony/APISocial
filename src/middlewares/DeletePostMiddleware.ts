import { Response, NextFunction } from "express";
import { AuthRequest } from "./Auth.Types";
import { ZodSchema } from "zod";
import PostModel from "../models/Post.model";

export const DeletePostMiddleware = (schema: ZodSchema) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            // ✅ Combine params dans un objet à valider
            const dataToValidate = {
                postId: req.params.postId,
                user: req.params.user,
            };

            const result = schema.safeParse(dataToValidate);
            if (!result.success) {
                res.status(400).json({ message: "Validation failed", errors: result.error.errors });
                return;
            }

            const post = await PostModel.findById(result.data.postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            if (post.user.toString() !== result.data.user) {
                res.status(403).json({ message: "You are not authorized to delete this post" });
                return;
            }

            req.body.post = post; // facultatif

            next();
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
            return;
        }
    };
};
