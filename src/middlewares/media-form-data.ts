// middleware pour parser le champ media (sous forme JSON string)
import { Request, Response, NextFunction } from 'express';

export function parseFormJson(req: Request, res: Response, next: NextFunction) {
  if (req.body.media && typeof req.body.media === 'string') {
    try {
      req.body.media = JSON.parse(req.body.media);
    } catch (error) {
      res.status(400).json({ message: "Le champ 'media' doit être un JSON valide." });
      return;
    }
  }
  next();
}
