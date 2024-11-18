import { Types } from "mongoose";
import { TagDocument, TagsModel } from "./db";
import axios from "axios";
import { z } from "zod";
import dotenv from "dotenv";
import * as cheerio from "cheerio";
import test from "node:test";
dotenv.config();

const envBody = z.object({
  YOUTUBE_API_KEY: z.string(),
  TWITTER_BEARER_TOKEN: z.string(),
});

const env = envBody.parse(process.env);

type ObjectId = Types.ObjectId;

export async function tagHelper(tags: string[]): Promise<ObjectId[]> {
  const tagIds = await Promise.all(
    tags.map(async (tag): Promise<ObjectId> => {
      const existingTag = await TagsModel.findOne({
        title: { $regex: new RegExp("^" + tag + "$", "i") },
      });
      if (existingTag) {
        return existingTag._id;
      } else {
        const newTag = await TagsModel.create({ title: tag });
        return newTag._id;
      }
    }),
  );
  return tagIds;
}

export async function getTagsByIdshelper(
  tagIds: Types.ObjectId[],
): Promise<string[]> {
  try {
    // Fetch tags by ObjectId
    const tags: TagDocument[] = await TagsModel.find({ _id: { $in: tagIds } })
      .select("title");

    if (tags.length !== tagIds.length) {
      console.warn("Some tags were not found");
    }

    // Return the titles as an array of strings
    return tags.map((tag) => tag.title);
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw new Error("Failed to fetch tags");
  }
}

function extractVideoId(url: string): string {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]*)|youtu\.be\/([^?]*)/,
  );
  if (!match) throw new Error("Invalid Youtube URL");
  return match[1] || match[2];
}

export async function getYoutubeData(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  const apiKey = env.YOUTUBE_API_KEY;

  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`,
  );

  if (response.data.items.length === 0) {
    throw new Error("Invalid video URL");
  }

  const video = response.data.items[0].snippet;
  return `${video.title}. ${video.description}`;
}

function extractTweetId(url: string): string {
  // Supports both Twitter (twitter.com) and X (x.com) URLs
  const match = url.match(/(?:twitter|x)\.com\/.*\/status\/(\d+)/);
  if (!match) {
    throw new Error("Invalid Twitter/X URL");
  }
  return match[1];
}

export async function getTweetData(tweetUrl: string): Promise<string> {
  try {
    const tweetId = extractTweetId(tweetUrl); // Extract tweet ID from the URL
    const bearerToken = process.env.TWITTER_BEARER_TOKEN; // Use environment variable for security

    if (!bearerToken) {
      throw new Error("Missing Twitter/X API Bearer Token");
    }

    const response = await axios.get(
      `https://api.x.com/2/tweets/${tweetId}?tweet.fields=text`,
      { headers: { Authorization: `Bearer ${bearerToken}` } },
    );

    if (!response.data.data || !response.data.data.text) {
      throw new Error("Invalid tweet data or no text content available");
    }

    return response.data.data.text;
  } catch (error: any) {
    console.error("Error fetching tweet data:", error.message);
    throw error;
  }
}

async function getArticleData(articleUrl: string): Promise<string> {
  try {
    // Perform the HTTP request
    const response = await axios.get(articleUrl);

    // Ensure data is returned
    if (!response.data) {
      throw new Error("No data returned from the URL");
    }

    // Load the HTML into Cheerio
    const $ = cheerio.load(response.data);

    // Extract title, description, and body
    const title = $("head > title").text() || "No title available";
    const description = $('meta[name="description"]').attr("content") ||
      "No description available";
    const body = $("article").text() || $("body").text().slice(0, 1000);

    // Return combined text
    return `${title}. ${description}. ${body}`;
  } catch (error: any) {
    console.error(`Failed to scrape article data: ${error.message}`);
    throw error;
  }
}
