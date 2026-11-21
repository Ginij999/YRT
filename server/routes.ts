import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { connectDatabase, db, getDatabaseInfo, isMongoConnected } from './db.ts';
import { seedDatabase } from './seed.ts';
import {
  AuthenticatedRequest,
  hashPassword,
  requireAdminAuth,
  requireRoles,
  signAdminToken,
  verifyAdminToken,
  verifyPassword,
  extractToken,
} from './auth.ts';

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME
);

function resolveUploadsDir(): string {
  if (!IS_SERVERLESS) {
    const localUploads = path.resolve(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(localUploads)) fs.mkdirSync(localUploads, { recursive: true });
      fs.accessSync(localUploads, fs.constants.W_OK);
      return localUploads;
    } catch {
      // Fall back to /tmp if read-only
    }
  }
  return path.join(os.tmpdir(), 'yrt-uploads');
}

const UPLOADS_DIR = resolveUploadsDir();
const MEDIA_DIR = path.join(UPLOADS_DIR, 'media');
const CVS_DIR = path.join(UPLOADS_DIR, 'cvs');

function ensureUploadDirs() {
  try {
    [UPLOADS_DIR, MEDIA_DIR, CVS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  } catch (err) {
    console.warn('[Uploads] Directory setup warning:', (err as Error).message);
  }
}
ensureUploadDirs();

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, MEDIA_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirs();
    cb(null, CVS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function logActivity(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityTitle: string,
  details = ''
) {
  if (!req.admin) return;
  try {
    await db.activity_logs.create({
      adminEmail: req.admin.email,
      adminName: req.admin.name,
      action,
      entityType,
      entityTitle,
      details,
    });
  } catch {
    // Non-blocking audit log
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } | null {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
  let apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';

  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(cloudinaryUrl);
      if (!apiKey && parsed.username) apiKey = decodeURIComponent(parsed.username);
      if (!apiSecret && parsed.password) apiSecret = decodeURIComponent(parsed.password);
      if (!cloudName && parsed.hostname) cloudName = parsed.hostname;
    } catch {
      // Ignore malformed CLOUDINARY_URL
    }
  }

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}

async function uploadToCloudinaryIfConfigured(
  file: Express.Multer.File,
  folder: string
): Promise<string | null> {
  const config = resolveCloudinaryConfig();
  if (!config) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const safeFolder = `yrt-esports/${folder.replace(/[^a-zA-Z0-9_-]/g, '_') || 'general'}`;
    const signaturePayload = `folder=${safeFolder}&timestamp=${timestamp}${config.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const buffer = await fs.promises.readFile(file.path);
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: file.mimetype || 'application/octet-stream' }), file.originalname);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', safeFolder);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as { secure_url?: string };
    if (result.secure_url) {
      fs.promises.unlink(file.path).catch(() => {});
      return result.secure_url;
    }
    return null;
  } catch {
    return null;
  }
}

export function registerRoutes(app: express.Express) {
  // Serve uploaded files safely
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Sample PDF download for seeded applicant
  app.get('/api/public/sample-cv', (_req, res) => {
    const samplePdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 96 >> stream
BT /F1 16 Tf 72 720 Td (YRT Esports Candidate Resume Sample) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000387 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
455
%%EOF`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Candidate_Resume_Sample.pdf"');
    res.send(Buffer.from(samplePdf));
  });

  // Dynamic SEO Sitemap & Robots
  app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const [pages, services, portfolio, events, posts] = await Promise.all([
      db.pages.find({ status: 'published' }),
      db.services.find({ status: 'published' }),
      db.portfolio.find({ status: 'published' }),
      db.events.find({}),
      db.blog_posts.find({ status: 'published' }),
    ]);

    const urls: string[] = [];
    pages.forEach((p: any) => {
      const route = p.slug === 'home' ? '/' : `/${p.slug}`;
      urls.push(`${baseUrl}${route}`);
    });
    services.forEach((s: any) => urls.push(`${baseUrl}/services/${s.slug}`));
    portfolio.forEach((p: any) => urls.push(`${baseUrl}/portfolio?project=${p.slug}`));
    events.forEach((e: any) => urls.push(`${baseUrl}/events?event=${e.slug}`));
    posts.forEach((b: any) => urls.push(`${baseUrl}/blog/${b.slug}`));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  // ============================================
  // PUBLIC API ROUTES
  // ============================================

  app.get('/api/public/bootstrap', async (_req, res) => {
    try {
      const [settingsList, themes, navigation, seo, stickyNotes] = await Promise.all([
        db.site_settings.find({}),
        db.themes.find({}),
        db.navigation.find({ visible: true }, { sort: { order: 1 } }),
        db.seo_metadata.find({}),
        db.sticky_notes.find({ visible: true }, { sort: { zIndex: 1 } }),
      ]);
      const settings = settingsList[0] || null;
      const activeTheme =
        themes.find((t: any) => t._id === settings?.activeThemeId) ||
        themes.find((t: any) => t.isDefault) ||
        themes[0] ||
        null;

      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      res.json({ settings, activeTheme, themes, navigation, seo, stickyNotes });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/public/track-visit', async (_req, res) => {
    try {
      const settingsList = await db.site_settings.find({});
      const current = settingsList[0];
      if (current) {
        await db.site_settings.findByIdAndUpdate(current._id, {
          visitorCount: (current.visitorCount || 0) + 1,
        });
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  app.get('/api/public/pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const preview = req.query.preview === 'true';
      let isAuthedAdmin = false;
      if (preview) {
        const token = extractToken(req);
        if (token && verifyAdminToken(token)) {
          isAuthedAdmin = true;
        }
      }
      const page = await db.pages.findOne({ slug });
      const filter: Record<string, unknown> = { pageSlug: slug };
      if (!isAuthedAdmin) {
        filter.enabled = true;
        filter.isDraft = false;
      }
      const sections = await db.page_sections.find(filter, { sort: { order: 1 } });
      const seo = await db.seo_metadata.findOne({ pageSlug: slug });
      res.json({ page, sections, seo, previewMode: isAuthedAdmin });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/public/services', async (_req, res) => {
    const items = await db.services.find({ status: 'published' }, { sort: { order: 1 } });
    res.json(items);
  });

  app.get('/api/public/services/:slug', async (req, res) => {
    const item = await db.services.findOne({ slug: req.params.slug, status: 'published' });
    if (!item) return res.status(404).json({ error: 'Service not found' });
    res.json(item);
  });

  app.get('/api/public/portfolio', async (_req, res) => {
    const items = await db.portfolio.find({ status: 'published' }, { sort: { year: -1, createdAt: -1 } });
    res.json(items);
  });

  app.get('/api/public/portfolio/:slug', async (req, res) => {
    const item = await db.portfolio.findOne({ slug: req.params.slug, status: 'published' });
    if (!item) return res.status(404).json({ error: 'Project not found' });
    res.json(item);
  });

  app.get('/api/public/events', async (_req, res) => {
    const items = await db.events.find({}, { sort: { startDate: -1 } });
    res.json(items);
  });

  app.get('/api/public/events/:slug', async (req, res) => {
    const item = await db.events.findOne({ slug: req.params.slug });
    if (!item) return res.status(404).json({ error: 'Event not found' });
    res.json(item);
  });

  app.get('/api/public/staff', async (_req, res) => {
    const items = await db.staff.find({}, { sort: { order: 1 } });
    res.json(items);
  });

  app.get('/api/public/departments', async (_req, res) => {
    const items = await db.departments.find({}, { sort: { order: 1 } });
    res.json(items);
  });

  app.get('/api/public/careers', async (_req, res) => {
    const items = await db.job_positions.find({ active: true }, { sort: { createdAt: -1 } });
    res.json(items);
  });

  app.post('/api/public/careers/apply', uploadCv.single('cv'), async (req: Request, res: Response) => {
    try {
      const { positionId, fullName, email, phone, portfolioUrl, coverLetter, additionalInfo } = req.body;
      if (!positionId || !fullName || !email || !phone || !coverLetter) {
        return res.status(400).json({ error: 'Please complete all required application fields.' });
      }
      const position = await db.job_positions.findById(positionId);
      if (!position) {
        return res.status(404).json({ error: 'Selected job position was not found.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload your CV / Resume file.' });
      }
      const cvUrl = `/uploads/cvs/${req.file.filename}`;
      const application = await db.job_applications.create({
        positionId,
        positionTitle: position.title,
        fullName: String(fullName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        portfolioUrl: String(portfolioUrl || '').trim(),
        cvUrl,
        cvOriginalName: req.file.originalname,
        coverLetter: String(coverLetter).trim(),
        additionalInfo: String(additionalInfo || '').trim(),
        status: 'New',
        internalNotes: '',
      });

      await db.media.create({
        title: `CV - ${fullName}`,
        url: cvUrl,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folder: 'documents',
        altText: req.file.originalname,
        uploadedBy: String(email),
      });

      res.status(201).json({ ok: true, applicationId: application._id });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/public/blog', async (_req, res) => {
    const now = new Date().toISOString().slice(0, 10);
    const all = await db.blog_posts.find({}, { sort: { publishedAt: -1 } });
    const visible = all.filter(
      (p: any) => p.status === 'published' || (p.status === 'scheduled' && p.scheduledFor && p.scheduledFor <= now)
    );
    res.json(visible);
  });

  app.get('/api/public/blog/:slug', async (req, res) => {
    const post = await db.blog_posts.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ error: 'Article not found' });
    res.json(post);
  });

  app.get('/api/public/blog-categories', async (_req, res) => {
    const cats = await db.blog_categories.find({}, { sort: { name: 1 } });
    res.json(cats);
  });

  app.get('/api/public/testimonials', async (_req, res) => {
    const items = await db.testimonials.find({}, { sort: { order: 1 } });
    res.json(items);
  });

  app.get('/api/public/partners', async (_req, res) => {
    const items = await db.partners.find({}, { sort: { order: 1 } });
    res.json(items);
  });

  app.post('/api/public/contact', async (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All required fields must be filled out.' });
      }
      const created = await db.contact_messages.create({
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject).trim(),
        category: String(category || 'General Inquiry').trim(),
        message: String(message).trim(),
        read: false,
        status: 'new',
      });
      res.status(201).json({ ok: true, id: created._id });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Public Sticky Notes
  app.get('/api/public/sticky-notes', async (req, res) => {
    const pageSlug = req.query.pageSlug ? String(req.query.pageSlug) : undefined;
    const all = await db.sticky_notes.find({ visible: true }, { sort: { zIndex: 1 } });
    const filtered = pageSlug ? all.filter((n: any) => n.pageSlug === 'all' || n.pageSlug === pageSlug) : all;
    res.json(filtered);
  });

  // Public Reviews with configurable limit
  app.get('/api/public/reviews', async (_req, res) => {
    try {
      const [settingsList, allPublished] = await Promise.all([
        db.site_settings.find({}),
        db.reviews.find({ status: 'published' }, { sort: { createdAt: -1 } }),
      ]);
      const settings = settingsList[0] || {};
      const maxCount = Math.max(1, Number(settings.reviewMaxCount ?? 50));
      const perSessionLimit = Math.max(1, Number(settings.reviewPerSessionLimit ?? 2));
      const reviewsEnabled = settings.reviewsEnabled !== false;
      res.json({
        reviews: allPublished.slice(0, maxCount),
        totalPublished: allPublished.length,
        config: {
          reviewsEnabled,
          reviewMaxCount: maxCount,
          reviewPerSessionLimit: perSessionLimit,
        },
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/public/reviews', async (req, res) => {
    try {
      const settingsList = await db.site_settings.find({});
      const settings = settingsList[0] || {};
      if (settings.reviewsEnabled === false) {
        return res.status(403).json({ error: 'Review submissions are currently disabled by the administrator.' });
      }
      const maxCount = Math.max(1, Number(settings.reviewMaxCount ?? 50));
      const perSessionLimit = Math.max(1, Number(settings.reviewPerSessionLimit ?? 2));

      const currentPublishedCount = await db.reviews.countDocuments({ status: 'published' });
      if (currentPublishedCount >= maxCount) {
        return res.status(429).json({
          error: `Maximum review limit (${maxCount}) has been reached.`,
        });
      }

      const { authorName, role, organization, rating, comment, serviceUsed, sessionFingerprint } = req.body;
      if (!authorName || !comment) {
        return res.status(400).json({ error: 'Name and review comment are required.' });
      }

      const fingerprint = String(sessionFingerprint || req.ip || 'anonymous').slice(0, 120);
      if (fingerprint) {
        const existingFromSession = await db.reviews.countDocuments({ sessionFingerprint: fingerprint });
        if (existingFromSession >= perSessionLimit) {
          return res.status(429).json({
            error: `Submission limit reached: maximum ${perSessionLimit} review(s) allowed per visitor.`,
          });
        }
      }

      const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));
      const created = await db.reviews.create({
        authorName: String(authorName).trim().slice(0, 80),
        role: String(role || 'Esports Partner').trim().slice(0, 80),
        organization: String(organization || '').trim().slice(0, 100),
        rating: numericRating,
        comment: String(comment).trim().slice(0, 1000),
        serviceUsed: String(serviceUsed || 'Esports Production').trim().slice(0, 80),
        status: 'published',
        featured: false,
        sessionFingerprint: fingerprint,
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ============================================
  // AUTH ROUTES
  // ============================================

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const user = await db.admin_users.findOne({ email: String(email).toLowerCase().trim() });
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Invalid credentials or account disabled.' });
      }
      const valid = await verifyPassword(String(password), user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      await db.admin_users.findByIdAndUpdate(user._id, { lastLogin: new Date().toISOString() });

      const payload = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
      const token = signAdminToken(payload);

      res.cookie('yrt_admin_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await db.activity_logs.create({
        adminEmail: user.email,
        adminName: user.name,
        action: 'LOGIN',
        entityType: 'auth',
        entityTitle: user.email,
        details: `Signed in as ${user.role}`,
      });

      res.json({ token, user: payload });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('yrt_admin_token');
    res.json({ ok: true });
  });

  app.get('/api/auth/setup-status', async (_req, res) => {
    const settingsList = await db.site_settings.find({});
    const current = settingsList[0];
    res.json({ setupRequired: !current?.setupCompleted });
  });

  app.post('/api/auth/setup', async (req, res) => {
    try {
      const settingsList = await db.site_settings.find({});
      const current = settingsList[0];
      if (current?.setupCompleted) {
        return res.status(403).json({ error: 'Workspace setup is already completed. Please sign in.' });
      }

      const {
        adminName,
        adminEmail,
        adminPassword,
        organizationName,
        tagline,
        description,
        contactEmail,
        themeSlug,
        startBlank,
      } = req.body;

      if (!adminName || !adminEmail || !adminPassword || String(adminPassword).length < 6) {
        return res.status(400).json({ error: 'Admin name, email, and a password of at least 6 characters are required.' });
      }

      const normalizedEmail = String(adminEmail).toLowerCase().trim();
      const passwordHash = await hashPassword(String(adminPassword));

      // Replace default seeded demo accounts with the owner's Super Admin account
      await db.admin_users.deleteMany({});
      const createdAdmin = await db.admin_users.create({
        name: String(adminName).trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'super_admin',
        active: true,
        lastLogin: new Date().toISOString(),
      });

      // Resolve selected theme if provided
      const themes = await db.themes.find({});
      const chosenTheme = themes.find((t: any) => t.slug === themeSlug) || themes[0];

      if (current) {
        await db.site_settings.findByIdAndUpdate(current._id, {
          organizationName: String(organizationName || current.organizationName || 'YRT Esports').trim(),
          tagline: tagline !== undefined ? String(tagline).trim() : current.tagline,
          description: description !== undefined ? String(description).trim() : current.description,
          contactEmail: contactEmail !== undefined ? String(contactEmail).trim() : current.contactEmail,
          activeThemeId: chosenTheme?._id || current.activeThemeId,
          setupCompleted: true,
        });
      }

      if (startBlank) {
        await Promise.all([
          db.services.deleteMany({}),
          db.portfolio.deleteMany({}),
          db.events.deleteMany({}),
          db.staff.deleteMany({}),
          db.departments.deleteMany({}),
          db.job_positions.deleteMany({}),
          db.job_applications.deleteMany({}),
          db.blog_posts.deleteMany({}),
          db.blog_categories.deleteMany({}),
          db.testimonials.deleteMany({}),
          db.partners.deleteMany({}),
          db.contact_messages.deleteMany({}),
          db.media.deleteMany({ url: { $ne: '/logo.png' } }),
        ]);
      }

      const payload = {
        id: createdAdmin._id,
        email: createdAdmin.email,
        name: createdAdmin.name,
        role: createdAdmin.role,
      };
      const token = signAdminToken(payload);

      res.cookie('yrt_admin_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await db.activity_logs.create({
        adminEmail: createdAdmin.email,
        adminName: createdAdmin.name,
        action: 'WORKSPACE_SETUP',
        entityType: 'system',
        entityTitle: String(organizationName || current?.organizationName || 'YRT Esports'),
        details: startBlank ? 'Completed initial setup with blank workspace' : 'Completed initial setup with starter template',
      });

      res.status(201).json({ token, user: payload });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/auth/me', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.admin_users.findById(req.admin!.id);
    if (!user) return res.status(401).json({ error: 'Session invalid' });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  // ============================================
  // PROTECTED ADMIN ROUTES
  // ============================================

  app.get('/api/admin/overview', requireAdminAuth, async (_req, res) => {
    try {
      const [
        settingsList,
        portfolioCount,
        blogCount,
        staffCount,
        activeJobsCount,
        applicationsCount,
        unreadMessagesCount,
        eventsCount,
        servicesCount,
        recentLogs,
      ] = await Promise.all([
        db.site_settings.find({}),
        db.portfolio.countDocuments({}),
        db.blog_posts.countDocuments({ status: 'published' }),
        db.staff.countDocuments({ employmentStatus: 'current' }),
        db.job_positions.countDocuments({ active: true }),
        db.job_applications.countDocuments({}),
        db.contact_messages.countDocuments({ read: false }),
        db.events.countDocuments({}),
        db.services.countDocuments({}),
        db.activity_logs.find({}, { sort: { createdAt: -1 }, limit: 15 }),
      ]);

      const dbInfo = getDatabaseInfo();
      res.json({
        stats: {
          visitors: settingsList[0]?.visitorCount || 0,
          portfolioProjects: portfolioCount,
          publishedBlogs: blogCount,
          staffMembers: staffCount,
          activePositions: activeJobsCount,
          jobApplications: applicationsCount,
          unreadMessages: unreadMessagesCount,
          eventsCount,
          servicesCount,
        },
        dbMode: isMongoConnected() ? 'mongodb' : 'local_persistent',
        dbError: dbInfo.lastError,
        recentLogs,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post(
    '/api/admin/reconnect-db',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      const result = await connectDatabase();
      if (result.mode === 'mongodb') {
        await seedDatabase();
        await logActivity(req, 'CONNECTED', 'database', 'MongoDB Atlas (yrt_esports)');
        return res.json({ ok: true, dbMode: 'mongodb', error: null });
      }
      res.json({
        ok: false,
        dbMode: 'local_persistent',
        error: result.error || 'Unable to connect to MongoDB Atlas.',
      });
    }
  );

  app.get(
    '/api/admin/workspace-counts',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (_req, res) => {
      const [
        services,
        portfolio,
        events,
        staff,
        departments,
        jobs,
        applications,
        blog,
        blogCategories,
        testimonials,
        partners,
        messages,
        media,
        sections,
        stickyNotes,
        reviews,
      ] = await Promise.all([
        db.services.countDocuments({}),
        db.portfolio.countDocuments({}),
        db.events.countDocuments({}),
        db.staff.countDocuments({}),
        db.departments.countDocuments({}),
        db.job_positions.countDocuments({}),
        db.job_applications.countDocuments({}),
        db.blog_posts.countDocuments({}),
        db.blog_categories.countDocuments({}),
        db.testimonials.countDocuments({}),
        db.partners.countDocuments({}),
        db.contact_messages.countDocuments({}),
        db.media.countDocuments({ url: { $ne: '/logo.png' } }),
        db.page_sections.countDocuments({}),
        db.sticky_notes.countDocuments({}),
        db.reviews.countDocuments({}),
      ]);

      res.json({
        services,
        portfolio,
        events,
        staff,
        departments,
        jobs,
        applications,
        blog,
        blogCategories,
        testimonials,
        partners,
        messages,
        media,
        sections,
        stickyNotes,
        reviews,
      });
    }
  );

  app.post(
    '/api/admin/workspace/clear',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      const { scope, includeSections } = req.body as { scope: string; includeSections?: boolean };
      let removed = 0;

      switch (scope) {
        case 'services':
          removed = await db.services.deleteMany({});
          break;
        case 'portfolio':
          removed = await db.portfolio.deleteMany({});
          break;
        case 'events':
          removed = await db.events.deleteMany({});
          break;
        case 'staff':
          removed = (await db.staff.deleteMany({})) + (await db.departments.deleteMany({}));
          break;
        case 'careers':
          removed = (await db.job_positions.deleteMany({})) + (await db.job_applications.deleteMany({}));
          break;
        case 'blog':
          removed = (await db.blog_posts.deleteMany({})) + (await db.blog_categories.deleteMany({}));
          break;
        case 'testimonials':
          removed = await db.testimonials.deleteMany({});
          break;
        case 'partners':
          removed = await db.partners.deleteMany({});
          break;
        case 'messages':
          removed = await db.contact_messages.deleteMany({});
          break;
        case 'sticky_notes':
          removed = await db.sticky_notes.deleteMany({});
          break;
        case 'reviews':
          removed = await db.reviews.deleteMany({});
          break;
        case 'media':
          removed = await db.media.deleteMany({ url: { $ne: '/logo.png' } });
          break;
        case 'sections':
          removed = await db.page_sections.deleteMany({});
          break;
        case 'all': {
          const counts = await Promise.all([
            db.services.deleteMany({}),
            db.portfolio.deleteMany({}),
            db.events.deleteMany({}),
            db.staff.deleteMany({}),
            db.departments.deleteMany({}),
            db.job_positions.deleteMany({}),
            db.job_applications.deleteMany({}),
            db.blog_posts.deleteMany({}),
            db.blog_categories.deleteMany({}),
            db.testimonials.deleteMany({}),
            db.partners.deleteMany({}),
            db.contact_messages.deleteMany({}),
            db.sticky_notes.deleteMany({}),
            db.reviews.deleteMany({}),
            db.media.deleteMany({ url: { $ne: '/logo.png' } }),
            includeSections ? db.page_sections.deleteMany({}) : Promise.resolve(0),
          ]);
          removed = counts.reduce((sum, n) => sum + n, 0);
          break;
        }
        default:
          return res.status(400).json({ error: 'Invalid clear scope specified.' });
      }

      await logActivity(req, 'CLEARED', 'workspace', `${scope} (${removed} items removed)`);
      res.json({ ok: true, removed });
    }
  );

  app.post(
    '/api/admin/workspace/restore-starter',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      await seedDatabase();
      await logActivity(req, 'RESTORED', 'workspace', 'Starter demo content');
      res.json({ ok: true });
    }
  );

  // Site Settings
  app.get('/api/admin/site-settings', requireAdminAuth, async (_req, res) => {
    const list = await db.site_settings.find({});
    res.json(list[0] || {});
  });

  app.put(
    '/api/admin/site-settings',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      const list = await db.site_settings.find({});
      const current = list[0];
      if (!current) {
        const created = await db.site_settings.create(req.body);
        await logActivity(req, 'CREATED', 'site_settings', created.organizationName || 'Site Settings');
        return res.json(created);
      }
      const updated = await db.site_settings.findByIdAndUpdate(current._id, req.body);
      await logActivity(req, 'UPDATED', 'site_settings', updated?.organizationName || 'Site Settings');
      res.json(updated);
    }
  );

  // Themes
  app.get('/api/admin/themes', requireAdminAuth, async (_req, res) => {
    res.json(await db.themes.find({}));
  });

  app.put(
    '/api/admin/themes/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor']),
    async (req: AuthenticatedRequest, res) => {
      const updated = await db.themes.findByIdAndUpdate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Theme not found' });
      await logActivity(req, 'UPDATED', 'theme', updated.name);
      res.json(updated);
    }
  );

  app.post(
    '/api/admin/themes/:id/activate',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor']),
    async (req: AuthenticatedRequest, res) => {
      const theme = await db.themes.findById(req.params.id);
      if (!theme) return res.status(404).json({ error: 'Theme not found' });
      const list = await db.site_settings.find({});
      if (list[0]) {
        await db.site_settings.findByIdAndUpdate(list[0]._id, { activeThemeId: theme._id });
      }
      await logActivity(req, 'ACTIVATED', 'theme', theme.name);
      res.json({ ok: true, activeTheme: theme });
    }
  );

  // Pages & Page Builder Sections
  app.get('/api/admin/pages', requireAdminAuth, async (_req, res) => {
    res.json(await db.pages.find({}));
  });

  app.get('/api/admin/page-sections', requireAdminAuth, async (req, res) => {
    const pageSlug = req.query.pageSlug ? String(req.query.pageSlug) : undefined;
    const filter = pageSlug ? { pageSlug } : {};
    res.json(await db.page_sections.find(filter, { sort: { order: 1 } }));
  });

  app.post(
    '/api/admin/page-sections',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const created = await db.page_sections.create({
        ...req.body,
        sectionKey: req.body.sectionKey || slugify(req.body.title || `section-${Date.now()}`),
      });
      await logActivity(req, 'CREATED', 'page_section', `${created.pageSlug}: ${created.title}`);
      res.status(201).json(created);
    }
  );

  app.put(
    '/api/admin/page-sections/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const updated = await db.page_sections.findByIdAndUpdate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Section not found' });
      await logActivity(req, 'UPDATED', 'page_section', `${updated.pageSlug}: ${updated.title}`);
      res.json(updated);
    }
  );

  app.post(
    '/api/admin/page-sections/reorder',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds required' });
      for (let i = 0; i < orderedIds.length; i++) {
        await db.page_sections.findByIdAndUpdate(orderedIds[i], { order: i + 1 });
      }
      await logActivity(req, 'REORDERED', 'page_section', `${orderedIds.length} sections`);
      res.json({ ok: true });
    }
  );

  app.post(
    '/api/admin/pages/:slug/publish',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const sections = await db.page_sections.find({ pageSlug: req.params.slug });
      for (const sec of sections) {
        if (sec.isDraft) {
          await db.page_sections.findByIdAndUpdate(sec._id, { isDraft: false });
        }
      }
      await db.pages.findOneAndUpdate({ slug: req.params.slug }, { status: 'published', hasDraftChanges: false });
      await logActivity(req, 'PUBLISHED', 'page', req.params.slug);
      res.json({ ok: true });
    }
  );

  app.delete(
    '/api/admin/page-sections/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const deleted = await db.page_sections.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Section not found' });
      await logActivity(req, 'DELETED', 'page_section', deleted.title);
      res.json({ ok: true });
    }
  );

  // Generic CRUD Factory for clean modularity
  function registerCrud(
    routeBase: string,
    repo: typeof db.services,
    entityName: string,
    allowedRoles: any[],
    options?: { autoSlugFrom?: string; defaultSort?: Record<string, 1 | -1> }
  ) {
    app.get(`/api/admin/${routeBase}`, requireAdminAuth, async (_req, res) => {
      const items = await repo.find({}, { sort: options?.defaultSort || { createdAt: -1 } });
      res.json(items);
    });

    app.post(
      `/api/admin/${routeBase}`,
      requireAdminAuth,
      requireRoles(allowedRoles),
      async (req: AuthenticatedRequest, res) => {
        const body = { ...req.body };
        if (options?.autoSlugFrom && !body.slug && body[options.autoSlugFrom]) {
          body.slug = `${slugify(body[options.autoSlugFrom])}-${Date.now().toString().slice(-4)}`;
        }
        const created = await repo.create(body);
        await logActivity(
          req,
          'CREATED',
          entityName,
          String(created.title || created.fullName || created.name || created.label || created.pageSlug || created._id)
        );
        res.status(201).json(created);
      }
    );

    app.put(
      `/api/admin/${routeBase}/:id`,
      requireAdminAuth,
      requireRoles(allowedRoles),
      async (req: AuthenticatedRequest, res) => {
        const updated = await repo.findByIdAndUpdate(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: `${entityName} not found` });
        await logActivity(
          req,
          'UPDATED',
          entityName,
          String(updated.title || updated.fullName || updated.name || updated.label || updated.pageSlug || updated._id)
        );
        res.json(updated);
      }
    );

    app.delete(
      `/api/admin/${routeBase}/:id`,
      requireAdminAuth,
      requireRoles(allowedRoles),
      async (req: AuthenticatedRequest, res) => {
        const deleted = await repo.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: `${entityName} not found` });
        await logActivity(
          req,
          'DELETED',
          entityName,
          String(deleted.title || deleted.fullName || deleted.name || deleted.label || deleted.pageSlug || deleted._id)
        );
        res.json({ ok: true });
      }
    );
  }

  registerCrud('services', db.services, 'service', ['super_admin', 'admin', 'editor', 'content_manager'], {
    autoSlugFrom: 'title',
    defaultSort: { order: 1 },
  });
  registerCrud('portfolio', db.portfolio, 'portfolio', ['super_admin', 'admin', 'editor', 'content_manager'], {
    autoSlugFrom: 'title',
    defaultSort: { year: -1 },
  });
  registerCrud('events', db.events, 'event', ['super_admin', 'admin', 'editor', 'content_manager'], {
    autoSlugFrom: 'title',
    defaultSort: { startDate: -1 },
  });
  registerCrud('staff', db.staff, 'staff', ['super_admin', 'admin', 'hr_manager'], {
    defaultSort: { order: 1 },
  });
  registerCrud('departments', db.departments, 'department', ['super_admin', 'admin', 'hr_manager'], {
    autoSlugFrom: 'name',
    defaultSort: { order: 1 },
  });
  registerCrud('jobs', db.job_positions, 'job_position', ['super_admin', 'admin', 'hr_manager'], {
    autoSlugFrom: 'title',
    defaultSort: { createdAt: -1 },
  });
  registerCrud('blog', db.blog_posts, 'blog_post', ['super_admin', 'admin', 'editor', 'content_manager'], {
    autoSlugFrom: 'title',
    defaultSort: { publishedAt: -1 },
  });
  registerCrud('blog-categories', db.blog_categories, 'blog_category', ['super_admin', 'admin', 'editor', 'content_manager'], {
    autoSlugFrom: 'name',
    defaultSort: { name: 1 },
  });
  registerCrud('testimonials', db.testimonials, 'testimonial', ['super_admin', 'admin', 'editor', 'content_manager'], {
    defaultSort: { order: 1 },
  });
  registerCrud('partners', db.partners, 'partner', ['super_admin', 'admin', 'editor', 'content_manager'], {
    defaultSort: { order: 1 },
  });
  registerCrud('navigation', db.navigation, 'navigation', ['super_admin', 'admin', 'editor'], {
    defaultSort: { order: 1 },
  });
  registerCrud('seo', db.seo_metadata, 'seo_metadata', ['super_admin', 'admin', 'editor', 'content_manager'], {
    defaultSort: { pageSlug: 1 },
  });
  registerCrud('sticky-notes', db.sticky_notes, 'sticky_note', ['super_admin', 'admin', 'editor', 'content_manager'], {
    defaultSort: { zIndex: 1 },
  });
  registerCrud('reviews', db.reviews, 'review', ['super_admin', 'admin', 'editor', 'content_manager'], {
    defaultSort: { createdAt: -1 },
  });

  app.put(
    '/api/admin/sticky-notes/batch',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'editor', 'content_manager']),
    async (req: AuthenticatedRequest, res) => {
      const updates = Array.isArray(req.body?.notes) ? req.body.notes : [];
      for (const item of updates) {
        if (item?._id) {
          const { _id, ...rest } = item;
          await db.sticky_notes.findByIdAndUpdate(String(_id), rest);
        }
      }
      await logActivity(req, 'UPDATED', 'sticky_note', `Batch updated ${updates.length} notes/layers`);
      res.json({ ok: true });
    }
  );

  // Job Applications (HR + Admin)
  app.get(
    '/api/admin/applications',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'hr_manager']),
    async (_req, res) => {
      res.json(await db.job_applications.find({}, { sort: { createdAt: -1 } }));
    }
  );

  app.put(
    '/api/admin/applications/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'hr_manager']),
    async (req: AuthenticatedRequest, res) => {
      const updated = await db.job_applications.findByIdAndUpdate(req.params.id, {
        status: req.body.status,
        internalNotes: req.body.internalNotes,
      });
      if (!updated) return res.status(404).json({ error: 'Application not found' });
      await logActivity(req, 'REVIEWED', 'job_application', `${updated.fullName} (${updated.status})`);
      res.json(updated);
    }
  );

  app.delete(
    '/api/admin/applications/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin', 'hr_manager']),
    async (req: AuthenticatedRequest, res) => {
      const deleted = await db.job_applications.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Application not found' });
      await logActivity(req, 'DELETED', 'job_application', deleted.fullName);
      res.json({ ok: true });
    }
  );

  // Contact Messages Inbox
  app.get('/api/admin/messages', requireAdminAuth, async (_req, res) => {
    res.json(await db.contact_messages.find({}, { sort: { createdAt: -1 } }));
  });

  app.put('/api/admin/messages/:id', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    const updated = await db.contact_messages.findByIdAndUpdate(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    await logActivity(req, 'UPDATED', 'contact_message', updated.subject);
    res.json(updated);
  });

  app.delete(
    '/api/admin/messages/:id',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (req: AuthenticatedRequest, res) => {
      const deleted = await db.contact_messages.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Message not found' });
      await logActivity(req, 'DELETED', 'contact_message', deleted.subject);
      res.json({ ok: true });
    }
  );

  // Media Library
  app.get('/api/admin/media', requireAdminAuth, async (_req, res) => {
    res.json(await db.media.find({}, { sort: { createdAt: -1 } }));
  });

  app.post(
    '/api/admin/media/upload',
    requireAdminAuth,
    uploadMedia.single('file'),
    async (req: AuthenticatedRequest, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const folder = String(req.body.folder || 'general');
      const cloudinaryUrl = await uploadToCloudinaryIfConfigured(req.file, folder);
      const url = cloudinaryUrl || `/uploads/media/${req.file.filename}`;
      const asset = await db.media.create({
        title: String(req.body.title || req.file.originalname),
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folder,
        altText: String(req.body.altText || req.file.originalname),
        uploadedBy: req.admin?.email || 'Admin',
      });
      await logActivity(req, 'UPLOADED', 'media', asset.title);
      res.status(201).json(asset);
    }
  );

  app.put(
    '/api/admin/media/:id',
    requireAdminAuth,
    uploadMedia.single('file'),
    async (req: AuthenticatedRequest, res) => {
      const existing = await db.media.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Media asset not found' });

      const folder = String(req.body.folder ?? existing.folder ?? 'general');
      const updatePayload: Record<string, unknown> = {
        title: req.body.title ?? existing.title,
        folder,
        altText: req.body.altText ?? existing.altText,
      };

      if (req.file) {
        const cloudinaryUrl = await uploadToCloudinaryIfConfigured(req.file, folder);
        updatePayload.url = cloudinaryUrl || `/uploads/media/${req.file.filename}`;
        updatePayload.mimeType = req.file.mimetype;
        updatePayload.size = req.file.size;
      }

      const updated = await db.media.findByIdAndUpdate(req.params.id, updatePayload);
      await logActivity(req, 'UPDATED', 'media', String(updated?.title));
      res.json(updated);
    }
  );

  app.delete('/api/admin/media/:id', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    const deleted = await db.media.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Media asset not found' });
    await logActivity(req, 'DELETED', 'media', deleted.title);
    res.json({ ok: true });
  });

  // Admin Users & RBAC
  app.get(
    '/api/admin/admin-users',
    requireAdminAuth,
    requireRoles(['super_admin', 'admin']),
    async (_req, res) => {
      const users = await db.admin_users.find({}, { sort: { createdAt: -1 } });
      res.json(users.map(({ passwordHash: _ph, ...safe }: any) => safe));
    }
  );

  app.post(
    '/api/admin/admin-users',
    requireAdminAuth,
    requireRoles(['super_admin']),
    async (req: AuthenticatedRequest, res) => {
      const { name, email, password, role, active } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }
      const normalizedEmail = String(email).toLowerCase().trim();
      const existing = await db.admin_users.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'An admin user with this email already exists.' });
      }
      const passwordHash = await hashPassword(String(password));
      const created = await db.admin_users.create({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: role || 'editor',
        active: active !== false,
      });
      await logActivity(req, 'CREATED', 'admin_user', `${created.email} (${created.role})`);
      const { passwordHash: _ph, ...safe } = created as any;
      res.status(201).json(safe);
    }
  );

  app.put(
    '/api/admin/admin-users/:id',
    requireAdminAuth,
    requireRoles(['super_admin']),
    async (req: AuthenticatedRequest, res) => {
      const update: Record<string, unknown> = {};
      if (req.body.name !== undefined) update.name = req.body.name;
      if (req.body.role !== undefined) update.role = req.body.role;
      if (req.body.active !== undefined) update.active = req.body.active;
      if (req.body.password) {
        update.passwordHash = await hashPassword(String(req.body.password));
      }
      const updated = await db.admin_users.findByIdAndUpdate(req.params.id, update);
      if (!updated) return res.status(404).json({ error: 'Admin user not found' });
      await logActivity(req, 'UPDATED', 'admin_user', updated.email);
      const { passwordHash: _ph, ...safe } = updated as any;
      res.json(safe);
    }
  );

  app.delete(
    '/api/admin/admin-users/:id',
    requireAdminAuth,
    requireRoles(['super_admin']),
    async (req: AuthenticatedRequest, res) => {
      if (req.params.id === req.admin?.id) {
        return res.status(400).json({ error: 'Cannot delete your own active session account.' });
      }
      const deleted = await db.admin_users.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Admin user not found' });
      await logActivity(req, 'DELETED', 'admin_user', deleted.email);
      res.json({ ok: true });
    }
  );
}
