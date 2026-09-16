import { PrismaClient } from '@prisma/client';
import { parseRepoInput, getRepoMetadata, getRepoFileTree } from '../services/githubService.js';
import { chunkFiles, indexRepoChunks } from '../services/ragService.js';

const prisma = new PrismaClient();

/**
 * Trigger repo ingestion and embedding pipeline
 */
export const ingestRepository = async (req, res) => {
  try {
    const { repoUrl, branch } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL or owner/repo string is required.' });
    }

    const { owner, repo } = parseRepoInput(repoUrl);
    const fullName = `${owner}/${repo}`;

    // Check if repo already exists in DB
    let repository = await prisma.repository.findUnique({
      where: { fullName },
    });

    if (!repository) {
      const metadata = await getRepoMetadata(owner, repo);
      repository = await prisma.repository.create({
        data: {
          name: metadata.name,
          owner: metadata.owner,
          fullName: metadata.fullName,
          url: metadata.url,
          description: metadata.description,
          branch: branch || metadata.defaultBranch || 'main',
          isPrivate: metadata.isPrivate,
          status: 'PROCESSING',
        },
      });
    } else {
      repository = await prisma.repository.update({
        where: { id: repository.id },
        data: { status: 'PROCESSING' },
      });
    }

    // Start background ingestion task
    const task = await prisma.ingestionTask.create({
      data: {
        repositoryId: repository.id,
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Ingest files asynchronously
    (async () => {
      try {
        const files = await getRepoFileTree(owner, repo, repository.branch);
        const chunks = await chunkFiles(files);
        await indexRepoChunks(repository.id, chunks);

        await prisma.repository.update({
          where: { id: repository.id },
          data: {
            status: 'COMPLETED',
            fileCount: files.length,
            chunkCount: chunks.length,
          },
        });

        await prisma.ingestionTask.update({
          where: { id: task.id },
          data: {
            status: 'COMPLETED',
            progress: 100,
            completedAt: new Date(),
          },
        });
      } catch (err) {
        console.error('Ingestion failed:', err);
        await prisma.repository.update({
          where: { id: repository.id },
          data: { status: 'FAILED' },
        });
        await prisma.ingestionTask.update({
          where: { id: task.id },
          data: {
            status: 'FAILED',
            error: err.message,
            completedAt: new Date(),
          },
        });
      }
    })();

    return res.status(202).json({
      message: 'Repository ingestion started successfully',
      repository,
      taskId: task.id,
    });
  } catch (error) {
    console.error('Error in ingestRepository controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * List all registered/indexed repositories
 */
export const listRepositories = async (req, res) => {
  try {
    const repos = await prisma.repository.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return res.json({ repositories: repos });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get single repository details by ID
 */
export const getRepositoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const repo = await prisma.repository.findUnique({
      where: { id },
      include: {
        chats: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    return res.json({ repository: repo });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  ingestRepository,
  listRepositories,
  getRepositoryById,
};
