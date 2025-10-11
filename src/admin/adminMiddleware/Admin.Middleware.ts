import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AdminModel from "../adminModel/Admin.Model";
import { IAdmin } from "../adminModel/Admin.Model";

// Étendre l'interface Request pour inclure l'admin
export interface AdminAuthRequest extends Request {
  admin?: IAdmin;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const verifyAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        message: 'Accès refusé. Token manquant ou format invalide.' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Accès refusé. Token manquant.' });
      return;
    }

    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: string; 
      username?: string;
      email?: string;
      role?: string;
    };

    // Rechercher l'admin dans la base de données
    const admin = await AdminModel.findById(decoded.id)
      .select('-password') // Exclure le mot de passe
      .exec();

    if (!admin) {
      res.status(403).json({ 
        message: "Accès refusé. Admin non trouvé ou compte désactivé." 
      });
      return;
    }

    // Vérifier si le compte admin est actif
    if (!admin.status?.isActive) {
      res.status(403).json({ 
        message: "Accès refusé. Compte admin désactivé." 
      });
      return;
    }

    // Attacher l'admin à la requête
    req.admin = admin;

    next();
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token JWT invalide.' });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expiré.' });
      return;
    }

    res.status(500).json({ 
      message: 'Erreur serveur lors de la vérification admin.' 
    });
  }
};

/**
 * ✅ Middleware pour vérifier les permissions spécifiques
 */
export const requirePermission = (permission: string) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ message: 'Authentification requise.' });
      return;
    }

    // Vérifier les permissions basées sur le rôle
    const hasPermission = checkAdminPermission(req.admin, permission);
    
    if (!hasPermission) {
      res.status(403).json({ 
        message: `Permission insuffisante. Requiert: ${permission}` 
      });
      return;
    }

    next();
  };
};

/**
 * ✅ Vérifier les permissions de l'admin
 */
const checkAdminPermission = (admin: IAdmin, permission: string): boolean => {
  // Super admin a tous les accès
  if (admin.role === 'super_admin') {
    return true;
  }

  // Vérifier les permissions spécifiques
  switch (permission) {
    case 'manage_users':
      return admin.permissions?.canManageUsers ?? true;
    
    case 'manage_content':
      return admin.permissions?.canManageContent ?? true;
    
    case 'view_analytics':
      return admin.permissions?.canViewAnalytics ?? true;
    
    case 'manage_system':
      return admin.permissions?.canManageSystem ?? false;
    
    default:
      return false;
  }
};

/**
 * ✅ Middleware pour vérifier le rôle super admin
 */
export const requireSuperAdmin = (
  req: AdminAuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.admin) {
    res.status(401).json({ message: 'Authentification requise.' });
    return;
  }

  if (req.admin.role !== 'super_admin') {
    res.status(403).json({ 
      message: 'Accès réservé aux super administrateurs.' 
    });
    return;
  }

  next();
};