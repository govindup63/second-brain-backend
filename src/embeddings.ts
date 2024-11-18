import mongoose from "mongoose";
import { getArticleData, getTweetData, getYoutubeData } from "./helper";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envBody = z.object({
  PINECONE_API_KEY: z.string(),
});

const env = envBody.parse(process.env);

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

export async function processLink(
  link: string,
  type: string,
  title: string,
  _id: mongoose.Types.ObjectId,
  userId: string,
): Promise<void> {
  let content: string;
  let datatype: string;

  switch (type) {
    case "youtube":
      content = await getYoutubeData(link);
      datatype = "youtube";

      break;
    case "tweet":
      content = await getTweetData(link);
      datatype = "tweet";
      break;
    case "article":
      content = await getArticleData(link);
      datatype = "article";
      break;
    case "image":
      content = title;
      datatype = "image";
      break;
    case "audio":
      content = title;
      datatype = "audio";
      break;
    default:
      throw new Error("Unsupported link type");
  }

  const embedding = await generateEmbedding(content);
  const metadata = { _id, title, link, type };

  await storeEmbedding(embedding, metadata, _id, userId);
  console.log(`Processed and stored embedding for ${type} link: ${link}`);
}

async function generateEmbedding(
  content: string,
  model = "multilingual-e5-large",
): Promise<number[]> {
  const response = await pc.inference.embed(
    model,
    [content],
    { inputType: "passage", truncate: "END" },
  );
  if (response && response[0] && response[0].values) {
    return response[0].values; // Return the embedding values as a number[] array
  } else {
    throw new Error("Embedding values not found in the response");
  }
}

async function storeEmbedding(
  embedding: number[],
  metadata: Record<string, any>,
  _id: mongoose.Types.ObjectId,
  userId: string,
): Promise<void> {
  const index = pc.index(
    "second-brain",
    "https://second-brain-8zqiwqq.svc.aped-4627-b74a.pinecone.io",
  );

  await index.namespace(userId).upsert([{
    id: _id.toString(),
    values: embedding,
    metadata: metadata,
  }]);
}

export async function queryEmbedding(
  queryText: string,
  _id: string,
): Promise<any[]> {
  const queryEmbedding = await generateEmbedding(queryText);
  const index = pc.index(
    "second-brain",
    "https://second-brain-8zqiwqq.svc.aped-4627-b74a.pinecone.io",
  );
  const queryResponse = await index.namespace(_id).query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
  });
  return queryResponse.matches;
}
