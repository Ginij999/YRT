import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'member' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'users' }
);

const AdminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'editor', 'hr_manager', 'content_manager'],
      default: 'editor',
      index: true,
    },
    avatarUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true, collection: 'admin_users' }
);

const SiteSettingSchema = new Schema(
  {
    organizationName: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    logoLightUrl: { type: String, default: '' },
    logoDarkUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    activeThemeId: { type: String, required: true },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    headquarters: { type: String, default: 'Kathmandu, Nepal (KTM HQ)' },
    footerCopyright: { type: String, default: '' },
    footerBio: { type: String, default: '' },
    visitorCount: { type: Number, default: 0 },
    analyticsId: { type: String, default: '' },
    setupCompleted: { type: Boolean, default: false },
    whatsappUrl: { type: String, default: '' },
    whatsappEnabled: { type: Boolean, default: true },
    reviewsEnabled: { type: Boolean, default: true },
    reviewMaxCount: { type: Number, default: 50 },
    reviewPerSessionLimit: { type: Number, default: 2 },
    homepageBackground: {
      mode: { type: String, default: 'stars' },
      primaryColor: { type: String, default: '#08080A' },
      secondaryColor: { type: String, default: '#18090D' },
      imageUrl: { type: String, default: '' },
      starsEnabled: { type: Boolean, default: true },
      starColor: { type: String, default: '#FFFFFF' },
      starDensity: { type: Number, default: 110 },
      overlayOpacity: { type: Number, default: 0.72 },
    },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitch: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      discord: { type: String, default: '' },
    },
  },
  { timestamps: true, collection: 'site_settings' }
);

const ThemeSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    bgColor: { type: String, required: true },
    surfaceColor: { type: String, required: true },
    surfaceElevatedColor: { type: String, required: true },
    textColor: { type: String, required: true },
    mutedTextColor: { type: String, required: true },
    primaryColor: { type: String, required: true },
    primaryHoverColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    borderColor: { type: String, required: true },
    headingFont: { type: String, required: true },
    bodyFont: { type: String, required: true },
    buttonStyle: { type: String, enum: ['sharp', 'rounded', 'editorial'], default: 'sharp' },
    gradientAccent: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'themes' }
);

const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    hasDraftChanges: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'pages' }
);

const PageSectionSchema = new Schema(
  {
    pageSlug: { type: String, required: true, index: true },
    sectionKey: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    ctaLink: { type: String, default: '' },
    secondaryCtaText: { type: String, default: '' },
    secondaryCtaLink: { type: String, default: '' },
    backgroundColor: { type: String, default: '' },
    layout: {
      type: String,
      enum: ['split', 'centered', 'grid', 'banner', 'stats', 'timeline'],
      default: 'split',
    },
    order: { type: Number, default: 0, index: true },
    enabled: { type: Boolean, default: true },
    isDraft: { type: Boolean, default: false },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, collection: 'page_sections' }
);
PageSectionSchema.index({ pageSlug: 1, order: 1 });

const ServiceSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    deliverables: { type: [String], default: [] },
    processSteps: {
      type: [{ title: String, detail: String }],
      default: [],
    },
    imageUrl: { type: String, default: '' },
    iconName: { type: String, default: 'Trophy' },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
  },
  { timestamps: true, collection: 'services' }
);

const PortfolioSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    thumbnailUrl: { type: String, required: true },
    coverUrl: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    projectType: { type: String, default: 'Tournament Production', index: true },
    gameTitle: { type: String, required: true, index: true },
    client: { type: String, required: true },
    projectDate: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    location: { type: String, default: '' },
    servicesProvided: { type: [String], default: [] },
    videoUrl: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    metrics: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
  },
  { timestamps: true, collection: 'portfolio' }
);

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming', index: true },
    bannerUrl: { type: String, required: true },
    description: { type: String, required: true },
    gameCategory: { type: String, required: true, index: true },
    location: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    prizePool: { type: String, default: '' },
    teamsCount: { type: Number, default: 16 },
    results: {
      type: [{ placement: String, team: String, prize: String }],
      default: [],
    },
    gallery: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'events' }
);

const StaffSchema = new Schema(
  {
    fullName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    department: { type: String, required: true, index: true },
    bio: { type: String, default: '' },
    photoUrl: { type: String, required: true },
    email: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    employmentStatus: {
      type: String,
      enum: ['current', 'former', 'alumni'],
      default: 'current',
      index: true,
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    socialLinks: {
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true, collection: 'staff' }
);

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'departments' }
);

const JobPositionSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, index: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    location: { type: String, required: true },
    workMode: { type: String, enum: ['Remote', 'On-site', 'Hybrid'], default: 'Hybrid' },
    description: { type: String, required: true },
    qualifications: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    deadline: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'job_positions' }
);

const JobApplicationSchema = new Schema(
  {
    positionId: { type: String, required: true, index: true },
    positionTitle: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    portfolioUrl: { type: String, default: '' },
    cvUrl: { type: String, required: true },
    cvOriginalName: { type: String, default: 'resume.pdf' },
    coverLetter: { type: String, required: true },
    additionalInfo: { type: String, default: '' },
    status: {
      type: String,
      enum: ['New', 'Under Review', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'],
      default: 'New',
      index: true,
    },
    internalNotes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'job_applications' }
);

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: 'Editorial' },
    authorAvatar: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'published',
      index: true,
    },
    publishedAt: { type: String, default: '' },
    scheduledFor: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    readTime: { type: String, default: '4 min read' },
  },
  { timestamps: true, collection: 'blog_posts' }
);

const BlogCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
  },
  { timestamps: true, collection: 'blog_categories' }
);

const TestimonialSchema = new Schema(
  {
    authorName: { type: String, required: true },
    role: { type: String, required: true },
    organization: { type: String, required: true },
    quote: { type: String, required: true },
    outcomeMetric: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'testimonials' }
);

const PartnerSchema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    tier: { type: String, default: 'Global Partner' },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'partners' }
);

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    category: { type: String, default: 'General Inquiry', index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['new', 'replied', 'archived'], default: 'new' },
  },
  { timestamps: true, collection: 'contact_messages' }
);

const MediaSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: 'image/jpeg' },
    size: { type: Number, default: 0 },
    folder: {
      type: String,
      enum: ['logos', 'events', 'portfolio', 'staff', 'blog', 'documents', 'general'],
      default: 'general',
      index: true,
    },
    altText: { type: String, default: '' },
    uploadedBy: { type: String, default: 'System' },
  },
  { timestamps: true, collection: 'media' }
);

const NavigationSchema = new Schema(
  {
    label: { type: String, required: true },
    path: { type: String, required: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    isExternal: { type: Boolean, default: false },
    location: {
      type: String,
      enum: ['header', 'footer_company', 'footer_services'],
      default: 'header',
      index: true,
    },
  },
  { timestamps: true, collection: 'navigation' }
);

const SeoMetadataSchema = new Schema(
  {
    pageSlug: { type: String, required: true, unique: true, index: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    ogImage: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    noIndex: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'seo_metadata' }
);

const ActivityLogSchema = new Schema(
  {
    adminEmail: { type: String, required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true, index: true },
    entityTitle: { type: String, required: true },
    details: { type: String, default: '' },
  },
  { timestamps: true, collection: 'activity_logs' }
);

const StickyNoteSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    author: { type: String, default: 'YRT Esports' },
    color: {
      type: String,
      enum: ['yellow', 'sky', 'mint', 'pink', 'amber', 'crimson', 'emerald', 'slate'],
      default: 'yellow',
    },
    customColor: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    noteType: { type: String, enum: ['note', 'polaroid'], default: 'note' },
    pinStyle: { type: String, enum: ['pin', 'tape', 'none'], default: 'pin' },
    pinColor: { type: String, default: 'red' },
    displayMode: { type: String, enum: ['pinboard', 'floating', 'both'], default: 'pinboard' },
    x: { type: Number, default: 25 },
    y: { type: Number, default: 20 },
    width: { type: Number, default: 250 },
    rotation: { type: Number, default: -2.5 },
    zIndex: { type: Number, default: 30 },
    layer: { type: String, enum: ['front', 'mid', 'back'], default: 'front' },
    pageSlug: { type: String, default: 'home', index: true },
    visible: { type: Boolean, default: true, index: true },
    pinned: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'sticky_notes' }
);

const ReviewSchema = new Schema(
  {
    authorName: { type: String, required: true },
    role: { type: String, default: 'Esports Partner' },
    organization: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true },
    serviceUsed: { type: String, default: 'Esports Production' },
    status: { type: String, enum: ['published', 'pending', 'hidden'], default: 'published', index: true },
    featured: { type: Boolean, default: false },
    sessionFingerprint: { type: String, default: '', index: true },
  },
  { timestamps: true, collection: 'reviews' }
);

export const MongooseModels = {
  users: mongoose.models.User || mongoose.model('User', UserSchema),
  admin_users: mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema),
  site_settings: mongoose.models.SiteSetting || mongoose.model('SiteSetting', SiteSettingSchema),
  themes: mongoose.models.Theme || mongoose.model('Theme', ThemeSchema),
  pages: mongoose.models.Page || mongoose.model('Page', PageSchema),
  page_sections: mongoose.models.PageSection || mongoose.model('PageSection', PageSectionSchema),
  services: mongoose.models.Service || mongoose.model('Service', ServiceSchema),
  portfolio: mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema),
  events: mongoose.models.Event || mongoose.model('Event', EventSchema),
  staff: mongoose.models.Staff || mongoose.model('Staff', StaffSchema),
  departments: mongoose.models.Department || mongoose.model('Department', DepartmentSchema),
  job_positions: mongoose.models.JobPosition || mongoose.model('JobPosition', JobPositionSchema),
  job_applications: mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema),
  blog_posts: mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema),
  blog_categories: mongoose.models.BlogCategory || mongoose.model('BlogCategory', BlogCategorySchema),
  testimonials: mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema),
  partners: mongoose.models.Partner || mongoose.model('Partner', PartnerSchema),
  contact_messages: mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema),
  media: mongoose.models.Media || mongoose.model('Media', MediaSchema),
  navigation: mongoose.models.Navigation || mongoose.model('Navigation', NavigationSchema),
  seo_metadata: mongoose.models.SeoMetadata || mongoose.model('SeoMetadata', SeoMetadataSchema),
  activity_logs: mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema),
  sticky_notes: mongoose.models.StickyNote || mongoose.model('StickyNote', StickyNoteSchema),
  reviews: mongoose.models.Review || mongoose.model('Review', ReviewSchema),
};

export type CollectionName = keyof typeof MongooseModels;
