import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getPineconeIndex } from '../config/pinecone.js';
import dotenv from 'dotenv';

dotenv.config();

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;

const getGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not configured in environment variables');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Splits repository code/markdown files into contextual chunks
 */
export const chunkFiles = async (files) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const allChunks = [];

  for (const file of files) {
    const docs = await splitter.createDocuments(
      [file.content],
      [{ filePath: file.path, sha: file.sha }]
    );

    docs.forEach((doc, idx) => {
      allChunks.push({
        id: `${file.path}#${idx}`,
        text: doc.pageContent,
        metadata: {
          filePath: file.path,
          chunkIndex: idx,
        },
      });
    });
  }

  return allChunks;
};

/**
 * Generates vector embeddings using Google Gemini text-embedding-004 (768 dimensions)
 */
export const createEmbeddings = async (texts) => {
  const genAI = getGenAI();
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is required to generate embeddings.');
  }

  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const batchSize = 100;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = await embeddingModel.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { parts: [{ text: text.slice(0, 8000) }] },
      })),
    });

    result.embeddings.forEach((e) => allEmbeddings.push(e.values));
  }

  return allEmbeddings;
};

/**
 * Ingests and indexes repository chunks into Pinecone
 */
export const indexRepoChunks = async (repositoryId, chunks) => {
  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex) {
    throw new Error('Pinecone index is not initialized.');
  }

  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text);
    const embeddings = await createEmbeddings(texts);

    const vectors = batch.map((chunk, index) => ({
      id: `${repositoryId}_${chunk.id}`,
      values: embeddings[index],
      metadata: {
        repositoryId,
        filePath: chunk.metadata.filePath,
        chunkIndex: chunk.metadata.chunkIndex,
        text: chunk.text,
      },
    }));

    await pineconeIndex.upsert(vectors);
  }
};

/**
 * Queries Pinecone for relevant chunks and generates an AI answer using Gemini
 */
export const queryRepository = async ({ repositoryId, query, conversationHistory = [] }) => {
  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex) {
    throw new Error('Pinecone vector index is not available.');
  }

  const genAI = getGenAI();
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is required to process chat queries.');
  }

  // 1. Generate embedding for user query
  const [queryEmbedding] = await createEmbeddings([query]);

  // 2. Vector search in Pinecone filtered by repositoryId
  const searchResults = await pineconeIndex.query({
    vector: queryEmbedding,
    topK: 6,
    includeMetadata: true,
    filter: { repositoryId: { $eq: repositoryId } },
  });

  const matches = searchResults.matches || [];
  const context = matches
    .map((m) => `File: ${m.metadata?.filePath}\nContent:\n${m.metadata?.text}`)
    .join('\n\n---\n\n');

  const sources = matches.map((m) => ({
    filePath: m.metadata?.filePath,
    score: m.score,
    snippet: m.metadata?.text ? m.metadata.text.slice(0, 150) + '...' : '',
  }));

  // 3. System prompt with RAG context
  const systemPrompt = `You are GitHub Assistant, an expert AI software architect and developer.
Analyze the user query based on the following code and context retrieved from the indexed GitHub repository.
Explain logic clearly, provide code snippets where appropriate, and cite specific file paths.

Relevant Repository Context:
${context || 'No specific repository chunks found matching this query.'}
`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  // 4. Format conversation history for Gemini (roles: 'user' or 'model')
  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: query }],
    },
  ];

  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: 0.2,
    },
  });

  const response = await result.response;
  const answer = response.text() || 'Unable to generate response.';

  return {
    answer,
    sources,
  };
};

export default {
  chunkFiles,
  createEmbeddings,
  indexRepoChunks,
  queryRepository,
};
