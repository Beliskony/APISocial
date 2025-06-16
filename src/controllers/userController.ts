import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { UserProvider } from "../providers/User.provider";
import { TYPES } from "../config/TYPES";
import jwt from "jsonwebtoken";


type LoginParams = { identifiant: string; password: string; };


@injectable()
export class UserController {
    constructor(@inject(TYPES.UserProvider) private userProvider: UserProvider) {}

    // Créer un nouvel utilisateur
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const user = req.body;
            const newUser = await this.userProvider.createUser(user);

            // Génération d'un token JWT
            const token = jwt.sign(
                { _id: newUser._id, username: newUser.username },
                process.env.JWT_SECRET || "your_secret_key",
                { expiresIn: "1h" }
            );

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
        }

            const user = await this.userProvider.loginUser({ identifiant, password} as LoginParams);

          
            // Vérifie si aucun utilisateur trouvé
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides" }) as unknown as void;
        }

             // Génération d'un token JWT
             const token = jwt.sign(
                { _id: user?._id, username: user?.username },
                process.env.JWT_SECRET || "your_secret_key",
                { expiresIn: "1h" }
            );
            return res.status(200).json({message: "User logged in successfully",
                id: user?._id,
                username: user?.username,
                email: user?.email,
                profilePicture: user?.profilePicture,
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
            res.status(200).json(users);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Suivre ou ne plus suivre un utilisateur
    async toggleFollow(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.body;        // userId vient du body
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
    async updateUserProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            const userData = req.body;

            if (!userId || !userData) {
                res.status(400).json({ message: "User ID and data are required" });
                return;
            }

            const updatedUser = await this.userProvider.updateUserProfile(userId, userData);
            res.status(200).json({ message: "User profile updated successfully", user: updatedUser });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

}
    
    