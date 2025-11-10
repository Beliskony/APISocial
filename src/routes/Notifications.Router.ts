// src/api/routes/notifications.routes.ts
import { Router } from "express";
import { NotificationsController } from "../controllers/notificationsController";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/TYPES";
import { validateRequest } from "../middlewares/auth";
import { 
  CreateNotificationSchema, 
  NotificationIdParamSchema, 
  NotificationTypeParamSchema,
  PaginationQuerySchema 
} from "../schemas/Notification.ZodSchema";
import { authenticateJWT } from "../middlewares/auth";

@injectable()
export class NotificationsRouter {
    public router: Router;
    private notificationsController: NotificationsController;

    constructor(
        @inject(TYPES.NotificationsController) notificationsController: NotificationsController
    ) {
        this.router = Router();
        this.notificationsController = notificationsController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // ====================
        // 📨 CRÉATION
        // ====================
        
        // Créer une notification
        this.router.post(
            "/",
            authenticateJWT,
            validateRequest(CreateNotificationSchema),
            this.notificationsController.createNotification.bind(this.notificationsController)
        );

        // ====================
        // 📖 LECTURE
        // ====================
        
        // Récupérer toutes les notifications (avec pagination)
        this.router.get(
            "/",
            authenticateJWT,
            validateRequest(PaginationQuerySchema),
            this.notificationsController.getNotifications.bind(this.notificationsController)
        );

        // Récupérer une notification spécifique
        this.router.get(
            "/:notificationId",
            authenticateJWT,
            validateRequest(NotificationIdParamSchema),
            this.notificationsController.getNotificationById.bind(this.notificationsController)
        );

        // Récupérer les notifications par type
        this.router.get(
            "/type/:type",
            authenticateJWT,
            validateRequest(NotificationTypeParamSchema),
            validateRequest(PaginationQuerySchema),
            this.notificationsController.getNotificationsByType.bind(this.notificationsController)
        );

        // Compter les notifications non lues
        this.router.get(
            "/unread/count",
            authenticateJWT,
            this.notificationsController.getUnreadCount.bind(this.notificationsController)
        );

        // ====================
        // ✏️ MISE À JOUR
        // ====================
        
        // Marquer une notification comme lue
        this.router.patch(
            "/:notificationId/read",
            authenticateJWT,
            validateRequest(NotificationIdParamSchema),
            this.notificationsController.markAsRead.bind(this.notificationsController)
        );

        // Marquer toutes les notifications comme lues
        this.router.patch(
            "/read/all",
            authenticateJWT,
            this.notificationsController.markAllAsRead.bind(this.notificationsController)
        );

        // ====================
        // 🗑️ SUPPRESSION
        // ====================
        
        // Supprimer une notification individuelle
        this.router.delete(
            "/:notificationId",
            authenticateJWT,
            validateRequest(NotificationIdParamSchema),
            this.notificationsController.deleteNotification.bind(this.notificationsController)
        );

        // Supprimer toutes les notifications de l'utilisateur connecté
        this.router.delete(
            "/",
            authenticateJWT,
            this.notificationsController.deleteAllUserNotifications.bind(this.notificationsController)
        );

        //this.router.post(
          //  '/register-push-token', 
            //authenticateJWT, 
            //this.notificationsController.registerPushToken.bind(this.notificationsController)
        //);

        this.router.post(
            '/remove-push-token', 
            authenticateJWT, 
            this.notificationsController.removePushToken.bind(this.notificationsController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default NotificationsRouter;