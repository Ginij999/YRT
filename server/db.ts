import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { CollectionName, MongooseModels } from './models.ts';

type FilterQuery = Record<string, unknown>;
type SortSpec = Record<string, 1 | -1>;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cms-db.json');

type LocalStoreData = Record<CollectionName, Record<string, unknown>[]>;

let useMongo = false;
let lastMongoError: string | null = null;
let localStore: LocalStoreData | null = null;

function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function ensureLocalStore(): LocalStoreData {
  if (localStore) return localStore;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      localStore = JSON.parse(raw) as LocalStoreData;
    } catch {
      localStore = createEmptyStore();
    }
  } else {
    localStore = createEmptyStore();
    persistLocalStore();
  }
  // Ensure every collection key exists
  const empty = createEmptyStore();
  for (const key of Object.keys(empty) as CollectionName[]) {
    if (!Array.isArray(localStore[key])) {
      localStore[key] = [];
    }
  }
  return localStore;
}

function createEmptyStore(): LocalStoreData {
  return {
    users: [],
    admin_users: [],
    site_settings: [],
    themes: [],
    pages: [],
    page_sections: [],
    services: [],
    portfolio: [],
    events: [],
    staff: [],
    departments: [],
    job_positions: [],
    job_applications: [],
    blog_posts: [],
    blog_categories: [],
    testimonials: [],
    partners: [],
    contact_messages: [],
    media: [],
    navigation: [],
    seo_metadata: [],
    activity_logs: [],
    sticky_notes: [],
    reviews: [],
  };
}

function persistLocalStore() {
  if (!localStore) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(localStore, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function matchesFilter(doc: Record<string, unknown>, filter: FilterQuery): boolean {
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(expected)) {
      const anyMatch = expected.some((sub) => matchesFilter(doc, sub as FilterQuery));
      if (!anyMatch) return false;
      continue;
    }
    const actual = doc[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      const ops = expected as Record<string, unknown>;
      if ('$in' in ops && Array.isArray(ops.$in)) {
        if (!ops.$in.includes(actual)) return false;
      }
      if ('$ne' in ops) {
        if (actual === ops.$ne) return false;
      }
      if ('$regex' in ops) {
        const re = new RegExp(String(ops.$regex), String(ops.$options || 'i'));
        if (!re.test(String(actual ?? ''))) return false;
      }
      continue;
    }
    if (actual !== expected) return false;
  }
  return true;
}

function sortDocs(docs: Record<string, unknown>[], sort?: SortSpec): Record<string, unknown>[] {
  if (!sort) return docs;
  const entries = Object.entries(sort);
  if (entries.length === 0) return docs;
  return [...docs].sort((a, b) => {
    for (const [field, dir] of entries) {
      const va = a[field];
      const vb = b[field];
      if (va === vb) continue;
      if (va === undefined || va === null) return 1;
      if (vb === undefined || vb === null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    }
    return 0;
  });
}

export async function connectDatabase(): Promise<{ mode: 'mongodb' | 'local'; error?: string }> {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    try {
      if (mongoose.connection.readyState === 1) {
        useMongo = true;
        lastMongoError = null;
        return { mode: 'mongodb' };
      }
      await mongoose.connect(uri, {
        dbName: 'yrt_esports',
        serverSelectionTimeoutMS: 3500,
        connectTimeoutMS: 3500,
        family: 4,
      });
      useMongo = true;
      lastMongoError = null;
      console.log('[DB] Connected to MongoDB Atlas (db: yrt_esports)');
      return { mode: 'mongodb' };
    } catch (err) {
      lastMongoError = (err as Error).message;
      await mongoose.disconnect().catch(() => {});
      console.log('[DB] MongoDB Atlas unavailable; using persistent local store (/data/cms-db.json).');
    }
  }
  ensureLocalStore();
  useMongo = false;
  console.log('[DB] Persistent local Mongo-compatible store active at /data/cms-db.json');
  return { mode: 'local', error: lastMongoError || undefined };
}

export function isMongoConnected(): boolean {
  return useMongo;
}

export function getDatabaseInfo(): { mode: 'mongodb' | 'local'; lastError: string | null } {
  return {
    mode: useMongo ? 'mongodb' : 'local',
    lastError: lastMongoError,
  };
}

export class CollectionRepo<T extends Record<string, any> = Record<string, any>> {
  private name: CollectionName;

  constructor(name: CollectionName) {
    this.name = name;
  }

