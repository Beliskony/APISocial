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
exports.PostRouter = void 0;
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const inversify_1 = require("inversify");
const TYPES_1 = require("../config/TYPES");
const CreatePostMiddleware_1 = require("../middlewares/CreatePostMiddleware");
const Delete_Post_ZodSchema_1 = require("../schemas/Delete.Post.ZodSchema");
const DeletePostMiddleware_1 = require("../middlewares/DeletePostMiddleware");
const UpdatePostMiddleware_1 = require("../middlewares/UpdatePostMiddleware");
const Post_ZodSchema_1 = require("../schemas/Post.ZodSchema");
const Update_PostZodschema_1 = require("../schemas/Update.PostZodschema");
let PostRouter = class PostRouter {
    constructor(postController) {
        this.router = (0, express_1.Router)();
        this.postController = postController;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/create/:user", (0, CreatePostMiddleware_1.CreatePostRequest)(Post_ZodSchema_1.PostZodSchema), this.postController.createPost.bind(this.postController));
        this.router.delete("/delete/:user/:postId", (0, DeletePostMiddleware_1.DeletePostMiddleware)(Delete_Post_ZodSchema_1.DeletePostSchema), this.postController.deletePost.bind(this.postController));
        this.router.patch("/update/:user/:postId", (0, UpdatePostMiddleware_1.UpdatePostMiddleware)(Update_PostZodschema_1.PostUpdateZodSchema), this.postController.updatePost.bind(this.postController));
        this.router.get("/getUserPost", this.postController.getPosts.bind(this.postController));
        this.router.get("/getAllPosts", this.postController.getAllPosts.bind(this.postController));
    }
};
exports.PostRouter = PostRouter;
exports.PostRouter = PostRouter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.PostController)),
    __metadata("design:paramtypes", [postController_1.PostController])
], PostRouter);
