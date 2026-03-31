import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { AuthRequest, authMiddleware, signToken } from './auth';

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

// --- Auth ---
router.post('/auth/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const user = await prisma.user.create({
      data: { email, name, password: await bcrypt.hash(password, 10) },
    });
    res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/auth/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true } });
  user ? res.json(user) : res.status(404).json({ error: 'User not found' });
});

// --- Documents ---
router.get('/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  const owned = await prisma.document.findMany({
    where: { ownerId: req.userId },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const shared = await prisma.document.findMany({
    where: { shares: { some: { userId: req.userId } } },
    include: {
      owner: { select: { name: true, email: true } },
      shares: { where: { userId: req.userId }, select: { permission: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ owned, shared });
});

router.post('/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  const doc = await prisma.document.create({
    data: { title: title || 'Untitled Document', content: content || '{}', ownerId: req.userId! },
  });
  res.status(201).json(doc);
});

router.get('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const hasAccess = doc.ownerId === req.userId || doc.shares.some(s => s.userId === req.userId);
  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
  const permission = doc.ownerId === req.userId ? 'owner' : doc.shares.find(s => s.userId === req.userId)?.permission || 'view';
  res.json({ ...doc, permission });
});

router.put('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id }, include: { shares: true } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const share = doc.shares.find(s => s.userId === req.userId);
  const canEdit = doc.ownerId === req.userId || share?.permission === 'edit';
  if (!canEdit) return res.status(403).json({ error: 'No edit permission' });
  const { title, content } = req.body;
  const updated = await prisma.document.update({
    where: { id: req.params.id },
    data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }) },
  });
  res.json(updated);
});

router.delete('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.ownerId !== req.userId) return res.status(403).json({ error: 'Only owner can delete' });
  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Sharing ---
router.post('/documents/:id/share', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { email, permission = 'view' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!['view', 'edit'].includes(permission)) return res.status(400).json({ error: 'Invalid permission' });
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.ownerId !== req.userId) return res.status(403).json({ error: 'Only owner can share' });
  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.id === req.userId) return res.status(400).json({ error: 'Cannot share with yourself' });
  const share = await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: req.params.id, userId: targetUser.id } },
    update: { permission },
    create: { documentId: req.params.id, userId: targetUser.id, permission },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(share);
});

router.delete('/documents/:id/share/:shareId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc || doc.ownerId !== req.userId) return res.status(403).json({ error: 'Only owner can remove shares' });
  await prisma.documentShare.delete({ where: { id: req.params.shareId } });
  res.json({ success: true });
});

// --- File Upload ---
router.post('/documents/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { originalname, buffer, mimetype } = req.file;
  const ext = originalname.split('.').pop()?.toLowerCase();
  if (!['txt', 'md'].includes(ext || '')) {
    return res.status(400).json({ error: 'Only .txt and .md files are supported' });
  }
  const text = buffer.toString('utf-8');
  const title = originalname.replace(/\.[^.]+$/, '');
  // Convert plain text/markdown to TipTap JSON
  const paragraphs = text.split(/\n\n|\r\n\r\n/).filter(Boolean);
  const content = JSON.stringify({
    type: 'doc',
    content: paragraphs.map(p => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.replace(/\n/g, ' ').trim() }],
    })),
  });
  const doc = await prisma.document.create({
    data: { title, content, ownerId: req.userId! },
  });
  res.status(201).json(doc);
});

export default router;
