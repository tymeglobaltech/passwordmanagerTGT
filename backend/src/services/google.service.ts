import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ALLOWED_SSO_DOMAIN = process.env.ALLOWED_SSO_DOMAIN || 'tymeglobal.com';

interface GoogleTokenPayload {
  email: string;
  name: string;
  googleId: string;
}

export class GoogleAuthService {
  private static client = new OAuth2Client(GOOGLE_CLIENT_ID);

  /**
   * Verify a Google ID token and extract user info.
   * Validates the token signature, audience, and email domain.
   */
  static async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token: missing payload or email');
    }

    // Validate email domain
    const domain = payload.email.split('@')[1];
    if (domain !== ALLOWED_SSO_DOMAIN) {
      throw new Error(`Only @${ALLOWED_SSO_DOMAIN} accounts are allowed`);
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      googleId: payload.sub,
    };
  }
}
