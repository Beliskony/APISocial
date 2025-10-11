// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import jwt from 'jsonwebtoken';
import { 
  AuthRequest, 
  AuthUser, 
  JwtPayload, 
  TokenValidationResult 
} from './Auth.Types';

const JWT_SECRET = process.env.JWT_SECRET || 'monSupercodeSecretAxel123456@';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// 🔐 Middleware pour vérifier le token JWT
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'Accès refusé. Token manquant.' 
      });
      return;
    }

    const validationResult = verifyToken(token);
    
    if (!validationResult.isValid || !validationResult.user) {
      res.status(401).json({ 
        success: false,
        message: validationResult.error || 'Token invalide' 
      });
      return;
    }

    req.user = validationResult.user;
    
    console.log("✅ Utilisateur authentifié:", {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    });
    
    next();
  } catch (error: any) {
    console.error('❌ Erreur d\'authentification JWT:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne d\'authentification' 
    });
  }
};

// 📝 Middleware pour valider l'inscription
export const registerUser = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: 'Erreur de validation', 
        errors: error.errors 
      });
    }
  };
};

// 🔐 Middleware pour valider la connexion
export const loginUser = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: 'Erreur de validation', 
        errors: error.errors 
      });
    }
  };
};

// ✅ Middleware de validation générique
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      console.error('❌ Erreur de validation:', error.errors);
      
      res.status(400).json({
        success: false,
        message: 'Données de requête invalides',
        errors: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

// 🎫 Générer un token JWT
export const generateToken = (userData: {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  coverPicture?: string;
  profile?: AuthUser['profile'];
  analytics?: AuthUser['analytics'];
  preferences?: AuthUser['preferences'];
  status?: AuthUser['status'];
}): string => {
  const payload: JwtPayload = {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    profilePicture: userData.profilePicture
    // Note: Les autres propriétés ne sont pas incluses dans JwtPayload selon votre interface
    // Si vous voulez les inclure, mettez à jour l'interface JwtPayload
  };

    return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);

};

// 🔍 Vérifier un token
export const verifyToken = (token: string): TokenValidationResult => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    const authUser: AuthUser = {
      _id: decoded._id,
      username: decoded.username,
      email: decoded.email,
      phoneNumber: decoded.phoneNumber,
      profilePicture: decoded.profilePicture,
      // Les autres propriétés seront chargées depuis la base de données si nécessaire
    };

    return { 
      isValid: true, 
      user: authUser,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined
    };
  } catch (error: any) {
    let errorMessage = 'Token invalide';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expiré';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Token malformé';
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token pas encore valide';
    }

    return { 
      isValid: false, 
      error: errorMessage 
    };
  }
};

// 🔧 Extraire le token de la requête
const extractTokenFromRequest = (req: Request): string | null => {
  // 1. Depuis l'en-tête Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Depuis les query parameters
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // 3. Depuis les cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // 4. Depuis le body (pour certaines APIs)
  if (req.body?.token) {
    return req.body.token;
  }

  return null;
};

// 🆕 Middleware optionnel (ne bloque pas si pas authentifié)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (token) {
      const validationResult = verifyToken(token);
      if (validationResult.isValid && validationResult.user) {
        req.user = validationResult.user;
      }
    }
    
    next();
  } catch (error) {
    // En mode optionnel, on continue même en cas d'erreur
    next();
  }
};

// 🛡️ Vérifier la propriété des ressources
export const requireOwnership = (resourceParam: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Authentification requise' 
      });
      return;
    }

    const resourceId = req.params[resourceParam];
    
    if (!resourceId) {
      res.status(400).json({ 
        success: false,
        message: `Paramètre ${resourceParam} manquant` 
      });
      return;
    }

    if (req.user._id !== resourceId) {
      res.status(403).json({ 
        success: false,
        message: 'Accès non autorisé à cette ressource' 
      });
      return;
    }

    next();
  };
};

// Export des types pour une utilisation facile
export type { AuthRequest, AuthUser, JwtPayload };