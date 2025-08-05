import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { CommentProvider } from '../providers/comment.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import { IComment } from '../models/Comment.model';
import { TYPES } from '../config/TYPES';


@injectable()
export class CommentController {
    constructor(@inject(TYPES.CommentProvider) private commentProvider: CommentProvider) {}

    async addComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id; // Assuming user ID is stored in the request object after authentication
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { content } = req.body;
            const { postId } = req.params;
           
            const comment: IComment = await this.commentProvider.addComment(postId, userId, content);
            res.status(201).json(comment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating comment', error });
        }
    }

    async getCommentsByPostId(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const comments: IComment[] = await this.commentProvider.getCommentsByPostId(postId);
            res.status(200).json(comments);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching comments', error });
        }
    }

    async updateComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id; // Assuming user ID is stored in the request object after authentication
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { commentId, content } = req.body;
            const updatedComment: IComment | null = await this.commentProvider.updateComment(commentId, userId, content);
            if (!updatedComment) {
                 res.status(404).json({ message: 'Comment not found' });
                 return;
            }
             res.status(200).json(updatedComment);
        } catch (error) {
             res.status(500).json({ message: 'Error updating comment', error });
        }
    }

    async deleteComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id; // Assuming user ID is stored in the request object after authentication
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { commentId } = req.params;
            const deleted: boolean = await this.commentProvider.deleteComment(commentId, userId);
            if (!deleted) {
                 res.status(404).json({ message: 'Comment not found' });
            }
             res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (error) {
             res.status(500).json({ message: 'Error deleting comment', error });
        }
    }

}
