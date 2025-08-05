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
      const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }

      const { storyId } = req.params;

      const count = await this.storyProvider.viewStoryAndGetCount(storyId, userId)
      res.status(200).json({ views: count});
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
            return res.status(401).json({ message: "Utilisateur non authentifié" });
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

}