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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const container_1 = require("./config/container");
const TYPES_1 = require("./config/TYPES");
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
// Injection de dépendances
const userRouter = container_1.container.get(TYPES_1.TYPES.UserRouter);
const storyRouter = container_1.container.get(TYPES_1.TYPES.StoryRouter);
const postRouter = container_1.container.get(TYPES_1.TYPES.PostRouter);
const likeRouter = container_1.container.get(TYPES_1.TYPES.LikeRouter);
const commentRouter = container_1.container.get(TYPES_1.TYPES.CommentRouter);
// Routes
app.use("/api/user", userRouter.router);
app.use("/api/story", storyRouter.router);
app.use("/api/post", postRouter.router);
app.use("/api/like", likeRouter.router);
app.use("/api/comment", commentRouter.router);
// Fonction de démarrage
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.default)();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Serveur lancé sur le port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Erreur au démarrage du serveur :", error);
    }
});
startServer(); // ← C’est maintenant ici que le serveur démarre
