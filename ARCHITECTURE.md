# Architecture Notes

## Stack
- **Frontend**: React 18, TypeScript, Vite, TipTap (ProseMirror), Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma ORM, SQLite
- **Auth**: JWT with bcrypt password hashing

## What I Prioritized
1. **Solid editing experience** — TipTap gives a polished rich-text editor out of the box
   with clean JSON serialization for persistence.
2. **Working sharing flow** — Owner can share by email, recipients see shared docs separately.
3. **File upload** — .txt and .md files convert to editable documents.
4. **Auto-save** — Documents save on a debounced timer so no work is lost.
5. **Clean separation** — API routes are RESTful; auth middleware protects all doc routes.

## What I Deprioritized
- Real-time collaboration (WebSocket): Would add ~2 hours of complexity.
- .docx parsing: Requires mammoth.js and edge-case handling.
- Role-based permissions beyond view/edit.
- Polished mobile responsiveness.

## With 2-4 More Hours
- WebSocket-based real-time cursors and edits
- .docx import/export
- Document version history with diff view
- Commenting / suggestion mode
