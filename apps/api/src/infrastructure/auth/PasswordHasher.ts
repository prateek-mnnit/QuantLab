import bcrypt from 'bcrypt';

/**
 * bcrypt: a well-established, deliberately slow password hashing algorithm
 * (built on the Blowfish cipher) that has been an industry-standard choice
 * for over two decades and remains one of the two most commonly recommended
 * algorithms for password storage today (alongside the newer argon2). Unlike
 * a fast general-purpose hash (e.g. SHA-256, MD5), bcrypt is intentionally
 * expensive to compute, which is what makes brute-forcing a stolen password
 * database slow enough to be impractical. It also salts automatically -
 * `bcrypt.hash` generates and embeds a random salt into its output, so two
 * users with the same password never produce the same hash.
 *
 * SALT_ROUNDS controls how expensive each hash is (each +1 roughly doubles
 * the work). 12 is a commonly recommended baseline in 2026 - high enough to
 * be meaningfully slow for an attacker, low enough not to noticeably delay
 * a real login request.
 *
 * Wrapped in its own class (rather than calling `bcrypt.hash` directly from
 * use cases) so the specific hashing library is an infrastructure detail -
 * swapping algorithms later only touches this one file, and use cases like
 * RegisterUseCase/LoginUseCase depend on this class's interface, not on
 * bcrypt itself.
 */
const SALT_ROUNDS = 12;

export class PasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
  }

  async verify(hash: string, plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hash);
  }
}
