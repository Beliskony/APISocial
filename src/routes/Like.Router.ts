import express from 'express';
import { inject, injectable } from 'inversify';
import { authenticateJWT } from '../middlewares/auth';
import { LikeController } from '../controllers/likeController';
import { TYPES } from '../config/TYPES';
import { LikeRequest } from '../middlewares/LikeMiddleware';
import { LikeZodSchema } from '../schemas/Like.ZodSchema';


@injectable()
export class LikeRouter {
    public router: express.Router;
    private likeController: LikeController;

    constructor(@inject(TYPES.LikeController) likeController: LikeController) {
        this.router = express.Router();
        this.likeController = likeController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.put('/toggle/:postId', authenticateJWT, this.likeController.toggleLike.bind(this.likeController));
        this.router.get('/post/:postId', this.likeController.getLikesForPost.bind(this.likeController));
    }
}