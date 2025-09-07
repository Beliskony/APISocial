import mongoose from 'mongoose';
import { inject, injectable } from 'inversify';
import UserModel from '../models/User.model';
import StoryModel,{ IStory } from '../models/Story.model';
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
        userId: new mongoose.Types.ObjectId(userId),
        content: { type: content.type, data: url }, // ✅ Ici tu mets l’URL finale
        expiresAt,
    });

    const savedStory = await story.save();
    await UserModel.findByIdAndUpdate(userId, { $push: { stories: savedStory._id } });

    return savedStory;
}


    async getUserStories(userId: string): Promise<IStory[]> {
        const now = new Date();
        return await StoryModel.find({ userId: new mongoose.Types.ObjectId(userId), expiresAt: { $gt: now } }).exec();
    }

    async viewStoryAndGetCount(storyId: string, userId: string): Promise<number> {
    const story = await StoryModel.findById(storyId);
    if (!story) throw new Error("Story non trouvée");

    if (!story.viewedBy.includes(new mongoose.Types.ObjectId(userId))) {
        story.viewedBy.push(new mongoose.Types.ObjectId(userId));
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
        await UserModel.updateMany({}, { $pull: { stories: { $in: expiredIds } } });
    }
}


   async deleteUserStory(storyId: string, userId: string): Promise<void> {
    // Supprimer uniquement si la story appartient à l'utilisateur
    const story = await StoryModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(storyId),
        userId: new mongoose.Types.ObjectId(userId),
    });

    if (!story) {
        throw new Error("Story introuvable ou vous n'êtes pas autorisé à la supprimer");
    }

    // Retirer la référence du post dans le tableau `stories` de l'utilisateur
    await UserModel.findByIdAndUpdate(userId, { $pull: { stories: storyId } });
    }


    async getStoryOfFollowing(userId: string): Promise<IStory[]> {
        const now = new Date();

        const user = await UserModel.findById(userId).populate('followers', '_id username profilePicture').exec();
        if (!user || !user.followers || user.followers.length === 0) {
            return [];
        }

        // Récupérer les IDs des comptes suivis
        const followerIds = user.followers.map((f: any) => f._id);

        return await StoryModel.find({ userId: { $in: followerIds }, expiresAt: { $gt: now } })
            .populate('userId', '_id username profilePicture') // Assuming you want to populate user details
            .exec();
    }
}

export default StoryService;