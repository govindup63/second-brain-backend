"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagHelper = tagHelper;
exports.getTagsByIdshelper = getTagsByIdshelper;
const db_1 = require("./db");
function tagHelper(tags) {
    return __awaiter(this, void 0, void 0, function* () {
        const tagIds = yield Promise.all(tags.map((tag) => __awaiter(this, void 0, void 0, function* () {
            const existingTag = yield db_1.TagsModel.findOne({ title: { $regex: new RegExp('^' + tag + '$', 'i') } });
            if (existingTag) {
                return existingTag._id;
            }
            else {
                const newTag = yield db_1.TagsModel.create({ title: tag });
                return newTag._id;
            }
        })));
        return tagIds;
    });
}
function getTagsByIdshelper(tagIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch tags by ObjectId
            const tags = yield db_1.TagsModel.find({ _id: { $in: tagIds } }).select("title");
            if (tags.length !== tagIds.length) {
                console.warn("Some tags were not found");
            }
            // Return the titles as an array of strings
            return tags.map(tag => tag.title);
        }
        catch (error) {
            console.error("Error fetching tags:", error);
            throw new Error("Failed to fetch tags");
        }
    });
}
