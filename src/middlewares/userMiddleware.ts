import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const userValidateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, params: req.params });

    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    // Remplace uniquement req.body par la donnée validée
    req.body = result.data.body;

    // Ne pas modifier req.params (propriété en lecture seule)
    // Tu peux accéder à la version validée via result.data.params dans le contrôleur si besoin

    next();
  };
};




export const updateUserRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, params: req.params });

    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    req.body = result.data.body;

    // Injecte la version validée des params dans req.validatedParams
    (req as any).validatedParams = result.data.params;

    next();
  };
};
