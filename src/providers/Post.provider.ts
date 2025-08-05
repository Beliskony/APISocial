import { inject, injectable } from "inversify";
import { PostService } from "../services/Post.service";
import { IPost } from "../models/Post.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class PostProvider {
    constructor(@inject(TYPES.PostService) private postService: PostService) {}

    async createPost(userId: string, text?:string, media?: {images?: string[], videos?: string[]}): Promise<IPost> {
        return this.postService.createPost(userId, text, media);
    }

    async getPosts(text: string): Promise<IPost[] | null> {
        return this.postService.getPosts(text);
    }

    async getPostsByUser(UserId: string): Promise<IPost[]> {
        return this.postService.getPostByUser(UserId);
    }

    async getAllPosts(userId: string, page: number, limit: number): Promise<IPost[] | null> {
        return this.postService.getAllPosts(userId, page, limit);
    }

    async updatePost(postId: string,user:string ,text?: string, media?: {images?: string[], videos?: string[]}): Promise<IPost | null> {
        return this.postService.updatePost(postId, user, text, media);
    }

    async deletePost(postId: string, userId: string): Promise<boolean> {
        return this.postService.deletePost(postId, userId);
    }
}