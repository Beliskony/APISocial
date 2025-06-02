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
exports.LikeController = void 0;
const inversify_1 = require("inversify");
const Like_provider_1 = require("../providers/Like.provider");
const TYPES_1 = require("../config/TYPES");
let LikeController = class LikeController {
    constructor(likeProvider) {
        this.likeProvider = likeProvider;
    }
    addLike(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, postId } = req.body;
                const existingLike = yield this.likeProvider.hasUserLiked(userId, postId);
                if (existingLike) {
                    res.status(400).json({ message: 'Like already exists' });
                }
                yield this.likeProvider.addLike(userId, postId);
                res.status(201).json({ message: 'Like added successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error checking like', error });
            }
        });
    }
    removeLike(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, postId } = req.body;
                yield this.likeProvider.removeLike(userId, postId);
                res.status(200).json({ message: 'Like removed successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error removing like', error });
            }
        });
    }
    getLikesForPost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { postId } = req.params;
                const likes = yield this.likeProvider.getLikesByPost(postId);
                res.status(200).json({ likes });
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching likes', error });
            }
        });
    }
    hasUserLiked(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, postId } = req.body;
                const hasLiked = yield this.likeProvider.hasUserLiked(userId, postId);
                res.status(200).json({ hasLiked });
            }
            catch (error) {
                res.status(500).json({ message: 'Error checking like', error });
            }
        });
    }
};
exports.LikeController = LikeController;
exports.LikeController = LikeController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.LikeProvider)),
    __metadata("design:paramtypes", [Like_provider_1.LikeProvider])
], LikeController);
