type AuthUser = {
  id: string;
  role: Role;
  email: string | null;
  name: string | null;
  username: string;
  onboardingStatus: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  trialEndsAt: Date | null;
};
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from './prisma';
import { verifyPassword } from './passwords';

const credentialsSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  basePath: '/api/auth',
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const identifier = parsed.data.identifier.trim().toLowerCase();
        const { password } = parsed.data;
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
          include: { profile: true },
        });

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
          return null;
        }

        // Check if trial has expired and update status
        let subscriptionStatus = (user as any).subscriptionStatus || 'NONE';
        if (
          subscriptionStatus === 'TRIAL_ACTIVE' &&
          (user as any).trialEndsAt &&
          new Date((user as any).trialEndsAt) < new Date()
        ) {
          subscriptionStatus = 'TRIAL_EXPIRED';
          // Update the database
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'TRIAL_EXPIRED' },
          });
        }

        const authUser: AuthUser = {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
          username: user.username,
          onboardingStatus: (user as any).onboardingStatus || 'PENDING',
          subscriptionStatus,
          subscriptionTier: (user as any).subscriptionTier || 'FREE',
          trialEndsAt: (user as any).trialEndsAt || null,
        };

        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.userId = authUser.id;
        token.role = authUser.role;
        token.username = authUser.username;
        token.onboardingStatus = authUser.onboardingStatus;
        token.subscriptionStatus = authUser.subscriptionStatus;
        token.subscriptionTier = authUser.subscriptionTier;
        token.trialEndsAt = authUser.trialEndsAt;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = typeof token.userId === 'string' ? token.userId : undefined;
      const role = typeof token.role === 'string' ? (token.role as Role) : undefined;
      const username = typeof token.username === 'string' ? token.username : undefined;
      const onboardingStatus =
        typeof token.onboardingStatus === 'string' ? token.onboardingStatus : 'PENDING';
      const subscriptionStatus =
        typeof token.subscriptionStatus === 'string' ? token.subscriptionStatus : 'NONE';
      const subscriptionTier =
        typeof token.subscriptionTier === 'string' ? token.subscriptionTier : 'FREE';
      const trialEndsAt = token.trialEndsAt as Date | null;

      if (session.user && userId && role && username) {
        session.user.id = userId;
        session.user.role = role;
        session.user.username = username;
        (session.user as any).onboardingStatus = onboardingStatus;
        (session.user as any).subscriptionStatus = subscriptionStatus;
        (session.user as any).subscriptionTier = subscriptionTier;
        (session.user as any).trialEndsAt = trialEndsAt;
      }
      return session;
    },
  },
});
