import { Router } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/TYPES';
import { MediaController } from '../controllers/MediaController';
import upload from '../middlewares/multer';
import { authenticateJWT } from '../middlewares/auth';

@injectable()
export class MediaRouter {
  public router: Router;

  constructor(
    @inject(TYPES.MediaController) private mediaController: MediaController
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/upload',
      authenticateJWT,
      upload.single('file'),
      this.mediaController.upload.bind(this.mediaController)
    );
  }
}
