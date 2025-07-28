import UserModel, { IUser } from "../models/User.model";
import { hash, compare } from "bcryptjs";
import {injectable} from "inversify";
import NotificationsModel from "../models/Notifications.model";



export interface IUserService {
    createUser(user: IUser): Promise<IUser>;
    loginUser(params: {identifiant: string; password: string}): Promise<IUser | null>;
    findUserByUsername(username: string): Promise<IUser[]>;
}

@injectable()
export class UserService implements IUserService{

async createUser (user: IUser): Promise<IUser> {
    const existingUser = await UserModel.findOne({ $or: [{ email: user.email}, { phoneNumber: user.phoneNumber }]})
     if (existingUser) {
        throw new Error("Utilisateur existe deja")
     }
    const hashedPassword = await hash(user.password, 10);
    const newUser = new UserModel({ ...user, password: hashedPassword});

    return await newUser.save()
}


 async loginUser (params: {identifiant: string, password: string}): Promise<IUser | null> {
    const { identifiant, password } = params;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifiant);
    const isPhone = /^(\+?\d{10,20})$/.test(identifiant);

     const searchCriteria = isEmail ? { email: identifiant } : { phoneNumber: identifiant };
    
    const user = await UserModel.findOne( searchCriteria ).populate('posts');
    if (!user){
        throw new Error("Utilisateur non trouve");
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Mot de passe incorrect")
    }

    return user
}

async findUserByUsername (username: string): Promise<IUser[]> {
    const user = await UserModel.find ({ username: {$regex: username, $options: "i"} }).select("-password -phoneNumber -email").populate('posts')
    return user
}

async toggleFollow(userId: string, targetId: string): Promise<"followed" | "unfollowed"> {
    if (userId === targetId) throw new Error("Impossible de se suivre soi-même");
    const target = await UserModel.findById(targetId);
    if (!target) throw new Error("Utilisateur introuvable");

    const alreadyFollowing = target.followers?.some(followerId => followerId.toString() === userId);

    if (alreadyFollowing) {
        // Unfollow
        target.followers = target.followers?.filter(followerId => followerId.toString() !== userId) || [];
        await target.save();
        return "unfollowed";
    } else {
        // Follow
        target.followers?.push(userId as any);
        await target.save();
        // Create a notification for the followed user
        await NotificationsModel.create({
            recipient: targetId,
            sender: userId,
            type: 'follow',
            content: `Vous avez un nouveau follower.`,
            isRead: false,
        });
        return "followed";
    }
}

//mettre à jour le profil de l'utilisateur
async updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
  const allowedFields: (keyof IUser)[] = ['username', 'profilePicture', 'email', 'phoneNumber', 'password'];
  const updateFields: Partial<IUser> = {};

  for (const field of allowedFields) {
    if (field in updateData) {
      if (field === 'password' && typeof updateData.password === 'string') {
        updateFields.password = await hash(updateData.password, 10);
      } else {
        updateFields[field] = updateData[field];
      }
    }
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-password'); // si tu veux toujours masquer ça

  if (!updatedUser) {
    throw new Error("Utilisateur non trouvé");
  }

  return updatedUser;
}


  //get me 
    async getMe(userId: string): Promise<IUser | null> {
        const user = await UserModel.findById(userId)
            .select("-password") 
            .populate('posts', '-user') // Exclure le champ 'user' des posts
            .populate('followers', '-password'); // Exclure les champs sensibles des followers
        return user;
    }

  
  //get userById
    async getUserById(userId: string): Promise<IUser | null> {
        const user = await UserModel.findById(userId)
            .select("-password") 
            .populate('posts', '-user') // Exclure le champ 'user' des posts
            .populate('followers', '-password'); // Exclure les champs sensibles des followers
        return user;
    }

}