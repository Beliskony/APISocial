// Admin.Middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AdminModel, { IAdmin } from "../adminModel/Admin.Model";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export interface AdminAuthRequest extends Request {
  admin?: IAdmin;
}

export const adminAuthMiddleware = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Token d'authentification manquant" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const admin = await AdminModel.findById(decoded.id).select("-password");

    if (!admin) {
      res.status(401).json({ message: "Admin non trouvé" });
      return;
    }

    if (!admin.status.isActive) {
      res.status(401).json({ message: "Compte admin désactivé" });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Erreur authentification admin:", error);
    res.status(401).json({ message: "Token invalide" });
  }
};

// Middleware de permissions
export const requirePermission = (permission: keyof IAdmin['permissions']) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    if (!req.admin.permissions[permission] && req.admin.role !== 'admin') {
      res.status(403).json({ 
        message: `Permission "${permission}" requise` 
      });
      return;
    }

    next();
  };
};