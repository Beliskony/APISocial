import { Response, NextFunction } from "express";
import { AuthRequest } from "./Auth.Types";
import { ZodSchema } from "zod";


export const NotificationsMiddleware = (Schema: ZodSchema) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        // Validation du corps de la requête
        const result = Schema.safeParse(req.body);

        if (!result.success) {
             res.status(400).json({
                message: "Erreur de validation",
                errors: result.error.errors,
            });
            return;
        }

        // Mise à jour du corps de la requête avec les données validées
        req.body = result.data;
        next();
    };
}