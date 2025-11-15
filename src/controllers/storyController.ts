import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { StoryProvider } from "../providers/Story.provider";
import { AuthRequest } from "../middlewares/Auth.Types";
import { TYPES } from "../config/TYPES";

@injectable()
export class StoryController {
  constructor(@inject(TYPES.StoryProvider) private storyProvider: StoryProvider) {}

  async createStory(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?._id; // Récupération de l'ID de l'utilisateur authentifié
        if (!userId) {
           res.status(401).json({ message: "Utilisateur non authentifié" });
           return;
        }
        const content = req.body.content; 
        const story = await this.storyProvider.createStory({ userId, content });
        res.status(201).json(story);
        return
    } catch (error) {
        console.error("Erreur lors de la création de la story:", error);        
        res.status(500).json({ message: "Erreur lors de la création de la story" });
        console.log(error);
        
    }
  }

  async getUserStories(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?._id; // Récupération de l'ID de l'utilisateur authentifié
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const stories = await this.storyProvider.getUserStories(userId);
        res.status(200).json(stories);
    } catch (error) {
        console.error("Erreur lors de la récupération des stories:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des stories" });
    }
  }

  async deleteExpiredStories(req: Request, res: Response) {
   await this.storyProvider.deleteExpiredStories();
    res.status(204).send(); // Sans contenu
  }

  async viewStoryAndGetCount(req: AuthRequest, res: Response){
    try {
      const { storyId } = req.params;
      const userId = req.user?._id;

        console.log('Contrôleur - viewStoryAndGetCount');
        console.log('Données reçues:', { storyId, userId });
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }

      const viewsCount = await this.storyProvider.viewStoryAndGetCount(storyId, userId)
      res.status(200).json({ success: true, views: viewsCount, message: 'Story marquée comme vue' });
    } catch (error) {
       console.error("Erreur lors du comptage des vues", error);
       res.status(500).json({ message: "Erreur lors du comptage des vues" });
    }
  }

  async deleteUserStory(req: AuthRequest, res: Response) {
    try {
        const { storyId } = req.params;
        const userId = req.user?._id; // Récupération de l'ID de l'utilisateur authentifié

        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }

        await this.storyProvider.deleteUserStory(storyId, userId);
        res.status(204).send(); // Sans contenu
    } catch (error) {
        console.error("Erreur lors de la suppression de la story:", error);
        res.status(500).json({ message: "Erreur lors de la suppression de la story" });
    }
  }

  async getStoryOfFollowers(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?._id; // Récupération de l'ID de l'utilisateur authentifié
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const stories = await this.storyProvider.getStoryOfFollowing(userId);
        res.status(200).json(stories);
    } catch (error) {
        console.error("Erreur lors de la récupération des stories des utilisateurs suivis:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des stories des utilisateurs suivis" });
    }
  }

  async hasNewStories(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?._id;
        
        if (!userId) {
            res.status(401).json({ 
                success: false, 
                message: "Utilisateur non authentifié" 
            });
            return;
        }

        // Récupérer le timestamp de dernière vérification depuis les query params
        const lastCheckParam = req.query.lastCheck;
        
        if (!lastCheckParam || typeof lastCheckParam !== 'string') {
            res.status(400).json({
                success: false,
                message: "Le paramètre 'lastCheck' est requis et doit être une date ISO"
            });
            return;
        }

        // Convertir en Date
        const lastCheck = new Date(lastCheckParam);
        
        // Vérifier que la date est valide
        if (isNaN(lastCheck.getTime())) {
            res.status(400).json({
                success: false,
                message: "Format de date invalide. Utilisez le format ISO (ex: 2024-01-01T00:00:00.000Z)"
            });
            return;
        }

        console.log(`🔍 Vérification nouvelles stories pour ${userId} depuis ${lastCheck.toISOString()}`);

        // Appeler le service
        const hasNewStories = await this.storyProvider.hasNewStories(userId, lastCheck);

        // Log pour le debug
        console.log(`📊 Résultat vérification: ${hasNewStories ? 'Nouvelles stories trouvées' : 'Aucune nouvelle story'}`);

        res.status(200).json({
            success: true,
            data: {
                hasNewStories,
                lastChecked: lastCheck.toISOString(),
                currentTime: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("❌ Erreur dans hasNewStories:", error);
        
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la vérification des nouvelles stories",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

}