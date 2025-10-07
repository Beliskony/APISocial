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
        // Créer une notification
        this.router.post(
            "/create",
            authenticateJWT,
            NotificationsMiddleware(NotificationSchema),
            this.notificationsController.createNotification.bind(this.notificationsController)
        );

        // Récupérer toutes les notifications
        this.router.get(
            "/getNotifications",
            authenticateJWT,
            this.notificationsController.getNotifications.bind(this.notificationsController)
        );

        // Marquer comme lue
        this.router.patch(
            "/markAsRead/:notificationId",
            authenticateJWT,
            NotificationsMiddleware(NotificationIdParamSchema),
            this.notificationsController.markAsRead.bind(this.notificationsController)
        );

        // Compter les notifications non lues
        this.router.get(
            "/unreadCount",
            authenticateJWT,
            this.notificationsController.getUnreadCount.bind(this.notificationsController)
        );

        // Supprimer une notification individuelle
        this.router.delete(
            "/delete/:notificationId",
            authenticateJWT,
            NotificationsMiddleware(NotificationIdParamSchema),
            this.notificationsController.deleteNotification.bind(this.notificationsController)
        );

        // Supprimer toutes les notifications de l'utilisateur connecté
        this.router.delete(
            "/deleteAll",
            authenticateJWT,
            this.notificationsController.deleteAllUserNotifications.bind(this.notificationsController)
        );

        this.router.patch(
            "/markAllAsRead",
            authenticateJWT,
            this.notificationsController.markAllAsRead.bind(this.notificationsController)
        );

    }
}
