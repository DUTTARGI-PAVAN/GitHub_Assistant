# 🤖 GitHub Assistant

An AI-powered full-stack assistant for analyzing, indexing, and conversing with GitHub repositories using RAG (Retrieval-Augmented Generation), LangChain, Pinecone vector database, PostgreSQL, Redis, Express, and Next.js.

---

## 📁 Repository Structure

```
├── client/                 # Next.js frontend (App Router + Tailwind CSS)
│   ├── src/
│   │   ├── app/            # App router, pages, and layouts
│   │   ├── components/     # shadcn/ui and custom reusable components
│   │   ├── lib/            # Utility functions and API client wrappers
│   │   └── styles/         # Tailwind CSS global styles
│   ├── public/             # Static assets
│   ├── next.config.js
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers (chat, repo ingestion)
│   │   ├── services/       # Core business logic (RAG, GitHub API, LangChain)
│   │   ├── routes/         # Express API route definitions
│   │   ├── prisma/         # Prisma schema and migrations (PostgreSQL)
│   │   ├── config/         # Redis and Pinecone client initializations
│   │   └── index.js        # Express server entry point
│   ├── .env                # Environment variables (OpenAI, GitHub, DB URIs)
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # Orchestrates Redis, PostgreSQL, and backend/frontend containers
└── README.md
```

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express.js (ES Modules), LangChain, Octokit (GitHub REST API)
- **Database & Cache**: PostgreSQL (via Prisma ORM), Redis (caching & job coordination)
- **Vector Search**: Pinecone Vector DB, Google Gemini Embeddings (`text-embedding-004`, 768 dim)
- **LLM**: Google Gemini (`gemini-1.5-flash`)
- **Containerization**: Docker & Docker Compose

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker](https://www.docker.com/) & Docker Compose
- API Keys for **Google Gemini**, **GitHub Personal Access Token**, and **Pinecone**

---

### 2. Environment Variables

Create and populate `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Database (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/github_assistant?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Google Gemini
GEMINI_API_KEY="your-gemini-api-key"

# GitHub
GITHUB_TOKEN="your-github-personal-access-token"

# Pinecone
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="github-assistant-index"
```

---

### 3. Running with Docker Compose (Recommended)

To start all services (PostgreSQL, Redis, Express server, Next.js client) simultaneously:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### 4. Running Locally without Docker

#### Start Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

#### Start Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/repos/ingest` | Ingest and vectorize a GitHub repository |
| `GET` | `/api/repos` | List all ingested repositories |
| `POST` | `/api/chat` | Query/chat with the RAG assistant |
| `GET` | `/api/chat/history/:repoId` | Retrieve chat message history |
