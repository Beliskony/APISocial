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
exports.LikeRouter = void 0;
const express_1 = __importDefault(require("express"));
const inversify_1 = require("inversify");
const likeController_1 = require("../controllers/likeController");
const TYPES_1 = require("../config/TYPES");
const LikeMiddleware_1 = require("../middlewares/LikeMiddleware");
const Like_ZodSchema_1 = require("../schemas/Like.ZodSchema");
let LikeRouter = class LikeRouter {
    constructor(likeController) {
        this.router = express_1.default.Router();
        this.likeController = likeController;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/add', (0, LikeMiddleware_1.LikeRequest)(Like_ZodSchema_1.LikeZodSchema), this.likeController.addLike.bind(this.likeController));
        this.router.delete('/remove', (0, LikeMiddleware_1.LikeRequest)(Like_ZodSchema_1.LikeZodSchema), this.likeController.removeLike.bind(this.likeController));
        this.router.get('/post/:postId', this.likeController.getLikesForPost.bind(this.likeController));
    }
};
exports.LikeRouter = LikeRouter;
exports.LikeRouter = LikeRouter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.LikeController)),
    __metadata("design:paramtypes", [likeController_1.LikeController])
], LikeRouter);
