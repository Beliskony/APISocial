"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const inversify_1 = require("inversify");
const User_provider_1 = require("../providers/User.provider");
const TYPES_1 = require("../config/TYPES");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let UserController = class UserController {
    constructor(userProvider) {
        this.userProvider = userProvider;
    }
    // Créer un nouvel utilisateur
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.body;
                const newUser = yield this.userProvider.createUser(user);
                // Génération d'un token JWT
                const token = jsonwebtoken_1.default.sign({ _id: newUser._id, username: newUser.username }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1h" });
                res.status(201).json({ message: "User registered successfully",
                    id: newUser._id,
                    token, });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Connexion d'un utilisateur
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const user = yield this.userProvider.loginUser(email, password);
                // Génération d'un token JWT
                const token = jsonwebtoken_1.default.sign({ _id: user === null || user === void 0 ? void 0 : user._id, username: user === null || user === void 0 ? void 0 : user.username }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1h" });
                res.status(200).json({ message: "User logged in successfully",
                    id: user === null || user === void 0 ? void 0 : user._id,
                    token, });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Rechercher un utilisateur par username
    findUserByUsername(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                const users = yield this.userProvider.findUserByUsername(username);
                res.status(200).json(users);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
};
exports.UserController = UserController;
exports.UserController = UserController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(TYPES_1.TYPES.UserProvider)),
    __metadata("design:paramtypes", [User_provider_1.UserProvider])
], UserController);
