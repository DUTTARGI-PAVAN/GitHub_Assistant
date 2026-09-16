'use client';

import React, { useState, useEffect } from 'react';
import RepoIngestCard from '@/components/repo-ingest-card';
import ChatInterface from '@/components/chat-interface';
import { Github, Database, Cpu, Layers, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function Home() {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    try {
      const data = await api.getRepos();
      setRepositories(data.repositories || []);
      if (!selectedRepo && data.repositories?.length > 0) {
        setSelectedRepo(data.repositories[0]);
      }
    } catch (err) {
      console.error('Failed to load repositories', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleRepoIngested = (newRepo: any) => {
    setRepositories((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    setSelectedRepo(newRepo);
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 px-4 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Top Navigation / Brand */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Github className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              GitHub Assistant
            </h1>
            <p className="text-xs text-slate-400">RAG-Powered AI Intelligence for Source Code</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Database className="h-3.5 w-3.5 text-emerald-400" /> PostgreSQL + Pinecone
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Cpu className="h-3.5 w-3.5 text-blue-400" /> GPT-4o RAG
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Repo Ingestion & Repo List */}
        <div className="lg:col-span-4 space-y-6">
          <RepoIngestCard onRepoIngested={handleRepoIngested} />

          {/* Indexed Repositories List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Indexed Repositories
              </h3>
              <button
                onClick={fetchRepositories}
                className="text-slate-400 hover:text-white transition-colors"
                title="Refresh repositories"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {repositories.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                  No repositories indexed yet.
                </div>
              ) : (
                repositories.map((repo) => {
                  const isSelected = selectedRepo?.id === repo.id;
                  return (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500/50 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-slate-200 truncate max-w-[180px]">
                          {repo.fullName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold flex items-center gap-1 ${
                            repo.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : repo.status === 'PROCESSING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {repo.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <Clock className="h-2.5 w-2.5" />
                          )}
                          {repo.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{repo.fileCount || 0} files</span>
                        <span>•</span>
                        <span>{repo.chunkCount || 0} vector chunks</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Interface */}
        <div className="lg:col-span-8">
          <ChatInterface selectedRepo={selectedRepo} />
        </div>
      </div>
    </main>
  );
}
