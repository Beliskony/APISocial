import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { UserRouter } from "./routes/User.Router";
import { StoryRouter } from "./routes/Story.Router";
import { PostRouter } from "./routes/Post.Router";
import { CommentRouter } from "./routes/Comment.Router";
import { NotificationsRouter } from "./routes/Notifications.Router";
import { AdminRouter } from "./admin/adminRoute/AdminRoute";
import { container } from "./config/container";
import { TYPES } from "./config/TYPES";
import bodyParser from "body-parser";
import { MediaRouter } from "./routes/media.router";
import cors from "cors";



dotenv.config();

const app = express();

// Configuration CORS
app.use(cors({
  origin: ["http://localhost:5173", "https://ton-domaine.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Injection de dépendances
const userRouter = container.get<UserRouter>(TYPES.UserRouter);
const storyRouter = container.get<StoryRouter>(TYPES.StoryRouter);
const postRouter = container.get<PostRouter>(TYPES.PostRouter);
const commentRouter = container.get<CommentRouter>(TYPES.CommentRouter);
const adminRouter = container.get<AdminRouter>(TYPES.AdminRouter)
const notificationsRouter = container.get<NotificationsRouter>(TYPES.NotificationsRouter);
const mediaRouter = container.get<MediaRouter>(TYPES.MediaRouter)

// Routes
app.use("/api/user", userRouter.router);
app.use("/api/story", storyRouter.router);
app.use("/api/post", postRouter.router);
app.use("/api/comment", commentRouter.router);
app.use("/api/admin", adminRouter.router);
app.use("/api/notifications", notificationsRouter.router);
app.use("/api/media", mediaRouter.router)


// Fonction de démarrage
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage du serveur :", error);
  }
};

startServer(); // ← C’est maintenant ici que le serveur démarre
