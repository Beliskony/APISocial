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
exports.CommentService = void 0;
const inversify_1 = require("inversify");
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
let CommentService = class CommentService {
    // Add a comment to a post
    addComment(postId, userId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const newComment = new Comment_model_1.default({
                user: userId,
                post: postId,
                content: content,
            });
            return yield newComment.save();
        });
    }
    getCommentsByPostId(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Comment_model_1.default.find({ post: postId }).populate("user", "username").exec();
        });
    }
    getCommentsByPost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Comment_model_1.default.find({ post: postId }).populate("user", "username").exec();
        });
    }
    updateComment(commentId, userId, content, newContent) {
        return __awaiter(this, void 0, void 0, function* () {
            const upComment = yield Comment_model_1.default.findById(commentId);
            if (!upComment || upComment.user !== userId) {
                throw new Error("Comment not found ou pas autoiser a modifier ce commentaire");
            }
            upComment.content = newContent;
            return yield upComment.save();
        });
    }
    deleteComment(commentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const delComment = yield Comment_model_1.default.findById(commentId);
            if (!delComment || delComment.user !== userId) {
                throw new Error("Comment not found ou pas autoiser a supprimer ce commentaire");
            }
            yield Comment_model_1.default.findByIdAndDelete(commentId);
            return true;
        });
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, inversify_1.injectable)()
], CommentService);
