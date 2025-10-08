import { Router } from "express";
import { UserController } from "../controllers/userController";
import {  authenticateJWT, loginUser, registerUser, } from "../middlewares/auth";
import { UserZodSchema, LoginZodSchema, FollowZodSchema, UpdateProfileZodSchema } from "../schemas/User.ZodSchema";
import { userValidateRequest, updateUserRequest } from "../middlewares/userMiddleware";
import { formParser } from "../middlewares/form-data";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/TYPES";

@injectable()
export class UserRouter {
    public router: Router;
    private userController: UserController;


    constructor(@inject(TYPES.UserController) userController: UserController) {
        this.router = Router();
        this.userController = userController;
        this.initializeRoutes();
    }

  private initializeRoutes(): void {
    this.router.get ("/search/:username", this.userController.findUserByUsername.bind(this.userController));

    this.router.post("/register",formParser,registerUser(UserZodSchema), this.userController.createUser.bind(this.userController));

    this.router.post("/login",formParser,loginUser(LoginZodSchema), this.userController.loginUser.bind(this.userController));

    this.router.post("/follow/:targetId", authenticateJWT, this.userController.toggleFollow.bind(this.userController));

    this.router.put("/profile", authenticateJWT, updateUserRequest(UpdateProfileZodSchema), this.userController.updateUserProfile.bind(this.userController));

    this.router.get("/me", authenticateJWT ,this.userController.getMe.bind(this.userController));

    this.router.get("profile/:userId",authenticateJWT, this.userController.getUserById.bind(this.userController));

    // 🆕 Nouvelle route pour les suggestions
    this.router.get("/suggestions", authenticateJWT, this.userController.getSuggestions.bind(this.userController));
  }
}