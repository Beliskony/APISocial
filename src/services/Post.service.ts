// src/core/services/post.service.ts
import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import PostModel, { IPost } from "../models/Post.model";
import UserModel from "../models/User.model";
import { v2 as cloudinary } from "cloudinary";
import { NotificationsService } from "../services/Notifications.Service";
import { TYPES } from '../config/TYPES';
import { MediaService } from "../services/Media.service";

// ✅ Interface simplifiée pour la création de post
export interface CreatePostData {
  author: Types.ObjectId;
  content: {
    text?: string;
    media?: {
      images?: string[]; // ✅ Simplifié en string[]
      videos?: string[]; // ✅ Simplifié en string[]
    };
  };
  visibility?: {
    privacy: 'public' | 'friends' | 'private' | 'custom';
    allowedUsers?: Types.ObjectId[];
  };
  metadata?: {
    tags?: string[];
    mentions?: Types.ObjectId[];
    hashtags?: string[];
  };
  type?: 'text' | 'image' | 'video' | 'poll' | 'event' | 'share';
  sharedPost?: Types.ObjectId;
}

export interface UpdatePostData {
  content?: {
    text?: string;
    media?: {
      images?: string[];
      videos?: string[];
    };
  };
  visibility?: {
    privacy?: 'public' | 'friends' | 'private' | 'custom';
    allowedUsers?: Types.ObjectId[];
  };
  metadata?: {
    tags?: string[];
    mentions?: Types.ObjectId[];
    hashtags?: string[];
  };
}

@injectable()
export class PostService {
  constructor( 
    @inject(TYPES.NotificationsService) private notificationsService: NotificationsService,
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  // ✅ Création de post - CORRIGÉ
  async createPost(postData: CreatePostData): Promise<IPost> {
    const newPost = new PostModel({
      author: postData.author,
      content: {
        text: postData.content.text,
        media: {
          images: postData.content.media?.images || [],
          videos: postData.content.media?.videos || [],
          files: []
        }
      },
      visibility: {
        privacy: postData.visibility?.privacy || 'public',
        allowedUsers: postData.visibility?.allowedUsers || [],
        isHidden: false,
        isArchived: false
      },
      metadata: {
        tags: postData.metadata?.tags || [],
        mentions: postData.metadata?.mentions || [],
        hashtags: postData.metadata?.hashtags || []
      },
      type: postData.type || 'text',
      sharedPost: postData.sharedPost
    });

    const savedPost = await newPost.save();
    await savedPost.populate('author', 'username profilePicture');
    
    if (postData.sharedPost) {
      await savedPost.populate('sharedPost');
    }
    if (postData.metadata?.mentions?.length) {
      await savedPost.populate('metadata.mentions', 'username profilePicture');
    }

    // Mettre à jour le compte de posts de l'utilisateur
    await UserModel.findByIdAndUpdate(
      postData.author, 
      { $push: { 'content.posts': savedPost._id } }, 
      { new: true }
    );

    // Notifications aux followers
    await this.notifyFollowersAboutNewPost(savedPost);

    // Notifications aux mentions
    await this.notifyMentions(savedPost);

    const completePost = await PostModel.findById(savedPost._id)
    .populate('author', 'username profilePicture');

    return completePost as IPost;
  }

  // ✅ Recherche de posts - CORRIGÉ
  async searchPosts(query: string, currentUserId?: string, page: number = 1, limit: number = 20): Promise<{ posts: IPost[], total: number }> {
    const searchCriteria = {
      $and: [
        {
          $or: [
            { 'content.text': { $regex: query, $options: 'i' } },
            { 'metadata.hashtags': { $in: [query.toLowerCase()] } }
          ]
        },
        { 'status.isPublished': true },
        { 'status.isDeleted': false }
      ]
    };

    const [posts, total] = await Promise.all([
      PostModel.find(searchCriteria)
        .populate('author', 'username profilePicture')
        .populate('sharedPost')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PostModel.countDocuments(searchCriteria)
    ]);

    return { posts, total };
  }

  // ✅ Fil d'actualité - CORRIGÉ
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<{ posts: IPost[], total: number }> {
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) throw new Error("Utilisateur non trouvé");

    const followedUsers = [...(currentUser.social?.following || []), new Types.ObjectId(userId)];
    
    const feedCriteria = {
      $and: [
        {
          $or: [
            { author: { $in: [...(currentUser.social?.following || []), new Types.ObjectId(userId)] } },
            { 'visibility.privacy': 'public' }
          ]
        },
        { 'status.isPublished': true },
        { 'status.isDeleted': false }
      ]
    };

    const [posts, total] = await Promise.all([
      PostModel.find(feedCriteria)
        .populate('author', 'username profile.profilePicture')
        .populate('sharedPost')
        .populate('metadata.mentions', 'username profile.profilePicture')
        .sort({ 
          createdAt: -1,
          'engagement.likesCount': -1, 
          'engagement.commentsCount': -1
        })
        .skip((page - 1) * limit)
        .limit(limit),
      PostModel.countDocuments(feedCriteria)
    ]);

    return { posts, total };
  }

