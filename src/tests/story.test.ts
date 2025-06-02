import { StoryController } from '../controllers/storyController';
import { StoryProvider } from '../providers/Story.provider';

describe('StoryController', () => {
    let storyProvider: jest.Mocked<StoryProvider>;
    let controller: StoryController;
    let req: any;
    let res: any;

    beforeEach(() => {
        storyProvider = {
            createStory: jest.fn(),
            getUserStories: jest.fn(),
            deleteExpiredStories: jest.fn(),
            deleteUserStory: jest.fn(),
        } as any;

        controller = new StoryController(storyProvider);

        req = {
            params: { userId: 'user123' },
            body: { content: { type: 'image', data: 'http://image.jpg' } },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
    });

    it('should create a story and return 201', async () => {
        const fakeStory = { _id: 'story1', ...req.body, userId: req.params.userId };
        storyProvider.createStory.mockResolvedValue(fakeStory);

        await controller.createStory(req, res);

        expect(storyProvider.createStory).toHaveBeenCalledWith({
            userId: req.params.userId,
            content: req.body.content,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(fakeStory);
    });

    it('should handle errors and return 500', async () => {
        storyProvider.createStory.mockRejectedValue(new Error('fail'));

        await controller.createStory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de la création de la story" });
    });
});