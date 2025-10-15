import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const userValidateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔍 Body reçu:', req.body);

    // Parse directement req.body (sans l'emballer dans un autre body)
    const result = schema.safeParse(req.body);

    if (!result.success) {
      console.log('❌ Erreur validation:', result.error.errors);
      res.status(400).json({ 
        success: false,
        message: "Erreur de validation",
        errors: result.error.errors 
      });
      return;
    }

    // Remplace req.body par la donnée validée
    req.body = result.data;
    
    console.log('✅ Body validé:', req.body);

    next();
  };
};