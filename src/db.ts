import mongoose, { Schema } from 'mongoose'
import { contentType } from './config';
import { union } from 'zod';
const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String
})

const ContentSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: contentType, required: true },
  link: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Tags' }],
  userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }

})

const TagsSchema = new Schema({
  title: { type: String, required: true, unique: true }
})

const LinkSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})

export const UserModel = mongoose.model("User", UserSchema);
export const ContentModel = mongoose.model("Content", ContentSchema)
export const TagsModel = mongoose.model("Tags", TagsSchema)
export const LinkModel = mongoose.model("Links", LinkSchema)


export interface TagDocument extends Document {
  _id: mongoose.Types.ObjectId;  // The MongoDB ObjectId for the tag
  title: string;         // The title of the tag (string)
}
export interface ContentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: string;
  tags: mongoose.Types.ObjectId[];
  userId: mongoose.Types.ObjectId
}
