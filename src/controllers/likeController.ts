import { Request, Response } from 'express';
import { inject,injectable } from 'inversify';
import { LikeProvider } from '../providers/Like.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import { TYPES } from '../config/TYPES';

@injectable()
export class LikeController {
    constructor(@inject(TYPES.LikeProvider) private likeProvider: LikeProvider) {}

    async toggleLike(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id; // Assuming user ID is stored in the request object after authentication
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            
            const postId  = req.params.postId;
            const result = await this.likeProvider.toggleLike(userId, postId);
            
            res.status(200).json({ message: `Post ${result}`, postId, userId, liked: result === 'liked' });
        } catch (error) {
            res.status(500).json({ message: 'Error toggling like', error });
        }
    }

    async getLikesForPost(req: Request, res: Response) {
        try {
            const { postId } = req.params;
            const likes = await this.likeProvider.getLikesByPost(postId);
            res.status(200).json({ 
                likeCount: likes.length,
                likes });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching likes', error });
        }
    }

    async hasUserLiked(req: Request, res: Response) {
        try {
            const userId = req.body.userId; // Assuming userId is passed in the request body
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { postId } = req.body;
            const hasLiked = await this.likeProvider.hasUserLiked(userId, postId);
            res.status(200).json({ hasLiked });
        } catch (error) {
            res.status(500).json({ message: 'Error checking like', error });
        }
    }

}