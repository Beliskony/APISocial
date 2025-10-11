// src/api/routes/user.routes.ts
import { Router } from "express";
import { inject, injectable } from "inversify";
import { UserController } from "../controllers/userController";
import { 
  authenticateJWT, 
  registerUser, 
  loginUser,
  validateRequest 
} from "../middlewares/auth";
import { 
  CreateUserZodSchema, 
  LoginZodSchema, 
  UpdateProfileZodSchema,
  FollowZodSchema,
  SearchUsersZodSchema,
  BlockUserZodSchema,
  PrivacySettingsZodSchema,
  DeactivateAccountZodSchema,
  SuggestedUsersZodSchema,
  GetUserByIdZodSchema
} from "../schemas/User.ZodSchema";
import { formParser } from "../middlewares/form-data";
import { TYPES } from "../config/TYPES";

@injectable()
export class UserRouter {
    public router: Router;
    private userController: UserController;

    constructor(
        @inject(TYPES.UserController) userController: UserController
    ) {
        this.router = Router();
        this.userController = userController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // ====================
        // 📍 ROUTES PUBLIQUES
        // ====================
        
        // 🔍 Recherche d'utilisateurs par username
        this.router.get(
            "/search/:username", 
            this.userController.findUserByUsername.bind(this.userController)
        );

        // 👤 Récupérer un utilisateur par ID (public avec informations limitées)
        this.router.get(
            "/:userId",
            validateRequest(GetUserByIdZodSchema),
            this.userController.getUserById.bind(this.userController)
        );

        // 📝 Inscription d'un nouvel utilisateur
        this.router.post(
            "/register",
            formParser,
            registerUser(CreateUserZodSchema),
            this.userController.createUser.bind(this.userController)
        );

        // 🔐 Connexion d'un utilisateur
        this.router.post(
            "/login",
            formParser,
            loginUser(LoginZodSchema),
            this.userController.loginUser.bind(this.userController)
        );

        // ====================
        // 🔐 ROUTES PROTÉGÉES
        // ====================
        
        // 👤 Récupérer mon profil (utilisateur connecté)
        this.router.get(
            "/me/profile",
            authenticateJWT,
            this.userController.getMe.bind(this.userController)
        );

        // ✏️ Mettre à jour mon profil
        this.router.put(
            "/me/profile",
            authenticateJWT,
            formParser,
            validateRequest(UpdateProfileZodSchema),
            this.userController.updateUserProfile.bind(this.userController)
        );

        // 🛑 Désactiver mon compte
        this.router.post(
            "/me/deactivate",
            authenticateJWT,
            validateRequest(DeactivateAccountZodSchema),
            this.userController.deactivateAccount.bind(this.userController)
        );

        // ====================
        // 👥 RÉSEAU SOCIAL
        // ====================
        
        // 💡 Suggestions d'utilisateurs
        this.router.get(
            "/me/suggestions",
            authenticateJWT,
            validateRequest(SuggestedUsersZodSchema),
            this.userController.getSuggestions.bind(this.userController)
        );

        // 🔍 Recherche avancée d'utilisateurs
        this.router.get(
            "/search/advanced",
            authenticateJWT,
            validateRequest(SearchUsersZodSchema),
            this.userController.searchUsers.bind(this.userController)
        );

        // ➕ Suivre/Ne plus suivre un utilisateur
        this.router.post(
            "/follow/:targetId",
            authenticateJWT,
            validateRequest(FollowZodSchema),
            this.userController.toggleFollow.bind(this.userController)
        );

        // 🚫 Bloquer un utilisateur
        this.router.post(
            "/block/:targetId",
            authenticateJWT,
            validateRequest(BlockUserZodSchema),
            this.userController.blockUser.bind(this.userController)
        );

        // ✅ Débloquer un utilisateur
        this.router.post(
            "/unblock/:targetId",
            authenticateJWT,
            validateRequest(BlockUserZodSchema),
            this.userController.unblockUser.bind(this.userController)
        );

        // 📋 Liste des utilisateurs bloqués
        this.router.get(
            "/me/blocked-users",
            authenticateJWT,
            this.userController.getBlockedUsers.bind(this.userController)
        );

        // ====================
        // ⚙️ PARAMÈTRES
        // ====================
        
        // 🔒 Mettre à jour les paramètres de confidentialité
        this.router.put(
            "/me/privacy-settings",
            authenticateJWT,
            validateRequest(PrivacySettingsZodSchema),
            this.userController.updatePrivacySettings.bind(this.userController)
        );

        // ====================
        // 🎯 ROUTES ADMIN (optionnelles)
        // ====================
        
        // 📊 Statistiques utilisateur (pour admin)
        this.router.get(
            "/admin/analytics",
            authenticateJWT,
            // Ajouter un middleware de rôle admin ici
            (req, res) => {
                res.json({ message: "Statistiques admin - À implémenter" });
            }
        );

        // 🚨 Modération utilisateur (pour admin)
        this.router.post(
            "/admin/users/:userId/suspend",
            authenticateJWT,
            // Ajouter un middleware de rôle admin ici
            (req, res) => {
                res.json({ message: "Suspension utilisateur - À implémenter" });
            }
        );
    }

    // Méthode pour obtenir le router
    public getRouter(): Router {
        return this.router;
    }
}

// Export pour une utilisation facile
export default UserRouter;