import { CommentController } from '../controllers/commentaireController';
import { CommentProvider } from '../providers/comment.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import { Request, Response } from 'express';
import { IComment } from '../models/Comment.model';
import mongoose, { Types } from 'mongoose';

describe('CommentController', () => {
    let commentProvider: jest.Mocked<CommentProvider>;
    let controller: CommentController;
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;

    // IDs de test
    const fakeUserId = new Types.ObjectId();
    const fakePostId = new Types.ObjectId();
    const fakeCommentId = new Types.ObjectId();
    const fakeParentCommentId = new Types.ObjectId();

    beforeEach(() => {
        commentProvider = {
            addComment: jest.fn(),
            getCommentsByPostId: jest.fn(),
            getCommentReplies: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
            toggleLike: jest.fn(),
            getPopularComments: jest.fn(),
            getCommentStats: jest.fn(),
        } as any;

        controller = new CommentController(commentProvider);

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('addComment', () => {
        it('should return 201 and the created comment', async () => {
            const comment: Partial<IComment> = {
                _id: fakeCommentId,
                author: fakeUserId,
                post: fakePostId,
                content: {
                    text: 'Test comment',
                    media: { images: [], videos: [] }
                },
                engagement: {
                    likes: [],
                    likesCount: 0,
                    replies: [],
                    repliesCount: 0
                },
                metadata: {
                    mentions: [],
                    hashtags: [],
                    isEdited: false
                },
                status: {
                    isPublished: true,
                    isDeleted: false,
                    moderationStatus: 'approved'
                },
                type: 'comment',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                body: { 
                    content: { 
                        text: 'Test comment',
                        media: { images: [], videos: [] }
                    } 
                },
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockResolvedValue(comment as IComment);

            await controller.addComment(req as AuthRequest, res as Response);

            expect(commentProvider.addComment).toHaveBeenCalledWith({
                author: fakeUserId,
                post: fakePostId,
                content: {
                    text: 'Test comment',
                    media: { images: [], videos: [] }
                },
                parentComment: undefined,
                metadata: undefined
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(comment);
        });

        it('should handle parent comment and metadata', async () => {
            const comment: Partial<IComment> = {
                _id: fakeCommentId,
                author: fakeUserId,
                post: fakePostId,
                content: {
                    text: 'Test reply',
                    media: { images: [], videos: [] }
                },
                engagement: {
                    likes: [],
                    likesCount: 0,
                    replies: [],
                    repliesCount: 0
                },
                metadata: {
                    mentions: [new Types.ObjectId()],
                    hashtags: ['test'],
                    isEdited: false
                },
                status: {
                    isPublished: true,
                    isDeleted: false,
                    moderationStatus: 'approved'
                },
                type: 'reply',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                body: { 
                    content: { 
                        text: 'Test reply',
                        media: { images: [], videos: [] }
                    },
                    parentComment: fakeParentCommentId.toString(),
                    metadata: {
                        mentions: [fakeUserId.toString()],
                        hashtags: ['test']
                    }
                },
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockResolvedValue(comment as IComment);

            await controller.addComment(req as AuthRequest, res as Response);

            expect(commentProvider.addComment).toHaveBeenCalledWith({
                author: fakeUserId,
                post: fakePostId,
                parentComment: fakeParentCommentId,
                content: {
                    text: 'Test reply',
                    media: { images: [], videos: [] }
                },
                metadata: {
                    mentions: [fakeUserId],
                    hashtags: ['test']
                }
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle errors and return 500', async () => {
            req = {
                user: { 
                    _id: fakeUserId.toString(), 
                    username: 'testuser', 
                    phoneNumber: '123456789', 
                    email: 'test@example.com' 
                },
                body: { 
                    content: { 
                        text: 'Test comment',
                        media: { images: [], videos: [] }
                    } 
                },
                params: { postId: fakePostId.toString() },
            };

            commentProvider.addComment.mockRejectedValue(new Error('Database error'));

            await controller.addComment(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: 'Error creating comment' 
            }));
        });

        it('should return 401 if user not authenticated', async () => {
            req = {
                user: undefined,
                body: { 
                    content: { 
                        text: 'Test comment',
                        media: { images: [], videos: [] }
                    } 
                },
                params: { postId: fakePostId.toString() },
            };

            await controller.addComment(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });
    });

    describe('getCommentsByPostId', () => {
        it('should return 200 and comments with pagination', async () => {
            const commentsResult = {
                comments: [{
                    _id: fakeCommentId,
                    author: fakeUserId,
                    post: fakePostId,
                    content: {
                        text: 'Test comment',
                        media: { images: [], videos: [] }
                    },
                    engagement: {
                        likes: [],
                        likesCount: 0,
                        replies: [],
                        repliesCount: 0
                    },
                    metadata: {
                        mentions: [],
                        hashtags: [],
                        isEdited: false
                    },
                    status: {
                        isPublished: true,
                        isDeleted: false,
                        moderationStatus: 'approved'
                    },
                    type: 'comment',
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as unknown as IComment],
                total: 1
            };

            req = { 
                params: { postId: fakePostId.toString() },
                query: { page: '1', limit: '20' }
            };
            
            commentProvider.getCommentsByPostId.mockResolvedValue(commentsResult);

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(commentProvider.getCommentsByPostId).toHaveBeenCalledWith(
                fakePostId.toString(), 1, 20
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(commentsResult);
        });

        it('should use default pagination values', async () => {
            req = { 
                params: { postId: fakePostId.toString() },
                query: {}
            };
            
            commentProvider.getCommentsByPostId.mockResolvedValue({
                comments: [],
                total: 0
            });

            await controller.getCommentsByPostId(req as Request, res as Response);

            expect(commentProvider.getCommentsByPostId).toHaveBeenCalledWith(
                fakePostId.toString(), 1, 20
            );
        });
    });

    describe('updateComment', () => {
        it('should return 200 and updated comment', async () => {
            const updatedComment: Partial<IComment> = {
                _id: fakeCommentId,
                author: fakeUserId,
                post: fakePostId,
                content: {
                    text: 'Updated comment',
                    media: { images: [], videos: [] }
                },
                engagement: {
                    likes: [],
                    likesCount: 0,
                    replies: [],
                    repliesCount: 0
                },
                metadata: {
                    mentions: [],
                    hashtags: ['updated'],
                    isEdited: true,
                    lastEditedAt: new Date()
                },
                status: {
                    isPublished: true,
                    isDeleted: false,
                    moderationStatus: 'approved'
                },
                type: 'comment',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            req = {
                user: { 
                    _id: fakeUserId.toString(), 
                    username: 'testuser', 
                    phoneNumber: '123456789', 
                    email: 'test@example.com' 
                },
                params: { commentId: fakeCommentId.toString() },
                body: { 
                    content: { 
                        text: 'Updated comment',
                        media: { images: [], videos: [] }
                    },
                    metadata: {
                        hashtags: ['updated']
                    }
                },
            };

            commentProvider.updateComment.mockResolvedValue(updatedComment as IComment);

            await controller.updateComment(req as AuthRequest, res as Response);

            expect(commentProvider.updateComment).toHaveBeenCalledWith(
                fakeCommentId.toString(),
                fakeUserId.toString(),
                {
                    content: {
                        text: 'Updated comment',
                        media: { images: [], videos: [] }
                    },
                    metadata: {
                        hashtags: ['updated']
                    }
                }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedComment);
        });

        it('should return 401 if user not authenticated', async () => {
            req = {
                user: undefined,
                params: { commentId: fakeCommentId.toString() },
                body: { 
                    content: { 
                        text: 'Updated comment',
                        media: { images: [], videos: [] }
                    }
                },
            };

            await controller.updateComment(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });
    });

    describe('deleteComment', () => {
        it('should return 200 if comment deleted', async () => {
            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                params: { commentId: fakeCommentId.toString() },
            };

            commentProvider.deleteComment.mockResolvedValue(true);

            await controller.deleteComment(req as AuthRequest, res as Response);

            expect(commentProvider.deleteComment).toHaveBeenCalledWith(
                fakeCommentId.toString(), 
                fakeUserId.toString()
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
        });

        it('should return 401 if user not authenticated', async () => {
            req = {
                user: undefined,
                params: { commentId: fakeCommentId.toString() },
            };

            await controller.deleteComment(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });
    });

    describe('toggleLike', () => {
        it('should return 200 and like result', async () => {
            req = {
                user: {
                    _id: fakeUserId.toString(),
                    username: 'testuser',
                    phoneNumber: '123456789',
                    email: 'test@example.com',
                },
                params: { commentId: fakeCommentId.toString() },
            };

            const likeResult = { action: 'liked' as const, likesCount: 1 };
            commentProvider.toggleLike.mockResolvedValue(likeResult);

            await controller.toggleLike(req as AuthRequest, res as Response);

            expect(commentProvider.toggleLike).toHaveBeenCalledWith(
                fakeCommentId.toString(),
                fakeUserId.toString()
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(likeResult);
        });
    });

    describe('getCommentReplies', () => {
        it('should return 200 and replies with pagination', async () => {
            const repliesResult = {
                replies: [{
                    _id: fakeCommentId,
                    author: fakeUserId,
                    post: fakePostId,
                    content: {
                        text: 'Test reply',
                        media: { images: [], videos: [] }
                    },
                    engagement: {
                        likes: [],
                        likesCount: 0,
                        replies: [],
                        repliesCount: 0
                    },
                    metadata: {
                        mentions: [],
                        hashtags: [],
                        isEdited: false
                    },
                    status: {
                        isPublished: true,
                        isDeleted: false,
                        moderationStatus: 'approved'
                    },
                    type: 'reply',
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as unknown as IComment],
                total: 1
            };

            req = { 
                params: { commentId: fakeCommentId.toString() },
                query: { page: '1', limit: '20' }
            };
            
            commentProvider.getCommentReplies.mockResolvedValue(repliesResult);

            await controller.getCommentReplies(req as Request, res as Response);

            expect(commentProvider.getCommentReplies).toHaveBeenCalledWith(
                fakeCommentId.toString(), 1, 20
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(repliesResult);
        });
    });

    describe('getPopularComments', () => {
        it('should return 200 and popular comments', async () => {
            const popularComments = [{
                _id: fakeCommentId,
                author: fakeUserId,
                post: fakePostId,
                content: {
                    text: 'Popular comment',
                    media: { images: [], videos: [] }
                },
                engagement: {
                    likes: [new Types.ObjectId()],
                    likesCount: 1,
                    replies: [],
                    repliesCount: 0
                },
                metadata: {
                    mentions: [],
                    hashtags: [],
                    isEdited: false
                },
                status: {
                    isPublished: true,
                    isDeleted: false,
                    moderationStatus: 'approved'
                },
                type: 'comment',
                createdAt: new Date(),
                updatedAt: new Date()
            } as unknown as IComment];

            req = { 
                params: { postId: fakePostId.toString() },
                query: { limit: '5' }
            };
            
            commentProvider.getPopularComments.mockResolvedValue(popularComments);

            await controller.getPopularComments(req as Request, res as Response);

            expect(commentProvider.getPopularComments).toHaveBeenCalledWith(
                fakePostId.toString(), 5
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(popularComments);
        });
    });

    describe('getCommentStats', () => {
        it('should return 200 and comment stats', async () => {
            const stats = {
                totalComments: 10,
                totalReplies: 5,
                popularComments: []
            };

            req = { 
                params: { postId: fakePostId.toString() }
            };
            
            commentProvider.getCommentStats.mockResolvedValue(stats);

            await controller.getCommentStats(req as Request, res as Response);

            expect(commentProvider.getCommentStats).toHaveBeenCalledWith(
                fakePostId.toString()
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(stats);
        });
    });
});