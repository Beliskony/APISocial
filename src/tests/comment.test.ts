import { CommentController } from '../controllers/commentaireController';
import { CommentProvider } from '../providers/comment.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import { Request, Response } from 'express';
import { IComment } from '../models/Comment.model';
import mongoose from 'mongoose';

describe('CommentController', () => {
    let commentProvider: jest.Mocked<CommentProvider>;
    let controller: CommentController;
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;

    // IDs de test
    const fakeUserId = new mongoose.Types.ObjectId();
    const fakePostId = new mongoose.Types.ObjectId();
    const fakeCommentId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        commentProvider = {
            addComment: jest.fn(),
            getCommentsByPostId: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
            getCommentsByPost: jest.fn(),
        } as any;

        controller = new CommentController(commentProvider);

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('addComment', () => {
        it('should return 201 and the created comment', async () => {
            const comment: IComment = {
                user: fakeUserId,
                post: fakePostId,
                content: 'test',
                createdAt: new Date(),
            };

            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                body: { content: 'test' },
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockResolvedValue(comment);

            await controller.addComment(req as AuthRequest, res as Response);

            expect(commentProvider.addComment).toHaveBeenCalledWith(fakePostId.toString(), fakeUserId.toString(), 'test');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(comment);
        });

        it('should handle errors and return 500', async () => {
            req = {
                user: { _id: fakeUserId.toString(), username: 'testuser', phoneNumber: '123456789', email: 'test@example.com' },
                body: { content: 'test' },
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockRejectedValue(new Error('fail'));

            await controller.addComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        });

        it('should handle missing body fields gracefully', async () => {
            req = {
                user: { _id: fakeUserId.toString(), username: 'testuser', phoneNumber: '123456789', email: 'test@example.com' },
                body: {},
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockRejectedValue(new Error('Missing fields'));

            await controller.addComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        });
    });

    describe('getCommentsByPostId', () => {
        it('should return 200 and comments array', async () => {
            const comments: IComment[] = [{
                user: fakeUserId,
                post: fakePostId,
                content: 'test',
                createdAt: new Date(),
            }];

            req = { params: { postId: fakePostId.toString() } };
            commentProvider.getCommentsByPostId.mockResolvedValue(comments);

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(commentProvider.getCommentsByPostId).toHaveBeenCalledWith(fakePostId.toString());
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(comments);
        });

        it('should handle errors and return 500', async () => {
            req = { params: { postId: fakePostId.toString() } };
            commentProvider.getCommentsByPostId.mockRejectedValue(new Error('fail'));

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error fetching comments' }));
        });

        it('should return empty array if no comments', async () => {
            req = { params: { postId: fakePostId.toString() } };
            commentProvider.getCommentsByPostId.mockResolvedValue([]);

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('updateComment', () => {
        it('should return 200 and updated comment', async () => {
            const updatedComment: IComment = {
                user: fakeUserId,
                post: fakePostId,
                content: 'updated',
                createdAt: new Date(),
            };

            req = {
                user: { _id: fakeUserId.toString(), username: 'testuser', phoneNumber: '123456789', email: 'test@example.com' },
                body: { commentId: fakeCommentId.toString(), content: 'updated' },
            };

            commentProvider.updateComment.mockResolvedValue(updatedComment);

            await controller.updateComment(req as Request, res as Response);

            expect(commentProvider.updateComment).toHaveBeenCalledWith(fakeCommentId.toString(), fakeUserId.toString(), 'updated');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedComment);
        });

        it('should return 404 if comment not found', async () => {
            req = {
                user: { _id: fakeUserId.toString(), username: 'testuser', phoneNumber: '123456789', email: 'test@example.com' },
                body: { commentId: fakeCommentId.toString(), content: 'updated' },
            };

            commentProvider.updateComment.mockResolvedValue(null);

            await controller.updateComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        });

        it('should handle errors and return 500', async () => {
            req = {
                user: { _id: fakeUserId.toString(), username: 'testuser', phoneNumber: '123456789', email: 'test@example.com' },
                body: { commentId: fakeCommentId.toString(), content: 'updated' },
            };

            commentProvider.updateComment.mockRejectedValue(new Error('fail'));

            await controller.updateComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error updating comment' }));
        });
    });

    describe('deleteComment', () => {
        beforeEach(() => {
            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                params: {},
            };
        });

        it('should return 200 if comment deleted', async () => {
            req.params = { commentId: fakeCommentId.toString() };
            commentProvider.deleteComment.mockResolvedValue(true);

            await controller.deleteComment(req as Request, res as Response);

            expect(commentProvider.deleteComment).toHaveBeenCalledWith(fakeCommentId.toString(), fakeUserId.toString());
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
        });

        it('should return 404 if comment not found', async () => {
            req.params = { commentId: fakeCommentId.toString() };
            commentProvider.deleteComment.mockResolvedValue(false);

            await controller.deleteComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        });

        it('should handle errors and return 500', async () => {
            req.params = { commentId: fakeCommentId.toString() };
            commentProvider.deleteComment.mockRejectedValue(new Error('fail'));

            await controller.deleteComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error deleting comment' }));
        });
    });
});
