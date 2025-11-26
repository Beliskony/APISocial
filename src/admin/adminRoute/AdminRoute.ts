import { Router } from "express";
import { AdminController } from "../adminController/Admin.Controller";
import { adminAuthMiddleware, requirePermission } from "../adminMiddleware/Admin.Middleware";
import { inject, injectable } from "inversify";
import { TYPES } from "../../config/TYPES";

@injectable()
export class AdminRouter {
    public router: Router;
    private adminController: AdminController;

    constructor(@inject(TYPES.AdminController) adminController: AdminController) {
        this.router = Router();
        this.adminController = adminController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
         // 🔐 AUTHENTIFICATION (publique)
        this.router.post(
            "/auth/register",
            this.adminController.createAdmin.bind(this.adminController)
        );

        this.router.post(
            "/auth/login", 
            this.adminController.login.bind(this.adminController)
        );

        // 🔒 PROFIL ADMIN (protégé)
        this.router.get(
            "/profile",
            adminAuthMiddleware,
            this.adminController.getProfile.bind(this.adminController)
        );

        // 📊 TABLEAU DE BORD & ANALYTICS (protégé)
        this.router.get(
            "/dashboard/stats",
            adminAuthMiddleware,
            requirePermission('canViewAnalytics'),
            this.adminController.getDashboardStats.bind(this.adminController)
        );

        this.router.get(
            "/analytics/advanced",
            adminAuthMiddleware,
            requirePermission('canViewAnalytics'),
            this.adminController.getAdvancedAnalytics.bind(this.adminController)
        );

        // 🚨 REPORTING & SIGNALEMENTS (protégé)
        this.router.post(
            "/reports",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.reportContent.bind(this.adminController)
        );

        this.router.get(
            "/reports/pending",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.getPendingReports.bind(this.adminController)
        );

        this.router.post(
            "/reports/:reportId/handle",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.handleReport.bind(this.adminController)
        );

        this.router.get(
            "/reports/stats",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.getReportStats.bind(this.adminController)
        );

        // 📝 AUDIT & LOGS (protégé)
        this.router.post(
            "/audit/log",
            adminAuthMiddleware,
            this.adminController.logAuditAction.bind(this.adminController)
        );

        this.router.get(
            "/audit/logs",
            adminAuthMiddleware,
            requirePermission('canViewAnalytics'),
            this.adminController.getAuditLogs.bind(this.adminController)
        );

        this.router.get(
            "/audit/stats",
            adminAuthMiddleware,
            requirePermission('canViewAnalytics'),
            this.adminController.getAuditStats.bind(this.adminController)
        );

        // 👥 GESTION UTILISATEURS (protégé)
        this.router.get(
            "/users",
            adminAuthMiddleware,
            requirePermission('canManageUsers'),
            this.adminController.getAllUsers.bind(this.adminController)
        );

        this.router.get(
            "/users/search",
            adminAuthMiddleware,
            requirePermission('canManageUsers'),
            this.adminController.searchUsers.bind(this.adminController)
        );

        this.router.post(
            "/users/manage",
            adminAuthMiddleware,
            requirePermission('canManageUsers'),
            this.adminController.manageUser.bind(this.adminController)
        );

        this.router.delete(
            "/users/:userId",
            adminAuthMiddleware,
            requirePermission('canManageUsers'),
            this.adminController.deleteUser.bind(this.adminController)
        );

        // 📝 GESTION CONTENUS (protégé)
        this.router.get(
            "/posts",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.getAllPosts.bind(this.adminController)
        );

        this.router.get(
            "/:postId/comments",
            adminAuthMiddleware,
            this.adminController.getCommentByPost.bind(this.adminController)
        )

        this.router.post(
            "/content/moderate",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.moderateContent.bind(this.adminController)
        );

        this.router.delete(
            "/posts/:postId",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.deletePost.bind(this.adminController)
        );

        this.router.delete(
            "/comments/:commentId",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.deleteComment.bind(this.adminController)
        );

        // 🔄 ROUTES EXISTANTES MIGRÉES (pour compatibilité)
        this.router.get(
            "/getAdmin",
            adminAuthMiddleware,
            this.adminController.getProfile.bind(this.adminController)
        );

        this.router.post(
            "/create",
            this.adminController.createAdmin.bind(this.adminController)
        );

        this.router.post(
            "/login",
            this.adminController.login.bind(this.adminController)
        );

        // 🔄 Routes de suppression avec anciens paramètres
        this.router.delete(
            "/user/:id",
            adminAuthMiddleware,
            requirePermission('canManageUsers'),
            this.adminController.deleteUser.bind(this.adminController)
        );

        this.router.delete(
            "/post/:id", 
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.deletePost.bind(this.adminController)
        );

        this.router.delete(
            "/comment/:id",
            adminAuthMiddleware,
            requirePermission('canManageContent'),
            this.adminController.deleteComment.bind(this.adminController)
        );

        // 🔄 Route profil admin par ID (super admin)
        this.router.get(
            "/admin/:id",
            adminAuthMiddleware,
            this.adminController.getAdminProfileById.bind(this.adminController)
        );
    }
}