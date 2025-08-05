import { Router } from "express";
import { NotificationsController } from "../controllers/notificationsController";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/TYPES";
import { NotificationsMiddleware } from "../middlewares/NotificationsMiddleware";
import { NotificationSchema, NotificationIdParamSchema } from "../schemas/Notification.ZodSchema";
import { authenticateJWT } from "../middlewares/auth";


@injectable()
export class NotificationsRouter {
    public router: Router;
    private notificationsController: NotificationsController;

    constructor(@inject(TYPES.NotificationsController) notificationsController: NotificationsController) {
        this.router = Router();
        this.notificationsController = notificationsController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post("/create", authenticateJWT, NotificationsMiddleware(NotificationSchema), this.notificationsController.createNotification.bind(this.notificationsController));
        this.router.get("/getNotifications", authenticateJWT, this.notificationsController.getNotifications.bind(this.notificationsController));
        this.router.patch("/markAsRead/:notificationId", authenticateJWT, NotificationsMiddleware(NotificationIdParamSchema), this.notificationsController.markAsRead.bind(this.notificationsController));
        this.router.get("/unreadCount", authenticateJWT, this.notificationsController.getUnreadCount.bind(this.notificationsController));
    }
}