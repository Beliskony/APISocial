import UserModel, { IUser } from "../models/User.model";
import { hash, compare } from "bcryptjs";
import {injectable} from "inversify";


export interface IUserService {
    createUser(user: IUser): Promise<IUser>;
    loginUser(email: string, password: string): Promise<IUser | null>;
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


 async loginUser (email : string, password: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email});
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
        return "followed";
    }
}

}