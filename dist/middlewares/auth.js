"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
// Fonction pour inscrire un nouvel utilisateur
const registerUser = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body); // Valider les données d'inscription
            next(); // Passer au contrôleur si les données sont valides
        }
        catch (error) {
            res.status(400).json({ message: 'Validation error', errors: error });
        }
    };
};
exports.registerUser = registerUser;
// Fonction pour authentifier un utilisateur
const loginUser = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body); // Valider les données de connexion
            next(); // Passer au contrôleur si les données sont valides
        }
        catch (error) {
            res.status(400).json({ message: 'Validation error', errors: error });
        }
    };
};
exports.loginUser = loginUser;
