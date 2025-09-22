import { Response, NextFunction } from "express";
import { AuthRequest } from "./Auth.Types";
import { ZodSchema } from "zod";
import PostModel from "../models/Post.model";

export const DeletePostMiddleware = (schema: ZodSchema) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✅ Valider uniquement le postId (pas l'user)
      const result = schema.safeParse({ postId: req.params.postId });
      if (!result.success) {
        res.status(400).json({ message: "Validation failed", errors: result.error.errors });
        return;
      }

      const post = await PostModel.findById(result.data.postId);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }

      // ✅ Comparaison avec l'utilisateur authentifié (via JWT)
      if (post.user.toString() !== req.user?._id.toString()) {
        res.status(403).json({ message: `You are not authorized to delete this post` });
        return;
      }

      // facultatif : attacher le post au body
      (req as any).post = post;

      next();
    } catch (error) {
      console.error("❌ Erreur middleware DeletePost :", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
};
