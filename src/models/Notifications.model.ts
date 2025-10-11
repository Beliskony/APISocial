// src/core/models/notifications.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface INotification extends Document {
    recipient: Types.ObjectId;
    sender: Types.ObjectId;
    type: 'like' | 'comment' | 'follow' | 'new_post' | 'mention';
    post?: Types.ObjectId;
    content?: string;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema: Schema = new Schema({
    recipient: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    sender: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['like', 'comment', 'follow', 'new_post', 'mention'], 
        required: true 
    },
    post: { 
        type: Schema.Types.ObjectId, 
        ref: 'Post' 
    },
    content: { 
        type: String, 
        trim: true 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
}, {
    timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour les performances
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);