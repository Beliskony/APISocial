import { StoryController } from '../controllers/storyController';
import { StoryProvider } from '../providers/Story.provider';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/Auth.Types';
import { IStory } from '../models/Story.model';
import { Types } from 'mongoose';


const userId = new Types.ObjectId(); // Mock user ID

describe('StoryController', () => {
    let storyProvider: jest.Mocked<StoryProvider>;
    let controller: StoryController;
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;

    beforeEach(() => {
        storyProvider = {
            createStory: jest.fn(),
            getUserStories: jest.fn(),
            deleteExpiredStories: jest.fn(),
            deleteUserStory: jest.fn(),
            getStoryOfFollowing: jest.fn(),
        } as any;

        controller = new StoryController(storyProvider);

        

        req = {
            user: {
                _id: 'user123',
                username: 'test',
                phoneNumber: '123456',
                email: 'test@example.com',
            },
            body: {
                content: { type: 'image', data: 'http://image.jpg' }
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
    });

    describe('createStory', () => {
        it('should create a story and return 201', async () => {
            const fakeStory: Partial<IStory> = { _id: 'story1', userId: userId, content: req.body!.content };
            storyProvider.createStory.mockResolvedValue(fakeStory as IStory);

            await controller.createStory(req as AuthRequest, res as Response);

            expect(storyProvider.createStory).toHaveBeenCalledWith({
                userId: 'user123',
                content: req.body!.content
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(fakeStory);
        });

        it('should return 401 if user is not authenticated', async () => {
            req.user = undefined;

            await controller.createStory(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
        });

        it('should handle errors and return 500', async () => {
            storyProvider.createStory.mockRejectedValue(new Error('fail'));

            await controller.createStory(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de la création de la story" });
        });
    });
});
