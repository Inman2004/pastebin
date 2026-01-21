import fs from 'fs';
import path from 'path';
import { Pool, PoolConfig } from 'pg';

export interface Paste {
  id: string;
  content: string;
  max_views?: number; // Optional
  views: number;      // Current view count
  created_at: number;
  expires_at?: number; // Optional timestamp
}

export interface CreatePasteParams {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export interface PasteStore {
  createPaste(params: CreatePasteParams): Promise<string>;
  getPaste(id: string): Promise<Paste | null>;
  incrementView(id: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Note: Redis implementation removed. This project is configured to use
// PostgreSQL (NeonDB) as the canonical persistence layer.

// --- Postgres Implementation ---
class PostgresPasteStore implements PasteStore {
  private pool: Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    // Neon and most cloud Postgres require SSL.
    // We enable it if the host looks like a remote host (not localhost/127.0.0.1).
    // Or simpler: connection string from Neon usually has sslmode=require, but pg client needs explicit config sometimes.
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    const config: PoolConfig = {
      connectionString,
    };

    if (!isLocal) {
      config.ssl = {
        rejectUnauthorized: false // Often needed for managed databases to avoid CA issues
      };
    }

    this.pool = new Pool(config);
    this.ready = this.init();
  }

  private async init() {
    const query = `
      CREATE TABLE IF NOT EXISTS pastes (
        id VARCHAR(50) PRIMARY KEY,
        content TEXT NOT NULL,
        max_views INT,
        views INT DEFAULT 0,
        created_at BIGINT NOT NULL,
        expires_at BIGINT
      );
    `;
    try {
      await this.pool.query(query);
    } catch (e) {
      console.error("Failed to initialize Postgres table", e);
    }
  }

  async createPaste(params: CreatePasteParams): Promise<string> {
    await this.ready;
    const { nanoid } = await import('nanoid');
    const id = nanoid(10);
    const now = Date.now();

    let expires_at = null;
    if (params.ttl_seconds !== undefined) {
      expires_at = now + params.ttl_seconds * 1000;
    }

    const query = `
      INSERT INTO pastes (id, content, max_views, views, created_at, expires_at)
      VALUES ($1, $2, $3, 0, $4, $5)
    `;

    await this.pool.query(query, [
      id,
      params.content,
      params.max_views ?? null,
      now,
      expires_at
    ]);

    return id;
  }

  async getPaste(id: string): Promise<Paste | null> {
    await this.ready;
    const res = await this.pool.query('SELECT * FROM pastes WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];

    return {
      id: row.id,
      content: row.content,
      max_views: row.max_views !== null ? parseInt(row.max_views) : undefined,
      views: parseInt(row.views),
      created_at: parseInt(row.created_at),
      expires_at: row.expires_at !== null ? parseInt(row.expires_at) : undefined,
    };
  }

  async incrementView(id: string): Promise<void> {
    await this.ready;
    await this.pool.query('UPDATE pastes SET views = views + 1 WHERE id = $1', [id]);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (e) {
      return false;
    }
  }
}

// --- File System Implementation (Fallback) ---
class FilePasteStore implements PasteStore {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'pastes.json');
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  private readData(): Record<string, Paste> {
    try {
      if (!fs.existsSync(this.filePath)) return {};
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '{}');
    } catch (e) {
      return {};
    }
  }

  private writeData(data: Record<string, Paste>) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async createPaste(params: CreatePasteParams): Promise<string> {
    const { nanoid } = await import('nanoid');
    const id = nanoid(10);
    const now = Date.now();

    const paste: Paste = {
      id,
      content: params.content,
      views: 0,
      created_at: now,
    };

    if (params.max_views !== undefined) {
      paste.max_views = params.max_views;
    }

    if (params.ttl_seconds !== undefined) {
      paste.expires_at = now + params.ttl_seconds * 1000;
    }

    const data = this.readData();
    data[id] = paste;
    this.writeData(data);
    return id;
  }

  async getPaste(id: string): Promise<Paste | null> {
    const data = this.readData();
    const paste = data[id];
    if (!paste) return null;

    if (paste.expires_at && Date.now() > paste.expires_at) {
      delete data[id];
      this.writeData(data);
      return null;
    }

    return { ...paste };
  }

  async incrementView(id: string): Promise<void> {
    const data = this.readData();
    const paste = data[id];
    if (paste) {
      paste.views += 1;
      this.writeData(data);
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// --- Factory ---

let storeInstance: PasteStore;

export function getStore(): PasteStore {
  if (storeInstance) return storeInstance;
  if (process.env.DATABASE_URL) {
    storeInstance = new PostgresPasteStore(process.env.DATABASE_URL);
  } else {
    // Require NeonDB/Postgres for persistence. Redis support has been removed.
    throw new Error(
      'No persistent store configured. Set DATABASE_URL to use NeonDB/Postgres.'
    );
  }
  return storeInstance;
}
