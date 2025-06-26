import { Router } from "express";
import { PostController } from "../controllers/postController";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/TYPES";
import { CreatePostRequest } from "../middlewares/CreatePostMiddleware";
import { DeletePostSchema } from "../schemas/Delete.Post.ZodSchema";
import { DeletePostMiddleware } from "../middlewares/DeletePostMiddleware";
import { UpdatePostMiddleware } from "../middlewares/UpdatePostMiddleware";
import { PostZodSchema } from "../schemas/Post.ZodSchema";
import { PostUpdateZodSchema } from "../schemas/Update.PostZodschema";
import { authenticateJWT } from "../middlewares/auth";

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
        this.router.post("/create", authenticateJWT, CreatePostRequest(PostZodSchema), this.postController.createPost.bind(this.postController));
        this.router.delete("/delete/:postId", authenticateJWT, DeletePostMiddleware(DeletePostSchema), this.postController.deletePost.bind(this.postController));
        this.router.patch("/update/:postId", authenticateJWT, UpdatePostMiddleware(PostUpdateZodSchema), this.postController.updatePost.bind(this.postController));
        this.router.get("/searchPost", this.postController.getPosts.bind(this.postController));
        this.router.get("/getPostsByUser", authenticateJWT, this.postController.getPostsByUser.bind(this.postController));
        this.router.get("/AllPosts", authenticateJWT, this.postController.getAllPosts.bind(this.postController));
    }
}