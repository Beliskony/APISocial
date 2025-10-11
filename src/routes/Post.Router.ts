// src/api/routes/post.routes.ts
import { Router } from "express";
import { PostController } from "../controllers/postController";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/TYPES";
import { validateRequest } from "../middlewares/auth";
import { 
  CreatePostSchema, 
  UpdatePostSchema, 
  LikePostSchema, 
  SavePostSchema,
  SharePostSchema,
  VotePollSchema,
  SearchPostsSchema,
  PaginationSchema,
  PopularPostsSchema,
  PostIdParamSchema 
} from "../schemas/Post.ZodSchema";
import { authenticateJWT } from "../middlewares/auth";
import { formParserMedia } from "../middlewares/form-data";

@injectable()
export class PostRouter {
    public router: Router;
    private postController: PostController;

    constructor(@inject(TYPES.PostController) postController: PostController) {
        this.router = Router();
        this.postController = postController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // ====================
        // 📝 CRÉATION
        // ====================
        
        // Créer un post avec médias
        this.router.post(
            "/create", 
            authenticateJWT,
            formParserMedia, 
            validateRequest(CreatePostSchema), 
            this.postController.createPost.bind(this.postController)
        );

        // ====================
        // 📖 LECTURE
        // ====================
        
        // Recherche de posts (publique)
        this.router.get(
            "/search", 
            validateRequest(SearchPostsSchema),
            this.postController.searchPosts.bind(this.postController)
        );

        // Fil d'actualité personnel
        this.router.get(
            "/feed", 
            authenticateJWT,
            validateRequest(PaginationSchema),
            this.postController.getFeed.bind(this.postController)
        );

        // Posts populaires (publique)
        this.router.get(
            "/popular", 
            validateRequest(PopularPostsSchema),
            this.postController.getPopularPosts.bind(this.postController)
        );

        // Tous les posts (pour compatibilité)
        this.router.get(
            "/all", 
            authenticateJWT,
            validateRequest(PaginationSchema),
            this.postController.getAllPosts.bind(this.postController)
        );

        // Posts d'un utilisateur spécifique
        this.router.get(
            "/user/:userId", 
            authenticateJWT,
            this.postController.getPostsByUser.bind(this.postController)
        );

        // Mes posts (utilisateur connecté)
        this.router.get(
            "/my-posts", 
            authenticateJWT,
            this.postController.getPostsByUser.bind(this.postController)
        );

        // ====================
        // ✏️ MISE À JOUR
        // ====================
        
        // Mettre à jour un post
        this.router.put(
            "/:postId", 
            authenticateJWT,
            formParserMedia,
            validateRequest(UpdatePostSchema), 
            this.postController.updatePost.bind(this.postController)
        );

        // ====================
        // ❤️ ENGAGEMENT
        // ====================
        
        // Like/Unlike un post
        this.router.post(
            "/:postId/like", 
            authenticateJWT,
            validateRequest(LikePostSchema),
            this.postController.toggleLike.bind(this.postController)
        );

        // Sauvegarder/Retirer un post
        this.router.post(
            "/:postId/save", 
            authenticateJWT,
            validateRequest(SavePostSchema),
            this.postController.toggleSave.bind(this.postController)
        );

        // Partager un post
        this.router.post(
            "/:postId/share", 
            authenticateJWT,
            validateRequest(SharePostSchema),
            this.postController.sharePost.bind(this.postController)
        );


        // ====================
        // 🗑️ SUPPRESSION
        // ====================
        
        // Supprimer un post
        this.router.delete(
            "/:postId", 
            authenticateJWT,
            validateRequest(PostIdParamSchema),
            this.postController.deletePost.bind(this.postController)
        );

        // ====================
        // 🔍 RECHERCHE (anciennes routes pour compatibilité)
        // ====================
        
        this.router.get(
            "/searchPost", 
            this.postController.getPosts.bind(this.postController)
        );

        this.router.get(
            "/getPostsByUser", 
            authenticateJWT, 
            this.postController.getPostsByUser.bind(this.postController)
        );

        this.router.get(
            "/AllPosts", 
            authenticateJWT, 
            this.postController.getAllPosts.bind(this.postController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default PostRouter;