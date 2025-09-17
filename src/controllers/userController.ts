import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { UserProvider } from "../providers/User.provider";
import { TYPES } from "../config/TYPES";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/Auth.Types";
import { IUser } from "../models/User.model";


type LoginParams = { identifiant: string; password: string; };


@injectable()
export class UserController {
    constructor(@inject(TYPES.UserProvider) private userProvider: UserProvider) {}

    private generateToken(user: IUser): string {
        console.log("🧪 Secret utilisé pour le token :", user);
        return jwt.sign(
            { _id: user._id,
              username: user.username, 
              phoneNumber: user.phoneNumber, 
              email: user.email, 
              profilePicture: user.profilePicture, 
              posts: user.posts, 
              followers: user.followers 
            },
            process.env.JWT_SECRET || "monSupercodeSecretAxel123456@",
            { expiresIn: "30d" }
        );
    }

    // Créer un nouvel utilisateur
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const user = req.body;
            const newUser = await this.userProvider.createUser(user);

            // Génération d'un token JWT
            const token = this.generateToken(newUser);
            // Exclure le mot de passe du token
            const { password, ...userWithoutPassword } = newUser.toObject();

            res.status(201).json({message: "Utilisateur enregistré avec succès",
                id: newUser._id.toString(),
                token,});
                console.log("Controller createUser called with body:", req.body)
                
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Connexion d'un utilisateur
    async loginUser(req: Request, res: Response): Promise<void> {
        try {
            const { identifiant, password } = req.body as LoginParams;

              if (!identifiant || !password ) {
            res.status(400).json({ message: "Email ou numéro de téléphone et mot de passe sont requis" });
            return;
        }

            const user = await this.userProvider.loginUser({ identifiant, password} as LoginParams);

          
            // Vérifie si aucun utilisateur trouvé
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides" }) as unknown as void;
        }

             // Génération d'un token JWT
             const token = this.generateToken(user);
            // Exclure le mot de passe du token
            const { password: userPassword, ...userWithoutPassword } = user.toObject();
            return res.status(200).json({message: "User logged in successfully",
                id: user?._id,
                username: user?.username,
                email: user?.email,
                phoneNumber: user?.phoneNumber,
                profilePicture: user?.profilePicture,
                posts: user?.posts,
                followers: user?.followers,
                token,}) as unknown as void;                
                
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Rechercher un utilisateur par username
    async findUserByUsername(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const users = await this.userProvider.findUserByUsername(username);
            const safeUser = users.map(user => {
                const { password, phoneNumber, email, ...safeUser} = user.toObject();
                return safeUser;
            })
            res.status(200).json(safeUser);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Suivre ou ne plus suivre un utilisateur
    async toggleFollow(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId  = req.user?._id;        
            const { targetId } = req.params;

            if (!userId || !targetId) {
                res.status(400).json({ message: "User ID and target ID are required" });
                return;
            }

            const action = await this.userProvider.toggleFollow(userId, targetId);
            res.status(200).json({ message: `Successfully ${action} user`, action });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Mettre à jour le profil de l'utilisateur
    async updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id; // userId vient du token JWT
            const userData = req.body;

            if (!userId) {
                res.status(400).json({ message: "Utilisateur non authentifié" });
                return;
            }

            if (!userData || Object.keys(userData).length === 0) {
                res.status(400).json({ message: "Aucune donnée à mettre à jour" });
                return;
            }

            const updatedUser = await this.userProvider.updateUserProfile(userId, userData);
            res.status(200).json({ message: "User profile updated successfully", user: updatedUser });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    //get me (profile)
    async getMe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?._id; // userId vient du token JWT

            if (!userId) {
                res.status(400).json({ message: "User ID is required" });
                return;
            }

            const user = await this.userProvider.getMe(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            // Exclure le mot de passe du profil
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json(userWithoutPassword);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    //get userById
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ message: "User ID is required" });
                return;
            }

            const user = await this.userProvider.getUserById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            // Exclure le mot de passe du profil
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json(userWithoutPassword);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

}
    
    