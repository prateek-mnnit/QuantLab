import type { RefreshToken, User } from '@prisma/client';
import type { IUserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import type { IRefreshTokenRepository } from '../../infrastructure/persistence/repositories/RefreshTokenRepository.js';

/**
 * In-memory fakes for every dependency the auth use cases take - not
 * mocks (no assertion-on-call-count trickery), just minimal working
 * implementations of the same interfaces the real infrastructure classes
 * satisfy. This is the concrete payoff of depending on IUserRepository /
 * IRefreshTokenRepository rather than the concrete Prisma-backed classes:
 * every auth use case can be exercised with zero database, zero real
 * password hashing, and zero real JWT signing, while still running the
 * exact same business logic a real request would.
 */
export class FakeUserRepository implements IUserRepository {
  private readonly users: User[] = [];
  private idCounter = 0;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    this.idCounter += 1;
    const user: User = {
      id: `user-${this.idCounter}`,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
}

export class FakeRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokens: RefreshToken[] = [];
  private idCounter = 0;

  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
    this.idCounter += 1;
    const token: RefreshToken = {
      id: `token-${this.idCounter}`,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.tokens.push(token);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.tokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string): Promise<RefreshToken> {
    const token = this.tokens.find((candidate) => candidate.id === id);
    if (!token) {
      throw new Error(`FakeRefreshTokenRepository: no token with id "${id}"`);
    }
    token.revokedAt = new Date();
    return token;
  }

  async revokeAllForUser(userId: string): Promise<{ count: number }> {
    let count = 0;
    for (const token of this.tokens) {
      if (token.userId === userId && !token.revokedAt) {
        token.revokedAt = new Date();
        count += 1;
      }
    }
    return { count };
  }
}

/** Deterministic stand-in for PasswordHasher - never touches real bcrypt in a test. */
export class FakePasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return `hashed:${plainTextPassword}`;
  }

  async verify(hash: string, plainTextPassword: string): Promise<boolean> {
    return hash === `hashed:${plainTextPassword}`;
  }
}

/** Deterministic stand-in for TokenService - never signs a real JWT in a test. */
export class FakeTokenService {
  private refreshTokenCounter = 0;

  signAccessToken(payload: { userId: string }): string {
    return `access-token-for-${payload.userId}`;
  }

  verifyAccessToken(token: string): { userId: string } {
    const match = /^access-token-for-(.+)$/.exec(token);
    if (!match) {
      throw new Error('FakeTokenService: invalid access token');
    }
    return { userId: match[1]! };
  }

  generateRefreshToken(): string {
    this.refreshTokenCounter += 1;
    return `refresh-token-${this.refreshTokenCounter}`;
  }

  hashRefreshToken(rawToken: string): string {
    return `hashed:${rawToken}`;
  }

  getRefreshTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  }
}
