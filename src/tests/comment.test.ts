import { CommentController } from '../controllers/commentaireController';
import { CommentProvider } from '../providers/comment.provider';
import { Request, Response } from 'express';
import { IComment } from '../models/Comment.model';

describe('CommentController', () => {
    let commentProvider: jest.Mocked<CommentProvider>;
    let controller: CommentController;
    let req: Partial<Request>;
    let res: Partial<Response>;

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

    // Existing tests...

    describe('addComment', () => {
        it('should return 201 and the created comment', async () => {
            const comment = { user: 'user1', post: 'post1', content: 'test', createdAt: new Date() } as IComment;
            req = { body: { postId: 'post1', userId: 'user1', content: 'test' } };
            commentProvider.addComment.mockResolvedValue(comment);

            await controller.addComment(req as Request, res as Response);

            expect(commentProvider.addComment).toHaveBeenCalledWith('post1', 'user1', 'test');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(comment);
        });

        it('should handle errors and return 500', async () => {
            req = { body: { postId: 'post1', userId: 'user1', content: 'test' } };
            commentProvider.addComment.mockRejectedValue(new Error('fail'));

            await controller.addComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        });

        it('should handle missing body fields gracefully', async () => {
            req = { body: {} };
            commentProvider.addComment.mockRejectedValue(new Error('Missing fields'));

            await controller.addComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        });
    });

    describe('getCommentsByPostId', () => {
        it('should return 200 and comments array', async () => {
            const comments = [{ user: 'user1', post: 'post1', content: 'test' }];
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPostId.mockResolvedValue(comments);

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(commentProvider.getCommentsByPostId).toHaveBeenCalledWith('post1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(comments);
        });

        it('should handle errors and return 500', async () => {
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPostId.mockRejectedValue(new Error('fail'));

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error fetching comments' }));
        });

        it('should return empty array if no comments', async () => {
            req = { params: { postId: 'post999' } };
            commentProvider.getCommentsByPostId.mockResolvedValue([]);

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('updateComment', () => {
        it('should return 200 and updated comment', async () => {
            const updatedComment = { user: 'user1', post: 'post1', content: 'updated' };
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockResolvedValue(updatedComment);

            await controller.updateComment(req as Request, res as Response);

            expect(commentProvider.updateComment).toHaveBeenCalledWith('comment1', 'user1', 'old', 'updated');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedComment);
        });

        it('should return 404 if comment not found', async () => {
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockResolvedValue(null);

            await controller.updateComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        });

        it('should handle errors and return 500', async () => {
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockRejectedValue(new Error('fail'));

            await controller.updateComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error updating comment' }));
        });

        it('should handle missing fields gracefully', async () => {
            req = { body: {} };
            commentProvider.updateComment.mockRejectedValue(new Error('Missing fields'));

            await controller.updateComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error updating comment' }));
        });
    });

    describe('deleteComment', () => {
        it('should return 200 if comment deleted', async () => {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockResolvedValue(true);

            await controller.deleteComment(req as Request, res as Response);

            expect(commentProvider.deleteComment).toHaveBeenCalledWith('comment1', 'user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
        });

        it('should return 404 if comment not found', async () => {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockResolvedValue(false);

            await controller.deleteComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        });

        it('should handle errors and return 500', async () => {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockRejectedValue(new Error('fail'));

            await controller.deleteComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error deleting comment' }));
        });

        it('should handle missing fields gracefully', async () => {
            req = { body: {} };
            commentProvider.deleteComment.mockRejectedValue(new Error('Missing fields'));

            await controller.deleteComment(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error deleting comment' }));
        });
    });

    // Additional edge case: test with undefined req/res
    describe('Edge cases', () => {
        it('should handle undefined req.body gracefully in addComment', async () => {
            req = {};
            commentProvider.addComment.mockRejectedValue(new Error('fail'));
            await controller.addComment(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle undefined req.params gracefully in getCommentsByPostId', async () => {
            req = {};
            commentProvider.getCommentsByPostId.mockRejectedValue(new Error('fail'));
            await controller.getCommentsByPostId(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});