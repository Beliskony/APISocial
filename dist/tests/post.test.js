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
jest.mock("../models/Post.model", () => ({
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));
jest.mock("../middlewares/CreatePostMiddleware", () => ({
    CreatePostRequest: jest.fn((schema) => {
        return jest.fn((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            // Simule la validation réussie
            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
                return;
            }
            req.body = parsed.data;
            // Simule la création de post dans la DB
            try {
                const createdPost = yield Post_model_1.default.create(req.body);
                res.status(201).json(createdPost);
            }
            catch (_a) {
                res.status(400).json({ message: "Post creation failed" });
            }
        }));
    }),
}));
jest.mock("../middlewares/DeletePostMiddleware", () => ({
    DeletePostMiddleware: jest.fn((schema) => {
        return jest.fn((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const deleted = yield Post_model_1.default.findByIdAndDelete(req.params.id);
                if (!deleted) {
                    res.status(404).json({ message: "Post not found" });
                    return;
                }
                res.status(200).json(deleted);
            }
            catch (_a) {
                res.status(500).json({ message: "Error deleting post" });
            }
        }));
    }),
}));
jest.mock("../middlewares/UpdatePostMiddleware", () => ({
    UpdatePostMiddleware: jest.fn((schema) => {
        return jest.fn((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const updated = yield Post_model_1.default.findByIdAndUpdate(req.body.id, req.body, { new: true });
                if (!updated) {
                    res.status(404).json({ message: "Post not found" });
                    return;
                }
                res.status(200).json(updated);
            }
            catch (_a) {
                res.status(500).json({ message: "Error updating post" });
            }
        }));
    }),
}));
jest.mock("../schemas/Post.ZodSchema", () => ({
    PostZodSchema: {
        parse: jest.fn(),
        safeParse: jest.fn(),
    },
}));
//pour la creation
describe("CreatePostMiddleware", () => {
    const mockRequest = (body) => ({ body });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should call next if body is valid", () => {
        const req = mockRequest({
            user: "507f191e810c19729de860ea",
            text: "Test post",
            media: "img.jpg",
        });
        const res = mockResponse();
        const next = jest.fn();
        const createPostMiddleware = (0, CreatePostMiddleware_1.CreatePostRequest)(Post_ZodSchema_1.PostZodSchema);
        createPostMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
    it("should return 400 if body is invalid", () => {
        const req = mockRequest({}); // corps invalide
        const res = mockResponse();
        const next = jest.fn();
        const createPostMiddleware = (0, CreatePostMiddleware_1.CreatePostRequest)(Post_ZodSchema_1.PostZodSchema);
        createPostMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Validation error",
            errors: expect.any(Array),
        }));
        expect(next).not.toHaveBeenCalled();
    });
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
        const req = {
            params: { id: "postId123" }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const deletedPost = {
            id: "postId123",
            media: "img.jpg",
            text: "old",
        };
        Post_model_1.default.findByIdAndDelete.mockResolvedValue(deletedPost);
        const deletePostMiddleware = (0, DeletePostMiddleware_1.DeletePostMiddleware)(Post_ZodSchema_1.PostZodSchema);
        yield deletePostMiddleware(req, res, () => { });
        expect(Post_model_1.default.findByIdAndDelete).toHaveBeenCalledWith("postId123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(deletedPost);
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
