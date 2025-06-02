"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commentaireController_1 = require("../controllers/commentaireController");
describe('CommentController', () => {
    let commentProvider;
    let controller;
    let req;
    let res;
    beforeEach(() => {
        commentProvider = {
            addComment: jest.fn(),
            getCommentsByPostId: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
            getCommentsByPost: jest.fn(),
        };
        controller = new commentaireController_1.CommentController(commentProvider);
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    // Existing tests...
    describe('addComment', () => {
        it('should return 201 and the created comment', () => __awaiter(void 0, void 0, void 0, function* () {
            const comment = { user: 'user1', post: 'post1', content: 'test', createdAt: new Date() };
            req = { body: { postId: 'post1', userId: 'user1', content: 'test' } };
            commentProvider.addComment.mockResolvedValue(comment);
            yield controller.addComment(req, res);
            expect(commentProvider.addComment).toHaveBeenCalledWith('post1', 'user1', 'test');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(comment);
        }));
        it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { postId: 'post1', userId: 'user1', content: 'test' } };
            commentProvider.addComment.mockRejectedValue(new Error('fail'));
            yield controller.addComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        }));
        it('should handle missing body fields gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: {} };
            commentProvider.addComment.mockRejectedValue(new Error('Missing fields'));
            yield controller.addComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error creating comment' }));
        }));
    });
    describe('getCommentsByPostId', () => {
        it('should return 200 and comments array', () => __awaiter(void 0, void 0, void 0, function* () {
            const comments = [{ user: 'user1', post: 'post1', content: 'test' }];
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPostId.mockResolvedValue(comments);
            yield controller.getCommentsByPostId(req, res);
            expect(commentProvider.getCommentsByPostId).toHaveBeenCalledWith('post1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(comments);
        }));
        it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPostId.mockRejectedValue(new Error('fail'));
            yield controller.getCommentsByPostId(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error fetching comments' }));
        }));
        it('should return empty array if no comments', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { params: { postId: 'post999' } };
            commentProvider.getCommentsByPostId.mockResolvedValue([]);
            yield controller.getCommentsByPostId(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        }));
    });
    describe('updateComment', () => {
        it('should return 200 and updated comment', () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedComment = { user: 'user1', post: 'post1', content: 'updated' };
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockResolvedValue(updatedComment);
            yield controller.updateComment(req, res);
            expect(commentProvider.updateComment).toHaveBeenCalledWith('comment1', 'user1', 'old', 'updated');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedComment);
        }));
        it('should return 404 if comment not found', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockResolvedValue(null);
            yield controller.updateComment(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        }));
        it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { commentId: 'comment1', userId: 'user1', content: 'old', newContent: 'updated' } };
            commentProvider.updateComment.mockRejectedValue(new Error('fail'));
            yield controller.updateComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error updating comment' }));
        }));
        it('should handle missing fields gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: {} };
            commentProvider.updateComment.mockRejectedValue(new Error('Missing fields'));
            yield controller.updateComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error updating comment' }));
        }));
    });
    describe('deleteComment', () => {
        it('should return 200 if comment deleted', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockResolvedValue(true);
            yield controller.deleteComment(req, res);
            expect(commentProvider.deleteComment).toHaveBeenCalledWith('comment1', 'user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
        }));
        it('should return 404 if comment not found', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockResolvedValue(false);
            yield controller.deleteComment(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
        }));
        it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: { commentId: 'comment1', userId: 'user1' } };
            commentProvider.deleteComment.mockRejectedValue(new Error('fail'));
            yield controller.deleteComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error deleting comment' }));
        }));
        it('should handle missing fields gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { body: {} };
            commentProvider.deleteComment.mockRejectedValue(new Error('Missing fields'));
            yield controller.deleteComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error deleting comment' }));
        }));
    });
    describe('getCommentsByPost', () => {
        it('should return 200 and comments array', () => __awaiter(void 0, void 0, void 0, function* () {
            const comments = [{ user: 'user1', post: 'post1', content: 'test' }];
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPost.mockResolvedValue(comments);
            yield controller.getCommentsByPost(req, res);
            expect(commentProvider.getCommentsByPost).toHaveBeenCalledWith('post1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(comments);
        }));
        it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { params: { postId: 'post1' } };
            commentProvider.getCommentsByPost.mockRejectedValue(new Error('fail'));
            yield controller.getCommentsByPost(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error fetching comments' }));
        }));
        it('should return empty array if no comments', () => __awaiter(void 0, void 0, void 0, function* () {
            req = { params: { postId: 'post999' } };
            commentProvider.getCommentsByPost.mockResolvedValue([]);
            yield controller.getCommentsByPost(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        }));
    });
    // Additional edge case: test with undefined req/res
    describe('Edge cases', () => {
        it('should handle undefined req.body gracefully in addComment', () => __awaiter(void 0, void 0, void 0, function* () {
            req = {};
            commentProvider.addComment.mockRejectedValue(new Error('fail'));
            yield controller.addComment(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        }));
        it('should handle undefined req.params gracefully in getCommentsByPostId', () => __awaiter(void 0, void 0, void 0, function* () {
            req = {};
            commentProvider.getCommentsByPostId.mockRejectedValue(new Error('fail'));
            yield controller.getCommentsByPostId(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        }));
    });
});
