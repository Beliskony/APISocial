import { Router } from "express";
import { CommentController } from "../controllers/commentaireController";
import { CommentMiddleware } from "../middlewares/CommentMiddleware";
import { authenticateJWT } from "../middlewares/auth";
import { 
    CreateCommentZodSchema, 
    DeleteCommentZodSchema, 
    UpdateCommentZodSchema,
    GetCommentsZodSchema,
    ToggleLikeZodSchema
} from "../schemas/Comment.ZodSchema";
import { inject, injectable } from "inversify";
import { formParser } from "../middlewares/form-data";
import { TYPES } from "../config/TYPES";

@injectable()
export class CommentRouter {
    public router: Router;
    private commentController: CommentController;

    constructor(@inject(TYPES.CommentController) commentController: CommentController) {
        this.router = Router();
        this.commentController = commentController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // ✅ Créer un commentaire
        this.router.post(
            "/posts/:postId/comments", 
            authenticateJWT, 
            formParser, 
            CommentMiddleware(CreateCommentZodSchema), 
            this.commentController.addComment.bind(this.commentController)
        );

        // ✅ Récupérer les commentaires d'un post avec pagination
        this.router.get(
            "/posts/:postId/comments", 
            CommentMiddleware(GetCommentsZodSchema), 
            this.commentController.getCommentsByPostId.bind(this.commentController)
        );

        // ✅ Récupérer les réponses d'un commentaire
        this.router.get(
            "/comments/:commentId/replies", 
            this.commentController.getCommentReplies.bind(this.commentController)
        );

        // ✅ Mettre à jour un commentaire
        this.router.put(
            "/comments/:commentId", 
            authenticateJWT, 
            formParser, 
            CommentMiddleware(UpdateCommentZodSchema), 
            this.commentController.updateComment.bind(this.commentController)
        );

        // ✅ Supprimer un commentaire
        this.router.delete(
            "/comments/:commentId", 
            authenticateJWT, 
            CommentMiddleware(DeleteCommentZodSchema), 
            this.commentController.deleteComment.bind(this.commentController)
        );

        // ✅ Gestion des likes
        this.router.post(
            "/comments/:commentId/like", 
            authenticateJWT, 
            CommentMiddleware(ToggleLikeZodSchema), 
            this.commentController.toggleLike.bind(this.commentController)
        );

        // ✅ Commentaires populaires
        this.router.get(
            "/posts/:postId/comments/popular", 
            this.commentController.getPopularComments.bind(this.commentController)
        );

        // ✅ Statistiques des commentaires
        this.router.get(
            "/posts/:postId/comments/stats", 
            this.commentController.getCommentStats.bind(this.commentController)
        );
    }
}