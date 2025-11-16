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
     console.log('🔍 DEBUG addComment - Données reçues:', {
    author: commentData.author,
    post: commentData.post,
    parentComment: commentData.parentComment,
    parentCommentType: typeof commentData.parentComment,
    content: commentData.content.text.substring(0, 50) + '...'
  });

    // ✅ CORRECTION CRITIQUE - Normaliser l'author
  let authorId: Types.ObjectId;

   if (typeof commentData.author === 'string') {
    // Si c'est un string, convertir en ObjectId
    authorId = new Types.ObjectId(commentData.author);
  } else if (commentData.author instanceof Types.ObjectId) {
    // Si c'est déjà un ObjectId
    authorId = commentData.author;
  } else if (commentData.author && (commentData.author as any)._id) {
    // Si c'est un objet user complet, prendre l'ID
    authorId = new Types.ObjectId((commentData.author as any)._id);
  } else {
    throw new Error('Format author invalide');
  }


    // ✅ CORRECTION - Normaliser parentComment si présent
  let parentCommentId: Types.ObjectId | undefined;
  if (commentData.parentComment) {
    if (typeof commentData.parentComment === 'string') {
      parentCommentId = new Types.ObjectId(commentData.parentComment);
    } else if (commentData.parentComment instanceof Types.ObjectId) {
      parentCommentId = commentData.parentComment;
    } else {
      console.warn('⚠️ Format parentComment invalide, ignoré:', commentData.parentComment);
    }
  }
  
    const newComment = new CommentModel({
      author: authorId,
      post: commentData.post,
      parentComment: parentCommentId,
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
    await savedComment.populate('author', 'username profile.profilePicture');
    
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
      .populate('author', 'username profile.profilePicture')
      .populate('engagement.replies', 'content.text author createdAt')
      .sort({ 
        createdAt: -1,
        'engagement.likesCount': -1
        
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
      .populate('author', 'username profile.profilePicture')
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
    await savedComment.populate('author', 'username profile.profilePicture');

    return savedComment;
  }

  // ✅ Supprimer un commentaire - VERSION CORRIGÉE
async deleteComment(commentId: string, userId: string): Promise<boolean> {
    console.log('🔍 DEBUG deleteComment - Début', { commentId, userId });
    
    try {
        const comment = await CommentModel.findById(commentId);
        
        if (!comment) {
            console.log('❌ Commentaire non trouvé');
            throw new Error("Commentaire non trouvé");
        }

        // ✅ LOG ICI - quand le commentaire existe encore
        console.log('✅ DEBUG - Commentaire trouvé:', {
            commentId: comment._id,
            author: comment.author.toString(),
            post: comment.post.toString(),
            hasParent: !!comment.parentComment,
            parentComment: comment.parentComment
        });

        // Vérifier si l'utilisateur est l'auteur ou l'auteur du post
        const post = await PostModel.findById(comment.post);
        
        if (!post) {
            console.log('❌ Post non trouvé pour le commentaire');
            throw new Error("Post associé non trouvé");
        }

        console.log('✅ DEBUG - Post trouvé:', {
            postId: post._id,
            postAuthor: post.author.toString(),
            postCommentsCount: post.engagement?.commentsCount
        });

        const isPostAuthor = post.author.toString() === userId;
        const isCommentAuthor = comment.author.toString() === userId;

        console.log('🔍 DEBUG - Autorisations:', {
            isCommentAuthor,
            isPostAuthor, 
            userId,
            commentAuthor: comment.author.toString(),
            postAuthor: post.author.toString()
        });

        if (!isCommentAuthor && !isPostAuthor) {
            console.log('❌ Non autorisé à supprimer ce commentaire');
            throw new Error("Non autorisé à supprimer ce commentaire");
        }

        console.log('✅ DEBUG - Autorisation OK, début suppression...');

        // 🆕 SUPPRESSION PHYSIQUE de la base de données
        console.log('🗑️ Suppression du commentaire principal...');
        const deleteResult = await CommentModel.findByIdAndDelete(commentId);
        
        if (!deleteResult) {
            console.log('❌ Échec de la suppression du commentaire');
            throw new Error("Échec de la suppression du commentaire");
        }
        console.log('✅ Commentaire principal supprimé');

        // Mettre à jour le compteur du post
        console.log('🔧 Mise à jour du compteur du post...');
        const updatedPost = await PostModel.findByIdAndUpdate(
            comment.post,
            {
                $inc: { 'engagement.commentsCount': -1 },
                $pull: { 'engagement.comments': comment._id }
            },
            { new: true }
        );
        console.log('✅ Post mis à jour:', {
            nouveauCount: updatedPost?.engagement.commentsCount
        });

        // Si c'est une réponse, la retirer du commentaire parent
        if (comment.parentComment) {
            console.log('🔧 Retrait de la réponse du commentaire parent...');
            await CommentModel.findByIdAndUpdate(
                comment.parentComment,
                { $pull: { 'engagement.replies': comment._id } }
            );
            console.log('✅ Réponse retirée du parent');
        } else {
            console.log('ℹ️  Pas de commentaire parent (commentaire racine)');
        }

        // 🆕 Supprimer également les réponses associées si elles existent
        console.log('🔧 Recherche des réponses à supprimer...');
        const repliesCount = await CommentModel.countDocuments({ parentComment: commentId });
        console.log(`🔧 ${repliesCount} réponses trouvées`);
        
        if (repliesCount > 0) {
            const deleteRepliesResult = await CommentModel.deleteMany({ parentComment: commentId });
            console.log(`✅ ${deleteRepliesResult.deletedCount} réponses supprimées`);
        }

        console.log('🎉 SUPPRESSION TERMINÉE AVEC SUCCÈS');
        return true;

    } catch (error: any) {
        console.error('💥 ERREUR CRITIQUE deleteComment:', {
            message: error.message,
            stack: error.stack,
            commentId,
            userId
        });
        throw error;
    }
}


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
      if (comment.author._id.toString() !== userId) {
        await this.notificationsService.createNotification({
          sender: userId,
          recipient: comment.author._id.toString(),
          type: 'like',
          content: `a aimé votre commentaire`,
          post: comment.post.toString()
      });
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


  private async notifyMentions(comment: IComment): Promise<void> {
    if (!comment.metadata.mentions.length) return;

    for (const mentionedUserId of comment.metadata.mentions) {
      if (mentionedUserId.toString() !== comment.author.toString()) {
        await this.notificationsService.createNotification({
          sender: comment.author._id.toString(),
          recipient: mentionedUserId._id.toString(),
          type: 'mention',
          content: `vous a mentionné dans un commentaire`,
          post: comment.post.toString()
        });
      }
    }
  }

  // Dans CommentService.ts - GESTION ROBUSTE DES NOTIFICATIONS
private async notifyPostOwner(comment: IComment): Promise<void> {
  try {
    const post = await PostModel.findById(comment.post).populate('author');
    if (!post || post.author.toString() === comment.author.toString()) return;

    await this.notificationsService.createNotification({
      sender: comment.author._id.toString(),
      recipient: post.author._id.toString(),
      type: 'comment',
      content:`a commenté votre publication: "${comment.content.text.substring(0, 50)}..."`,
      post: comment.post.toString()
    });
  } catch (error: any) {
    // Logger mais ne pas bloquer si l'utilisateur a désactivé les notifications
    if (error.message.includes("Notifications désactivées")) {
      console.log(`📵 Notifications désactivées pour le propriétaire du post`);
    } else {
      console.warn('❌ Échec notification propriétaire:', error.message);
    }
  }
}

private async notifyParentCommentAuthor(comment: IComment): Promise<void> {
  try {
    if (!comment.parentComment) return;

    const parentComment = await CommentModel.findById(comment.parentComment).populate('author');
    if (!parentComment || parentComment.author.toString() === comment.author.toString()) return;

    await this.notificationsService.createNotification({
      sender: comment.author._id.toString(),
      recipient: parentComment.author._id.toString(),
      type: 'comment', 
      content: `a répondu à votre commentaire`,
      post: comment.post.toString()
    });
  } catch (error: any) {
    if (error.message.includes("Notifications désactivées")) {
      console.log(`📵 Notifications désactivées pour l'auteur du commentaire parent`);
    } else {
      console.warn('❌ Échec notification parent:', error.message);
    }
  }
}
}