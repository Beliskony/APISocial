
// src/config/TYPES.ts
export const TYPES = {
    // Services
    IUserService: Symbol.for("IUserService"),
    PostService: Symbol.for("PostService"),
    UserService: Symbol.for("UserService"),
    CommentService: Symbol.for("CommentService"),
    StoryService: Symbol.for("StoryService"),
    LikeService: Symbol.for("LikeService"),
    NotificationsService: Symbol.for("NotificationsService"),
    MediaService: Symbol.for('MediaService'),
    
    // Providers
    UserProvider: Symbol.for("UserProvider"),
    StoryProvider: Symbol.for("StoryProvider"),
    LikeProvider: Symbol.for("LikeProvider"),
    PostProvider: Symbol.for("PostProvider"),
    CommentProvider: Symbol.for("CommentProvider"),
    NotificationsProvider: Symbol.for("NotificationsProvider"),
    
    // Controllers
    UserController: Symbol.for("UserController"),
    CommentController: Symbol.for("CommentController"),
    PostController: Symbol.for("PostController"),
    LikeController: Symbol.for("LikeController"),
    StoryController: Symbol.for("StoryController"),
    NotificationsController: Symbol.for("NotificationsController"),
    MediaController: Symbol.for('MediaController'),
  
    
    // Routers
    UserRouter: Symbol.for("UserRouter"),
    StoryRouter: Symbol.for("StoryRouter"),
    PostRouter: Symbol.for("PostRouter"),
    CommentRouter: Symbol.for("CommentRouter"),
    LikeRouter: Symbol.for("LikeRouter"),
    NotificationsRouter: Symbol.for("NotificationsRouter"),
    MediaRouter: Symbol.for("MediaRouter"),




    //Admin Only
    AdminService: Symbol.for("AdminService"),
    AdminProvider: Symbol.for("AdminProvider"),
    AdminController: Symbol.for("AdminController"),
    AdminRouter: Symbol.for("AdminRouter"),
  };