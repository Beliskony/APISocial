import {  Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AuthRequest } from './Auth.Types';

export const CommentMiddleware = (schema: ZodSchema) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      res.status(400).json({
        message: 'Validation error',
        errors: zodError.errors,
      });
    }

    // Optionnel : remplacer le body par la version validée (sécurisé et propre)
    req.body = result.data;

    next();
  };
};
