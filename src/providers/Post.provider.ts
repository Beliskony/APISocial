// src/core/providers/post.provider.ts
import { inject, injectable } from "inversify";
import { Types } from "mongoose";
import { PostService, CreatePostData, UpdatePostData } from "../services/Post.service";
import { IPost } from "../models/Post.model";
import { TYPES } from "../config/TYPES";

@injectable()
export class PostProvider {
    constructor(@inject(TYPES.PostService) private postService: PostService) {}

    // ✅ Création de post - CORRIGÉ
    async createPost(
        userId: string, 
        text?: string, 
        media?: { images?: string[], videos?: string[] }
    ): Promise<IPost> {
        const postData: CreatePostData = {
            author: new Types.ObjectId(userId),
            content: {
                text,
                media
            }
        };
        return this.postService.createPost(postData);
    }

    // ✅ Recherche de posts - CORRIGÉ
    async getPosts(query: string): Promise<IPost[]> {
        // Utiliser searchPosts avec un userId par défaut (vous pourrez ajuster selon vos besoins)
        const result = await this.postService.searchPosts(query, "default-user-id", 1, 20);
        return result.posts;
    }

    // ✅ Posts par utilisateur - CORRIGÉ
    async getPostsByUser(userId: string): Promise<IPost[]> {
        return this.postService.getPostByUser(userId);
    }

    // ✅ Tous les posts - CORRIGÉ
    async getAllPosts(userId: string, page: number = 1, limit: number = 20): Promise<IPost[]> {
        return this.postService.getAllPosts(userId, page, limit);
    }

    // ✅ Mise à jour de post - CORRIGÉ
    async updatePost(
        postId: string, 
        userId: string, 
        text?: string, 
        media?: { images?: string[], videos?: string[] }
    ): Promise<IPost> {
        const updateData: UpdatePostData = {
            content: {
                text,
                media
            }
        };
        return this.postService.updatePost(postId, userId, updateData);
    }

    // ✅ Suppression de post - CORRIGÉ
    async deletePost(postId: string, userId: string): Promise<boolean> {
        return this.postService.deletePost(postId, userId);
    }

    // 🆕 NOUVELLES MÉTHODES POUR LES FONCTIONNALITÉS AVANCÉES

    // 📱 Fil d'actualité
    async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<{ posts: IPost[], total: number }> {
        return this.postService.getFeed(userId, page, limit);
    }

    // 👍 Gestion des likes
    async toggleLike(postId: string, userId: string): Promise<{ action: 'liked' | 'unliked', likesCount: number }> {
        return this.postService.toggleLike(postId, userId);
    }

    // 💾 Sauvegarder un post
    async toggleSave(postId: string, userId: string): Promise<{ action: 'saved' | 'unsaved', savesCount: number }> {
        return this.postService.toggleSave(postId, userId);
    }

    // 🔄 Partager un post
    async sharePost(originalPostId: string, userId: string, text?: string): Promise<IPost> {
        return this.postService.sharePost(originalPostId, userId, text);
    }

    // 🎯 Posts populaires
    async getPopularPosts(limit: number = 10): Promise<IPost[]> {
        return this.postService.getPopularPosts(limit);
    }

    // 🔍 Recherche avancée
    async searchPosts(query: string, currentUserId: string, page: number = 1, limit: number = 20): Promise<{ posts: IPost[], total: number }> {
        return this.postService.searchPosts(query, currentUserId, page, limit);
    }

    // 🆕 Création de post avancée
    async createAdvancedPost(postData: CreatePostData): Promise<IPost> {
        return this.postService.createPost(postData);
    }
}