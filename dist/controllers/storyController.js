"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.StoryController = void 0;
const inversify_1 = require("inversify");
const Story_provider_1 = require("../providers/Story.provider");
const TYPES_1 = require("../config/TYPES");
let StoryController = class StoryController {
    constructor(storyProvider) {
        this.storyProvider = storyProvider;
    }
    createStory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.userId;
                const content = req.body.content; // Assuming content is passed in the request body
                const story = yield this.storyProvider.createStory({ userId, content });
                res.status(201).json(story);
                return;
            }
            catch (error) {
                console.error("Erreur lors de la création de la story:", error);
                res.status(500).json({ message: "Erreur lors de la création de la story" });
                console.log(error);
            }
        });
    }
    getUserStories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const stories = yield this.storyProvider.getUserStories(userId);
                res.status(200).json(stories);
            }
            catch (error) {
                console.error("Erreur lors de la récupération des stories:", error);
                res.status(500).json({ message: "Erreur lors de la récupération des stories" });
            }
        });
    }
    deleteExpiredStories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.storyProvider.deleteExpiredStories();
            res.status(204).send(); // No content
        });
    }
    deleteUserStory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { storyId } = req.params;
                const userId = req.params.userId; // Assuming userId is passed in the request params
                if (!userId) {
                    return res.status(401).json({ message: "Utilisateur non authentifié" });
                }
                yield this.storyProvider.deleteUserStory(storyId, userId);
                res.status(204).send(); // No content
            }
            catch (error) {
                console.error("Erreur lors de la suppression de la story:", error);
                res.status(500).json({ message: "Erreur lors de la suppression de la story" });
            }
        });
    }
};
exports.StoryController = StoryController;
exports.StoryController = StoryController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.StoryProvider)),
    __metadata("design:paramtypes", [Story_provider_1.StoryProvider])
], StoryController);
