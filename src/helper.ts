import mongoose, { Types } from "mongoose";
import { TagDocument, TagsModel } from "./db";

type ObjectId = Types.ObjectId

export async function tagHelper(tags: string[]): Promise<ObjectId[]> {
  const tagIds = await Promise.all(
    tags.map(async (tag): Promise<ObjectId> => {
      const existingTag = await TagsModel.findOne({ title: { $regex: new RegExp('^' + tag + '$', 'i') } })
      if (existingTag) {
        return existingTag._id
      }
      else {
        const newTag = await TagsModel.create({ title: tag })
        return newTag._id
      }
    })
  )
  return tagIds
}


export async function getTagsByIdshelper(tagIds: Types.ObjectId[]): Promise<string[]> {
  try {
    // Fetch tags by ObjectId
    const tags: TagDocument[] = await TagsModel.find({ _id: { $in: tagIds } }).select("title");

    if (tags.length !== tagIds.length) {
      console.warn("Some tags were not found");
    }

    // Return the titles as an array of strings
    return tags.map(tag => tag.title);
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw new Error("Failed to fetch tags");
  }
}
