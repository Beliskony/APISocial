import { Router } from "express";
import { StoryController } from "../controllers/storyController";
import { StoryMiddleware } from "../middlewares/StoryMiddleware";
import { authenticateJWT } from "../middlewares/auth";
import { 
    CreateStoryZodSchema, 
    DeleteStoryZodSchema, 
    ViewStoryZodSchema
} from "../schemas/Story.ZodSchema";
import { inject, injectable } from "inversify";
import { formParser } from "../middlewares/form-data";
import { TYPES } from "../config/TYPES";

@injectable()
export class StoryRouter {
    public router: Router;
    private storyController: StoryController;

    constructor(@inject(TYPES.StoryController) storyController: StoryController) {
        this.router = Router();
        this.storyController = storyController;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // ✅ Créer une story
        this.router.post(
            "/", 
            authenticateJWT, 
            formParser, 
            StoryMiddleware(CreateStoryZodSchema), 
            this.storyController.createStory.bind(this.storyController)
        );

        // ✅ Récupérer mes stories
        this.router.get(
            "/my-stories", 
            authenticateJWT, 
            this.storyController.getUserStories.bind(this.storyController)
        );

        // ✅ Récupérer les stories des utilisateurs suivis
        this.router.get(
            "/following", 
            authenticateJWT, 
            this.storyController.getStoryOfFollowers.bind(this.storyController)
        );

        // ✅ Voir une story et compter les vues
        this.router.post(
            "/:storyId/view", 
            authenticateJWT, 
            StoryMiddleware(ViewStoryZodSchema), 
            this.storyController.viewStoryAndGetCount.bind(this.storyController)
        );

        // ✅ Supprimer une story
        this.router.delete(
            "/:storyId", 
            authenticateJWT, 
            StoryMiddleware(DeleteStoryZodSchema), 
            this.storyController.deleteUserStory.bind(this.storyController)
        );

        // ✅ Nettoyer les stories expirées (Admin/Cron)
        this.router.delete(
            "/cleanup/expired", 
            this.storyController.deleteExpiredStories.bind(this.storyController)
        );

        this.router.get(
        "/has-new-stories", 
        authenticateJWT, 
        this.storyController.hasNewStories.bind(this.storyController)
    );
    }
}