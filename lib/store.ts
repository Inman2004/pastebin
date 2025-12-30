import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

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

// --- Redis Implementation ---
class RedisPasteStore implements PasteStore {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url);
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

    const stringified = JSON.stringify(paste);

    if (params.ttl_seconds) {
      await this.redis.set(id, stringified, 'EX', params.ttl_seconds);
    } else {
      await this.redis.set(id, stringified);
    }

    return id;
  }

  async getPaste(id: string): Promise<Paste | null> {
    const data = await this.redis.get(id);
    if (!data) return null;
    return JSON.parse(data);
  }

  async incrementView(id: string): Promise<void> {
    const session = this.redis;
    try {
      await session.watch(id);
      const data = await session.get(id);
      if (!data) {
        await session.unwatch();
        return;
      }
      const paste: Paste = JSON.parse(data);
      paste.views += 1;

      const multi = session.multi();
      multi.set(id, JSON.stringify(paste), 'KEEPTTL');
      const results = await multi.exec();

      if (!results) {
        // Recursive retry on conflict
        await this.incrementView(id);
      }
    } catch (e) {
      console.error("Error incrementing view", e);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (e) {
      return false;
    }
  }
}

// --- File System Implementation (Fallback for Local Dev) ---
// Using a file allows state to persist across hot-reloads and worker threads in Dev.
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

    // Check expiration logic
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

  if (process.env.REDIS_URL) {
    // console.log("Using Redis persistence");
    storeInstance = new RedisPasteStore(process.env.REDIS_URL);
  } else {
    // console.warn("No REDIS_URL found. Using File persistence.");
    storeInstance = new FilePasteStore();
  }
  return storeInstance;
}
