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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRouter = void 0;
const express_1 = require("express");
const commentaireController_1 = require("../controllers/commentaireController");
const CommentMiddleware_1 = require("../middlewares/CommentMiddleware");
const Comment_ZodSchema_1 = require("../schemas/Comment.ZodSchema");
const inversify_1 = require("inversify");
const TYPES_1 = require("../config/TYPES");
let CommentRouter = class CommentRouter {
    constructor(commentController) {
        this.router = (0, express_1.Router)();
        this.commentController = commentController;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/create", (0, CommentMiddleware_1.CommentMiddleware)(Comment_ZodSchema_1.CreateCommentZodSchema), this.commentController.addComment.bind(this.commentController));
        this.router.put("/update", (0, CommentMiddleware_1.CommentMiddleware)(Comment_ZodSchema_1.UpdateCommentZodSchema), this.commentController.updateComment.bind(this.commentController));
        this.router.delete("/delete", (0, CommentMiddleware_1.CommentMiddleware)(Comment_ZodSchema_1.DeleteCommentZodSchema), this.commentController.deleteComment.bind(this.commentController));
        this.router.get("/getAllComments/:postId", this.commentController.getCommentsByPost.bind(this.commentController));
    }
};
exports.CommentRouter = CommentRouter;
exports.CommentRouter = CommentRouter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.CommentController)),
    __metadata("design:paramtypes", [commentaireController_1.CommentController])
], CommentRouter);
