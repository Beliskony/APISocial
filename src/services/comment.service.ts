// src/core/services/comment.service.ts
import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import CommentModel, { IComment } from "../models/Comment.model";
import PostModel from "../models/Post.model";
import UserModel from "../models/User.model";
import { NotificationsService } from "../services/Notifications.Service";
import { TYPES } from "../config/TYPES";
import { MediaService } from "../services/Media.service";

export interface CreateCommentData {
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
}

export interface UpdateCommentData {
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
}

@injectable()
export class CommentService {
  constructor(
    @inject(TYPES.NotificationsService) private notificationsService: NotificationsService,
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  // ✅ Ajouter un commentaire - AMÉLIORÉ
  async addComment(commentData: CreateCommentData): Promise<IComment> {
    const newComment = new CommentModel({
      author: commentData.author,
      post: commentData.post,
      parentComment: commentData.parentComment,
      content: {
        text: commentData.content.text,
        media: commentData.content.media || { images: [], videos: [] }
      },
      metadata: {
        mentions: commentData.metadata?.mentions || [],
        hashtags: commentData.metadata?.hashtags || [],
        isEdited: false
      }
    });

    const savedComment = await newComment.save();
    await savedComment.populate('author', 'username profilePicture');
    
    if (commentData.parentComment) {
      await savedComment.populate('parentComment', 'content.text author');
      // Ajouter cette réponse au commentaire parent
      await CommentModel.findByIdAndUpdate(
        commentData.parentComment,
        { $push: { 'engagement.replies': savedComment._id } }
      );
    }

    // Mettre à jour le compteur de commentaires du post
    await PostModel.findByIdAndUpdate(commentData.post, {
      $inc: { 'engagement.commentsCount': 1 },
      $push: { 'engagement.comments': savedComment._id }
    });

    // Notifications
    await this.notifyPostOwner(savedComment);
    await this.notifyMentions(savedComment);
    await this.notifyParentCommentAuthor(savedComment);

    return savedComment;
  }

  // ✅ Récupérer les commentaires d'un post - AMÉLIORÉ
  // ✅ Récupérer les commentaires d'un post - AVEC DEBUG
async getCommentsByPostId(postId: string, page: number = 1, limit: number = 20): Promise<{ comments: IComment[], total: number }> {
  try {
    console.log('🔍 DEBUG getCommentsByPostId - Début', { postId, page, limit });

    const [comments, total] = await Promise.all([
      CommentModel.find({ 
        post: postId,
        parentComment: null,
        'status.isPublished': true,
        'status.isDeleted': false
      })
      .populate('author', 'username profilePicture')
      .populate('engagement.replies', 'content.text author createdAt')
      .sort({ 
        'engagement.likesCount': -1,
        createdAt: -1 
      })
      .skip((page - 1) * limit)
      .limit(limit),
      
      CommentModel.countDocuments({ 
        post: postId,
        parentComment: null,
        'status.isPublished': true,
        'status.isDeleted': false
      })
    ]);

    // 🔍 LOGS CRITIQUES POUR DEBUG
    console.log('🔍 DEBUG - Nombre de commentaires trouvés:', comments.length);
    console.log('🔍 DEBUG - Total count:', total);

    // Vérifier chaque commentaire pour l'engagement
    comments.forEach((comment, index) => {
      console.log(`🔍 DEBUG - Comment ${index}:`, {
        _id: comment._id,
        content: comment.content?.text?.substring(0, 50) + '...',
        hasEngagement: !!comment.engagement,
        engagementStructure: comment.engagement ? {
          hasLikes: !!comment.engagement.likes,
          likesType: typeof comment.engagement.likes,
          likesIsArray: Array.isArray(comment.engagement.likes),
          likesLength: comment.engagement.likes?.length,
          likesCount: comment.engagement.likesCount,
          hasReplies: !!comment.engagement.replies,
          repliesLength: comment.engagement.replies?.length
        } : 'NO ENGAGEMENT'
      });

      // 🔍 VÉRIFICATION DE SÉCURITÉ - Corriger les engagements manquants
      if (!comment.engagement) {
        console.log(`⚠️  DEBUG - Comment ${comment._id} n'a pas d'engagement!`);
        comment.engagement = {
          likes: [],
          likesCount: 0,
          replies: [],
          repliesCount: 0
        };
      }

      if (!comment.engagement.likes || !Array.isArray(comment.engagement.likes)) {
        console.log(`⚠️  DEBUG - Comment ${comment._id} a un engagement.likes invalide:`, comment.engagement.likes);
        comment.engagement.likes = [];
      }

      if (!comment.engagement.replies || !Array.isArray(comment.engagement.replies)) {
        console.log(`⚠️  DEBUG - Comment ${comment._id} a un engagement.replies invalide:`, comment.engagement.replies);
        comment.engagement.replies = [];
      }
    });

    console.log('✅ DEBUG getCommentsByPostId - Succès');
    return { comments, total };

  } catch (error) {
    console.error('❌ ERROR getCommentsByPostId:', {
      message: error,
      postId,
      page,
      limit
    });
    throw error;
  }
}

  // ✅ Récupérer les réponses d'un commentaire
  async getCommentReplies(commentId: string, page: number = 1, limit: number = 20): Promise<{ replies: IComment[], total: number }> {
    const [replies, total] = await Promise.all([
      CommentModel.find({ 
        parentComment: commentId,
        'status.isPublished': true,
        'status.isDeleted': false
      })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
      
      CommentModel.countDocuments({ 
        parentComment: commentId,
        'status.isPublished': true,
        'status.isDeleted': false
      })
    ]);

    return { replies, total };
  }

  // ✅ Mettre à jour un commentaire - AMÉLIORÉ
  async updateComment(commentId: string, userId: string, updateData: UpdateCommentData): Promise<IComment> {
    const comment = await CommentModel.findById(commentId);
    
    if (!comment) {
      throw new Error("Commentaire non trouvé");
    }

    if (comment.author.toString() !== userId) {
      throw new Error("Non autorisé à modifier ce commentaire");
    }

    // Mettre à jour les champs
    comment.content.text = updateData.content.text;
    
    if (updateData.content.media) {
      comment.content.media = updateData.content.media;
    }

    if (updateData.metadata) {
      comment.metadata.mentions = updateData.metadata.mentions || comment.metadata.mentions;
      comment.metadata.hashtags = updateData.metadata.hashtags || comment.metadata.hashtags;
    }

    comment.metadata.isEdited = true;
    comment.metadata.lastEditedAt = new Date();

    const savedComment = await comment.save();
    await savedComment.populate('author', 'username profilePicture');

    return savedComment;
  }

  // ✅ Supprimer un commentaire - VERSION CORRIGÉE
async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await CommentModel.findById(commentId);
    
    if (!comment) {
        throw new Error("Commentaire non trouvé");
    }

    // Vérifier si l'utilisateur est l'auteur ou l'auteur du post
    const post = await PostModel.findById(comment.post);
    const isPostAuthor = post && post.author.toString() === userId;
    const isCommentAuthor = comment.author.toString() === userId;

    if (!isCommentAuthor && !isPostAuthor) {
        throw new Error("Non autorisé à supprimer ce commentaire");
    }

    // 🆕 SUPPRESSION PHYSIQUE de la base de données
    await CommentModel.findByIdAndDelete(commentId);

    // Mettre à jour le compteur du post
    await PostModel.findByIdAndUpdate(comment.post, {
        $inc: { 'engagement.commentsCount': -1 },
        $pull: { 'engagement.comments': comment._id }
    });

    // Si c'est une réponse, la retirer du commentaire parent
    if (comment.parentComment) {
        await CommentModel.findByIdAndUpdate(
            comment.parentComment,
            { $pull: { 'engagement.replies': comment._id } }
        );
    }

    // 🆕 Supprimer également les réponses associées si elles existent
    await CommentModel.deleteMany({ parentComment: commentId });

    return true;
}
  // 🆕 NOUVELLES FONCTIONNALITÉS

