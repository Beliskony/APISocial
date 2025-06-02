"use strict";
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
const Post_ZodSchema_1 = require("../schemas/Post.ZodSchema");
const CreatePostMiddleware_1 = require("../middlewares/CreatePostMiddleware");
const DeletePostMiddleware_1 = require("../middlewares/DeletePostMiddleware");
const UpdatePostMiddleware_1 = require("../middlewares/UpdatePostMiddleware");
const Post_model_1 = __importDefault(require("../models/Post.model"));
// Mocks
jest.mock("../models/Post.model");
jest.mock("../middlewares/CreatePostMiddleware");
jest.mock("../middlewares/DeletePostMiddleware");
jest.mock("../middlewares/UpdatePostMiddleware");
jest.mock("../schemas/Post.ZodSchema", () => ({
    PostZodSchema: {
        parse: jest.fn(),
    },
}));
//pour la creation
describe("Post Middleware", () => {
    const mockRequest = (body) => {
        return { body };
    };
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should create a post and return the created post", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({
            user: "hdhgjkjdjkd",
            text: "Test Post",
            media: "This is a test post",
        });
        const res = mockResponse();
        Post_model_1.default.create.mockResolvedValue(req.body);
        Post_ZodSchema_1.PostZodSchema.parse.mockReturnValue(req.body);
        const createPostMiddleware = (0, CreatePostMiddleware_1.CreatePostRequest)(Post_ZodSchema_1.PostZodSchema);
        yield createPostMiddleware(req, res, () => { });
        expect(Post_model_1.default.create).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(req.body);
    }));
    it("should return 400 if post creation fails", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({
            user: "hdhgjkjdjkd",
            text: "Test Post",
            media: "This is a test post",
        });
        const res = mockResponse();
        Post_model_1.default.create.mockRejectedValue(new Error("Post creation failed"));
        const createPostMiddleware = (0, CreatePostMiddleware_1.CreatePostRequest)(Post_ZodSchema_1.PostZodSchema);
        yield createPostMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Post creation failed" });
    }));
});
//pour la suppression
describe("DeletePostMiddleware", () => {
    const mockRequest = (params) => ({ params });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should delete a post and return the deleted post", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({ id: "postId123" });
        const res = mockResponse();
        Post_model_1.default.findByIdAndDelete.mockResolvedValue(req.params);
        const deletePostMiddleware = (0, DeletePostMiddleware_1.DeletePostMiddleware)(Post_ZodSchema_1.PostZodSchema);
        yield deletePostMiddleware(req, res, () => { });
        expect(Post_model_1.default.findByIdAndDelete).toHaveBeenCalledWith("postId123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(req.params);
    }));
    it("should return 404 if post not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({ id: "postId123" });
        const res = mockResponse();
        Post_model_1.default.findByIdAndDelete.mockResolvedValue(null);
        const deletePostMiddleware = (0, DeletePostMiddleware_1.DeletePostMiddleware)(Post_ZodSchema_1.PostZodSchema);
        yield deletePostMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    }));
});
//pour la mise à jour ou modification
describe("UpdatePostMiddleware", () => {
    const MockRequest = (body) => ({ body });
    const MockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should update a post and return the updated post", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = MockRequest({
            id: "postId123",
            text: "Updated Post",
            media: "This is an updated post",
        });
        const res = MockResponse();
        Post_model_1.default.findByIdAndUpdate.mockResolvedValue(req.body);
        const updatePostMiddleware = (0, UpdatePostMiddleware_1.UpdatePostMiddleware)(Post_ZodSchema_1.PostZodSchema);
        yield updatePostMiddleware(req, res, () => { });
        expect(Post_model_1.default.findByIdAndUpdate).toHaveBeenCalledWith("postId123", req.body, {
            new: true,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(req.body);
    }));
    it("should return 404 if post not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = MockRequest({
            id: "postId123",
            text: "Updated Post",
            media: "This is an updated post",
        });
        const res = MockResponse();
        Post_model_1.default.findByIdAndUpdate.mockResolvedValue(null);
        const updatePostMiddleware = (0, UpdatePostMiddleware_1.UpdatePostMiddleware)(Post_ZodSchema_1.PostZodSchema);
        yield updatePostMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    }));
});
