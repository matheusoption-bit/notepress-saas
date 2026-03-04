import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function ensureUser(clerkId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((address) => address.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

  return prisma.user.upsert({
    where: { clerkId },
    update: { email, name, imageUrl: clerkUser.imageUrl ?? null },
    create: { clerkId, email, name, imageUrl: clerkUser.imageUrl ?? null },
  });
}
