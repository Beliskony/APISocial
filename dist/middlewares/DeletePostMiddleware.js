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
exports.DeletePostMiddleware = void 0;
const Post_model_1 = __importDefault(require("../models/Post.model"));
const DeletePostMiddleware = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // 1. Valider le body via Zod
            const { postId } = schema.parse(req.body);
            // 2. Trouver le post
            const post = yield Post_model_1.default.findById(postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            // 3. Vérifier l'auteur
            if (post.user.toString() !== req.params.userId) {
                res.status(403).json({ message: "You are not authorized to delete this post" });
                return;
            }
            // Ajouter le post dans req.body si besoin
            req.body.post = post;
            next();
        }
        catch (error) {
            if (error.name === "ZodError") {
                res.status(400).json({ message: "Validation failed", errors: error.errors });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
            return;
        }
    });
};
exports.DeletePostMiddleware = DeletePostMiddleware;
