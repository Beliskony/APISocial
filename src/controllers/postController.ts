// src/api/controllers/post.controller.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { PostProvider } from '../providers/Post.provider';
import { AuthRequest } from '../middlewares/auth';
import { MediaService } from '../services/Media.service';
import { IPost } from '../models/Post.model';
import { TYPES } from '../config/TYPES';

@injectable()
export class PostController {
    constructor( 
        @inject(TYPES.PostProvider) private postProvider: PostProvider,
        @inject(TYPES.MediaService) private mediaService: MediaService    
    ) {}

    // ✅ Création de post avec médias
    async createPost(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?._id;
    if (!userId) {
        res.status(401).json({ 
            success: false,
            message: 'Non autorisé' 
        });
        return;
    }

    // ✅ UTILISER LA NOUVELLE STRUCTURE du schéma Zod
    const { content, visibility, metadata, type, sharedPost } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    try {
        // Préparer les médias à partir de la nouvelle structure
        let media: { images: string[]; videos: string[] } = { 
            images: content?.media?.images || [], 
            videos: content?.media?.videos || [] 
        };

        // Traitement des fichiers uploadés
        if (files) {
            if (files.images) {
                for (const file of files.images) {
                    const result = await this.mediaService.uploadToCloudinary(file.buffer);
                    if (result.type === 'image') {
                        media.images.push(result.url);
                    }
                }
            }

            if (files.videos) {
                for (const file of files.videos) {
                    const result = await this.mediaService.uploadToCloudinary(file.buffer);
                    if (result.type === 'video') {
                        media.videos.push(result.url);
                    }
                }
            }
        }

        // ✅ APPEL CORRECT avec tous les paramètres
        const post = await this.postProvider.createPost(
            userId, 
            content?.text,  // ✅ text vient maintenant de content.text
            media,
            visibility,
            metadata,
            type,
            sharedPost
        );
        
        res.status(201).json({
            success: true,
            message: "Post créé avec succès",
            data: post
        });

    } catch (error) {
        console.error('Erreur création post:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur de création du post', 
            error: error instanceof Error ? error.message : error 
        });
    }
}
    // ✅ Recherche de posts
    async getPosts(req: Request, res: Response): Promise<void> {
        try {
            const { text } = req.query;
            const posts = await this.postProvider.getPosts(text as string);
            
            res.status(200).json({
                success: true,
                data: posts
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la récupération des posts', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // ✅ Fil d'actualité
    async getAllPosts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const posts = await this.postProvider.getAllPosts(userId, page, limit);
            
            res.status(200).json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error("❌ Erreur dans getAllPosts:", error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des posts',
                error: error instanceof Error ? error.message : error,
            });
        }
    }

    // ✅ Posts par utilisateur
    async getPostsByUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const {userId} = req.params;
            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const posts = await this.postProvider.getPostsByUser(userId);
            
            res.status(200).json({
                success: true,
                data: posts
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la récupération des posts utilisateur', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // ✅ Mise à jour de post
    async updatePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user?._id;
            if (!user) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const { postId } = req.params;
            const { content, visibility, metadata } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            let media: { images?: string[]; videos?: string[] } | undefined = undefined;

            if (files) {
                const images: string[] = [];
                const videos: string[] = [];

                if (files.images) {
                    for (const file of files.images) {
                        const result = await this.mediaService.uploadToCloudinary(file.buffer);
                        if (result.type === 'image') images.push(result.url);
                    }
                }

                if (files.videos) {
                    for (const file of files.videos) {
                        const result = await this.mediaService.uploadToCloudinary(file.buffer);
                        if (result.type === 'video') videos.push(result.url);
                    }
                }

                // ⚠️ On n'envoie `media` que s'il y a du contenu réel
                if (images.length || videos.length) {
                    media = {};
                    if (images.length) media.images = images;
                    if (videos.length) media.videos = videos;
                }
            }

            const post = await this.postProvider.updatePost(postId, user, content?.text, media, visibility, metadata);

            if (!post) {
                res.status(404).json({ 
                    success: false,
                    message: 'Post non trouvé' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Post mis à jour avec succès",
                data: post
            });

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("❌ Erreur updatePost :", error);
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la mise à jour du post', 
                error: message 
            });
        }
    }

    // ✅ Suppression de post
    async deletePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user?._id;
            if (!user) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const { postId } = req.params;
            console.log("🚨 Requête suppression reçue:", { postId });
            console.log("🚨 Utilisateur:", user);

            const result = await this.postProvider.deletePost(postId, user);
            
            if (!result) {
                res.status(400).json({ 
                    success: false,
                    message: "Post non trouvé ou non autorisé" 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Post supprimé avec succès'
            });
            
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la suppression du post', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 🆕 NOUVELLES FONCTIONNALITÉS

    // 📱 Fil d'actualité intelligent
    async getFeed(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this.postProvider.getFeed(userId, page, limit);
            
            res.status(200).json({
                success: true,
                data: result.posts,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la récupération du fil d\'actualité', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 👍 Gestion des likes
    async toggleLike(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { postId } = req.params;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const result = await this.postProvider.toggleLike(postId, userId);
            
            res.status(200).json({
                success: true,
                message: `Post ${result.action === 'liked' ? 'aimé' : 'non aimé'} avec succès`,
                data: result
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors du like du post', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 💾 Sauvegarder un post
    async toggleSave(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { postId } = req.params;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const result = await this.postProvider.toggleSave(postId, userId);
            
            res.status(200).json({
                success: true,
                message: `Post ${result.action === 'saved' ? 'sauvegardé' : 'retiré des sauvegardes'} avec succès`,
                data: result
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la sauvegarde du post', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 🔄 Partager un post
    async sharePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { postId } = req.params;
            const { text } = req.body;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            const sharedPost = await this.postProvider.sharePost(postId, userId, text);
            
            res.status(201).json({
                success: true,
                message: "Post partagé avec succès",
                data: sharedPost
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors du partage du post', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 🎯 Posts populaires
    async getPopularPosts(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const posts = await this.postProvider.getPopularPosts(limit);
            
            res.status(200).json({
                success: true,
                data: posts
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la récupération des posts populaires', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

    // 🔍 Recherche avancée
    async searchPosts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { q } = req.query;

            if (!userId) {
                res.status(401).json({ 
                    success: false,
                    message: 'Non autorisé' 
                });
                return;
            }

            if (!q || typeof q !== 'string') {
                res.status(400).json({ 
                    success: false,
                    message: "Paramètre de recherche requis" 
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this.postProvider.searchPosts(q, userId, page, limit);
            
            res.status(200).json({
                success: true,
                data: result.posts,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la recherche', 
                error: error instanceof Error ? error.message : error 
            });
        }
    }

}