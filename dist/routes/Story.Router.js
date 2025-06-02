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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryRouter = void 0;
const express_1 = require("express");
const storyController_1 = require("../controllers/storyController");
const StoryMiddleware_1 = __importDefault(require("../middlewares/StoryMiddleware"));
const Story_ZodSchema_1 = require("../schemas/Story.ZodSchema");
const inversify_1 = require("inversify");
const TYPES_1 = require("../config/TYPES");
let StoryRouter = class StoryRouter {
    constructor(storyController) {
        this.router = (0, express_1.Router)();
        this.storyController = storyController;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/create/:userId", (0, StoryMiddleware_1.default)(Story_ZodSchema_1.StoryZodSchema), this.storyController.createStory.bind(this.storyController));
        this.router.get("/getUser", (0, StoryMiddleware_1.default)(Story_ZodSchema_1.StoryZodSchema), this.storyController.getUserStories.bind(this.storyController));
        this.router.delete("/delete/:userId/:story", (0, StoryMiddleware_1.default)(Story_ZodSchema_1.DeleteStoryZodSchema), this.storyController.deleteExpiredStories.bind(this.storyController));
        this.router.get("/expire", this.storyController.deleteExpiredStories.bind(this.storyController));
    }
};
exports.StoryRouter = StoryRouter;
exports.StoryRouter = StoryRouter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.StoryController)),
    __metadata("design:paramtypes", [storyController_1.StoryController])
], StoryRouter);
