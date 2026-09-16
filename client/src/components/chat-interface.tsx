'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, Bot, User, FileCode, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface ChatInterfaceProps {
  selectedRepo: any;
}

interface Message {
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: Array<{ filePath: string; score: number; snippet?: string }>;
}

export function ChatInterface({ selectedRepo }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ASSISTANT',
      content: selectedRepo
        ? `Hello! I have indexed **${selectedRepo.fullName}**. Ask me any question about architecture, functions, files, or logic!`
        : 'Please select or ingest a repository to start conversing with the codebase.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRepo) {
      setMessages([
        {
          role: 'ASSISTANT',
          content: `Ready to answer questions about **${selectedRepo.fullName}** (Branch: \`${selectedRepo.branch || 'main'}\`). What would you like to explore?`,
        },
      ]);
      setSessionId(undefined);
    }
  }, [selectedRepo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedRepo || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'USER', content: userQuery }]);
    setLoading(true);

    try {
      const response = await api.sendMessage(selectedRepo.id, userQuery, sessionId);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: response.assistantMessage.content,
          sources: response.assistantMessage.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: `⚠️ Error retrieving answer: ${err.response?.data?.error || err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              GitHub AI Assistant
              {selectedRepo && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedRepo.fullName}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">RAG-powered conversational codebase search</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.role === 'USER' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'ASSISTANT' && (
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'USER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-sm shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Citations / Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <FileCode className="h-3.5 w-3.5" /> Cited Sources:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-700 text-[10px] text-slate-300 font-mono"
                      >
                        {s.filePath}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'USER' && (
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700/60 p-4 text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              Searching codebase & synthesizing answer...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex gap-2">
        <Input
          placeholder={
            selectedRepo
              ? `Ask anything about ${selectedRepo.name}...`
              : 'Select a repository first...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!selectedRepo || loading}
          className="flex-1"
        />
        <Button type="submit" disabled={!selectedRepo || !input.trim() || loading} size="md">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
export default ChatInterface;
