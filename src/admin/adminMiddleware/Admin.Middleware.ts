import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import AdminModel from "../adminModel/Admin.Model";

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; // à sécuriser en prod

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Accès refusé. Token manquant.' });
      return;
    }

    // Vérifie le token
    const decoded = Jwt.verify(token, SECRET_KEY) as { id: string };

    // Recherche l'admin dans la base
    const admin = await AdminModel.findById(decoded.id);
    if (!admin) {
      res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé." });
      return;
    }

    // On attache l’admin à la requête pour plus tard si besoin
    (req as any).admin = admin;

    next();
  } catch (error) {
    console.error('Erreur de vérification admin :', error);
    res.status(401).json({ message: 'Token invalide ou expiré.' });
    return;
  }
};
