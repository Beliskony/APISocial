import { Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AuthRequest } from './Auth.Types';

export const CommentMiddleware = (schema: ZodSchema) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Créer un objet avec toutes les données à valider
    const dataToValidate = {
      body: req.body,
      params: req.params,
      query: req.query
    };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const zodError = result.error as ZodError;
       res.status(400).json({
        message: 'Validation error',
        errors: zodError.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message
        })),
      });
      return;
    }

    // Remplacer les données par la version validée
    req.body = result.data.body || req.body;
    req.params = result.data.params || req.params;
    req.query = result.data.query || req.query;

    next();
  };
};