import { inject, injectable } from "inversify";
import { Types } from "mongoose";
import { IComment } from "../models/Comment.model";
import { CommentService, CreateCommentData, UpdateCommentData } from "../services/comment.service";
import { TYPES } from "../config/TYPES";

@injectable()
export class CommentProvider {
    constructor(@inject(TYPES.CommentService) private commentService: CommentService) {}

    // ✅ Ajouter un commentaire - MIS À JOUR
    async addComment(commentData: {
        author: Types.ObjectId;
        post: Types.ObjectId;
        parentComment?: Types.ObjectId;
        content: {
            text: string;
            media?: {
                images?: string[];
                videos?: string[];
            };
        };
        metadata?: {
            mentions?: Types.ObjectId[];
            hashtags?: string[];
        };
    }): Promise<IComment> {
        return this.commentService.addComment(commentData);
    }

    // ✅ Récupérer les commentaires d'un post avec pagination - MIS À JOUR
    async getCommentsByPostId(postId: string, page: number = 1, limit: number = 20): Promise<{ comments: IComment[], total: number }> {
        return await this.commentService.getCommentsByPostId(postId, page, limit);
    }

    // ✅ Récupérer les réponses d'un commentaire - NOUVEAU
    async getCommentReplies(commentId: string, page: number = 1, limit: number = 20): Promise<{ replies: IComment[], total: number }> {
        return await this.commentService.getCommentReplies(commentId, page, limit);
    }

    // ✅ Mettre à jour un commentaire - MIS À JOUR
    async updateComment(commentId: string, userId: string, updateData: {
        content: {
            text: string;
            media?: {
                images?: string[];
                videos?: string[];
            };
        };
        metadata?: {
            mentions?: Types.ObjectId[];
            hashtags?: string[];
        };
    }): Promise<IComment> {
        return await this.commentService.updateComment(commentId, userId, updateData);
    }

    // ✅ Supprimer un commentaire - DÉJÀ BON
    async deleteComment(commentId: string, userId: string): Promise<boolean> {
        return await this.commentService.deleteComment(commentId, userId);
    }

    // ✅ Gestion des likes - NOUVEAU
    async toggleLike(commentId: string, userId: string): Promise<{ action: 'liked' | 'unliked', likesCount: number }> {
        return await this.commentService.toggleLike(commentId, userId);
    }

    // ✅ Commentaires populaires - NOUVEAU
    async getPopularComments(postId: string, limit: number = 10): Promise<IComment[]> {
        return await this.commentService.getPopularComments(postId, limit);
    }

    // ✅ Statistiques des commentaires - NOUVEAU
    async getCommentStats(postId: string): Promise<{
        totalComments: number;
        totalReplies: number;
        popularComments: IComment[];
    }> {
        return await this.commentService.getCommentStats(postId);
    }
}