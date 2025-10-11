// src/core/models/comment.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId; // ✅ Renommé pour cohérence avec Post
  post: Types.ObjectId;
  parentComment?: Types.ObjectId; // Pour les réponses aux commentaires
  content: {
    text: string;
    media?: {
      images?: string[];
      videos?: string[];
    };
  };
  engagement: {
    likes: Types.ObjectId[];
    likesCount: number;
    replies: Types.ObjectId[];
    repliesCount: number;
  };
  metadata: {
    mentions: Types.ObjectId[];
    hashtags: string[];
    isEdited: boolean;
    lastEditedAt?: Date;
  };
  status: {
    isPublished: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  };
  type: 'comment' | 'reply';
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    author: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    post: { 
      type: Schema.Types.ObjectId,
      ref: 'Post', 
      required: true,
      index: true
    },
    parentComment: { 
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    content: {
      text: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 2000
      },
      media: {
        images: [{
          type: String,
          trim: true
        }],
        videos: [{
          type: String,
          trim: true
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
      replies: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Comment' 
      }],
      repliesCount: { 
        type: Number, 
        default: 0 
      }
    },
    metadata: {
      mentions: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      hashtags: [{
        type: String,
        trim: true,
        lowercase: true
      }],
      isEdited: {
        type: Boolean,
        default: false
      },
      lastEditedAt: Date
    },
    status: {
      isPublished: {
        type: Boolean,
        default: true
      },
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
      enum: ['comment', 'reply'],
      default: 'comment'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Calculer automatiquement les compteurs
        ret.engagement.likesCount = ret.engagement.likes.length;
        ret.engagement.repliesCount = ret.engagement.replies.length;
        return ret;
      }
    }
  }
);

// Index pour les performances
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ 'status.isPublished': 1, 'status.isDeleted': 1 });
CommentSchema.index({ createdAt: -1 });

// Middleware pour mettre à jour les compteurs
CommentSchema.pre('save', function(next) {
  const comment = this as unknown as IComment;
  
  if (comment.isModified('engagement.likes')) {
    comment.engagement.likesCount = comment.engagement.likes.length;
  }
  if (comment.isModified('engagement.replies')) {
    comment.engagement.repliesCount = comment.engagement.replies.length;
  }
  
  // Déterminer le type basé sur parentComment
  if (!comment.type) {
    comment.type = comment.parentComment ? 'reply' : 'comment';
  }
  
  next();
});

// Méthode statique pour les commentaires populaires
CommentSchema.statics.getPopularComments = function(postId: Types.ObjectId, limit: number = 10) {
  return this.find({
    post: postId,
    'status.isPublished': true,
    'status.isDeleted': false
  })
  .populate('author', 'username profilePicture')
  .populate('parentComment', 'content.text author')
  .sort({ 
    'engagement.likesCount': -1,
    'engagement.repliesCount': -1,
    createdAt: -1
  })
  .limit(limit);
};

// Méthode d'instance pour vérifier si l'utilisateur a aimé le commentaire
CommentSchema.methods.hasLiked = function(userId: Types.ObjectId): boolean {
  const comment = this as unknown as IComment;
  return comment.engagement.likes.some(like => 
    like.toString() === userId.toString()
  );
};

// Méthode d'instance pour ajouter une réponse
CommentSchema.methods.addReply = function(replyId: Types.ObjectId): void {
  const comment = this as unknown as IComment;
  if (!comment.engagement.replies.includes(replyId)) {
    comment.engagement.replies.push(replyId);
  }
};

// Interface pour les méthodes statiques
interface CommentModel extends mongoose.Model<IComment> {
  getPopularComments(postId: Types.ObjectId, limit?: number): Promise<IComment[]>;
}

export default mongoose.model<IComment, CommentModel>('Comment', CommentSchema);