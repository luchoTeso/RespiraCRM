import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'NOT_CONFIGURED',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'NOT_CONFIGURED',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
      // La app usa JWT stateless — no hay session para almacenar el state CSRF.
      // Deshabilitarlo evita que Passport falle al intentar req.session.state.
      state: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google profile sin email'), undefined);
    }

    const user: GoogleUserProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, user);
  }
}
