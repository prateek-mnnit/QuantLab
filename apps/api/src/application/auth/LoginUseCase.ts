import type { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import type { RefreshTokenRepository } from '../../infrastructure/persistence/repositories/RefreshTokenRepository.js';
import type { PasswordHasher } from '../../infrastructure/auth/PasswordHasher.js';
import type { TokenService } from '../../infrastructure/auth/TokenService.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { AuthUser } from '@quantlab/shared-types';

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  /** The raw (unhashed) refresh token - the controller sets this as an httpOnly cookie, never returned in the JSON body. */
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: { email: string; password: string }): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);

    // Deliberately identical error/message for "no such user" and "wrong
    // password" - distinguishing them would let an attacker enumerate
    // which emails have accounts by watching which error comes back.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isPasswordValid = await this.passwordHasher.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const accessToken = this.tokenService.signAccessToken({ userId: user.id });
    const refreshToken = this.tokenService.generateRefreshToken();

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
    });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
}