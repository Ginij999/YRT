export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'hr_manager'
  | 'content_manager';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface HomepageBackgroundConfig {
  mode: 'stars' | 'solid' | 'gradient' | 'image';
  primaryColor: string;
  secondaryColor: string;
  imageUrl: string;
  starsEnabled: boolean;
  starColor: string;
  starDensity: number;
  overlayOpacity: number;
}

export interface SiteSettings {
  _id?: string;
  organizationName: string;
  tagline: string;
  description: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  activeThemeId: string;
  contactEmail: string;
  contactPhone: string;
  headquarters: string;
  footerCopyright: string;
  footerBio: string;
  visitorCount: number;
  analyticsId?: string;
  setupCompleted?: boolean;
  whatsappUrl?: string;
  whatsappEnabled?: boolean;
  reviewsEnabled?: boolean;
  reviewMaxCount?: number;
  reviewPerSessionLimit?: number;
  homepageBackground?: HomepageBackgroundConfig;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    linkedin?: string;
    discord?: string;
  };
}

export interface ThemeConfig {
  _id: string;
  slug: 'competitive-esports' | 'luxury-gold' | string;
  name: string;
  description: string;
  bgColor: string;
  surfaceColor: string;
  surfaceElevatedColor: string;
  textColor: string;
  mutedTextColor: string;
  primaryColor: string;
  primaryHoverColor: string;
  secondaryColor: string;
  borderColor: string;
  headingFont: string;
  bodyFont: string;
  buttonStyle: 'sharp' | 'rounded' | 'editorial';
  gradientAccent: string;
  isDefault?: boolean;
}

export interface PageSectionItem {
  id: string;
  label?: string;
  title?: string;
  value?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  year?: string;
  meta?: string;
}

export interface PageSection {
  _id: string;
  pageSlug: string;
  sectionKey: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundColor?: string;
  layout: 'split' | 'centered' | 'grid' | 'banner' | 'stats' | 'timeline';
  order: number;
  enabled: boolean;
  isDraft: boolean;
  items?: PageSectionItem[];
}

export interface PageRecord {
  _id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft';
  hasDraftChanges?: boolean;
  updatedAt?: string;
}

export interface ServiceItem {
  _id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  deliverables: string[];
  processSteps: { title: string; detail: string }[];
  imageUrl: string;
  iconName: string;
  order: number;
  featured: boolean;
  status: 'published' | 'draft';
}

export interface PortfolioItem {
  _id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  coverUrl: string;
  gallery: string[];
  description: string;
  category: string;
  projectType: string;
  gameTitle: string;
  client: string;
  projectDate: string;
  year: number;
  location: string;
  servicesProvided: string[];
  videoUrl?: string;
  externalUrl?: string;
  metrics?: string;
  featured: boolean;
  status: 'published' | 'draft';
}

export interface EventResult {
  placement: string;
  team: string;
  prize: string;
}

export interface EventItem {
  _id: string;
  title: string;
  slug: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  bannerUrl: string;
  description: string;
  gameCategory: string;
  location: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  teamsCount: number;
  results: EventResult[];
  gallery: string[];
  featured: boolean;
}

export interface StaffMember {
  _id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  bio: string;
  photoUrl: string;
  email?: string;
  joiningDate: string;
  employmentStatus: 'current' | 'former' | 'alumni';
  featured: boolean;
  order: number;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface Department {
  _id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface JobPosition {
  _id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  location: string;
  workMode: 'Remote' | 'On-site' | 'Hybrid';
  description: string;
  qualifications: string[];
  responsibilities: string[];
  deadline: string;
  active: boolean;
}

export type ApplicationStatus =
  | 'New'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Accepted'
  | 'Rejected';

export interface JobApplication {
  _id: string;
  positionId: string;
  positionTitle: string;
  fullName: string;
  email: string;
  phone: string;
  portfolioUrl?: string;
  cvUrl: string;
  cvOriginalName: string;
  coverLetter: string;
  additionalInfo?: string;
  status: ApplicationStatus;
  internalNotes?: string;
  createdAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt: string;
  scheduledFor?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  readTime: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Testimonial {
  _id: string;
  authorName: string;
  role: string;
  organization: string;
  quote: string;
  outcomeMetric: string;
  avatarUrl?: string;
  featured: boolean;
  order: number;
}

export interface Partner {
  _id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier: string;
  featured: boolean;
  order: number;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  read: boolean;
  status: 'new' | 'replied' | 'archived';
  createdAt: string;
}

export interface MediaAsset {
  _id: string;
  title: string;
  url: string;
  mimeType: string;
  size: number;
  folder: 'logos' | 'events' | 'portfolio' | 'staff' | 'blog' | 'documents' | 'general';
  altText?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface NavigationItem {
  _id: string;
  label: string;
  path: string;
  order: number;
  visible: boolean;
  isExternal: boolean;
  location: 'header' | 'footer_company' | 'footer_services';
}

export interface SeoMetadata {
  _id: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ActivityLog {
  _id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  entityType: string;
  entityTitle: string;
  details?: string;
  createdAt: string;
}

export type StickyNoteColor =
  | 'yellow'
  | 'sky'
  | 'mint'
  | 'pink'
  | 'amber'
  | 'crimson'
  | 'emerald'
  | 'slate';

export interface StickyNote {
  _id: string;
  title: string;
  content: string;
  author?: string;
  color: StickyNoteColor;
  customColor?: string;
  imageUrl?: string;
  noteType?: 'note' | 'polaroid';
  pinStyle?: 'pin' | 'tape' | 'none';
  pinColor?: string;
  displayMode?: 'pinboard' | 'floating' | 'both';
  x: number;
  y: number;
  width: number;
  rotation: number;
  zIndex: number;
  layer: 'front' | 'mid' | 'back';
  pageSlug: string;
  visible: boolean;
  pinned?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface ReviewItem {
  _id: string;
  authorName: string;
  role: string;
  organization: string;
  rating: number;
  comment: string;
  serviceUsed?: string;
  status: 'published' | 'pending' | 'hidden';
  featured: boolean;
  sessionFingerprint?: string;
  createdAt: string;
}
