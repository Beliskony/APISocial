import { Router } from "express";
import { AdminController } from "../adminController/Admin.Controller";
import { verifyAdmin } from "../adminMiddleware/Admin.Middleware";
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
            this.adminController.login.bind(this.adminController) // ✅ login() pas adminLogin()
        );

        // 🔒 PROFIL ADMIN (protégé)
        this.router.get(
            "/profile",
            verifyAdmin,
            this.adminController.getProfile.bind(this.adminController) // ✅ getProfile() pas getAdminProfile()
        );

        // 📊 TABLEAU DE BORD (protégé)
        this.router.get(
            "/dashboard/stats",
            verifyAdmin,
            this.adminController.getDashboardStats.bind(this.adminController)
        );

        // 👥 GESTION UTILISATEURS (protégé)
        this.router.get(
            "/users",
            verifyAdmin,
            this.adminController.getAllUsers.bind(this.adminController)
        );

        this.router.get(
            "/users/search",
            verifyAdmin,
            this.adminController.searchUsers.bind(this.adminController)
        );

        this.router.post(
            "/users/manage",
            verifyAdmin,
            this.adminController.manageUser.bind(this.adminController)
        );

        this.router.delete(
            "/users/:userId",
            verifyAdmin,
            this.adminController.deleteUser.bind(this.adminController)
        );

        // 📝 GESTION CONTENUS (protégé)
        this.router.get(
            "/posts",
            verifyAdmin,
            this.adminController.getAllPosts.bind(this.adminController)
        );

        this.router.post(
            "/content/moderate",
            verifyAdmin,
            this.adminController.moderateContent.bind(this.adminController)
        );

        this.router.delete(
            "/posts/:postId",
            verifyAdmin,
            this.adminController.deletePost.bind(this.adminController)
        );

        this.router.delete(
            "/comments/:commentId",
            verifyAdmin,
            this.adminController.deleteComment.bind(this.adminController)
        );

        // 🔄 ROUTES EXISTANTES MIGRÉES (pour compatibilité)
        this.router.get(
            "/getAdmin",
            verifyAdmin,
            this.adminController.getProfile.bind(this.adminController) // ✅ getProfile()
        );

        this.router.post(
            "/create",
            this.adminController.createAdmin.bind(this.adminController)
        );

        this.router.post(
            "/login",
            this.adminController.login.bind(this.adminController) // ✅ login()
        );

        // 🔄 Routes de suppression avec anciens paramètres
        this.router.delete(
            "/user/:id",
            verifyAdmin,
            this.adminController.deleteUser.bind(this.adminController)
        );

        this.router.delete(
            "/post/:id", 
            verifyAdmin,
            this.adminController.deletePost.bind(this.adminController)
        );

        this.router.delete(
            "/comment/:id",
            verifyAdmin,
            this.adminController.deleteComment.bind(this.adminController)
        );
    }
}