  // 👍 Gestion des likes sur commentaires
  async toggleLike(commentId: string, userId: string): Promise<{ action: 'liked' | 'unliked', likesCount: number }> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new Error("Commentaire non trouvé");

    const hasLiked = comment.engagement.likes.some(like => 
      like.toString() === userId
    );

    if (hasLiked) {
      // Unlike
      comment.engagement.likes = comment.engagement.likes.filter(
        like => like.toString() !== userId
      );
      await comment.save();
      
      return { action: 'unliked', likesCount: comment.engagement.likesCount };
    } else {
      // Like
      comment.engagement.likes.push(new Types.ObjectId(userId));
      await comment.save();

      // Notification à l'auteur du commentaire
      if (comment.author.toString() !== userId) {
        await this.notificationsService.createNotification(
          userId,
          comment.author.toString(),
          'like',
          `a aimé votre commentaire`,
          comment.post.toString()
        );
      }

      return { action: 'liked', likesCount: comment.engagement.likesCount };
    }
  }

  // 🔍 Commentaires populaires d'un post
  async getPopularComments(postId: string, limit: number = 10): Promise<IComment[]> {
    return await CommentModel.getPopularComments(new Types.ObjectId(postId), limit);
  }

  // 📊 Statistiques des commentaires
  async getCommentStats(postId: string): Promise<{
    totalComments: number;
    totalReplies: number;
    popularComments: IComment[];
  }> {
    const [totalComments, totalReplies, popularComments] = await Promise.all([
      CommentModel.countDocuments({ 
        post: postId,
        parentComment: null,
        'status.isPublished': true,
        'status.isDeleted': false
      }),
      
      CommentModel.countDocuments({ 
        post: postId,
        parentComment: { $ne: null },
        'status.isPublished': true,
        'status.isDeleted': false
      }),
      
      this.getPopularComments(postId, 5)
    ]);

    return { totalComments, totalReplies, popularComments };
  }

  // 🔧 MÉTHODES PRIVÉES

  private async notifyPostOwner(comment: IComment): Promise<void> {
    const post = await PostModel.findById(comment.post).populate('author');
    if (!post || post.author.toString() === comment.author.toString()) return;

    await this.notificationsService.createNotification(
      comment.author.toString(),
      post.author.toString(),
      'comment',
      `a commenté votre publication`,
      comment.post.toString()
    );
  }

  private async notifyParentCommentAuthor(comment: IComment): Promise<void> {
    if (!comment.parentComment) return;

    const parentComment = await CommentModel.findById(comment.parentComment).populate('author');
    if (!parentComment || parentComment.author.toString() === comment.author.toString()) return;

    await this.notificationsService.createNotification(
      comment.author.toString(),
      parentComment.author.toString(),
      'comment',
      `a répondu à votre commentaire`,
      comment.post.toString()
    );
  }

  private async notifyMentions(comment: IComment): Promise<void> {
    if (!comment.metadata.mentions.length) return;

    for (const mentionedUserId of comment.metadata.mentions) {
      if (mentionedUserId.toString() !== comment.author.toString()) {
        await this.notificationsService.createNotification(
          comment.author.toString(),
          mentionedUserId.toString(),
          'mention',
          `vous a mentionné dans un commentaire`,
          comment.post.toString()
        );
      }
    }
  }
}