  // ✅ Gestion des likes - CORRIGÉ
  async toggleLike(postId: string, userId: string): Promise<{ action: 'liked' | 'unliked', likesCount: number }> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Post non trouvé");

    const hasLiked = post.engagement.likes.some(like => 
      like.toString() === userId
    );

    if (hasLiked) {
      // Unlike
      post.engagement.likes = post.engagement.likes.filter(
        like => like.toString() !== userId
      );
      await post.save();
      
      return { action: 'unliked', likesCount: post.engagement.likesCount };
    } else {
      // Like
      post.engagement.likes.push(new Types.ObjectId(userId));
      await post.save();

      // Notification au propriétaire du post
      if (post.author.toString() !== userId) {
        await this.notificationsService.createNotification(
          userId,
          post.author.toString(),
          'like',
          `a aimé votre publication`,
          postId
        );
      }

      return { action: 'liked', likesCount: post.engagement.likesCount };
    }
  }

  // ✅ Sauvegarder un post - CORRIGÉ
  async toggleSave(postId: string, userId: string): Promise<{ action: 'saved' | 'unsaved', savesCount: number }> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Post non trouvé");

    const hasSaved = post.engagement.saves.some(save => 
      save.toString() === userId
    );

    if (hasSaved) {
      post.engagement.saves = post.engagement.saves.filter(
        save => save.toString() !== userId
      );
    } else {
      post.engagement.saves.push(new Types.ObjectId(userId));
    }

    await post.save();
    return { 
      action: hasSaved ? 'unsaved' : 'saved', 
      savesCount: post.engagement.savesCount 
    };
  }

  // ✅ Partager un post - CORRIGÉ
  async sharePost(originalPostId: string, userId: string, text?: string): Promise<IPost> {
    const originalPost = await PostModel.findById(originalPostId);
    if (!originalPost) throw new Error("Post original non trouvé");

    const sharePostData: CreatePostData = {
      author: new Types.ObjectId(userId),
      content: { text },
      type: 'share',
      sharedPost: originalPost._id
    };

    const sharedPost = await this.createPost(sharePostData);

    // Mettre à jour le compteur de partages du post original
    originalPost.engagement.shares.push(new Types.ObjectId(userId));
    await originalPost.save();

    // Notification au propriétaire du post original
    if (originalPost.author.toString() !== userId) {
      await this.notificationsService.createNotification(
        userId,
        originalPost.author.toString(),
        'new_post',
        `a partagé votre publication`,
        originalPostId
      );
    }

    return sharedPost;
  }

  // ✅ Posts populaires - CORRIGÉ (méthode alternative)
  async getPopularPosts(limit: number = 10): Promise<IPost[]> {
    return await PostModel.find({
      'status.isPublished': true,
      'status.isDeleted': false
    })
    .populate('author', 'username profile.profilePicture')
    .populate('sharedPost')
    .sort({ 
      'engagement.likesCount': -1, 
      'engagement.commentsCount': -1,
      createdAt: -1 
    })
    .limit(limit);
  }

  // ✅ Mise à jour de post - CORRIGÉ
  async updatePost(postId: string, userId: string, updateData: UpdatePostData): Promise<IPost> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Post non trouvé");

    if (post.author.toString() !== userId) {
      throw new Error("Non autorisé à modifier ce post");
    }

    // Mettre à jour les champs autorisés
    if (updateData.content?.text !== undefined) {
      post.content.text = updateData.content.text;
    }

    if (updateData.content?.media) {
      post.content.media.images = updateData.content.media.images || post.content.media.images;
      post.content.media.videos = updateData.content.media.videos || post.content.media.videos;
    }

    if (updateData.visibility) {
      post.visibility = { ...post.visibility, ...updateData.visibility };
    }

    if (updateData.metadata) {
      
      post.metadata = { ...post.metadata, ...updateData.metadata };
   
    }

    post.status.isEdited = true;
    post.status.lastEditedAt = new Date();

    await post.save();
    await post.populate('author', 'username profile.profilePicture');
    
    return post;
  }

 // ✅ Suppression de post - CORRIGÉ (avec gestion d'erreur)
