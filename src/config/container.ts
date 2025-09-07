import { Container } from "inversify";
import { PostService } from "../services/Post.service";
import { UserService } from "../services/User.service";
import { CommentService } from "../services/comment.service";
import { StoryService } from "../services/Story.service";
import { LikeService } from "../services/Like.service";
import { NotificationsService } from "../services/Notifications.Service";
import { LikeProvider } from "../providers/Like.provider";
import { UserProvider } from "../providers/User.provider";
import { StoryProvider } from "../providers/Story.provider";
import { NotificationsProvider } from "../providers/Notifications.provider";
import { UserController } from "../controllers/userController";
import { CommentController } from "../controllers/commentaireController";
import { NotificationsController } from "../controllers/notificationsController";
import { PostController } from "../controllers/postController";
import { LikeController } from "../controllers/likeController";
import { PostProvider } from "../providers/Post.provider";
import { CommentProvider } from "../providers/comment.provider";
import { StoryController } from "../controllers/storyController";
import { UserRouter } from "../routes/User.Router";
import { CommentRouter } from "../routes/Comment.Router";
import { PostRouter } from "../routes/Post.Router";
import { LikeRouter } from "../routes/Like.Router";
import { StoryRouter } from "../routes/Story.Router";
import { NotificationsRouter } from "../routes/Notifications.Router";
import { AdminService } from "../admin/adminService/Admin.Service";
import { AdminProvider } from "../admin/adminProvider/Admin.Provider";
import { AdminRouter } from "../admin/adminRoute/AdminRoute";
import { AdminController } from "../admin/adminController/Admin.Controller";
import { TYPES } from "./TYPES";
import { MediaService } from "../services/Media.service";
import { MediaController } from "../controllers/MediaController";
import { MediaRouter } from "../routes/media.router";



export const container: Container = new Container();
// services
container.bind(TYPES.PostService).to(PostService).inSingletonScope();
container.bind(TYPES.UserService).to(UserService).inSingletonScope();
container.bind(TYPES.CommentService).to(CommentService).inSingletonScope();
container.bind(TYPES.StoryService).to(StoryService).inSingletonScope();
container.bind(TYPES.LikeService).to(LikeService).inSingletonScope();
container.bind(TYPES.NotificationsService).to(NotificationsService).inSingletonScope();
container.bind(TYPES.MediaService).to(MediaService).inSingletonScope()


// providers
container.bind(TYPES.UserProvider).to(UserProvider).inSingletonScope();
container.bind(TYPES.StoryProvider).to(StoryProvider).inSingletonScope();
container.bind(TYPES.LikeProvider).to(LikeProvider).inSingletonScope();
container.bind(TYPES.PostProvider).to(PostProvider).inSingletonScope();
container.bind(TYPES.CommentProvider).to(CommentProvider).inSingletonScope();
container.bind(TYPES.NotificationsProvider).to(NotificationsProvider).inSingletonScope();


// controllers
container.bind(TYPES.UserController).to(UserController).inSingletonScope();
container.bind(TYPES.CommentController).to(CommentController).inSingletonScope();
container.bind(TYPES.PostController).to(PostController).inSingletonScope();
container.bind(TYPES.LikeController).to(LikeController).inSingletonScope();
container.bind(TYPES.StoryController).to(StoryController).inSingletonScope();
container.bind(TYPES.NotificationsController).to(NotificationsController).inSingletonScope();
container.bind(TYPES.MediaController).to(MediaController).inSingletonScope()

// routes
container.bind(TYPES.UserRouter).to(UserRouter).inSingletonScope();
container.bind(TYPES.CommentRouter).to(CommentRouter).inSingletonScope();
container.bind(TYPES.PostRouter).to(PostRouter).inSingletonScope();
container.bind(TYPES.LikeRouter).to(LikeRouter).inSingletonScope();
container.bind(TYPES.StoryRouter).to(StoryRouter).inSingletonScope();
container.bind(TYPES.NotificationsRouter).to(NotificationsRouter).inSingletonScope();
container.bind(TYPES.MediaRouter).to(MediaRouter).inSingletonScope()



// admin only
// services, providers, controllers, routers
container.bind<AdminController>(TYPES.AdminController).to(AdminController).inSingletonScope();
container.bind<AdminService>(TYPES.AdminService).to(AdminService).inSingletonScope();
container.bind<AdminProvider>(TYPES.AdminProvider).to(AdminProvider).inSingletonScope();
container.bind<AdminRouter>(TYPES.AdminRouter).to(AdminRouter).inSingletonScope();

