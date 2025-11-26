import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { injectable, inject } from "inversify";
import { TYPES } from "../../config/TYPES";
import { AdminProvider } from "../adminProvider/Admin.Provider";
import { IAdmin } from "../adminModel/Admin.Model";
import { AdminAuthRequest } from "../adminMiddleware/Admin.Middleware";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.AdminProvider) private adminProvider: AdminProvider
  ) {}

  /**
   * Génère un token JWT pour l'admin
   */
  private generateToken(admin: IAdmin): string {
    return jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        email: admin.email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
  }

  /**
   * ✅ Créer un nouvel admin
   */
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminData: IAdmin = req.body;
      const newAdmin = await this.adminProvider.createAdmin(adminData);

      const token = this.generateToken(newAdmin);

      res.status(201).json({
        message: "Admin créé avec succès",
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          profilePicture: newAdmin.profilePicture,
          role: newAdmin.role
        },
        token
      });
    } catch (error: any) {
      console.error("Erreur création admin:", error);
      res.status(400).json({ 
        message: error.message || "Erreur lors de la création de l'admin" 
      });
    }
  }

  /**
   * ✅ Connexion de l'admin
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email et mot de passe requis" });
        return;
      }

      const admin = await this.adminProvider.adminLogin(email, password);
      const token = this.generateToken(admin);

      res.status(200).json({
        message: "Connexion réussie",
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          profilePicture: admin.profilePicture,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      });
    } catch (error: any) {
      console.error("Erreur connexion admin:", error);
      res.status(401).json({ 
        message: error.message || "Erreur d'authentification" 
      });
    }
  }

  /**
   * ✅ Récupérer le profil de l'admin connecté
   */
  async getProfile(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const admin = req.admin;

      if (!admin) {
        res.status(401).json({ message: "Non autorisé" });
        return;
      }

      res.status(200).json({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        profilePicture: admin.profilePicture,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status
      });
    } catch (error: any) {
      console.error("Erreur récupération profil admin:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération du profil" 
      });
    }
  }

   async getAdvancedAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? {
        start: new Date(start as string),
        end: new Date(end as string)
      } : undefined;

      const analytics = await this.adminProvider.getAdvancedAnalytics(dateRange);
      res.status(200).json(analytics);
    } catch (error: any) {
      console.error("Erreur analytics avancées:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération des analytics" 
      });
    }
  }

  async getReportStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminProvider.getReportStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Erreur stats signalements:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération des stats" 
      });
    }
  }

  /**
   * ✅ Tableau de bord avec statistiques
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminProvider.getDashboardStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Erreur récupération stats dashboard:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des statistiques" 
      });
    }
  }

   /**
   * ✅ Obtenir les signalements en attente
   */
  async getPendingReports(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.adminProvider.getPendingReports(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erreur récupération signalements:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération des signalements" 
      });
    }
  }

  /**
   * ✅ Signaler du contenu
   */
  async reportContent(req: Request, res: Response): Promise<void> {
    try {
      const reportData = req.body;
      await this.adminProvider.reportContent(reportData);
      res.status(201).json({ message: "Contenu signalé avec succès" });
    } catch (error: any) {
      console.error("Erreur signalement:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors du signalement" 
      });
    }
  }

    /**
   * ✅ Traiter un signalement
   */
  async handleReport(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { reportId, action, moderatorNotes } = req.body;
      const adminId = req.admin?._id.toString();

      if (!adminId) {
        res.status(401).json({ message: "Admin non authentifié" });
        return;
      }

      await this.adminProvider.handleReport(reportId, action, adminId, moderatorNotes);
      res.status(200).json({ message: "Signalement traité avec succès" });
    } catch (error: any) {
      console.error("Erreur traitement signalement:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors du traitement du signalement" 
      });
    }
  }

  /**
   * ✅ Loguer une action d'audit
   */
  async logAuditAction(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const auditData = req.body;
      const adminId = req.admin?._id.toString();

      if (!adminId) {
        res.status(401).json({ message: "Admin non authentifié" });
        return;
      }

      await this.adminProvider.logAuditAction({
        ...auditData,
        adminId,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
      });
      res.status(201).json({ message: "Action d'audit loguée avec succès" });
    } catch (error: any) {
      console.error("Erreur log audit:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors du log de l'action" 
      });
    }
  }


   /**
   * ✅ Obtenir les logs d'audit
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        adminId,
        action,
        dateFrom,
        dateTo,
        targetType,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        adminId: adminId as string,
        action: action as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        targetType: targetType as string
      };

      const result = await this.adminProvider.getAuditLogs(
        filters, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erreur logs audit:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération des logs" 
      });
    }
  }
  
  /**
   * ✅ Statistiques d'audit
   */
  async getAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminProvider.getAuditStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Erreur stats audit:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération des stats audit" 
      });
    }
  }

  /**
   * ✅ Lister tous les utilisateurs avec pagination
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.adminProvider.getAllUsers(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erreur récupération utilisateurs:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des utilisateurs" 
      });
    }
  }

  /**
   * ✅ Rechercher des utilisateurs
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!q) {
        res.status(400).json({ message: "Terme de recherche requis" });
        return;
      }

      const result = await this.adminProvider.searchUsers(q as string, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erreur recherche utilisateurs:", error);
      res.status(500).json({ 
        message: "Erreur lors de la recherche" 
      });
    }
  }

  /**
   * ✅ Gérer un utilisateur (suspendre/activer/supprimer)
   */
  async manageUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, action, reason, duration } = req.body;

      if (!userId || !action) {
        res.status(400).json({ message: "userId et action requis" });
        return;
      }

      await this.adminProvider.manageUser({
        userId,
        action,
        reason,
        duration
      });

      res.status(200).json({ 
        message: `Utilisateur ${action} avec succès` 
      });
    } catch (error: any) {
      console.error("Erreur gestion utilisateur:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la gestion de l'utilisateur" 
      });
    }
  }

  /**
   * ✅ Supprimer complètement un utilisateur
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      await this.adminProvider.deleteUserComplet(userId);
      
      res.status(200).json({ 
        message: "Utilisateur supprimé avec succès" 
      });
    } catch (error: any) {
      console.error("Erreur suppression utilisateur:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la suppression" 
      });
    }
  }

  /**
   * ✅ Lister toutes les publications avec pagination
   */
  async getAllPosts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.adminProvider.getAllPosts(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erreur récupération publications:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des publications" 
      });
    }
  }

  /**
   * ✅ Modérer du contenu (post ou commentaire)
   */
  async moderateContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, contentType, action } = req.body;

      if (!contentId || !contentType || !action) {
        res.status(400).json({ 
          message: "contentId, contentType et action requis" 
        });
        return;
      }

      await this.adminProvider.moderateContent(contentId, contentType, action);
      
      res.status(200).json({ 
        message: `Contenu ${action} avec succès` 
      });
    } catch (error: any) {
      console.error("Erreur modération contenu:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la modération" 
      });
    }
  }

  /**
   * ✅ Supprimer une publication
   */
  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.id;
      await this.adminProvider.deletePublication(postId);
      
      res.status(200).json({ 
        message: "Publication supprimée avec succès" 
      });
    } catch (error: any) {
      console.error("Erreur suppression publication:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la suppression" 
      });
    }
  }

  /**
   * ✅ Supprimer un commentaire
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const commentId = req.params.id;
      await this.adminProvider.deleteCommentaire(commentId);
      
      res.status(200).json({ 
        message: "Commentaire supprimé avec succès" 
      });
    } catch (error: any) {
      console.error("Erreur suppression commentaire:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la suppression" 
      });
    }
  }

  /**
   * ✅ Récupérer le profil admin par ID (pour super admin)
   */
  async getAdminProfileById(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.params.id;
      const admin = await this.adminProvider.getAdminProfile(adminId);
      
      res.status(200).json({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        profilePicture: admin.profilePicture,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status
      });
    } catch (error: any) {
      console.error("Erreur récupération profil admin:", error);
      res.status(500).json({ 
        message: error.message || "Erreur lors de la récupération du profil" 
      });
    }
  }

/**
 * ✅ Récupérer les commentaires d'une publication
 */
async getCommentByPost(req: AdminAuthRequest, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    const adminId = req.admin?._id.toString();

    if (!adminId) {
      res.status(401).json({ message: "Admin non authentifié" });
      return;
    }

    // Validation de l'ID
    if (!postId) {
      res.status(400).json({
        success: false,
        message: "ID de publication requis"
      });
      return;
    }

    // Vérification que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({
        success: false,
        message: "ID de publication invalide"
      });
      return;
    }

    // Appel du provider
    const comments = await this.adminProvider.getCommentByPost(postId);

    // Réponse réussie
    res.status(200).json({
      success: true,
      data: {
        comments,
        total: comments.length
      },
      message: "Commentaires récupérés avec succès"
    });

  } catch (error: any) {
    console.error('Erreur dans getCommentByPost:', error);
    
    // Gestion des erreurs spécifiques
    if (error.message.includes("ID de publication invalide")) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else if (error.message.includes("Erreur lors de la récupération")) {
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des commentaires"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
}

}