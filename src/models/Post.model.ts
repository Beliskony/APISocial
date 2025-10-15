// src/core/models/post.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId; // Référence à l'utilisateur (renommé pour plus de clarté)
  content: {
    text?: string;
    media: {
      images: string[];
      videos: string[];
      files: string[];
    };
  };
  engagement: {
    likes: Types.ObjectId[];
    likesCount: number;
    comments: Types.ObjectId[];
    commentsCount: number;
    shares: Types.ObjectId[];
    sharesCount: number;
    saves: Types.ObjectId[]; // Utilisateurs qui ont sauvegardé le post
    savesCount: number;
  };
  visibility: {
    privacy: 'public' | 'friends' | 'private' | 'custom';
    allowedUsers: Types.ObjectId[]; // Pour la confidentialité custom
    isHidden: boolean; // Si le post est masqué
    isArchived: boolean; // Si le post est archivé
  };
  metadata: {
    tags: string[];
    mentions: Types.ObjectId[]; // Utilisateurs mentionnés
    hashtags: string[];
  };
  analytics: {
    views: number;
    viewDuration: number; // Temps total de visionnage en secondes
    impressions: number; // Nombre de fois où le post a été affiché
    reach: number; // Nombre d'utilisateurs uniques ayant vu le post
    engagementRate: number; // Taux d'engagement calculé
  };
  status: {
    isPublished: boolean;
    isEdited: boolean;
    lastEditedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  };
  type: 'text' | 'image' | 'video' | 'poll' | 'event' | 'share';
  poll?: {
    question: string;
    options: {
      text: string;
      votes: Types.ObjectId[]; // Utilisateurs qui ont voté
      voteCount: number;
    }[];
    endsAt: Date;
    isMultiChoice: boolean;
    totalVotes: number;
  };
  sharedPost?: Types.ObjectId; // Référence au post original si c'est un partage
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    author: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    content: {
      text: { 
        type: String, 
        trim: true,
        maxlength: 5000 
      },
      media: {
        images: [{
          type: String,
        }],
        videos: [{
          type: String,
        }], 
        files: [{
           type: String
         
        }]
      }
    },
    engagement: {
      likes: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        index: true 
      }],
      likesCount: { 
        type: Number, 
        default: 0 
      },
      comments: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Comment' 
      }],
      commentsCount: { 
        type: Number, 
        default: 0 
      },
      shares: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
      }],
      sharesCount: { 
        type: Number, 
        default: 0 
      },
      saves: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
      }],
      savesCount: { 
        type: Number, 
        default: 0 
      }
    },
    visibility: {
      privacy: {
        type: String,
        enum: ['public', 'friends', 'private', 'custom'],
        default: 'public'
      },
      allowedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      isHidden: {
        type: Boolean,
        default: false
      },
      isArchived: {
        type: Boolean,
        default: false
      }
    },
    metadata: {
      tags: [{
        type: String,
        trim: true,
        lowercase: true
      }],
      mentions: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      hashtags: [{
        type: String,
        trim: true,
        lowercase: true
      }]
    },
    analytics: {
      views: {
        type: Number,
        default: 0
      },
      viewDuration: {
        type: Number,
        default: 0
      },
      impressions: {
        type: Number,
        default: 0
      },
      reach: {
        type: Number,
        default: 0
      },
      engagementRate: {
        type: Number,
        default: 0
      }
    },
    status: {
      isPublished: {
        type: Boolean,
        default: true
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      lastEditedAt: Date,
      isDeleted: {
        type: Boolean,
        default: false
      },
      deletedAt: Date,
      moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved'
      }
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'event', 'share'],
      default: 'text',
      required: true
    },
    poll: {
      question: {
        type: String,
        trim: true,
        maxlength: 500
      },
      options: [{
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200
        },
        votes: [{
          type: Schema.Types.ObjectId,
          ref: 'User'
        }],
        voteCount: {
          type: Number,
          default: 0
        }
      }],
      endsAt: Date,
      isMultiChoice: {
        type: Boolean,
        default: false
      },
      totalVotes: {
        type: Number,
        default: 0
      }
    },
    sharedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Calculer le taux d'engagement à la volée
        if (ret.analytics && ret.analytics.reach > 0) {
          ret.analytics.engagementRate = 
            ((ret.engagement.likesCount + ret.engagement.commentsCount + ret.engagement.sharesCount) / ret.analytics.reach) * 100;
        }
        return ret;
      }
    }
  }
);

// Index pour les recherches et performances
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ 'content.text': 'text', 'metadata.hashtags': 'text' });
PostSchema.index({ 'engagement.likesCount': -1 });
PostSchema.index({ 'engagement.commentsCount': -1 });
PostSchema.index({ 'visibility.privacy': 1 });
PostSchema.index({ 'status.isPublished': 1, 'status.isDeleted': 1 });
PostSchema.index({ 'metadata.hashtags': 1 });
PostSchema.index({ createdAt: -1 });

// Middleware pour mettre à jour les compteurs
PostSchema.pre('save', function(next) {
  const post = this as unknown as IPost;
  
  // Mettre à jour les compteurs d'engagement
  if (post.isModified('engagement.likes')) {
    post.engagement.likesCount = post.engagement.likes.length;
  }
  if (post.isModified('engagement.comments')) {
    post.engagement.commentsCount = post.engagement.comments.length;
  }
  if (post.isModified('engagement.shares')) {
    post.engagement.sharesCount = post.engagement.shares.length;
  }
  if (post.isModified('engagement.saves')) {
    post.engagement.savesCount = post.engagement.saves.length;
  }
  
  // Mettre à jour le total des votes pour les sondages
  if (post.poll && post.isModified('poll.options')) {
    post.poll.totalVotes = post.poll.options.reduce((total, option) => total + option.voteCount, 0);
  }
  
  // Déterminer le type de post basé sur le contenu
  if (!post.type) {
    if (post.content.media.images.length > 0) {
      post.type = 'image';
    } else if (post.content.media.videos.length > 0) {
      post.type = 'video';
    } else if (post.poll && post.poll.question) {
      post.type = 'poll';
    } else if (post.sharedPost) {
      post.type = 'share';
    } else {
      post.type = 'text';
    }
  }
  
  next();
});

// Méthode statique pour les posts populaires
PostSchema.statics.getPopularPosts = function(limit: number = 10) {
  return this.find({
    'status.isPublished': true,
    'status.isDeleted': false
  })
  .sort({ 
    'engagement.likesCount': -1, 
    'engagement.commentsCount': -1,
    createdAt: -1 
  })
  .limit(limit)
  .populate('author', 'username profilePicture')
  .populate('sharedPost');
};

// Méthode d'instance pour vérifier si l'utilisateur a aimé le post
PostSchema.methods.hasLiked = function(userId: Types.ObjectId): boolean {
  return this.engagement.likes.some((like: Types.ObjectId) => 
    like.toString() === userId.toString()
  );
};

export default mongoose.model<IPost>('Post', PostSchema);