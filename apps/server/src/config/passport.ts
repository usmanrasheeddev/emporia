// ═══════════════════════════════════════════════════════════════
// Passport.js OAuth Strategies — Google & GitHub
// ═══════════════════════════════════════════════════════════════

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from './env';
import { prisma } from './database';
import { logger } from '../utils/logger';

export interface OAuthProfile {
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Find or create a user from an OAuth profile.
 * If user exists with same email, link the OAuth provider.
 * If new, create a verified user account.
 */
async function findOrCreateOAuthUser(profile: OAuthProfile) {
  // Check if user exists by provider ID
  let user = await prisma.user.findFirst({
    where: {
      provider: profile.provider,
      providerId: profile.providerId,
      deletedAt: null,
    },
  });

  if (user) return user;

  // Check if user exists by email (link accounts)
  user = await prisma.user.findFirst({
    where: { email: profile.email, deletedAt: null },
  });

  if (user) {
    // Link OAuth provider to existing account
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: user.avatar || profile.avatar,
        isVerified: true,
      },
    });
    return user;
  }

  // Create new user
  user = await prisma.user.create({
    data: {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      provider: profile.provider,
      providerId: profile.providerId,
      isVerified: true,
      role: 'CUSTOMER',
    },
  });

  // Create default wallet for new user
  await prisma.wallet.create({
    data: { userId: user.id, balance: 0 },
  });

  // Create default wishlist
  await prisma.wishlist.create({
    data: { userId: user.id, name: 'My Wishlist', isDefault: true },
  });

  return user;
}

/** Initialize Passport strategies */
export function initializePassport(): void {
  // ─── Google OAuth 2.0 ────────────────────────────────────
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email provided by Google'), undefined);
            }

            const oauthProfile: OAuthProfile = {
              provider: 'GOOGLE',
              providerId: profile.id,
              email,
              firstName: profile.name?.givenName || 'User',
              lastName: profile.name?.familyName || '',
              avatar: profile.photos?.[0]?.value,
            };

            const user = await findOrCreateOAuthUser(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('Google OAuth error:', error);
            done(error as Error, undefined);
          }
        }
      )
    );
    logger.info('✅ Google OAuth strategy initialized');
  }

  // ─── GitHub OAuth ────────────────────────────────────────
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          callbackURL: env.GITHUB_CALLBACK_URL,
          scope: ['user:email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: any,
          done: (error: Error | null, user?: any) => void
        ) => {
          try {
            const email =
              profile.emails?.[0]?.value || `${profile.username}@github.local`;

            const nameParts = (profile.displayName || profile.username || 'User').split(' ');

            const oauthProfile: OAuthProfile = {
              provider: 'GITHUB',
              providerId: String(profile.id),
              email,
              firstName: nameParts[0] || 'User',
              lastName: nameParts.slice(1).join(' ') || '',
              avatar: profile.photos?.[0]?.value,
            };

            const user = await findOrCreateOAuthUser(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('GitHub OAuth error:', error);
            done(error as Error, undefined);
          }
        }
      )
    );
    logger.info('✅ GitHub OAuth strategy initialized');
  }

  // Serialize/deserialize (we use JWT, so these are minimal)
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
