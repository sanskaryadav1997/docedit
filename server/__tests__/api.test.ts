import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../src/auth';

const prisma = new PrismaClient();

describe('Document API logic', () => {
  let userId: string;
  let token: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('test123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: { email: 'test@test.com', name: 'Test', password: hash },
    });
    userId = user.id;
    token = signToken(user.id);
  });

  it('should create and retrieve a document', async () => {
    const doc = await prisma.document.create({
      data: { title: 'Test Doc', content: '{"type":"doc","content":[]}', ownerId: userId },
    });
    expect(doc.title).toBe('Test Doc');
    const found = await prisma.document.findUnique({ where: { id: doc.id } });
    expect(found).toBeTruthy();
    expect(found!.ownerId).toBe(userId);
    await prisma.document.delete({ where: { id: doc.id } });
  });

  it('should handle sharing', async () => {
    const hash = await bcrypt.hash('test123', 10);
    const other = await prisma.user.upsert({
      where: { email: 'other@test.com' },
      update: {},
      create: { email: 'other@test.com', name: 'Other', password: hash },
    });
    const doc = await prisma.document.create({
      data: { title: 'Shared Doc', content: '{}', ownerId: userId },
    });
    const share = await prisma.documentShare.create({
      data: { documentId: doc.id, userId: other.id, permission: 'edit' },
    });
    expect(share.permission).toBe('edit');
    const sharedDocs = await prisma.document.findMany({
      where: { shares: { some: { userId: other.id } } },
    });
    expect(sharedDocs.length).toBeGreaterThan(0);
    await prisma.documentShare.delete({ where: { id: share.id } });
    await prisma.document.delete({ where: { id: doc.id } });
  });

  afterAll(() => prisma.$disconnect());
});