  async find(filter: FilterQuery = {}, options?: { sort?: SortSpec; limit?: number }): Promise<T[]> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      let query = model.find(filter);
      if (options?.sort) query = query.sort(options.sort);
      if (options?.limit) query = query.limit(options.limit);
      const docs = await query.lean();
      return docs.map((d: any) => ({ ...d, _id: String(d._id) })) as T[];
    }
    const store = ensureLocalStore();
    let list = store[this.name].filter((d) => matchesFilter(d, filter));
    if (options?.sort) list = sortDocs(list, options.sort);
    if (options?.limit) list = list.slice(0, options.limit);
    return structuredClone(list) as T[];
  }

  async findOne(filter: FilterQuery = {}): Promise<T | null> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const doc = await model.findOne(filter).lean();
      return doc ? ({ ...doc, _id: String((doc as any)._id) } as T) : null;
    }
    const store = ensureLocalStore();
    const found = store[this.name].find((d) => matchesFilter(d, filter));
    return found ? (structuredClone(found) as T) : null;
  }

  async findById(id: string): Promise<T | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const doc = await model.findById(id).lean();
      return doc ? ({ ...doc, _id: String((doc as any)._id) } as T) : null;
    }
    return this.findOne({ _id: id });
  }

  async create(payload: Partial<T>): Promise<T> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const created = await model.create(payload);
      const obj = created.toObject();
      return { ...obj, _id: String(obj._id) } as T;
    }
    const store = ensureLocalStore();
    const now = new Date().toISOString();
    const doc = {
      ...structuredClone(payload),
      _id: (payload as any)._id || generateObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    store[this.name].push(doc);
    persistLocalStore();
    return structuredClone(doc) as unknown as T;
  }

  async insertMany(items: Partial<T>[]): Promise<T[]> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const docs = await model.insertMany(items);
      return docs.map((d: any) => {
        const obj = d.toObject();
        return { ...obj, _id: String(obj._id) };
      }) as T[];
    }
    const results: T[] = [];
    for (const item of items) {
      results.push(await this.create(item));
    }
    return results;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    const cleanUpdate = { ...update };
    delete (cleanUpdate as any)._id;
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const updated = await model.findByIdAndUpdate(id, { $set: cleanUpdate }, { new: true }).lean();
      return updated ? ({ ...updated, _id: String((updated as any)._id) } as T) : null;
    }
    const store = ensureLocalStore();
    const idx = store[this.name].findIndex((d) => d._id === id);
    if (idx === -1) return null;
    const updated = {
      ...store[this.name][idx],
      ...structuredClone(cleanUpdate),
      updatedAt: new Date().toISOString(),
    };
    store[this.name][idx] = updated;
    persistLocalStore();
    return structuredClone(updated) as unknown as T;
  }

  async findOneAndUpdate(filter: FilterQuery, update: Partial<T>): Promise<T | null> {
    const cleanUpdate = { ...update };
    delete (cleanUpdate as any)._id;
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const updated = await model.findOneAndUpdate(filter, { $set: cleanUpdate }, { new: true }).lean();
      return updated ? ({ ...updated, _id: String((updated as any)._id) } as T) : null;
    }
    const store = ensureLocalStore();
    const idx = store[this.name].findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return null;
    const updated = {
      ...store[this.name][idx],
      ...structuredClone(cleanUpdate),
      updatedAt: new Date().toISOString(),
    };
    store[this.name][idx] = updated;
    persistLocalStore();
    return structuredClone(updated) as unknown as T;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const deleted = await model.findByIdAndDelete(id).lean();
      return deleted ? ({ ...deleted, _id: String((deleted as any)._id) } as T) : null;
    }
    const store = ensureLocalStore();
    const idx = store[this.name].findIndex((d) => d._id === id);
    if (idx === -1) return null;
    const [deleted] = store[this.name].splice(idx, 1);
    persistLocalStore();
    return structuredClone(deleted) as T;
  }

  async deleteMany(filter: FilterQuery = {}): Promise<number> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      const res = await model.deleteMany(filter);
      return res.deletedCount || 0;
    }
    const store = ensureLocalStore();
    const before = store[this.name].length;
    store[this.name] = store[this.name].filter((d) => !matchesFilter(d, filter));
    const removed = before - store[this.name].length;
    if (removed > 0) persistLocalStore();
    return removed;
  }

  async countDocuments(filter: FilterQuery = {}): Promise<number> {
    if (useMongo) {
      const model = MongooseModels[this.name] as mongoose.Model<any>;
      return model.countDocuments(filter);
    }
    const store = ensureLocalStore();
    return store[this.name].filter((d) => matchesFilter(d, filter)).length;
  }
}

export const db = {
  users: new CollectionRepo('users'),
  admin_users: new CollectionRepo('admin_users'),
  site_settings: new CollectionRepo('site_settings'),
  themes: new CollectionRepo('themes'),
  pages: new CollectionRepo('pages'),
  page_sections: new CollectionRepo('page_sections'),
  services: new CollectionRepo('services'),
  portfolio: new CollectionRepo('portfolio'),
  events: new CollectionRepo('events'),
  staff: new CollectionRepo('staff'),
  departments: new CollectionRepo('departments'),
  job_positions: new CollectionRepo('job_positions'),
  job_applications: new CollectionRepo('job_applications'),
  blog_posts: new CollectionRepo('blog_posts'),
  blog_categories: new CollectionRepo('blog_categories'),
  testimonials: new CollectionRepo('testimonials'),
  partners: new CollectionRepo('partners'),
  contact_messages: new CollectionRepo('contact_messages'),
  media: new CollectionRepo('media'),
  navigation: new CollectionRepo('navigation'),
  seo_metadata: new CollectionRepo('seo_metadata'),
  activity_logs: new CollectionRepo('activity_logs'),
  sticky_notes: new CollectionRepo('sticky_notes'),
  reviews: new CollectionRepo('reviews'),
};
