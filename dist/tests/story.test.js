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
const storyController_1 = require("../controllers/storyController");
describe('StoryController', () => {
    let storyProvider;
    let controller;
    let req;
    let res;
    beforeEach(() => {
        storyProvider = {
            createStory: jest.fn(),
            getUserStories: jest.fn(),
            deleteExpiredStories: jest.fn(),
            deleteUserStory: jest.fn(),
        };
        controller = new storyController_1.StoryController(storyProvider);
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
    it('should create a story and return 201', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeStory = Object.assign(Object.assign({ _id: 'story1' }, req.body), { userId: req.params.userId });
        storyProvider.createStory.mockResolvedValue(fakeStory);
        yield controller.createStory(req, res);
        expect(storyProvider.createStory).toHaveBeenCalledWith({
            userId: req.params.userId,
            content: req.body.content,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(fakeStory);
    }));
    it('should handle errors and return 500', () => __awaiter(void 0, void 0, void 0, function* () {
        storyProvider.createStory.mockRejectedValue(new Error('fail'));
        yield controller.createStory(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de la création de la story" });
    }));
});
