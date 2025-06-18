import { Request, Response } from 'express';
import { inject } from 'inversify';
import { PostProvider } from '../providers/Post.provider';
import { IPost } from '../models/Post.model';
import { TYPES } from '../config/TYPES';


export class PostController {
    constructor( @inject(TYPES.PostService) private postProvider: PostProvider) {}

    async createPost(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.user;
            const { text, media } = req.body;
            const post: IPost = await this.postProvider.createPost(userId, text, media);
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

    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
             const page = parseInt(req.query.page as string) || 1;
             const limit = parseInt(req.query.limit as string) || 10;

            const posts = await this.postProvider.getAllPosts();
             res.status(200).json(posts);
        } catch (error) {
             res.status(500).json({ message: 'Error fetching posts', error });
        }
    }

    async getPostsByUser(req: Request, res: Response): Promise<void> {
        try {
          const {userId} = req.params;
          const posts = await this.postProvider.getPostsByUser(userId);
          res.status(200).json(posts);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching user posts', error})
        }
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const {user, postId} = req.params;
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

    async deletePost(req: Request, res: Response): Promise<void> {
        try {
          const post = req.body.postId;
            const { postId, userId } = req.params;
            await post.deleteOne({ _id: postId, user: userId });
             res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
             res.status(500).json({ message: 'Error deleting post', error });
        }
    }
}