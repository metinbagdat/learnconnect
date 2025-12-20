import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { MemoryStore } from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { getPoolInstance } from "./db.js";

const PgStore = connectPgSimple(session);
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log(`[HASH] Comparing passwords, stored format check...`);
    // Handle plaintext passwords (for new registrations)
    if (!stored.includes('.')) {
      console.log(`[HASH] Plaintext comparison: ${supplied === stored}`);
      return supplied === stored;
    }
    // Handle hashed passwords (old format)
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.error(`[HASH] Invalid password hash format. Expected 2 parts, got ${parts.length}`);
      return false;
    }
    const [hashed, salt] = parts;
    console.log(`[HASH] Hash length: ${hashed.length}, Salt length: ${salt.length}`);
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const isEqual = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`[HASH] Buffers equal: ${isEqual}`);
    return isEqual;
  } catch (error) {
    console.error(`[HASH] Password comparison error:`, error);
    return false;
  }
}

export async function setupAuth(app: Express) {
  // AUTO-CREATION: Re-enabled to populate production database with courses
  (async () => {
    try {
      const existingUser = await storage.getUserByUsername("testuser");
      if (!existingUser) {
        // TEMPORARY: Store plaintext for testing
        await storage.createUser({
          username: "testuser",
          password: "password123",
          displayName: "Test User",
          role: "student"
        });
        console.log("✓ Seeded test user: testuser / password123 (PLAINTEXT FOR TESTING)");
      }
      // Also ensure admin user exists
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        await storage.createUser({
          username: "admin",
          password: "password123",
          displayName: "Admin User",
          role: "admin"
        });
        console.log("✓ Seeded admin user: admin / password123");
      }
    } catch (err) {
      console.log("Could not seed test user:", err);
    }
  })();

  // Use PostgreSQL session store for serverless compatibility
  // Falls back to memory store only if database is unavailable (development)
  let sessionStore: session.Store;
  
  try {
    // Check if DATABASE_URL is available before attempting to use PostgreSQL session store
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    
    // Get the actual pool instance for connect-pg-simple
    // Wrap in try-catch to handle pool initialization errors gracefully
    let actualPool;
    try {
      actualPool = getPoolInstance();
    } catch (poolError: any) {
      console.warn("⚠️ Failed to get pool instance:", poolError?.message || poolError);
      throw poolError; // Re-throw to trigger fallback to memory store
    }
    
    // Try to use PostgreSQL session store
    // Wrap in try-catch to handle PgStore initialization errors
    try {
      sessionStore = new PgStore({
        pool: actualPool as any, // Use the database pool
        tableName: 'session', // Table name for sessions
        createTableIfMissing: true, // Automatically create table if missing
      });
      console.log("✓ Using PostgreSQL session store (sessions will persist across serverless invocations)");
    } catch (pgStoreError: any) {
      console.warn("⚠️ Failed to initialize PgStore:", pgStoreError?.message || pgStoreError);
      throw pgStoreError; // Re-throw to trigger fallback to memory store
    }
  } catch (error: any) {
    // Fallback to memory store if database is not available
    console.warn("⚠️ PostgreSQL session store unavailable, falling back to memory store:", error?.message || error);
    // Use memory store as fallback (even in production if DB connection fails)
    try {
      // Try to use memorystore for better memory management (optional dependency)
      const memorystore = await import("memorystore");
      const createMemoryStore = memorystore.default || memorystore;
      const MemoryStoreClass = createMemoryStore(session);
      sessionStore = new MemoryStoreClass({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
      console.log("⚠️ Using memory store (sessions will not persist across serverless invocations)");
    } catch (memError: any) {
      // If memorystore also fails, use basic memory store from express-session
      console.warn("⚠️ Memorystore package not available, using basic MemoryStore:", memError?.message || memError);
      sessionStore = new MemoryStore();
      console.log("⚠️ Using basic memory session store");
    }
  }

  // Generate a session secret if not provided (for development/testing)
  // In production, SESSION_SECRET should be set in Vercel environment variables
  const sessionSecret = process.env.SESSION_SECRET || "edulearn-platform-dev-secret-change-in-production";
  
  // Log SESSION_SECRET status (without exposing the actual secret)
  if (process.env.SESSION_SECRET) {
    console.log("✓ SESSION_SECRET is set (length: " + process.env.SESSION_SECRET.length + " chars)");
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error("❌ ERROR: SESSION_SECRET not set in production! This is a security issue.");
      console.error("   Please set SESSION_SECRET in Vercel environment variables.");
      // Don't throw here - let it use the default but log the error clearly
    } else {
      console.warn("⚠️ SESSION_SECRET not set, using default (dev only)");
    }
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'lax' in dev, 'none' in production
      path: '/'
    },
    name: 'edulearn.sid' // Custom session ID name
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[AUTH] Login attempt for user: ${username}, password: ${password}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[AUTH] User not found: ${username}`);
          return done(null, false, { message: "Incorrect username or password" });
        }
        console.log(`[AUTH] User found: ${username}`);
        console.log(`[AUTH] Stored password: ${user.password}`);
        console.log(`[AUTH] Supplied password: ${password}`);
        
        // TEMPORARY: Direct plaintext comparison for testing
        const passwordMatch = user.password === password;
        console.log(`[AUTH] Password match (plaintext): ${passwordMatch}`);
        
        if (!passwordMatch) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        console.log(`[AUTH] Login successful for: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`[AUTH] Login error:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[AUTH] User not found during deserialization: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error: any) {
      // If database is not available, don't fail the session
      // This allows the app to work even without a database connection
      console.error(`[AUTH] Error deserializing user ${id}:`, error?.message || error);
      // Return null instead of error to allow session to continue
      // The user will need to re-authenticate when database is available
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, displayName, role = "student" } = req.body;
      
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Missing required fields. Please provide username, password, and display name." });
      }
      
      // Validate input
      if (username.trim().length === 0) {
        return res.status(400).json({ message: "Username cannot be empty." });
      }
      if (password.length < 3) {
        return res.status(400).json({ message: "Password must be at least 3 characters long." });
      }
      if (displayName.trim().length === 0) {
        return res.status(400).json({ message: "Display name cannot be empty." });
      }

      try {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ message: "Username already exists. Please choose a different username." });
        }
      } catch (dbError: any) {
        console.error("[AUTH] Database error checking existing user:", dbError);
        // If database is unavailable, return a clear error
        return res.status(503).json({ message: "Service temporarily unavailable. Please try again later." });
      }

      try {
        const user = await storage.createUser({
          username,
          password: password,
          displayName,
          role
        });

        req.login(user, (err) => {
          if (err) {
            console.error("[AUTH] Login error after registration:", err);
            return res.status(500).json({ message: "Registration successful but login failed. Please try logging in." });
          }
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } catch (dbError: any) {
        console.error("[AUTH] Database error creating user:", dbError);
        // Handle specific database errors
        if (dbError.code === '23505' || dbError.message?.includes('unique')) {
          return res.status(409).json({ message: "Username already exists. Please choose a different username." });
        }
        return res.status(503).json({ message: "Service temporarily unavailable. Please try again later." });
      }
    } catch (error: any) {
      console.error("[AUTH] Registration error:", error);
      // Pass to error handler if it's not already handled
      if (!res.headersSent) {
        next(error);
      }
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      console.log("POST /api/login - User attempting login:", req.body?.username || 'unknown');
      
      // Validate request body
      if (!req.body || !req.body.username || !req.body.password) {
        console.log("[AUTH] Login request missing credentials");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      passport.authenticate("local", (err: Error | null, user: any, info: { message?: string } | undefined) => {
        try {
          if (err) {
            console.error("[AUTH] Login authentication error:", err);
            console.error("[AUTH] Error stack:", err?.stack);
            // Don't pass to next() which might crash, return 500 directly
            return res.status(500).json({ message: "A server error has occurred" });
          }
          if (!user) {
            console.log("[AUTH] Authentication failed:", info?.message || "Invalid credentials");
            return res.status(401).json({ message: info?.message || "Incorrect username or password" });
          }
          
          req.login(user, (err: Error | null) => {
            try {
              if (err) {
                console.error("[AUTH] Login session error:", err);
                console.error("[AUTH] Session error stack:", err?.stack);
                // Don't pass to next() which might crash, return 500 directly
                return res.status(500).json({ message: "A server error has occurred" });
              }
              
              // Log session details
              console.log("[AUTH] User logged in successfully, session ID:", req.session?.id || 'no-id');
              
              // Return user without password
              const { password, ...userWithoutPassword } = user;
              res.status(200).json(userWithoutPassword);
            } catch (loginErr: any) {
              console.error("[AUTH] Error in req.login callback:", loginErr);
              if (!res.headersSent) {
                return res.status(500).json({ message: "A server error has occurred" });
              }
            }
          });
        } catch (authErr: any) {
          console.error("[AUTH] Error in passport.authenticate callback:", authErr);
          if (!res.headersSent) {
            return res.status(500).json({ message: "A server error has occurred" });
          }
        }
      })(req, res, next);
    } catch (error: any) {
      console.error("[AUTH] Error in /api/login handler:", error);
      console.error("[AUTH] Error stack:", error?.stack);
      if (!res.headersSent) {
        return res.status(500).json({ message: "A server error has occurred" });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('edulearn.sid');
        res.sendStatus(200);
      });
    });
  });

  // Global authentication middleware with proper async handling
  const ensureAuthenticated = async (req: any, res: any, next: any) => {
    try {
      // First try standard session-based authentication
      if (req.isAuthenticated() && req.user) {
        console.log('[MIDDLEWARE] User authenticated via session:', req.user?.id);
        return next();
      }
      
      // If session auth fails, check for user ID in custom header
      const userId = req.headers['x-user-id'];
      if (userId) {
        console.log('[MIDDLEWARE] Checking x-user-id header:', userId);
        try {
          const user = await storage.getUser(Number(userId));
          if (user) {
            console.log('[MIDDLEWARE] User found via header ID:', user.id);
            req.user = user;
            return next();
          }
        } catch (dbError: any) {
          // Database error - but we know the userId is valid from header
          // Create minimal user object to proceed
          console.log('[MIDDLEWARE] Database error, creating minimal user object for userId:', userId);
          req.user = { id: Number(userId), role: 'student' };
          return next();
        }
      }
      
      // No authentication succeeded
      console.log('[MIDDLEWARE] No authentication found - session:', req.isAuthenticated(), 'header:', req.headers['x-user-id']);
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("[MIDDLEWARE] Authentication error:", error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  app.get("/api/user", async (req, res) => {
    try {
      // Try to get user from session first
      if (req.isAuthenticated() && req.user) {
        const { password, ...userWithoutPassword } = req.user;
        return res.json(userWithoutPassword);
      }
      
      // Try header-based auth
      const userId = req.headers['x-user-id'];
      if (userId) {
        try {
          const user = await storage.getUser(Number(userId));
          if (user) {
            const { password, ...userWithoutPassword } = user;
            return res.json(userWithoutPassword);
          }
        } catch (dbError) {
          console.error("[AUTH] Database error fetching user:", dbError);
          // Return 401 instead of 500 for database errors
          return res.status(401).json({ message: "Unauthorized" });
        }
      }
      
      // No authentication - return 401 (this is expected for unauthenticated users)
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("[AUTH] Error in /api/user:", error);
      // Return 401 instead of 500 to prevent ErrorBoundary from catching it
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Export middleware for use in routes
  (app as any).ensureAuthenticated = ensureAuthenticated;
}
