import { prisma } from '../client';

jest.setTimeout(60000);

afterAll(async () => {
  await prisma.$disconnect();
});
