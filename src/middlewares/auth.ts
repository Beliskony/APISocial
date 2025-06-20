import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import  Jwt, { JwtPayload }  from 'jsonwebtoken';
import { AuthRequest, AuthUser } from './Auth.Types';



const SECRET = process.env.JWT_SECRET || 'your_secret_key';
// Middleware pour vérifier le token JWT
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization; // Récupérer l'en-tête d'autorisation

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   res.status(401).json({ message: 'Access denied. No token provided.' });
   return;
  }

  const token = authHeader.split(' ')[1]; // Extraire le token de l'en-tête

  try {
    const decoded = Jwt.verify(token, SECRET) as JwtPayload | string; // Vérifier le token
    if (typeof decoded === 'string') {
      res.status(401).json({ message: 'Token invalide' });
      return;
    }

    req.user = decoded as AuthUser // Ajouter les informations de l'utilisateur à la requête
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expire' });
    return;
  }
};

// Fonction pour inscrire un nouvel utilisateur
export const registerUser = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body); // Valider les données d'inscription
      next(); // Passer au contrôleur si les données sont valides
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error });
    }
  };
};

// Fonction pour authentifier un utilisateur
export const loginUser = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body); // Valider les données de connexion
      next(); // Passer au contrôleur si les données sont valides
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error });
    }
  };
};