async deletePost(postId: string, userId: string): Promise<boolean> {
  const post = await PostModel.findById(postId);
  if (!post) throw new Error("Post non trouvé");

  if (post.author.toString() !== userId) {
    throw new Error("Non autorisé à supprimer ce post");
  }

  // ✅ SUPPRESSION PHYSIQUE
  await PostModel.findByIdAndDelete(postId);

  // ✅ Nettoyage des médias Cloudinary (sécurisé)
  try {
    await this.cleanupPostMedia(post);
    console.log('✅ Médias Cloudinary supprimés');
  } catch (mediaError) {
    console.log('⚠️ Médias non supprimés (post quand même supprimé):', mediaError);
    // Ne pas throw - la suppression du post est prioritaire
  }

  // ✅ Supprimer la référence du post dans l'utilisateur
  try {
    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { 'content.posts': postId } },
      { new: true }
    );
  } catch (userError) {
    console.log('⚠️ Référence utilisateur non mise à jour:', userError);
  }

  return true;
}
  // ✅ Récupérer les posts d'un utilisateur
  async getPostByUser(userId: string): Promise<IPost[]> {
    return await PostModel.find({ author: userId })
      .populate('author', 'username profile.profilePicture')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ Récupérer tous les posts
  async getAllPosts(userId: string, page = 1, limit = 20): Promise<IPost[]> {
    const currentUser = await UserModel.findById(userId).populate('social.following');
    if (!currentUser) throw new Error("Utilisateur non trouvé");

    const followedUsers = [...(currentUser.social?.following || []), new Types.ObjectId(userId)];

    // 1. Posts des utilisateurs suivis
    const followedPosts = await PostModel.find({ author: { $in: followedUsers } })
        .populate('author', 'username profile.profilePicture')
        .sort({ createdAt: -1 })
        .limit(Math.floor(limit * 0.6));

    // 2. Posts aléatoires des non-suivis
    const randomPostIds = await PostModel.aggregate([
        { $match: { author: { $nin: followedUsers } } },
        { $sample: { size: Math.floor(limit * 0.35) } },
        { $project: { _id: 1 } },
    ]);
    const randomPosts = await PostModel.find({ _id: { $in: randomPostIds.map(p => p._id) } })
        .populate('author', 'username profile.profilePicture');

    // 3. Posts personnels
    const selfPosts = await PostModel.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(Math.floor(limit * 0.05))
        .populate('author', 'username profile.profilePicture');

    // 4. Fusion sans doublon
    const allPostsMap = new Map<string, IPost>();
    [...followedPosts, ...randomPosts, ...selfPosts].forEach(post => {
        allPostsMap.set(post.id.toString(), post);
    });

    const allUniquePosts = Array.from(allPostsMap.values());

    // 5. Mélanger aléatoirement
    const shuffled = allUniquePosts.sort(() => 0.5 - Math.random());

    // 6. Paginer
    const paginated = shuffled.slice((page - 1) * limit, page * limit);

    return paginated;
  }

  // 🔧 Méthodes privées CORRIGÉES
  private async notifyFollowersAboutNewPost(post: IPost): Promise<void> {
    const author = await UserModel.findById(post.author);
    if (!author || !author.social?.followers?.length) return;

    for (const followerId of author.social.followers) {
      await this.notificationsService.createNotification(
        post.author.toString(),
        followerId.toString(),
        'new_post',
        `${author.username} a publié un nouveau post`,
        post._id.toString()
      );
    }
  }

  private async notifyMentions(post: IPost): Promise<void> {
    if (!post.metadata.mentions.length) return;

    for (const mentionedUserId of post.metadata.mentions) {
      await this.notificationsService.createNotification(
        post.author.toString(),
        mentionedUserId.toString(),
        'new_post',
        `vous a mentionné dans une publication`,
        post._id.toString()
      );
    }
  }

  // ✅ Nettoyage des médias CORRIGÉ
  private async cleanupPostMedia(post: IPost): Promise<void> {
    const allMediaUrls = [
      ...(post.content.media.images || []),
      ...(post.content.media.videos || [])
    ];

    for (const url of allMediaUrls) {
      const publicId = this.extractPublicId(url);
      if (publicId) {
        try {
          const resourceType = url.includes('/image/') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') ? 'image' : 'video';
          console.log(`🚀 Suppression ${resourceType}:`, publicId);

          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
          console.error(`Erreur suppression media ${publicId}:`, error);
        }
      }
    }
  }

  private extractPublicId(url: string): string | null {
    try {
      const parts = url.split("/");
      const filename = parts.pop() || "";
      const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
      return folder ? `${folder}/${filename.split(".")[0]}` : filename.split(".")[0];
    } catch (err) {
      console.error("Erreur extraction publicId:", err);
      return null;
    }
  }
}