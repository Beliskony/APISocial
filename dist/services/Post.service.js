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
exports.PostService = void 0;
const inversify_1 = require("inversify");
const Post_model_1 = __importDefault(require("../models/Post.model"));
let PostService = class PostService {
    createPost(userId, text, media) {
        return __awaiter(this, void 0, void 0, function* () {
            const newPost = new Post_model_1.default({
                user: userId,
                text,
                media,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return yield newPost.save();
        });
    }
    getPosts(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Post_model_1.default.find({
                $or: [
                    { text: { $regex: text, $options: 'i' } }, // Recherche insensible à la casse
                    //{ 'media.images': { $regex: text, $options: 'i' } }, // Recherche dans les images
                    //{ 'media.videos': { $regex: text, $options: 'i' } }, // Recherche dans les vidéos
                ],
            }).populate('userId');
        });
    }
    getAllPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Post_model_1.default.find().populate('userId').sort({ createdAt: -1 }).exec();
        });
    }
    updatePost(postId, userId, text, media) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔍 Tentative de mise à jour");
            console.log("➡️ postId reçu :", postId);
            console.log("➡️ userId reçu :", userId);
            const post = yield Post_model_1.default.findById(postId);
            if (!post) {
                return null;
            }
            console.log("✅ Post trouvé avec user :", post.user.toString());
            if ((post === null || post === void 0 ? void 0 : post.user.toString()) !== userId) {
                console.log("⛔️ Utilisateur non autorisé");
                throw new Error("You are not authorized to modify this post");
            }
            post.text = text || post.text;
            post.media = media || post.media;
            post.updatedAt = new Date();
            return yield post.save();
        });
    }
    deletePost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Post_model_1.default.findById(postId);
            if ((post === null || post === void 0 ? void 0 : post.user.toString()) !== userId) {
                throw new Error("You are not authorized to modify this post");
            }
            yield Post_model_1.default.findByIdAndDelete(postId);
            return true;
        });
    }
};
exports.PostService = PostService;
exports.PostService = PostService = __decorate([
    (0, inversify_1.injectable)()
], PostService);
