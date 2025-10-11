import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { Types } from 'mongoose';
import { CommentProvider } from '../providers/comment.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import { IComment } from '../models/Comment.model';
import { TYPES } from '../config/TYPES';

@injectable()
export class CommentController {
    constructor(@inject(TYPES.CommentProvider) private commentProvider: CommentProvider) {}

    async addComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { content, parentComment, metadata } = req.body;
            const { postId } = req.params;

            const commentData = {
                author: new Types.ObjectId(userId),
                post: new Types.ObjectId(postId),
                parentComment: parentComment ? new Types.ObjectId(parentComment) : undefined,
                content: {
                    text: content.text,
                    media: content.media || { images: [], videos: [] }
                },
                metadata: metadata ? {
                    mentions: metadata.mentions?.map((id: string) => new Types.ObjectId(id)) || [],
                    hashtags: metadata.hashtags || []
                } : undefined
            };

            const comment: IComment = await this.commentProvider.addComment(commentData);
            res.status(201).json(comment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating comment', error });
        }
    }

    async getCommentsByPostId(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this.commentProvider.getCommentsByPostId(postId, page, limit);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching comments', error });
        }
    }

    async getCommentReplies(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this.commentProvider.getCommentReplies(commentId, page, limit);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching comment replies', error });
        }
    }

    async updateComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { commentId } = req.params;
            const { content, metadata } = req.body;

            const updateData = {
                content: {
                    text: content.text,
                    media: content.media || { images: [], videos: [] }
                },
                metadata: metadata ? {
                    mentions: metadata.mentions?.map((id: string) => new Types.ObjectId(id)) || [],
                    hashtags: metadata.hashtags || []
                } : undefined
            };

            const updatedComment: IComment = await this.commentProvider.updateComment(commentId, userId, updateData);
            res.status(200).json(updatedComment);
        } catch (error) {
            res.status(500).json({ message: 'Error updating comment', error });
        }
    }

    async deleteComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { commentId } = req.params;
            const deleted: boolean = await this.commentProvider.deleteComment(commentId, userId);
            res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting comment', error });
        }
    }

    async toggleLike(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { commentId } = req.params;
            const result = await this.commentProvider.toggleLike(commentId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error toggling like', error });
        }
    }

    async getPopularComments(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const limit = parseInt(req.query.limit as string) || 10;
            const comments = await this.commentProvider.getPopularComments(postId, limit);
            res.status(200).json(comments);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching popular comments', error });
        }
    }

    async getCommentStats(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const stats = await this.commentProvider.getCommentStats(postId);
            res.status(200).json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching comment stats', error });
        }
    }
}