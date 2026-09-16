'use client';

import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Github, Loader2, Sparkles, CheckCircle, GitBranch, FolderGit2 } from 'lucide-react';
import api from '@/lib/api';

interface RepoIngestCardProps {
  onRepoIngested: (repo: any) => void;
}

export function RepoIngestCard({ onRepoIngested }: RepoIngestCardProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.ingestRepo(repoUrl, branch);
      setSuccessMsg(`Repository ${response.repository.fullName} queued for AI indexing!`);
      onRepoIngested(response.repository);
      setRepoUrl('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to ingest repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-2xl">
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <FolderGit2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Ingest GitHub Repository</h2>
          <p className="text-xs text-slate-400">Index source code, branches, and docs into Pinecone for RAG analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" /> Repository URL or Owner/Repo
          </label>
          <Input
            placeholder="e.g. facebook/react or https://github.com/vercel/next.js"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" /> Branch
          </label>
          <Input
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting & Vectorizing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Start Ingestion
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
export default RepoIngestCard;
