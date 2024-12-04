import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import z from "zod";
import cors from "cors";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import crypto from "crypto";

import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import { contentType } from "./config";
import { getTagsByIdshelper, tagHelper } from "./helper";
import { processLink, queryEmbedding } from "./embeddings";

const model = "multilingual-e5-large";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

const envSchema = z.object({
  MONGO_URL: z.string(),
  JWT_PASS: z.string(),
  PINECONE_API_KEY: z.string(),
});

const env = envSchema.parse(process.env);

app.post("/api/v1/signup", async (req, res) => {
  const requredBody = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(3).max(30),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(411).json({
      message: "wrong format of input",
    });
    return;
  }
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 5);
  try {
    UserModel.create({
      username: username,
      password: hashedPassword,
    });
    res.status(200).json({
      message: "you are signed in as a user",
    });
    return;
  } catch (e) {
    console.error("error creating user: \n" + e);
    res.status(403).json({
      message: "User Already Exists / database issue",
    });
    return;
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const requredBody = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(3).max(30),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(401).json({
      message: "body format wrong",
    });
    return;
  }
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username }) as {
    password: string;
    _id: mongoose.Types.ObjectId;
  };
  if (!user) {
    res.status(403).json({
      message: "user does not exist try signup first",
    });
    return;
  }

  const passwordMatched = await bcrypt.compare(password, user.password);
  if (!passwordMatched) {
    res.status(403).json({
      message: "wrong password",
    });
    return;
  }

  const token = jwt.sign({
    id: user._id,
  }, env.JWT_PASS);

  res.json({
    token,
  });
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const requredBody = z.object({
    type: z.enum(contentType),
    link: z.string().url(),
    title: z.string().min(1),
    tags: z.array(z.string()).nonempty(),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(401).json({
      message: "data input error format",
    });
  }
  const { type, link, title, tags } = req.body;
  const tagIds = await tagHelper(tags);

  try {
    const content = await ContentModel.create({
      title: title,
      type: type,
      link: link,
      tags: tagIds,
      userId: req.userId,
    });
    if (req.userId) {
      processLink(link, type, title, content._id, req.userId);
      res.status(200).json({
        message: "your content is added succesfully",
      });
    } else {
      res.status(403).json({
        message: "req.userId not available",
      });
    }
    return;
  } catch (e) {
    console.error("error uploading content to db: \n" + e);
    res.status(403).json({
      message: "content upload failed try again",
    });
    return;
  }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  const user = req.userId;

  try {
    // Fetch content for the user
    const content = await ContentModel.find({ userId: user }).populate(
      "userId",
      "username",
    );

    // Transform the content's tags from DocumentArray (subdocuments) to ObjectIds
    const transformedContent = await Promise.all(content.map(async (item) => {
      // Assuming item.tags is a DocumentArray of tags (subdocuments), extract ObjectIds
      const tagIds: mongoose.Types.ObjectId[] = item.tags.map((
        tag: { _id: mongoose.Types.ObjectId },
      ) => tag._id);

      // Call your helper function to fetch tag names using ObjectIds
      const tagNames = await getTagsByIdshelper(tagIds);

      return {
        ...item.toObject(), // Ensure the content is in a plain object format
        tags: tagNames, // Replace ObjectIds with tag names
      };
    }));

    // Return the transformed content
    res.json({
      content: transformedContent,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const requredBody = z.object({
    contentId: z.custom((value) => {
      try {
        return ObjectId.isValid(value);
      } catch (e) {
        return false;
      }
    }),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(401).json({
      message: "data format wrong",
      error: parsedCorrectly.error.errors,
    });
  }
  const { contentId } = req.body;
  const userId = req.userId;
  try {
    const status = await ContentModel.deleteOne({
      _id: contentId,
      userId,
    });
    res.json({
      message: `content with content id: ${contentId} deleted`,
      status,
    });
  } catch (e) {
    console.error(e);
    res.json({
      message: "error deleting the content",
      error: e,
    });
  }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const requredBody = z.object({
    status: z.boolean(),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(401).json({
      message: "wrong input format",
    });
  }
  const { status } = req.body;

  if (status) {
    const hash = crypto.randomBytes(16).toString("hex");
    try {
      LinkModel.create({
        hash: hash,
        userId: req.userId,
      });
      res.status(200).json({
        message: "Link Created successfully",
        hash: `${hash}`,
      });
      return;
    } catch (e) {
      console.error(e);
      res.status(403).json({
        message: "error creating link",
        error: e,
      });
      return;
    }
  } else if (!status) {
    try {
      const status = await LinkModel.deleteMany({
        userId: req.userId,
      });
      res.json({
        message: "all links to your brain is disabled",
        status,
      });
      return;
    } catch (e) {
      console.error(e);
      res.status(403).json({
        message: "error disabling links",
        error: e,
      });
      return;
    }
  }
});

app.get("/api/v1/brain/:shareLink", userMiddleware, async (req, res) => {
  const { shareLink } = req.params;

  try {
    const userLink = await LinkModel.findOne({
      hash: shareLink,
    });
    const user = userLink?.userId;
    const content = await ContentModel.find({ userId: user }).populate(
      "userId",
      "username",
    );

    // Transform the content's tags from DocumentArray (subdocuments) to ObjectIds
    const transformedContent = await Promise.all(content.map(async (item) => {
      // Assuming item.tags is a DocumentArray of tags (subdocuments), extract ObjectIds
      const tagIds: mongoose.Types.ObjectId[] = item.tags.map((
        tag: { _id: mongoose.Types.ObjectId },
      ) => tag._id);

      // Call your helper function to fetch tag names using ObjectIds
      const tagNames = await getTagsByIdshelper(tagIds);

      return {
        ...item.toObject(), // Ensure the content is in a plain object format
        tags: tagNames, // Replace ObjectIds with tag names
      };
    }));

    // Return the transformed content
    res.json({
      content: transformedContent,
    });
  } catch (e) {
    console.error(e);
    res.status(403).json({
      message: "you dont have access to link",
    });
  }
});

app.post("/api/v1/brain/ask", userMiddleware, async (req, res) => {
  const requredBody = z.object({
    query: z.string(),
  });
  const parsedCorrectly = requredBody.safeParse(req.body);
  if (!parsedCorrectly.success) {
    res.status(403).json({
      message: "input format wrong",
    });
    return;
  }
  const { query } = req.body;
  if (req.userId) {
    const topResults = await queryEmbedding(query, req.userId);
    res.json({
      topResults,
    });
  } else {
    console.log("userId does not exist");
  }
});

async function main() {
  await mongoose.connect(env.MONGO_URL);
  app.listen(3000, () => {
    console.log("server running on port 3000");
  });
}
main();
