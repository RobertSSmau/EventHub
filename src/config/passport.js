import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';
import { generateToken } from '../utils/token.js';

// Check if Google credentials are configured
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

// Configure Passport 
const googleStrategy = new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
},
async (accessToken, refreshToken, profile, done) => {
  console.log('Google OAuth callback received:', { profileId: profile.id, email: profile.emails[0].value });
  try {
    let user = await User.findOne({ where: { google_id: profile.id } });

    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    const existingUser = await User.findOne({ where: { email: profile.emails[0].value } });

    if (existingUser) {
      // Link Google account to existing user
      await existingUser.update({
        google_id: profile.id,
        provider: 'google',
        email_verified: true // OAuth users are pre-verified
      });
      return done(null, existingUser);
    }

    // Create new user
    const newUser = await User.create({
      username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 8), // Generate unique username
      email: profile.emails[0].value,
      google_id: profile.id,
      provider: 'google',
      email_verified: true, // OAuth users are pre-verified
      password_hash: null // No password for OAuth users
    });

    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(googleStrategy);
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;