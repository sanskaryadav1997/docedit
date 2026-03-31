# DocEdit — Collaborative Document Editor

A lightweight collaborative document editor with rich-text editing, file upload,
document sharing, and persistence.

## Features
- Rich-text editing (bold, italic, underline, headings, lists)
- Document CRUD with auto-save
- File upload (.txt, .md → new editable document)
- Share documents with other users (view/edit)
- Persistent storage (SQLite via Prisma)

## Seeded Test Accounts
| Email | Password |
|---|---|
| alice@test.com | password123 |
| bob@test.com | password123 |
| carol@test.com | password123 |

## Local Setup

### Prerequisites
Node.js 18+, npm

### Server
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev        # starts on :3001
```

### Client
```bash
cd client
npm install
npm run dev        # starts on :5173
```

Open http://localhost:5173

## Deployment
Deployed at: [YOUR_DEPLOYED_URL]
