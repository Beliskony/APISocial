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
exports.PostController = void 0;
const inversify_1 = require("inversify");
const Post_provider_1 = require("../providers/Post.provider");
const TYPES_1 = require("../config/TYPES");
let PostController = class PostController {
    constructor(postProvider) {
        this.postProvider = postProvider;
    }
    createPost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, text, media } = req.body;
                const post = yield this.postProvider.createPost(user, text, media);
                res.status(201).json(post);
            }
            catch (error) {
                res.status(500).json({ message: 'Erreur de creation du post', error });
            }
        });
    }
    getPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { text } = req.query;
                const posts = yield this.postProvider.getPosts(text);
                res.status(200).json(posts);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching posts', error });
            }
        });
    }
    getAllPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const posts = yield this.postProvider.getAllPosts();
                res.status(200).json(posts);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching posts', error });
            }
        });
    }
    updatePost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, postId } = req.params;
                const { text, media } = req.body;
                const post = yield this.postProvider.updatePost(postId, user, text, media);
                if (!post) {
                    res.status(404).json({ message: 'Post not found' });
                    return;
                }
                res.status(200).json(post);
            }
            catch (error) {
                res.status(500).json({ message: 'Error updating post', error });
            }
        });
    }
    deletePost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = req.body.postId;
                const { postId, userId } = req.params;
                yield post.deleteOne({ _id: postId, user: userId });
                res.status(200).json({ message: 'Post deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error deleting post', error });
            }
        });
    }
};
exports.PostController = PostController;
exports.PostController = PostController = __decorate([
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.PostService)),
    __metadata("design:paramtypes", [Post_provider_1.PostProvider])
], PostController);
