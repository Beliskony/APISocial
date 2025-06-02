"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeService = void 0;
const inversify_1 = require("inversify");
const Like_model_1 = __importDefault(require("../models/Like.model"));
let LikeService = class LikeService {
    addLike(userId_1, postId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, postId, isLiked = true) {
            try {
                const existingLike = yield Like_model_1.default.findOne({ userId, postId });
                if (existingLike) {
                    existingLike.isLiked = isLiked; // Update the like status
                    yield existingLike.save();
                }
                else {
                    const newLike = new Like_model_1.default({ userId, postId, isLiked });
                    yield newLike.save();
                }
            }
            catch (error) {
                throw new Error(`Error adding like: ${error}`);
            }
        });
    }
    removeLike(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Like_model_1.default.deleteOne({ userId, postId });
        });
    }
    getLikesByPost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const likes = yield Like_model_1.default.find({ postId, isLiked: true });
            return likes;
        });
    }
    hasUserLiked(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const like = yield Like_model_1.default.findOne({ userId, postId });
            return !!like;
        });
    }
};
exports.LikeService = LikeService;
exports.LikeService = LikeService = __decorate([
    (0, inversify_1.injectable)()
], LikeService);
exports.default = new LikeService();
//compare ce snippet avec celui de Like.model.ts
