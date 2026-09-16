import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

let pineconeClient = null;

export const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ PINECONE_API_KEY is not configured in environment variables');
      return null;
    }
    pineconeClient = new Pinecone({
      apiKey,
    });
  }
  return pineconeClient;
};

export const getPineconeIndex = (indexName = process.env.PINECONE_INDEX || 'github-assistant-index') => {
  const client = getPineconeClient();
  if (!client) return null;
  return client.index(indexName);
};

export default {
  getPineconeClient,
  getPineconeIndex,
};
