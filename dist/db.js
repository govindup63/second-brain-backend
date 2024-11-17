"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkModel = exports.TagsModel = exports.ContentModel = exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const config_1 = require("./config");
const UserSchema = new mongoose_1.Schema({
    username: { type: String, unique: true },
    password: String,
});
const ContentSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: config_1.contentType, required: true },
    link: { type: String, required: true },
    tags: [{ type: mongoose_1.default.Types.ObjectId, required: true, ref: "Tags" }],
    userId: { type: mongoose_1.default.Types.ObjectId, required: true, ref: "User" },
});
const TagsSchema = new mongoose_1.Schema({
    title: { type: String, required: true, unique: true },
});
const LinkSchema = new mongoose_1.Schema({
    hash: { type: String, required: true, unique: true },
    userId: { type: mongoose_1.default.Types.ObjectId, required: true, ref: "User" },
});
exports.UserModel = mongoose_1.default.model("User", UserSchema);
exports.ContentModel = mongoose_1.default.model("Content", ContentSchema);
exports.TagsModel = mongoose_1.default.model("Tags", TagsSchema);
exports.LinkModel = mongoose_1.default.model("Links", LinkSchema);
