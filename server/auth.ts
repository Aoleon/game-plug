import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

/**
 * Session configuration for local authentication
 * No more Replit OAuth - only local GM authentication
 */
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

/**
 * Setup simplified authentication middleware
 * Only uses session-based local auth
 */
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

/**
 * Authentication middleware for protected routes
 * Checks for local session only
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for local session
  const localUser = (req.session as any)?.user;

  if (localUser && localUser.authType === 'local') {
    // Set user data for route handlers
    req.user = {
      id: localUser.id,
      email: localUser.email,
      authType: 'local'
    };
    return next();
  }

  // No valid session found
  return res.status(401).json({ message: "Non authentifié" });
};
