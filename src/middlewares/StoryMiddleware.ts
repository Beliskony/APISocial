import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './Auth.Types';
import { ZodSchema, ZodError } from 'zod';

export const StoryMiddleware = (schema: ZodSchema) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dataToValidate = {
                body: req.body,
                params: req.params,
                query: req.query
            };

            const result = await schema.parseAsync(dataToValidate);

            // Remplacer les données par la version validée
            if (result.body) req.body = result.body;
            if (result.params) req.params = result.params;
            if (result.query) req.query = result.query;

            next();
            
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                
                res.status(400).json({
                    message: 'Validation error',
                    errors: errorMessages,
                });
                return;
            }

            // Erreur générale
            res.status(400).json({
                message: 'Validation error',
                detail: error instanceof Error ? error.message : 'Unknown error',
            });
            return;
        }
    };
};
