import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { injectable, inject } from "inversify";
import { TYPES } from "../../config/TYPES";
import { AdminProvider } from "../adminProvider/Admin.Provider";
import { IAdmin } from "../adminModel/Admin.Model";
import { Document } from "mongoose";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.AdminProvider) private adminProvider: AdminProvider
  ) {}

  private generateToken(admin: any): string {
          return jwt.sign(
              { _id: admin._id, username: admin.username, email: admin.email, profilePicture: admin.profilePicture},
              process.env.JWT_SECRET || "your_secret_key",
              { expiresIn: "30d" }
          );
      }

  //create Admin
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.body;
      const newAdmin = await this.adminProvider.createAdmin(admin);

      // Génération d'un token JWT
            const token = this.generateToken(newAdmin);
            // Exclure le mot de passe du token
            const { password, ...userWithoutPassword } = newAdmin.toObject();

        res.status(201).json({message: "Admin enregistré avec succès",
                id: newAdmin._id,
                token,});
                console.log("Controller createAdmin called with body:", req.body)
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }



  // Connexion de l'admin
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const admin = await this.adminProvider.getAdmin();

      if (!admin) {
        res.status(404).json({ message: "Administrateur non trouvé" });
        return;
      }

      if (admin.email !== email) {
        res.status(401).json({ message: "Email incorrect" });
        return;
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        res.status(401).json({ message: "Mot de passe incorrect" });
        return;
      }

      const token = jwt.sign({ id: admin._id }, SECRET_KEY, {
        expiresIn: "7d",
      });

      res.status(200).json({
        message: "Connexion réussie",
        token,
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          profilePicture: admin.profilePicture,
        },
      });
    } catch (error) {
      console.error("Erreur de connexion admin:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  // Récupérer le profil de l'admin
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        res.status(401).json({ message: "Non autorisé" });
        return;
      }

      res.status(200).json({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        profilePicture: admin.profilePicture,
      });
    } catch (error) {
      console.error("Erreur getProfile admin:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  }

  // Supprimer un utilisateur complet
  async deleteUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;

    try {
      await this.adminProvider.deleteUserComplet(userId);
      res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  }

  // Supprimer un commentaire
  async deleteComment(req: Request, res: Response): Promise<void> {
    const commentId = req.params.id;

    try {
      await this.adminProvider.deleteCommentaire(commentId);
      res.status(200).json({ message: "Commentaire supprimé avec succès" });
    } catch (error) {
      console.error("Erreur suppression commentaire:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  }

  // Supprimer une publication
  async deletePost(req: Request, res: Response): Promise<void> {
    const postId = req.params.id;

    try {
      await this.adminProvider.deletePublication(postId);
      res.status(200).json({ message: "Publication supprimée avec succès" });
    } catch (error) {
      console.error("Erreur suppression publication:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  }
}
