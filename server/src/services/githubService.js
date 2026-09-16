import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
});

/**
 * Parses GitHub repo URL or string (e.g., "owner/repo" or "https://github.com/owner/repo")
 */
export const parseRepoInput = (input) => {
  const cleanInput = input.trim().replace(/\/+$/, '');
  const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = cleanInput.match(urlPattern);

  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  const parts = cleanInput.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
  }

  throw new Error('Invalid GitHub repository format. Use "owner/repo" or a full GitHub URL.');
};

/**
 * Fetches repository metadata
 */
export const getRepoMetadata = async (owner, repo) => {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });
  return {
    name: data.name,
    owner: data.owner.login,
    fullName: data.full_name,
    description: data.description,
    url: data.html_url,
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
  };
};

/**
 * Recursively fetches file tree and code contents for supported file extensions
 */
export const getRepoFileTree = async (owner, repo, branch = 'main') => {
  const supportedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go',
    '.rs', '.rb', '.php', '.cs', '.md', '.json', '.yaml', '.yml', '.sql',
    '.html', '.css', '.scss', '.sh', '.dockerfile'
  ];

  const ignoredDirs = [
    'node_modules', '.git', 'dist', 'build', '.next', 'vendor',
    'coverage', '.idea', '.vscode', '__pycache__'
  ];

  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: '1',
  });

  const files = [];

  for (const item of treeData.tree) {
    if (item.type !== 'blob') continue;
    
    // Ignore excluded folders
    if (ignoredDirs.some((dir) => item.path.includes(`${dir}/`) || item.path.startsWith(`${dir}/`))) {
      continue;
    }

    const isSupported = supportedExtensions.some((ext) => item.path.toLowerCase().endsWith(ext));
    if (!isSupported) continue;

    try {
      const { data: blobData } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: item.sha,
      });

      const content = Buffer.from(blobData.content, 'base64').toString('utf-8');
      
      // Ignore binary or massive files > 200KB for embedding
      if (content.length < 200000) {
        files.push({
          path: item.path,
          size: item.size,
          sha: item.sha,
          content,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch file content for ${item.path}:`, err.message);
    }
  }

  return files;
};

export default {
  parseRepoInput,
  getRepoMetadata,
  getRepoFileTree,
};
