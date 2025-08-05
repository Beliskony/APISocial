import { Router } from "express";
import { AdminController } from "../adminController/Admin.Controller";
import { verifyAdmin } from "../adminMiddleware/Admin.Middleware";
import { inject, injectable } from "inversify";
import { TYPES } from "../../config/TYPES";

@injectable()
export class AdminRouter {
  public router: Router;
  private adminController: AdminController;

  constructor(
    @inject(TYPES.AdminController) adminController: AdminController
  ) {
    this.router = Router();
    this.adminController = adminController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Auth
    this.router.post("/login", this.adminController.login.bind(this.adminController));

    // Infos admin connecté (protégé)
    this.router.get("/getAdmin", verifyAdmin, this.adminController.getProfile.bind(this.adminController));

    // Suppression utilisateur (protégé)
    this.router.delete("/user/:id", verifyAdmin, this.adminController.deleteUser.bind(this.adminController));

    // Suppression post (protégé)
    this.router.delete("/post/:id", verifyAdmin, this.adminController.deletePost.bind(this.adminController));

    // Suppression commentaire (protégé)
    this.router.delete("/comment/:id", verifyAdmin, this.adminController.deleteComment.bind(this.adminController));

    // Creation d'un Admin
    this.router.post("/create",this.adminController.createAdmin.bind(this.adminController));
  }
}
