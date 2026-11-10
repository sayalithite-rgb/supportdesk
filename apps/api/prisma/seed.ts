import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const JSON_PATH = path.resolve(__dirname, '../../../docs/tickets.json');

type SeedTicket = {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  slaDueAt: string;
  createdByEmail: string;
  assigneeEmail?: string;
  tags?: string;
};

const USERS = [
  { name: 'Admin User', email: 'admin@supportdesk.test', role: Role.admin },
  { name: 'Asha Agent', email: 'agent.asha@supportdesk.test', role: Role.agent },
  { name: 'Ravi Agent', email: 'agent.ravi@supportdesk.test', role: Role.agent },
  { name: 'Cara Customer', email: 'customer.cara@example.com', role: Role.customer },
  { name: 'Dev Customer', email: 'customer.dev@example.com', role: Role.customer },
  { name: 'Mia Customer', email: 'customer.mia@example.com', role: Role.customer },
];

// Fake hash for fictional seed users only (real auth comes later)
function fakeHash(password: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 32).toString('hex')}`;
}

async function main() {
  if (!fs.existsSync(JSON_PATH)) throw new Error(`Seed JSON not found: ${JSON_PATH}`);
  const tickets: SeedTicket[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Read ${tickets.length} tickets from JSON`);

  // 1. Users (upsert = safe to re-run)
  const userIds = new Map<string, string>();
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash: fakeHash('ChangeMe123!') },
    });
    userIds.set(u.email, user.id);
  }

  // 2. Tags (upsert)
  const tagIds = new Map<string, string>();
  const tagNames = new Set(tickets.flatMap((t) => (t.tags ? t.tags.split(';') : [])));
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    tagIds.set(name, tag.id);
  }

  // 3. Tickets: delete old ones then recreate, so re-running never duplicates
  const validStatus = Object.values(TicketStatus) as string[];
  const validPriority = Object.values(TicketPriority) as string[];

  await prisma.$transaction(
    async (tx) => {
      await tx.ticket.deleteMany(); // cascades comments, tag links, attachments

      for (const t of tickets) {
        if (!validStatus.includes(t.status)) throw new Error(`Bad status: ${t.status}`);
        if (!validPriority.includes(t.priority)) throw new Error(`Bad priority: ${t.priority}`);

        const createdById = userIds.get(t.createdByEmail);
        if (!createdById) throw new Error(`Unknown creator: ${t.createdByEmail}`);

        const assigneeId = t.assigneeEmail ? userIds.get(t.assigneeEmail) : undefined;
        if (t.assigneeEmail && !assigneeId) throw new Error(`Unknown assignee: ${t.assigneeEmail}`);

        await tx.ticket.create({
          data: {
            title: t.title,
            description: t.description,
            status: t.status as TicketStatus,
            priority: t.priority as TicketPriority,
            category: t.category,
            slaDueAt: new Date(t.slaDueAt),
            createdById,
            assigneeId: assigneeId ?? null,
            tags: {
              create: (t.tags ? t.tags.split(';') : []).map((name) => ({
                tag: { connect: { id: tagIds.get(name)! } },
              })),
            },
            ...(assigneeId && {
              comments: {
                create: [
                  { body: 'Thanks for reaching out, we are looking into this.', isInternal: false, authorId: assigneeId },
                ],
              },
            }),
          },
        });
      }
    },
    { timeout: 60000 }
  );

  const count = await prisma.ticket.count();
  console.log(`Tickets in database: ${count}`);
  if (count !== 50) throw new Error(`Expected 50 tickets but found ${count}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());