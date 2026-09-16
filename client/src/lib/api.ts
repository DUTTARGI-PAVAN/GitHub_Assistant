import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Repository APIs
  ingestRepo: async (repoUrl: string, branch?: string) => {
    const res = await apiClient.post('/repos/ingest', { repoUrl, branch });
    return res.data;
  },
  getRepos: async () => {
    const res = await apiClient.get('/repos');
    return res.data;
  },
  getRepoById: async (id: string) => {
    const res = await apiClient.get(`/repos/${id}`);
    return res.data;
  },

  // Chat APIs
  sendMessage: async (repositoryId: string, message: string, chatSessionId?: string) => {
    const res = await apiClient.post('/chat', {
      repositoryId,
      message,
      chatSessionId,
    });
    return res.data;
  },
  getChatHistory: async (sessionId: string) => {
    const res = await apiClient.get(`/chat/history/${sessionId}`);
    return res.data;
  },
};

export default api;
