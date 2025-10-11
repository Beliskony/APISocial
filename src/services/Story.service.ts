import mongoose from 'mongoose';
import { inject, injectable } from 'inversify';
import { Types } from 'mongoose';
import UserModel, { IUser } from '../models/User.model';
import StoryModel, { IStory } from '../models/Story.model';
import { MediaService } from './Media.service';
import { TYPES } from '../config/TYPES';

@injectable()
export class StoryService {
    constructor(
        @inject(TYPES.MediaService) private mediaService: MediaService
    ){}

    async createStory(userId: string, content: { type: 'image' | 'video'; data: string | Buffer }): Promise<IStory> {
        let url: string;

        if (Buffer.isBuffer(content.data)) {
            const result = await this.mediaService.uploadToCloudinary(content.data);
            url = result.url;
        } else {
            url = content.data; // déjà une URL
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const story = new StoryModel({
            userId: new Types.ObjectId(userId),
            content: { type: content.type, data: url },
            expiresAt,
        });

        const savedStory = await story.save();
        await UserModel.findByIdAndUpdate(userId, { 
            $push: { 'content.stories': savedStory._id } 
        });

        return savedStory;
    }

    async getUserStories(userId: string): Promise<IStory[]> {
        const now = new Date();
        return await StoryModel.find({ 
            userId: new Types.ObjectId(userId), 
            expiresAt: { $gt: now } 
        })
        .populate('userId', 'username profile.profilePicture')
        .exec();
    }

    async viewStoryAndGetCount(storyId: string, userId: string): Promise<number> {
        const story = await StoryModel.findById(storyId);
        if (!story) throw new Error("Story non trouvée");

        const userIdObj = new Types.ObjectId(userId);
        
        if (!story.viewedBy.some(viewerId => viewerId.equals(userIdObj))) {
            story.viewedBy.push(userIdObj);
            await story.save();
        }

        return story.viewedBy.length;
    }

    async deleteExpiredStories(): Promise<void> {
        const now = new Date();
        const expiredStories = await StoryModel.find({ expiresAt: { $lte: now } });

        if (expiredStories.length > 0) {
            const expiredIds = expiredStories.map(s => s._id);

            // Supprime les stories expirées
            await StoryModel.deleteMany({ _id: { $in: expiredIds } });

            // Nettoie aussi chez les users
            await UserModel.updateMany(
                {}, 
                { $pull: { 'content.stories': { $in: expiredIds } } }
            );
        }
    }

    async deleteUserStory(storyId: string, userId: string): Promise<void> {
        // Supprimer uniquement si la story appartient à l'utilisateur
        const story = await StoryModel.findOneAndDelete({
            _id: new Types.ObjectId(storyId),
            userId: new Types.ObjectId(userId),
        });

        if (!story) {
            throw new Error("Story introuvable ou vous n'êtes pas autorisé à la supprimer");
        }

        // Retirer la référence de la story dans le tableau `content.stories` de l'utilisateur
        await UserModel.findByIdAndUpdate(userId, { 
            $pull: { 'content.stories': storyId } 
        });
    }

    async getStoryOfFollowing(userId: string): Promise<IStory[]> {
        const now = new Date();

        const user = await UserModel.findById(userId).exec();
        if (!user || !user.social.following || user.social.following.length === 0) {
            return [];
        }

        // Récupérer les IDs des comptes suivis
        const followingIds = user.social.following;

        return await StoryModel.find({ 
            userId: { $in: followingIds }, 
            expiresAt: { $gt: now } 
        })
        .populate('userId', 'username profile.profilePicture')
        .sort({ createdAt: 1 })
        .exec();
    }

    // 🆕 NOUVELLE MÉTHODE : Récupérer les stories avec les infos utilisateur
    async getStoriesWithUserInfo(userId: string): Promise<{
        user: any;
        stories: IStory[];
        hasUnviewed: boolean;
    }[]> {
        const now = new Date();
        
        const user = await UserModel.findById(userId);
        if (!user) return [];

        const followingIds = user.social.following || [];

        // Récupérer toutes les stories des utilisateurs suivis
        const stories = await StoryModel.find({
            userId: { $in: followingIds },
            expiresAt: { $gt: now }
        })
        .populate('userId', 'username profile.profilePicture')
        .sort({ createdAt: 1 })
        .exec();

        // Grouper par utilisateur
        const storiesByUser = new Map();

        stories.forEach(story => {
            const userId = story.userId._id.toString();
            if (!storiesByUser.has(userId)) {
                storiesByUser.set(userId, {
                    user: story.userId,
                    stories: [],
                    hasUnviewed: false
                });
            }

            const userStories = storiesByUser.get(userId);
            userStories.stories.push(story);

            // Vérifier si l'utilisateur actuel n'a pas vu cette story
            if (!story.viewedBy.some(viewerId => viewerId.equals(new Types.ObjectId(userId)))) {
                userStories.hasUnviewed = true;
            }
        });

        return Array.from(storiesByUser.values());
    }

    // 🆕 NOUVELLE MÉTHODE : Statistiques des stories
    async getStoryStats(userId: string): Promise<{
        totalStories: number;
        activeStories: number;
        totalViews: number;
        storiesThisWeek: number;
    }> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalStories, activeStories, allStories] = await Promise.all([
            StoryModel.countDocuments({ userId: new Types.ObjectId(userId) }),
            StoryModel.countDocuments({ 
                userId: new Types.ObjectId(userId),
                expiresAt: { $gt: now } 
            }),
            StoryModel.find({ userId: new Types.ObjectId(userId) })
        ]);

        const totalViews = allStories.reduce((sum, story) => sum + story.viewedBy.length, 0);
        const storiesThisWeek = allStories.filter(story => 
            story.createdAt >= oneWeekAgo
        ).length;

        return {
            totalStories,
            activeStories,
            totalViews,
            storiesThisWeek
        };
    }
}

export default StoryService;