import { Request, Response } from 'express';
import { inject } from 'inversify';
import { PostProvider } from '../providers/Post.provider';
import { AuthRequest } from '../middlewares/Auth.Types';
import PostModel, { IPost } from '../models/Post.model';
import { TYPES } from '../config/TYPES';


export class PostController {
    constructor( @inject(TYPES.PostProvider) private postProvider: PostProvider) {}

    async createPost(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user?._id;
        if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
        const { text, media } = req.body;

        try {
            const post = await this.postProvider.createPost(userId, text, media);
             res.status(201).json(post);
        } catch (error) {
             res.status(500).json({ message: 'Erreur de creation du post', error });
        }
    }

    async getPosts(req: Request, res: Response): Promise<void> {
        try {
            const {text} = req.query;
            const posts: IPost[] | null = await this.postProvider.getPosts(text as string);
            
             res.status(200).json(posts);
        } catch (error) {
             res.status(500).json({ message: 'Error fetching posts', error });
        }
    }

    async getAllPosts(req: AuthRequest, res: Response): Promise<void> {
        try {
             const userId = req.user?._id;
             if (!userId) {
                 res.status(401).json({ message: 'Unauthorized' });
                 return;
             }
             const page = parseInt(req.query.page as string) || 1;
             const limit = parseInt(req.query.limit as string) || 20;

            const posts = await this.postProvider.getAllPosts(userId, page, limit);
             res.status(200).json(posts);
        } catch (error) {
              console.error("❌ Erreur réelle dans getAllPosts:", error);
   res.status(500).json({
    message: 'Error fetching posts',
    error: error instanceof Error ? error.message : error,
  });
  return;
        }
    }

    async getPostsByUser(req: AuthRequest, res: Response): Promise<void> {
        try {
          const user = req.user?._id;
          if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
          }
          const posts = await this.postProvider.getPostsByUser(user);
          res.status(200).json(posts);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching user posts', error: (error as Error).message });
        }
    }

    async updatePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user?._id;
            if (!user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const { postId} = req.params;
            const { text, media } = req.body;

            const post: IPost | null = await this.postProvider.updatePost( postId ,user, text, media );
            if (!post) {
                 res.status(404).json({ message: 'Post not found' });
                 return
            }
             res.status(200).json(post);
        } catch (error) {
             res.status(500).json({ message: 'Error updating post', error: (error as Error).message });

        }
    }

    async deletePost(req: AuthRequest, res: Response): Promise<void> {
        try {
          const user = req.user?._id;
            if (!user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
          const { postId } = req.params;

          const result = await this.postProvider.deletePost(postId, user);
           if (!result) {
            res.status(400).json({ message: "Post not found in request body" });
            return;
          }
          res.status(200).json({ message: 'Post deleted successfully' });
             
        } catch (error) {
             res.status(500).json({ message: 'Error deleting post', error });
        }
    }
}