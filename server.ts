import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Simple SQLite DB for user profiles
const db = new Database('vitas.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    profile TEXT
  );
`);

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "super-secret-key-for-dev";

// Middleware to check auth
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as { email: string };
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 3. Get Profile
app.get("/api/profile", requireAuth, (req, res) => {
  const email = (req as any).user.email;
  const row = db.prepare('SELECT profile FROM users WHERE email = ?').get(email) as any;
  
  if (row) {
    res.json({ profile: JSON.parse(row.profile), email });
  } else {
    res.json({ profile: null, email });
  }
});

// 4. Update Profile
app.post("/api/profile", requireAuth, (req, res) => {
  const email = (req as any).user.email;
  const { profile } = req.body;
  
  db.prepare('INSERT INTO users (email, profile) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET profile = excluded.profile')
    .run(email, JSON.stringify(profile));
    
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
