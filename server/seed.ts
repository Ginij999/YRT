import { db } from './db.ts';
import { hashPassword } from './auth.ts';

const IMG_HERO = '/src/assets/images/hero_arena_stage_1795184428898.jpg';
const IMG_STUDIO = '/src/assets/images/studio_broadcast_control_1795184431019.jpg';
const IMG_EVENT = '/src/assets/images/event_championship_crowd_1795184429879.jpg';
const IMG_EXEC_1 = '/src/assets/images/portrait_exec_one_1795184429897.jpg';
const IMG_EXEC_2 = '/src/assets/images/portrait_exec_two_1795184429855.jpg';
const IMG_EXEC_3 = '/src/assets/images/portrait_exec_three_1795184429872.jpg';

const YRT_LOGO_PATH = '/logo.png';
const LEGACY_LOGO_PATH = '/assets/aistudio/LOGO-Photoroom_0f89e0c2.png';

function partnerBadgeSvg(letters: string, color: string) {
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="none"><rect x="1" y="1" width="178" height="46" rx="4" stroke="${color}" stroke-opacity="0.35"/><text x="90" y="30" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-weight="700" font-size="16" letter-spacing="3">${letters}</text></svg>`
    )
  );
}

export async function seedDatabase() {
  // Cleanly migrate any initial placeholder Valiant seed to YRT Esports
  const existingSettings = await db.site_settings.findOne({});
  if (existingSettings && existingSettings.organizationName === 'Valiant Esports') {
    await Promise.all([
      db.admin_users.deleteMany({}),
      db.site_settings.deleteMany({}),
      db.themes.deleteMany({}),
      db.navigation.deleteMany({}),
      db.pages.deleteMany({}),
      db.page_sections.deleteMany({}),
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
      db.media.deleteMany({}),
      db.seo_metadata.deleteMany({}),
      db.activity_logs.deleteMany({}),
    ]);
  } else if (existingSettings) {
    // Non-destructively migrate old Photoroom filename references to /logo.png & backfill new settings
    const patch: Record<string, any> = {};
    if (existingSettings.logoLightUrl === LEGACY_LOGO_PATH) patch.logoLightUrl = YRT_LOGO_PATH;
    if (existingSettings.logoDarkUrl === LEGACY_LOGO_PATH) patch.logoDarkUrl = YRT_LOGO_PATH;
    if (existingSettings.faviconUrl === LEGACY_LOGO_PATH) patch.faviconUrl = YRT_LOGO_PATH;
    if (
      existingSettings.headquarters === 'Kathmandu · Singapore · London' ||
      String(existingSettings.headquarters || '').includes('London')
    ) {
      patch.headquarters = 'Kathmandu, Nepal (KTM HQ)';
    }
    if (existingSettings.whatsappUrl === undefined) patch.whatsappUrl = 'https://wa.me/97715550194';
    if (existingSettings.whatsappEnabled === undefined) patch.whatsappEnabled = true;
    if (existingSettings.reviewsEnabled === undefined) patch.reviewsEnabled = true;
    if (existingSettings.reviewMaxCount === undefined) patch.reviewMaxCount = 50;
    if (existingSettings.reviewPerSessionLimit === undefined) patch.reviewPerSessionLimit = 2;
    if (!existingSettings.homepageBackground) {
      patch.homepageBackground = {
        mode: 'stars',
        primaryColor: '#08080A',
        secondaryColor: '#18090D',
        imageUrl: '',
        starsEnabled: true,
        starColor: '#FFFFFF',
        starDensity: 110,
        overlayOpacity: 0.72,
      };
    }
    if (Object.keys(patch).length > 0 && existingSettings._id) {
      await db.site_settings.findByIdAndUpdate(String(existingSettings._id), patch);
    }
    const legacyMedia = await db.media.find({ url: LEGACY_LOGO_PATH });
    for (const m of legacyMedia) {
      if (m._id) {
        await db.media.findByIdAndUpdate(String(m._id), { url: YRT_LOGO_PATH, title: 'logo.png' });
      }
    }
    const legacySeo = await db.seo_metadata.find({ ogImage: LEGACY_LOGO_PATH });
    for (const s of legacySeo) {
      if (s._id) {
        await db.seo_metadata.findByIdAndUpdate(String(s._id), { ogImage: YRT_LOGO_PATH });
      }
    }
    // Remove Singapore/London hub copy from careers_callout if still starter copy
    const careersSec = await db.page_sections.findOne({ pageSlug: 'home', sectionKey: 'careers_callout' });
    if (careersSec && String(careersSec.description || '').includes('Singapore, London')) {
      await db.page_sections.findByIdAndUpdate(String(careersSec._id), {
        description:
          'We are hiring broadcast directors, tournament administrators, jersey & motion designers, and partnership strategists headquartered at our Kathmandu (KTM) studio.',
      });
    }
  }

  // 1. Admin Users
  if ((await db.admin_users.countDocuments()) === 0) {
    const adminPass = await hashPassword('Admin@2026!');
    const editorPass = await hashPassword('Editor@2026!');
    const hrPass = await hashPassword('HR@2026!');
    await db.admin_users.insertMany([
      {
        name: 'Aarav Shrestha',
        email: 'admin@yrtesports.gg',
        passwordHash: adminPass,
        role: 'super_admin',
        avatarUrl: IMG_EXEC_1,
        active: true,
      },
      {
        name: 'Elena Rostova',
        email: 'editor@yrtesports.gg',
        passwordHash: editorPass,
        role: 'content_manager',
        avatarUrl: IMG_EXEC_2,
        active: true,
      },
      {
        name: 'Devon Mercer',
        email: 'hr@yrtesports.gg',
        passwordHash: hrPass,
        role: 'hr_manager',
        avatarUrl: IMG_EXEC_3,
        active: true,
      },
    ]);
  }

  // 2. Themes
  let competitiveThemeId = '';
  if ((await db.themes.countDocuments()) === 0) {
    const createdThemes = await db.themes.insertMany([
      {
        slug: 'competitive-esports',
        name: 'Competitive Esports',
        description:
          'High-contrast obsidian black, matte charcoal surfaces, bold crimson highlights, and condensed athletic typography.',
        bgColor: '#08080A',
        surfaceColor: '#111115',
        surfaceElevatedColor: '#18181D',
        textColor: '#F8FAFC',
        mutedTextColor: '#94A3B8',
        primaryColor: '#DC2626',
        primaryHoverColor: '#B91C1C',
        secondaryColor: '#EF4444',
        borderColor: 'rgba(255, 255, 255, 0.09)',
        headingFont: 'Barlow Condensed',
        bodyFont: 'Plus Jakarta Sans',
        buttonStyle: 'sharp',
        gradientAccent: 'linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%)',
        isDefault: true,
      },
      {
        slug: 'luxury-gold',
        name: 'Luxury Gold',
        description:
          'Deep jet-black canvas paired with metallic champagne gold accents, refined serif & geometric display pairings, and architectural borders.',
        bgColor: '#070708',
        surfaceColor: '#101012',
        surfaceElevatedColor: '#17171B',
        textColor: '#F5F2EB',
        mutedTextColor: '#A19D94',
        primaryColor: '#D4AF37',
        primaryHoverColor: '#B89427',
        secondaryColor: '#F3E5AB',
        borderColor: 'rgba(212, 175, 55, 0.22)',
        headingFont: 'Playfair Display',
        bodyFont: 'DM Sans',
        buttonStyle: 'editorial',
        gradientAccent: 'linear-gradient(135deg, #D4AF37 0%, #8C6D1F 100%)',
        isDefault: false,
      },
    ]);
    competitiveThemeId = createdThemes[0]._id;
  } else {
    const first = await db.themes.findOne({ slug: 'competitive-esports' });
    competitiveThemeId = first?._id || '';
  }

  // 3. Site Settings
  if ((await db.site_settings.countDocuments()) === 0) {
    await db.site_settings.create({
      organizationName: 'YRT Esports',
      tagline: 'International Esports Production & Tournament Agency',
      description:
        'End-to-end tournament operations, YRT Production broadcast studios, competitive roster management, and strategic brand partnerships.',
      logoLightUrl: YRT_LOGO_PATH,
      logoDarkUrl: YRT_LOGO_PATH,
      faviconUrl: YRT_LOGO_PATH,
      activeThemeId: competitiveThemeId,
      contactEmail: 'partnerships@yrtesports.gg',
      contactPhone: '+977 1-555-0194',
      headquarters: 'Kathmandu, Nepal (KTM HQ)',
      footerCopyright: 'YRT Esports & YRT Production. All rights reserved.',
      footerBio:
        'YRT Esports architects championship-grade competitive circuits, live arena broadcasts under YRT Production, and commercial esports partnerships worldwide.',
      visitorCount: 48290,
      analyticsId: 'G-YRT2026',
      whatsappUrl: 'https://wa.me/97715550194',
      whatsappEnabled: true,
      reviewsEnabled: true,
      reviewMaxCount: 50,
      reviewPerSessionLimit: 2,
      homepageBackground: {
        mode: 'stars',
        primaryColor: '#08080A',
        secondaryColor: '#18090D',
        imageUrl: '',
        starsEnabled: true,
        starColor: '#FFFFFF',
        starDensity: 110,
        overlayOpacity: 0.72,
      },
      socialLinks: {
        twitter: 'https://x.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com',
        twitch: 'https://twitch.tv',
        linkedin: 'https://linkedin.com',
        discord: 'https://discord.com',
      },
    });
  }

  // 4. Navigation
  if ((await db.navigation.countDocuments()) === 0) {
    await db.navigation.insertMany([
      { label: 'Services', path: '/services', order: 1, visible: true, isExternal: false, location: 'header' },
      { label: 'Work', path: '/portfolio', order: 2, visible: true, isExternal: false, location: 'header' },
      { label: 'Events', path: '/events', order: 3, visible: true, isExternal: false, location: 'header' },
      { label: 'Teams', path: '/team', order: 4, visible: true, isExternal: false, location: 'header' },
      { label: 'Reviews', path: '/reviews', order: 5, visible: true, isExternal: false, location: 'header' },
      { label: 'About Us', path: '/about', order: 1, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Leadership & Staff', path: '/team', order: 2, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Client Reviews', path: '/reviews', order: 3, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Careers', path: '/careers', order: 4, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Journal', path: '/blog', order: 5, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Contact', path: '/contact', order: 6, visible: true, isExternal: false, location: 'footer_company' },
      { label: 'Tournament Operations', path: '/services/esports-tournament-organization', order: 1, visible: true, isExternal: false, location: 'footer_services' },
      { label: 'Jersey Printing & Design', path: '/services/jersey-printing-design', order: 2, visible: true, isExternal: false, location: 'footer_services' },
      { label: 'Gaming & Esports Services', path: '/services/gaming-esports-services', order: 3, visible: true, isExternal: false, location: 'footer_services' },
      { label: 'Designer & Creative Production', path: '/services/designer-creative-production', order: 4, visible: true, isExternal: false, location: 'footer_services' },
    ]);
  } else {
    const reviewsNav = await db.navigation.findOne({ path: '/reviews', location: 'header' });
    if (!reviewsNav) {
      const existingHeader = await db.navigation.find({ location: 'header' });
      const journalNav = existingHeader.find((n: any) => n.path === '/blog');
      if (journalNav) {
        await db.navigation.findByIdAndUpdate(String(journalNav._id), { label: 'Reviews', path: '/reviews' });
      } else {
        await db.navigation.create({
          label: 'Reviews',
          path: '/reviews',
          order: 5,
          visible: true,
          isExternal: false,
          location: 'header',
        });
      }
    }
    const teamNav = await db.navigation.findOne({ path: '/team', location: 'header' });
    if (teamNav && teamNav.label === 'Team') {
      await db.navigation.findByIdAndUpdate(String(teamNav._id), { label: 'Teams' });
    }
  }

  // 5. Pages & Page Sections
  if ((await db.pages.countDocuments()) === 0) {
    await db.pages.insertMany([
      { slug: 'home', title: 'Home', status: 'published' },
      { slug: 'about', title: 'About Us', status: 'published' },
      { slug: 'services', title: 'Services', status: 'published' },
      { slug: 'portfolio', title: 'Portfolio', status: 'published' },
      { slug: 'events', title: 'Events & Tournaments', status: 'published' },
      { slug: 'team', title: 'Our Team', status: 'published' },
      { slug: 'reviews', title: 'Client Reviews', status: 'published' },
      { slug: 'careers', title: 'Careers', status: 'published' },
      { slug: 'blog', title: 'Blog & News', status: 'published' },
      { slug: 'contact', title: 'Contact', status: 'published' },
    ]);
  } else {
    const revPage = await db.pages.findOne({ slug: 'reviews' });
    if (!revPage) {
      await db.pages.create({ slug: 'reviews', title: 'Client Reviews', status: 'published' });
    }
  }

  if ((await db.page_sections.countDocuments()) === 0) {
    await db.page_sections.insertMany([
      {
        pageSlug: 'home',
        sectionKey: 'hero',
        title: 'Engineering the Next Era of Global Esports',
        subtitle: 'YRT Esports & YRT Production',
        description:
          'We design, operate, and broadcast championship-caliber esports leagues, arena spectacles, and commercial brand ecosystems across Asia, Europe, and global digital stages.',
        imageUrl: IMG_HERO,
        ctaText: 'Start a Project',
        ctaLink: '/contact',
        secondaryCtaText: 'Explore Our Work',
        secondaryCtaLink: '/portfolio',
        layout: 'split',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'organization_intro',
        title: 'Built for Broadcast Precision and Competitive Integrity',
        subtitle: 'Organization Overview',
        description:
          'From packed LAN finals to multi-language remote studio feeds powered by YRT Production, YRT Esports unites tournament architecture, real-time broadcast graphics, and sponsorship activation under one roof.',
        imageUrl: IMG_STUDIO,
        ctaText: 'About YRT Esports',
        ctaLink: '/about',
        layout: 'split',
        order: 2,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'company_stats',
        title: 'Operational Scale Across Global Circuits',
        subtitle: 'Verified Impact',
        description: 'Audited performance metrics across our global tournament and broadcast operations (2021–2026).',
        layout: 'stats',
        order: 3,
        enabled: true,
        isDraft: false,
        items: [
          { id: 's1', value: '140+', label: 'Sanctioned Tournaments Produced', meta: 'LAN & Regional Circuits' },
          { id: 's2', value: '68M+', label: 'Live Broadcast Hours Watched', meta: 'Multi-Platform Distribution' },
          { id: 's3', value: '$14.5M', label: 'Prize Pools Administered', meta: 'Zero Payout Delays' },
          { id: 's4', value: '32', label: 'Countries Reached', meta: '12 Broadcast Languages' },
        ],
      },
      {
        pageSlug: 'home',
        sectionKey: 'services_showcase',
        title: 'Core Agency Capabilities',
        subtitle: 'Full-Stack Esports Execution',
        description:
          'Modular production and advisory units engineered for game publishers, global hardware brands, and competitive franchises.',
        ctaText: 'View All Services',
        ctaLink: '/services',
        layout: 'grid',
        order: 4,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'featured_events',
        title: 'Tournaments & Live Circuits',
        subtitle: 'Competitive Calendar',
        description: 'Flagship championships currently in production, live broadcast, and seasonal archive.',
        ctaText: 'Full Event Calendar',
        ctaLink: '/events',
        layout: 'grid',
        order: 5,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'portfolio_showcase',
        title: 'Selected Case Studies',
        subtitle: 'Our Work',
        description: 'Recent arena builds, publisher activations, and international league operations.',
        ctaText: 'Browse Full Portfolio',
        ctaLink: '/portfolio',
        layout: 'grid',
        order: 6,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'partners_strip',
        title: 'Trusted by Publishers & Global Sponsors',
        subtitle: 'Partner Network',
        description: 'Long-term production and commercial partnerships across gaming hardware, telecom, and publishing.',
        layout: 'grid',
        order: 7,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'leadership_team',
        title: 'The Leadership Behind the Broadcast',
        subtitle: 'Executive & Production Leads',
        description: 'Veterans of international arena production, competitive integrity, and publisher marketing.',
        ctaText: 'Meet Full Directory',
        ctaLink: '/team',
        layout: 'grid',
        order: 8,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'testimonials_section',
        title: 'Partner Outcomes & Client Perspectives',
        subtitle: 'Client Feedback',
        description: 'Verified impact reports from league commissioners and global brand directors.',
        layout: 'grid',
        order: 9,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'latest_blog',
        title: 'Dispatches & Industry Analysis',
        subtitle: 'Editorial Journal',
        description: 'Post-mortems, broadcast engineering notes, and market intelligence from the YRT Production desk.',
        ctaText: 'Read All Articles',
        ctaLink: '/blog',
        layout: 'grid',
        order: 10,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'careers_callout',
        title: 'Build Championship Moments With YRT Esports',
        subtitle: 'Open Roles',
        description:
          'We are hiring broadcast directors, tournament administrators, jersey & motion designers, and partnership strategists headquartered at our Kathmandu (KTM) studio.',
        ctaText: 'Explore Open Positions',
        ctaLink: '/careers',
        layout: 'banner',
        order: 11,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'home',
        sectionKey: 'contact_cta',
        title: 'Ready to Launch Your Next Tournament or Campaign?',
        subtitle: 'Direct Consultation',
        description:
          'Share your tournament brief, broadcast timeline, or sponsorship objectives. Our executive producers respond within 24 business hours.',
        ctaText: 'Request Production Proposal',
        ctaLink: '/contact',
        layout: 'centered',
        order: 12,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'about',
        sectionKey: 'about_hero',
        title: 'Where Competitive Rigor Meets Broadcast Craft',
        subtitle: 'About YRT Esports',
        description:
          'Founded by competitive esports pioneers and broadcast engineers, YRT Esports and its studio arm YRT Production bridge grassroots competition with stadium-scale media production.',
        imageUrl: IMG_STUDIO,
        layout: 'split',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'about',
        sectionKey: 'mission_vision',
        title: 'Mission, Vision & Competitive Values',
        subtitle: 'Operating Principles',
        description:
          'Every decision on stage and in the control room is governed by competitive fairness, technical redundancy, and measurable ROI for our publishing partners.',
        layout: 'grid',
        order: 2,
        enabled: true,
        isDraft: false,
        items: [
          {
            id: 'mv1',
            title: 'Our Mission',
            description:
              'Deliver zero-compromise tournament infrastructure and broadcast storytelling that elevates players, games, and partners worldwide.',
          },
          {
            id: 'mv2',
            title: 'Our Vision',
            description:
              'Establish the premier international standard for sustainable esports ecosystems connecting South Asia, APAC, MENA, and Europe.',
          },
          {
            id: 'mv3',
            title: 'Zero-Downtime Redundancy',
            description: 'Dual fiber routing, backup observer rigs, and hardware failover on every live show.',
          },
          {
            id: 'mv4',
            title: 'Competitive Integrity',
            description: 'Independent referee panels, anti-cheat telemetry audits, and transparent rulebook governance.',
          },
        ],
      },
      {
        pageSlug: 'about',
        sectionKey: 'company_timeline',
        title: 'Five Years of International Expansion',
        subtitle: 'Company History',
        description: 'Key milestones from our founding broadcast desk to multi-continental arena finals.',
        layout: 'timeline',
        order: 3,
        enabled: true,
        isDraft: false,
        items: [
          {
            id: 't1',
            year: '2021',
            title: 'YRT Production Studio Launch',
            description: 'Opened our first multi-booth esports broadcast control room and tournament admin desk.',
          },
          {
            id: 't2',
            year: '2022',
            title: 'Regional Publisher Series',
            description: 'Appointed lead tournament operator for flagship South Asia and SEA tactical shooter circuits.',
          },
          {
            id: 't3',
            year: '2024',
            title: 'Singapore & London Expansion',
            description: 'Expanded into 24/7 follow-the-sun broadcast operations with dedicated Unreal Engine graphics teams.',
          },
          {
            id: 't4',
            year: '2026',
            title: 'Global Championship Architecture',
            description: 'Surpassed 68M live broadcast hours watched and $14.5M administered in tournament prize pools.',
          },
        ],
      },
      {
        pageSlug: 'about',
        sectionKey: 'org_gallery',
        title: 'Inside Our Arenas & Control Rooms',
        subtitle: 'Production Gallery',
        description: 'Snapshots from recent championship stages and YRT Production setups.',
        layout: 'grid',
        order: 4,
        enabled: true,
        isDraft: false,
        items: [
          { id: 'g1', title: 'Championship Main Stage', imageUrl: IMG_HERO, meta: 'Arena Build · 2026' },
          { id: 'g2', title: 'YRT Master Control Room', imageUrl: IMG_STUDIO, meta: '4K HDR Broadcast' },
          { id: 'g3', title: 'Grand Finals Crowd Floor', imageUrl: IMG_EVENT, meta: '12,000 Capacity LAN' },
        ],
      },
      {
        pageSlug: 'services',
        sectionKey: 'services_header',
        title: 'End-to-End Esports Production & Advisory',
        subtitle: 'Services',
        description:
          'Select any capability below to inspect deliverables, technical workflows, and past deployment benchmarks.',
        imageUrl: IMG_STUDIO,
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'portfolio',
        sectionKey: 'portfolio_header',
        title: 'Championships, Broadcasts & Activations',
        subtitle: 'Our Work',
        description:
          'Filter completed engagements by competitive title, production discipline, year, and event format.',
        imageUrl: IMG_HERO,
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'events',
        sectionKey: 'events_header',
        title: 'Global Tournament Calendar & Results',
        subtitle: 'Events & Tournaments',
        description:
          'Track upcoming qualifiers, live ongoing leagues, and verified standings from completed LAN championships.',
        imageUrl: IMG_EVENT,
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'team',
        sectionKey: 'team_header',
        title: 'Producers, Operators & Strategists',
        subtitle: 'Our Team',
        description:
          'Meet the permanent leadership, broadcast engineers, tournament referees, and alumni who power YRT Esports.',
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'careers',
        sectionKey: 'careers_header',
        title: 'Join Our International Production Team',
        subtitle: 'Careers & Recruitment',
        description:
          'Browse open full-time, contract, and seasonal tournament positions. Submit your CV directly to our HR pipeline.',
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'blog',
        sectionKey: 'blog_header',
        title: 'Editorial Dispatches & Case Notes',
        subtitle: 'Journal & News',
        description:
          'Deep dives into broadcast technology, tournament economics, and competitive ecosystem design.',
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
      {
        pageSlug: 'contact',
        sectionKey: 'contact_header',
        title: 'Start a Conversation With Our Executive Desk',
        subtitle: 'Contact Us',
        description:
          'Whether commissioning a global championship or exploring brand sponsorships, connect with YRT Esports directly.',
        layout: 'centered',
        order: 1,
        enabled: true,
        isDraft: false,
      },
    ]);
  }

  // 6. Services
  if ((await db.services.countDocuments()) === 0) {
    await db.services.insertMany([
      {
        slug: 'esports-tournament-organization',
        title: 'Esports Tournament Organization',
        shortDescription: 'Full-cycle league architecture, rulebooks, bracket operations, and international refereeing.',
        fullDescription:
          'We architect competitive circuits from open qualifiers to stadium finals. Our tournament administration unit handles anti-cheat compliance, player travel logistics, rulebook authoring, seeding algorithms, and verified prize pool disbursement.',
        deliverables: [
          'Custom tournament format & competitive rulebook',
          'Dedicated head admins & multilingual player support',
          'Anti-cheat & integrity verification workflows',
          'Automated bracket ops & prize disbursement',
        ],
        processSteps: [
          { title: 'Format Blueprint', detail: 'Calibrating regional slots, tiebreakers, and seasonal calendars.' },
          { title: 'Platform & Verification', detail: 'Deploying player check-in, lobby orchestration, and anti-cheat checks.' },
          { title: 'Live Admin Execution', detail: 'Real-time dispute resolution and schedule integrity across matchdays.' },
        ],
        imageUrl: IMG_EVENT,
        iconName: 'Trophy',
        order: 1,
        featured: true,
        status: 'published',
      },
      {
        slug: 'tournament-production',
        title: 'Tournament Production',
        shortDescription: 'Stage engineering, player booth setups, LAN networking, and show-calling for live venues.',
        fullDescription:
          'Turnkey arena and studio production designed for zero-latency LAN competition. From bespoke acoustic player booths and stage LED monoliths to match-day run-of-show execution.',
        deliverables: [
          'Arena stage CAD & LED scenic design',
          'Zero-latency LAN server & player PC provisioning',
          'On-site show-calling & stage management',
          'VIP hospitality & fan activation zones',
        ],
        processSteps: [
          { title: 'Venue Technical Survey', detail: 'Power, rigging, fiber redundancy, and acoustic mapping.' },
          { title: 'Hardware Staging', detail: 'Identical tournament-spec PCs, monitors, and audio isolation.' },
          { title: 'Live Show Direction', detail: 'Synchronized lighting, walkouts, and broadcast handoffs.' },
        ],
        imageUrl: IMG_HERO,
        iconName: 'Layers',
        order: 2,
        featured: true,
        status: 'published',
      },
      {
        slug: 'live-broadcast-production',
        title: 'Live Broadcast Production',
        shortDescription: 'Multi-camera 4K60 broadcast engineering, remote cloud workflows, and multi-language feeds.',
        fullDescription:
          'YRT Production master control rooms deliver resilient 4K60 HDR feeds across Twitch, YouTube, and linear sports networks, complete with dedicated observer teams and instant replay desks.',
        deliverables: [
          'Multi-feed 4K60 live switching & replay',
          'Dedicated in-game observer & replay directors',
          'Simultaneous multilingual clean-feed distribution',
          'Dual-path SRT/fiber redundancy',
        ],
        processSteps: [
          { title: 'Signal Architecture', detail: 'Designing cloud or on-prem MCR routing with dual-ISP failover.' },
          { title: 'Rehearsal & Calibration', detail: 'Audio leveling, observer sync, and talent IFB testing.' },
          { title: 'Global Simulcast', detail: 'Low-latency encoding to publisher and co-streamer endpoints.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'Tv',
        order: 3,
        featured: true,
        status: 'published',
      },
      {
        slug: 'broadcast-graphics',
        title: 'Broadcast Graphics',
        shortDescription: 'Real-time Vizrt/Unreal HUDs, live telemetry overlays, and dynamic match lower-thirds.',
        fullDescription:
          'Data-driven broadcast packages engineered to turn raw game API telemetry into broadcast-grade storytelling. We build custom match HUDs, draft screens, and augmented reality arena overlays.',
        deliverables: [
          'Live game-API telemetry HUD integration',
          '3D AR stage stingers & trophy reveals',
          'Automated sponsor integration & lower-thirds',
          'Complete motion identity toolkits',
        ],
        processSteps: [
          { title: 'Visual System Design', detail: 'Typography, motion physics, and legibility testing at 1080p/4K.' },
          { title: 'API Data Binding', detail: 'Connecting live match state and player stats to real-time templates.' },
          { title: 'Operator Control', detail: 'Streamlined control panels for live graphics operators.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'Sparkles',
        order: 4,
        featured: true,
        status: 'published',
      },
      {
        slug: 'esports-marketing',
        title: 'Esports Marketing',
        shortDescription: 'Campaign creative, co-streamer amplification, and measurable audience acquisition.',
        fullDescription:
          'Performance-backed marketing campaigns tailored to gaming audiences. We align creator watch-parties, paid social distribution, and community activations around major competitive milestones.',
        deliverables: [
          'Launch trailers & hype docuseries',
          'Tier-1 co-streamer & creator watch-party programs',
          'Cross-channel paid media & attribution',
          'Community quest & drop campaigns',
        ],
        processSteps: [
          { title: 'Audience Mapping', detail: 'Identifying high-affinity titles, creators, and regional channels.' },
          { title: 'Creative Production', detail: 'Producing cutdowns, key art, and creator toolkits.' },
          { title: 'Campaign Optimization', detail: 'Live viewership tracking and conversion attribution.' },
        ],
        imageUrl: IMG_EVENT,
        iconName: 'Megaphone',
        order: 5,
        featured: false,
        status: 'published',
      },
      {
        slug: 'event-management',
        title: 'Event Management',
        shortDescription: 'End-to-end venue operations, ticketing, talent hospitality, and on-ground security.',
        fullDescription:
          'Comprehensive live-event logistics covering venue contracting, accreditation, player and VIP hospitality, booth exhibitor management, and crowd safety.',
        deliverables: [
          'Venue sourcing & floorplan engineering',
          'Accreditation, security & crowd flow',
          'Player travel, visa & hotel concierge',
          'Exhibitor & merchandise village operations',
        ],
        processSteps: [
          { title: 'Pre-Production Logistics', detail: 'Permits, insurance, vendor RFPs, and travel manifests.' },
          { title: 'Load-In & Accreditation', detail: 'Coordinating freight, exhibitor builds, and press desks.' },
          { title: 'Event Execution', detail: 'On-site command center managing schedules and VIP operations.' },
        ],
        imageUrl: IMG_HERO,
        iconName: 'Calendar',
        order: 6,
        featured: false,
        status: 'published',
      },
      {
        slug: 'brand-partnerships',
        title: 'Brand Partnerships',
        shortDescription: 'Commercial rights packaging, sponsorship valuation, and authentic in-broadcast integrations.',
        fullDescription:
          'We connect non-endemic and hardware brands with premier esports properties through measurable sponsorship assets, broadcast segments, and physical booth experiences.',
        deliverables: [
          'Sponsorship deck & valuation modeling',
          'Native broadcast segment integration',
          'Post-campaign Nielsen/StreamsCharts reporting',
          'Long-term ambassador & team deals',
        ],
        processSteps: [
          { title: 'Commercial Audit', detail: 'Benchmarking inventory value and brand fit.' },
          { title: 'Activation Design', detail: 'Crafting organic broadcast moments rather than banner clutter.' },
          { title: 'ROI Reporting', detail: 'Verified media value, brand lift, and sentiment analytics.' },
        ],
        imageUrl: IMG_EVENT,
        iconName: 'Handshake',
        order: 7,
        featured: false,
        status: 'published',
      },
      {
        slug: 'social-media-management',
        title: 'Social Media Management',
        shortDescription: 'Real-time live clipping, editorial calendars, and multi-platform community growth.',
        fullDescription:
          'Always-on social newsrooms built for tournament pace. Our editors cut highlight reels within 90 seconds of match moments across X, TikTok, Instagram, and YouTube Shorts.',
        deliverables: [
          'Live match-day real-time clipping desk',
          'Platform-native vertical video production',
          'Daily editorial calendar & copywriting',
          'Community sentiment & growth reporting',
        ],
        processSteps: [
          { title: 'Voice & Playbook', detail: 'Establishing brand tone, visual templates, and response SLAs.' },
          { title: 'Live Publishing Desk', detail: 'Real-time match reactions and instant highlight distribution.' },
          { title: 'Monthly Analytics', detail: 'Engagement velocity, follower retention, and reach audits.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'Share2',
        order: 8,
        featured: false,
        status: 'published',
      },
      {
        slug: 'team-management',
        title: 'Team Management',
        shortDescription: 'Roster operations, performance coaching infrastructure, bootcamps, and player welfare.',
        fullDescription:
          'Structured operational support for competitive rosters—covering contract governance, international bootcamp logistics, sports psychology, and commercial appearance scheduling.',
        deliverables: [
          'Roster operations & contract administration',
          'Bootcamp facility & scrim scheduling',
          'Player welfare & performance analytics',
          'Commercial media training & deliverables',
        ],
        processSteps: [
          { title: 'Roster Audit', detail: 'Evaluating staff structure, scrim infrastructure, and compliance.' },
          { title: 'Operations Deployment', detail: 'Dedicated team managers and performance tracking.' },
          { title: 'Season Review', detail: 'Post-split contract, competitive, and commercial review.' },
        ],
        imageUrl: IMG_EXEC_1,
        iconName: 'Users',
        order: 9,
        featured: false,
        status: 'published',
      },
      {
        slug: 'esports-consulting',
        title: 'Esports Consulting',
        shortDescription: 'Market entry strategy, publisher league economics, and facility feasibility studies.',
        fullDescription:
          'Board-level advisory for game publishers, sports federations, and institutional investors entering competitive gaming—backed by proprietary cost models and global regulatory insight.',
        deliverables: [
          '3-year league P&L & ecosystem roadmap',
          'Publisher competitive policy & licensing strategy',
          'Esports arena & studio CAPEX feasibility',
          'M&A commercial due diligence',
        ],
        processSteps: [
          { title: 'Discovery & Benchmarks', detail: 'Auditing regional player bases, viewership, and cost structures.' },
          { title: 'Strategic Modeling', detail: 'Building executable operational and financial roadmaps.' },
          { title: 'Executive Handover', detail: 'Board presentation and implementation governance.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'Compass',
        order: 10,
        featured: false,
        status: 'published',
      },
      {
        slug: 'jersey-printing-design',
        title: 'Jersey Printing & Design Services',
        shortDescription: 'Custom sublimation pro-team jerseys, stage apparel, and tournament merchandise engineering.',
        fullDescription:
          'Bespoke esports kit design and full-sublimation apparel manufacturing for competitive rosters, collegiate teams, and event staff—engineered with breathable athletic fabrics and crisp sponsor branding.',
        deliverables: [
          'Custom pro-team 3D jersey mockups & pattern design',
          'Full dye-sublimation breathable micro-mesh production',
          'Player gamertag, squad crest & sponsor placement specs',
          'Event merch capsules & stage crew apparel kits',
        ],
        processSteps: [
          { title: 'Kit Concept & Crest Styling', detail: 'Developing team colorway systems and sponsor-ready cutlines.' },
          { title: 'Pre-Press Sublimation Proofing', detail: 'Color-calibrated digital fabric proofs and sizing runs.' },
          { title: 'Production & Team Delivery', detail: 'Batch manufacturing and direct dispatch to arena or bootcamp.' },
        ],
        imageUrl: IMG_HERO,
        iconName: 'Shirt',
        order: 11,
        featured: true,
        status: 'published',
      },
      {
        slug: 'gaming-esports-services',
        title: 'Gaming & Esports Services',
        shortDescription: 'Competitive league infrastructure, scrim rooms, anti-cheat governance, and grassroots community cups.',
        fullDescription:
          'Dedicated gaming operations spanning PUBG Mobile, Mobile Legends, League of Legends, Valorant, Counter-Strike, FIFA, and eFootball—supporting publishers, campus leagues, and pro organizations.',
        deliverables: [
          'Multi-title server lobbies & anti-cheat orchestration',
          'Qualifier brackets & live referee administration',
          'Collegiate & community tournament circuits',
          'Bootcamp hardware & LAN readiness support',
        ],
        processSteps: [
          { title: 'Game Ecosystem Alignment', detail: 'Customizing rulesets for MOBA, FPS, Battle Royale, and Sports titles.' },
          { title: 'Player Check-In & Match Ops', detail: 'Automated seeding, Discord/lobby coordination, and live rulings.' },
          { title: 'Broadcast & Highlight Handoff', detail: 'Feeding clean observer POVs directly to production control.' },
        ],
        imageUrl: IMG_EVENT,
        iconName: 'Gamepad2',
        order: 12,
        featured: true,
        status: 'published',
      },
      {
        slug: 'designer-creative-production',
        title: 'Designer & Creative Production Services',
        shortDescription: 'Key art direction, stage motion graphics, team visual identities, and 3D broadcast toolkits.',
        fullDescription:
          'Full-spectrum creative studio delivering championship key art, animated stream packages, team rebrands, social motion kits, and stage LED screen visuals tailored to high-energy gaming culture.',
        deliverables: [
          'Championship key art & tournament identity suites',
          'Animated stream stingers, match cards & stage LED visuals',
          'Team branding, crests & social campaign toolkits',
          'Video highlight reels, hype trailers & recaps',
        ],
        processSteps: [
          { title: 'Art Direction & Moodboards', detail: 'Setting bold visual language tailored to game title & audience.' },
          { title: '2D/3D Motion Fabrication', detail: 'Producing modular AE/Unreal/Figma production kits.' },
          { title: 'Live Asset Deployment', detail: 'Integrating creative suites across social, stage, and broadcast.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'PenTool',
        order: 13,
        featured: true,
        status: 'published',
      },
    ]);
  } else {
    // Non-destructively ensure core newly requested services exist if missing
    const extraStarterServices = [
      {
        slug: 'jersey-printing-design',
        title: 'Jersey Printing & Design Services',
        shortDescription: 'Custom sublimation pro-team jerseys, stage apparel, and tournament merchandise engineering.',
        fullDescription:
          'Bespoke esports kit design and full-sublimation apparel manufacturing for competitive rosters, collegiate teams, and event staff—engineered with breathable athletic fabrics and crisp sponsor branding.',
        deliverables: [
          'Custom pro-team 3D jersey mockups & pattern design',
          'Full dye-sublimation breathable micro-mesh production',
          'Player gamertag, squad crest & sponsor placement specs',
          'Event merch capsules & stage crew apparel kits',
        ],
        processSteps: [
          { title: 'Kit Concept & Crest Styling', detail: 'Developing team colorway systems and sponsor-ready cutlines.' },
          { title: 'Pre-Press Sublimation Proofing', detail: 'Color-calibrated digital fabric proofs and sizing runs.' },
          { title: 'Production & Team Delivery', detail: 'Batch manufacturing and direct dispatch to arena or bootcamp.' },
        ],
        imageUrl: IMG_HERO,
        iconName: 'Shirt',
        order: 11,
        featured: true,
        status: 'published',
      },
      {
        slug: 'gaming-esports-services',
        title: 'Gaming & Esports Services',
        shortDescription: 'Competitive league infrastructure, scrim rooms, anti-cheat governance, and grassroots community cups.',
        fullDescription:
          'Dedicated gaming operations spanning PUBG Mobile, Mobile Legends, League of Legends, Valorant, Counter-Strike, FIFA, and eFootball—supporting publishers, campus leagues, and pro organizations.',
        deliverables: [
          'Multi-title server lobbies & anti-cheat orchestration',
          'Qualifier brackets & live referee administration',
          'Collegiate & community tournament circuits',
          'Bootcamp hardware & LAN readiness support',
        ],
        processSteps: [
          { title: 'Game Ecosystem Alignment', detail: 'Customizing rulesets for MOBA, FPS, Battle Royale, and Sports titles.' },
          { title: 'Player Check-In & Match Ops', detail: 'Automated seeding, Discord/lobby coordination, and live rulings.' },
          { title: 'Broadcast & Highlight Handoff', detail: 'Feeding clean observer POVs directly to production control.' },
        ],
        imageUrl: IMG_EVENT,
        iconName: 'Gamepad2',
        order: 12,
        featured: true,
        status: 'published',
      },
      {
        slug: 'designer-creative-production',
        title: 'Designer & Creative Production Services',
        shortDescription: 'Key art direction, stage motion graphics, team visual identities, and 3D broadcast toolkits.',
        fullDescription:
          'Full-spectrum creative studio delivering championship key art, animated stream packages, team rebrands, social motion kits, and stage LED screen visuals tailored to high-energy gaming culture.',
        deliverables: [
          'Championship key art & tournament identity suites',
          'Animated stream stingers, match cards & stage LED visuals',
          'Team branding, crests & social campaign toolkits',
          'Video highlight reels, hype trailers & recaps',
        ],
        processSteps: [
          { title: 'Art Direction & Moodboards', detail: 'Setting bold visual language tailored to game title & audience.' },
          { title: '2D/3D Motion Fabrication', detail: 'Producing modular AE/Unreal/Figma production kits.' },
          { title: 'Live Asset Deployment', detail: 'Integrating creative suites across social, stage, and broadcast.' },
        ],
        imageUrl: IMG_STUDIO,
        iconName: 'PenTool',
        order: 13,
        featured: true,
        status: 'published',
      },
    ];
    for (const svc of extraStarterServices) {
      const exists = await db.services.findOne({ slug: svc.slug });
      if (!exists) {
        await db.services.create(svc);
      }
    }
  }

  // 7. Portfolio
  if ((await db.portfolio.countDocuments()) === 0) {
    await db.portfolio.insertMany([
      {
        title: 'YRT Continental Masters — Kathmandu & Singapore Finals',
        slug: 'yrt-continental-masters-finals',
        thumbnailUrl: IMG_HERO,
        coverUrl: IMG_HERO,
        gallery: [IMG_HERO, IMG_EVENT, IMG_STUDIO],
        description:
          'Full arena stage design, 12-team LAN tournament operations, and 4K HDR tri-lingual broadcast produced by YRT Production.',
        category: 'Arena Championship',
        projectType: 'End-to-End Production',
        gameTitle: 'Valorant',
        client: 'Regional Publisher Circuit',
        projectDate: 'August 2026',
        year: 2026,
        location: 'Singapore / Kathmandu',
        servicesProvided: ['Tournament Production', 'Live Broadcast Production', 'Broadcast Graphics'],
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        externalUrl: 'https://example.com',
        metrics: '284,000 Peak Concurrent Viewers · 11,500 Live Attendees',
        featured: true,
        status: 'published',
      },
      {
        title: 'Meridian Global Invitational',
        slug: 'meridian-global-invitational',
        thumbnailUrl: IMG_EVENT,
        coverUrl: IMG_EVENT,
        gallery: [IMG_EVENT, IMG_HERO],
        description:
          '20-squad international Battle Royale invitational featuring custom observer camera automation, live map telemetry overlays, and multi-stage VIP hospitality.',
        category: 'International Invitational',
        projectType: 'Broadcast & Admin',
        gameTitle: 'PUBG Mobile',
        client: 'Meridian Gaming Group',
        projectDate: 'May 2026',
        year: 2026,
        location: 'London, UK',
        servicesProvided: ['Esports Tournament Organization', 'Broadcast Graphics', 'Event Management'],
        videoUrl: '',
        externalUrl: 'https://example.com',
        metrics: '4.2M Total Broadcast Hours · 99.98% Stream Uptime',
        featured: true,
        status: 'published',
      },
      {
        title: 'South Asia Telecom Pro Circuit Season 4',
        slug: 'south-asia-telecom-pro-circuit',
        thumbnailUrl: IMG_STUDIO,
        coverUrl: IMG_STUDIO,
        gallery: [IMG_STUDIO, IMG_EVENT],
        description:
          'Eight-week regional franchise league operated from the YRT Production Master Control Room with real-time sponsor telemetry integrations.',
        category: 'National League',
        projectType: 'Remote Broadcast',
        gameTitle: 'Counter-Strike 2',
        client: 'Telco Esports Division',
        projectDate: 'March 2026',
        year: 2026,
        location: 'Kathmandu / Remote',
        servicesProvided: ['Live Broadcast Production', 'Brand Partnerships', 'Social Media Management'],
        videoUrl: '',
        externalUrl: 'https://example.com',
        metrics: '+162% YoY Brand Recall · 18M Social Impressions',
        featured: true,
        status: 'published',
      },
      {
        title: 'APAC Mobile Legends Collegiate Cup',
        slug: 'apac-collegiate-cup',
        thumbnailUrl: IMG_EVENT,
        coverUrl: IMG_EVENT,
        gallery: [IMG_EVENT, IMG_STUDIO],
        description:
          'Pan-regional university tournament spanning 640 campuses across South & Southeast Asia with automated bracket verification.',
        category: 'Collegiate & Grassroots',
        projectType: 'Tournament Operations',
        gameTitle: 'Mobile Legends',
        client: 'Horizon Interactive',
        projectDate: 'November 2025',
        year: 2025,
        location: 'Singapore',
        servicesProvided: ['Esports Tournament Organization', 'Esports Marketing'],
        videoUrl: '',
        externalUrl: 'https://example.com',
        metrics: '3,200 Registered Teams · 420 Match Broadcasts',
        featured: false,
        status: 'published',
      },
      {
        title: 'HyperCore Hardware Showcase LAN',
        slug: 'hypercore-hardware-showcase',
        thumbnailUrl: IMG_HERO,
        coverUrl: IMG_HERO,
        gallery: [IMG_HERO, IMG_STUDIO],
        description:
          'Bespoke creator showmatch and hardware launch broadcast integrating live peripheral latency telemetry into the broadcast HUD.',
        category: 'Brand Activation',
        projectType: 'Marketing & Showmatch',
        gameTitle: 'Rocket League',
        client: 'HyperCore Peripherals',
        projectDate: 'September 2025',
        year: 2025,
        location: 'Berlin, Germany',
        servicesProvided: ['Brand Partnerships', 'Broadcast Graphics', 'Esports Marketing'],
        videoUrl: '',
        externalUrl: 'https://example.com',
        metrics: '$1.8M Tracked Launch Revenue · 190K Live Peak',
        featured: false,
        status: 'published',
      },
    ]);
  }

  // 8. Events
  if ((await db.events.countDocuments()) === 0) {
    await db.events.insertMany([
      {
        title: 'YRT Winter Major 2026',
        slug: 'yrt-winter-major-2026',
        status: 'upcoming',
        bannerUrl: IMG_HERO,
        description:
          'Sixteen international contenders converge for our flagship winter championship, featuring a $500,000 prize pool and four-day arena finals produced by YRT Production.',
        gameCategory: 'Counter-Strike 2',
        location: 'Singapore Indoor Stadium',
        startDate: '2026-12-10',
        endDate: '2026-12-14',
        prizePool: '$500,000',
        teamsCount: 16,
        results: [],
        gallery: [IMG_HERO, IMG_EVENT],
        featured: true,
      },
      {
        title: 'YRT Masters Autumn Split',
        slug: 'yrt-masters-autumn-split',
        status: 'ongoing',
        bannerUrl: IMG_STUDIO,
        description:
          'Live weekly Swiss-stage competition broadcasting every Thursday through Sunday across English, Nepali, Hindi, and Bahasa feeds.',
        gameCategory: 'Valorant',
        location: 'YRT Studio / Online',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        prizePool: '$250,000',
        teamsCount: 24,
        results: [],
        gallery: [IMG_STUDIO],
        featured: true,
      },
      {
        title: 'Himalayan Invitational LAN 2026',
        slug: 'himalayan-invitational-lan-2026',
        status: 'completed',
        bannerUrl: IMG_EVENT,
        description:
          'Packed arena showdown showcasing top South Asian and APAC squads across five days of double-elimination competition.',
        gameCategory: 'PUBG Mobile',
        location: 'Kathmandu Arena',
        startDate: '2026-09-14',
        endDate: '2026-09-18',
        prizePool: '$400,000',
        teamsCount: 16,
        results: [
          { placement: '1st Place', team: 'YRT Crimson', prize: '$180,000' },
          { placement: '2nd Place', team: 'Team Zenith APAC', prize: '$95,000' },
          { placement: '3rd Place', team: 'Everest Five', prize: '$55,000' },
          { placement: '4th Place', team: 'Kestrel Gaming', prize: '$35,000' },
        ],
        gallery: [IMG_EVENT, IMG_HERO],
        featured: true,
      },
      {
        title: 'Summer Collegiate Championship Finals',
        slug: 'summer-collegiate-championship-finals',
        status: 'completed',
        bannerUrl: IMG_EVENT,
        description:
          'National inter-university LAN championship celebrating emerging amateur talent and broadcast production trainees.',
        gameCategory: 'Mobile Legends',
        location: 'London Studio Arena',
        startDate: '2026-07-08',
        endDate: '2026-07-10',
        prizePool: '$75,000',
        teamsCount: 16,
        results: [
          { placement: '1st Place', team: 'Imperial Phantoms', prize: '$35,000' },
          { placement: '2nd Place', team: 'Manchester Owls', prize: '$20,000' },
          { placement: '3rd Place', team: 'Edinburgh Stags', prize: '$12,000' },
        ],
        gallery: [IMG_EVENT],
        featured: false,
      },
    ]);
  }

  // 9. Departments
  if ((await db.departments.countDocuments()) === 0) {
    const deptNames = [
      'Management',
      'Administration',
      'Esports Operations',
      'Tournament Management',
      'Production',
      'Broadcast',
      'Graphics & Design',
      'Marketing',
      'Content Creation',
      'Technical Team',
    ];
    await db.departments.insertMany(
      deptNames.map((name, idx) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${name} division`,
        order: idx + 1,
      }))
    );
  }

  // 10. Staff
  if ((await db.staff.countDocuments()) === 0) {
    await db.staff.insertMany([
      {
        fullName: 'Aarav Shrestha',
        jobTitle: 'Founder & Chief Executive Officer',
        department: 'Management',
        bio: 'Founder of YRT Esports & YRT Production, directing international tournament circuits and publisher partnerships across Asia and Europe.',
        photoUrl: IMG_EXEC_1,
        email: 'aarav@yrtesports.gg',
        joiningDate: '2021-01-15',
        employmentStatus: 'current',
        featured: true,
        order: 1,
        socialLinks: { twitter: 'https://x.com', linkedin: 'https://linkedin.com' },
      },
      {
        fullName: 'Elena Rostova',
        jobTitle: 'VP of YRT Production',
        department: 'Broadcast',
        bio: 'Broadcast director overseeing multi-language 4K60 control rooms, observer workflows, and global satellite/SRT distribution.',
        photoUrl: IMG_EXEC_2,
        email: 'elena@yrtesports.gg',
        joiningDate: '2021-03-01',
        employmentStatus: 'current',
        featured: true,
        order: 2,
        socialLinks: { twitter: 'https://x.com', linkedin: 'https://linkedin.com' },
      },
      {
        fullName: 'Devon Mercer',
        jobTitle: 'Creative & Broadcast Graphics Director',
        department: 'Graphics & Design',
        bio: 'Leads real-time Unreal Engine AR stage packages, data-driven HUD systems, and brand identity across all YRT Esports properties.',
        photoUrl: IMG_EXEC_3,
        email: 'devon@yrtesports.gg',
        joiningDate: '2022-02-10',
        employmentStatus: 'current',
        featured: true,
        order: 3,
        socialLinks: { twitter: 'https://x.com', instagram: 'https://instagram.com' },
      },
      {
        fullName: 'Kieran Okafor',
        jobTitle: 'Head of Tournament Operations',
        department: 'Tournament Management',
        bio: 'Architects international rulebooks, anti-cheat governance, and 24-team LAN competitive schedules.',
        photoUrl: IMG_EXEC_1,
        email: 'kieran@yrtesports.gg',
        joiningDate: '2022-06-01',
        employmentStatus: 'current',
        featured: false,
        order: 4,
        socialLinks: { linkedin: 'https://linkedin.com' },
      },
      {
        fullName: 'Hannah Lindqvist',
        jobTitle: 'Director of Brand Partnerships',
        department: 'Marketing',
        bio: 'Structures commercial sponsorships, media valuation models, and co-branded fan activations with enterprise partners.',
        photoUrl: IMG_EXEC_2,
        email: 'hannah@yrtesports.gg',
        joiningDate: '2023-01-20',
        employmentStatus: 'current',
        featured: false,
        order: 5,
        socialLinks: { linkedin: 'https://linkedin.com' },
      },
      {
        fullName: 'Tariq Al-Mansoor',
        jobTitle: 'Lead Systems & LAN Engineer',
        department: 'Technical Team',
        bio: 'Designs zero-latency local server topologies, redundant fiber routing, and stage hardware deployments.',
        photoUrl: IMG_EXEC_3,
        email: 'tariq@yrtesports.gg',
        joiningDate: '2023-08-12',
        employmentStatus: 'current',
        featured: false,
        order: 6,
        socialLinks: { twitter: 'https://x.com' },
      },
      {
        fullName: 'Sora Takahashi',
        jobTitle: 'Senior Show Producer (2021–2024)',
        department: 'Production',
        bio: 'Directed opening ceremonies and live stage call-sheets for 18 LAN championships before moving to Tokyo.',
        photoUrl: IMG_EXEC_2,
        joiningDate: '2021-05-10',
        employmentStatus: 'former',
        featured: false,
        order: 7,
        socialLinks: { linkedin: 'https://linkedin.com' },
      },
      {
        fullName: 'Liam Gallagher',
        jobTitle: 'Broadcast Observer Fellow (Class of 2024)',
        department: 'Esports Operations',
        bio: 'Completed our competitive observer residency and now serves as lead tactical observer on international circuit broadcasts.',
        photoUrl: IMG_EXEC_3,
        joiningDate: '2024-01-15',
        employmentStatus: 'alumni',
        featured: false,
        order: 8,
        socialLinks: { twitter: 'https://x.com' },
      },
    ]);
  }

  // 11. Job Positions
  if ((await db.job_positions.countDocuments()) === 0) {
    await db.job_positions.insertMany([
      {
        title: 'Senior Live Broadcast Director',
        slug: 'senior-live-broadcast-director',
        department: 'Broadcast',
        employmentType: 'Full-time',
        location: 'Kathmandu / Singapore',
        workMode: 'On-site',
        description:
          'Lead live show-calling and multi-camera switching from the YRT Production Master Control Room across premier international esports circuits.',
        qualifications: [
          '4+ years directing live sports or tier-1 esports broadcasts',
          'Deep familiarity with Ross/vMix switching, EVS replay, and SRT workflows',
          'Ability to lead calm, decisive control room communications under live pressure',
        ],
        responsibilities: [
          'Call live camera, observer, and graphics cues for 8–10 hour match days',
          'Manage technical rehearsals and broadcast run-of-show documents',
          'Collaborate with executive producers on visual storytelling standards',
        ],
        deadline: '2026-12-31',
        active: true,
      },
      {
        title: 'Tournament Operations Manager',
        slug: 'tournament-operations-manager',
        department: 'Tournament Management',
        employmentType: 'Full-time',
        location: 'Singapore / Hybrid',
        workMode: 'Hybrid',
        description:
          'Own end-to-end competitive rulebook governance, bracket operations, and team communications for APAC and global circuits.',
        qualifications: [
          '3+ years in competitive tournament administration across FPS or Mobile titles',
          'Fluent in English; additional regional languages a strong advantage',
          'Experience with anti-cheat protocols and player dispute resolution',
        ],
        responsibilities: [
          'Author tournament rulesets and manage team onboarding',
          'Lead a roster of 12+ match referees during live splits',
          'Coordinate travel and venue check-ins for LAN playoffs',
        ],
        deadline: '2026-12-20',
        active: true,
      },
      {
        title: 'Real-Time Broadcast Motion Designer (Vizrt / Unreal)',
        slug: 'realtime-broadcast-motion-designer',
        department: 'Graphics & Design',
        employmentType: 'Full-time',
        location: 'Remote',
        workMode: 'Remote',
        description:
          'Build real-time data-bound HUD templates, AR arena stingers, and dynamic broadcast graphic systems for YRT Production.',
        qualifications: [
          'Portfolio demonstrating broadcast packages in Unreal Engine, Vizrt, or Singular.live',
          'Strong typographic discipline and motion timing sensibility',
          'Comfort binding JSON/WebSocket game telemetry to live templates',
        ],
        responsibilities: [
          'Design and deploy real-time HUD overlays for tactical shooter and MOBA titles',
          'Maintain brand-compliant motion toolkits for partner tournaments',
          'Support graphics operators during major LAN rehearsals',
        ],
        deadline: '2027-01-15',
        active: true,
      },
      {
        title: 'Esports Partnerships & Sponsorship Strategist',
        slug: 'esports-partnerships-strategist',
        department: 'Marketing',
        employmentType: 'Full-time',
        location: 'London / Remote',
        workMode: 'Hybrid',
        description:
          'Develop commercial sponsorship proposals, valuation frameworks, and brand activation concepts for global enterprise clients.',
        qualifications: [
          '3+ years in sports, gaming, or entertainment sponsorship strategy',
          'Strong commercial writing and spreadsheet valuation skills',
          'Proven track record pitching agency capabilities to brand directors',
        ],
        responsibilities: [
          'Build tailored sponsorship decks and ROI models',
          'Coordinate post-event media value and brand lift reporting',
          'Partner with production leads to ensure seamless on-air integrations',
        ],
        deadline: '2026-12-30',
        active: true,
      },
    ]);
  }

  // 12. Sample Job Applications
  if ((await db.job_applications.countDocuments()) === 0) {
    const firstJob = await db.job_positions.findOne({ slug: 'senior-live-broadcast-director' });
    if (firstJob) {
      await db.job_applications.insertMany([
        {
          positionId: firstJob._id,
          positionTitle: firstJob.title,
          fullName: 'Julian Vance-Kerr',
          email: 'julian.vk@example.com',
          phone: '+44 7700 900412',
          portfolioUrl: 'https://vimeo.com',
          cvUrl: '/api/public/sample-cv',
          cvOriginalName: 'Julian_VK_Broadcast_Director_CV.pdf',
          coverLetter:
            'Seven years directing live CS2 and Valorant studio broadcasts with Ross Carbonite and cloud SRT distribution.',
          status: 'Shortlisted',
          internalNotes: 'Strong control room reel; scheduled for technical interview with Elena.',
        },
        {
          positionId: firstJob._id,
          positionTitle: firstJob.title,
          fullName: 'Nadia Benali',
          email: 'nadia.benali@example.com',
          phone: '+33 6 12 34 56 78',
          portfolioUrl: 'https://behance.net',
          cvUrl: '/api/public/sample-cv',
          cvOriginalName: 'Nadia_Benali_CV_2026.pdf',
          coverLetter:
            'Broadcast producer and director specializing in multilingual tournament feeds and replay workflows.',
          status: 'New',
          internalNotes: '',
        },
      ]);
    }
  }

  // 13. Blog Categories & Posts
  if ((await db.blog_categories.countDocuments()) === 0) {
    await db.blog_categories.insertMany([
      { name: 'Broadcast Engineering', slug: 'broadcast-engineering', description: 'Control room & technical case notes' },
      { name: 'Tournament Operations', slug: 'tournament-operations', description: 'Competitive integrity & league formats' },
      { name: 'Brand Strategy', slug: 'brand-strategy', description: 'Commercial partnerships & ROI' },
      { name: 'Company News', slug: 'company-news', description: 'Announcements and milestones' },
    ]);
  }

  if ((await db.blog_posts.countDocuments()) === 0) {
    await db.blog_posts.insertMany([
      {
        title: 'Architecting Sub-Second Redundancy for 4K60 Arena Broadcasts',
        slug: 'architecting-sub-second-redundancy-4k60-broadcasts',
        excerpt:
          'How YRT Production eliminates single points of failure across dark fiber, SRT cloud ingest, and on-stage player PCs.',
        content:
          '<p>When 11,000 fans fill an arena and 280,000 viewers watch online, thirty seconds of dead air erodes months of partner goodwill. At YRT Esports, every championship broadcast begins with an N+1 redundancy matrix.</p><h3>Dual-Path Signal Transport</h3><p>Every stage camera and observer feed enters redundant fiber multiplexers before hitting our primary and hot-standby switching cores. Should an encoder experience frame drift, downstream distribution switches cleanly within two frames.</p><h3>Telemetry-Synchronized Replays</h3><p>By pairing live game-state APIs with multi-channel EVS replay servers, our directors surface tactical breakdowns within four seconds of a round end without interrupting match cadence.</p>',
        coverImageUrl: IMG_STUDIO,
        category: 'Broadcast Engineering',
        tags: ['4K60', 'SRT', 'Redundancy', 'YRT Production'],
        authorName: 'Elena Rostova',
        authorRole: 'VP of YRT Production',
        authorAvatar: IMG_EXEC_2,
        status: 'published',
        publishedAt: '2026-11-12',
        featured: true,
        seoTitle: '4K60 Esports Broadcast Redundancy Architecture | YRT Esports',
        seoDescription: 'Inside the dual-path fiber and SRT architecture powering zero-downtime esports arena broadcasts.',
        readTime: '5 min read',
      },
      {
        title: 'Designing Sponsorship Integrations Viewers Actually Respect',
        slug: 'designing-sponsorship-integrations-viewers-respect',
        excerpt:
          'Moving beyond static corner logos toward native telemetry segments that deliver measurable brand lift.',
        content:
          '<p>Esports audiences are acutely sensitive to intrusive advertising. The highest-performing partnerships feel woven directly into the analytical storytelling of the match.</p><h3>Telemetry-Linked Segments</h3><p>Instead of interrupting gameplay with banner overlays, our graphics team ties partner branding to tactical moments: economy buy-round predictors, player POV replay sponsorships, and post-map statistical summaries.</p><h3>Verified Attribution</h3><p>Every campaign concludes with audited viewership minute-by-minute reports, social clip velocity, and direct conversion attribution.</p>',
        coverImageUrl: IMG_EVENT,
        category: 'Brand Strategy',
        tags: ['Sponsorships', 'ROI', 'Broadcast Graphics'],
        authorName: 'Hannah Lindqvist',
        authorRole: 'Director of Brand Partnerships',
        authorAvatar: IMG_EXEC_2,
        status: 'published',
        publishedAt: '2026-10-28',
        featured: false,
        seoTitle: 'Authentic Esports Sponsorship Integrations | YRT Esports',
        seoDescription: 'How telemetry-driven broadcast integrations increase sponsor recall without disrupting competitive broadcasts.',
        readTime: '4 min read',
      },
      {
        title: 'Why Swiss Formats Changed Mid-Season League Retention',
        slug: 'why-swiss-formats-changed-league-retention',
        excerpt:
          'Analyzing viewership stability and competitive parity across 140 sanctioned tournaments.',
        content:
          '<p>Dead-rubber matches are the quiet killer of round-robin esports leagues. Over the past three seasons, transitioning publisher circuits to dynamic Buchholz-seeded Swiss stages increased late-week viewership retention by 34%.</p><p>Every series carries immediate qualification or elimination stakes, keeping fans invested from opening week through playoffs.</p>',
        coverImageUrl: IMG_HERO,
        category: 'Tournament Operations',
        tags: ['Swiss Format', 'League Design', 'Viewership'],
        authorName: 'Kieran Okafor',
        authorRole: 'Head of Tournament Operations',
        authorAvatar: IMG_EXEC_1,
        status: 'published',
        publishedAt: '2026-10-14',
        featured: false,
        seoTitle: 'Swiss Tournament Formats & Viewership Retention | YRT Esports',
        seoDescription: 'Data-backed insights on how Swiss brackets improve competitive stakes and broadcast retention.',
        readTime: '6 min read',
      },
    ]);
  }

  // 14. Testimonials
  if ((await db.testimonials.countDocuments()) === 0) {
    await db.testimonials.insertMany([
      {
        authorName: 'Henrik Lindholm',
        role: 'Head of Competitive Esports',
        organization: 'Nordic Publishing Group',
        quote:
          'YRT Esports took our regional circuit from fragmented community cups to a cohesive multi-nation broadcast product. YRT Production control room discipline and rulebook execution were flawless.',
        outcomeMetric: '+162% Peak Broadcast Viewership in Season 1',
        avatarUrl: IMG_EXEC_1,
        featured: true,
        order: 1,
      },
      {
        authorName: 'Claire Beaumont',
        role: 'Global Gaming Marketing Director',
        organization: 'HyperCore Peripherals',
        quote:
          'Instead of slapping our logo on a static ticker, YRT Production integrated real-time hardware telemetry directly into the broadcast HUD. It became our highest-converting gaming activation of the year.',
        outcomeMetric: '$1.8M Tracked Product Launch Revenue',
        avatarUrl: IMG_EXEC_2,
        featured: true,
        order: 2,
      },
      {
        authorName: 'Daniel Park',
        role: 'VP of Live Events',
        organization: 'Meridian Gaming Group',
        quote:
          'Managing 20 international squads on LAN requires relentless operational rigor. Every match started on schedule and our VIP partners experienced five-star hospitality.',
        outcomeMetric: '99.98% Broadcast Uptime Across 5 Arena Days',
        avatarUrl: IMG_EXEC_3,
        featured: true,
        order: 3,
      },
    ]);
  }

  // 15. Partners
  if ((await db.partners.countDocuments()) === 0) {
    await db.partners.insertMany([
      { name: 'HyperCore', logoUrl: partnerBadgeSvg('HYPERCORE', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Hardware Partner', featured: true, order: 1 },
      { name: 'Nordic Telco', logoUrl: partnerBadgeSvg('NORDIC TELCO', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Connectivity Partner', featured: true, order: 2 },
      { name: 'Meridian Games', logoUrl: partnerBadgeSvg('MERIDIAN', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Publisher Partner', featured: true, order: 3 },
      { name: 'Aegis Monitors', logoUrl: partnerBadgeSvg('AEGIS 360HZ', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Display Partner', featured: true, order: 4 },
      { name: 'Kestrel Audio', logoUrl: partnerBadgeSvg('KESTREL PRO', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Audio Partner', featured: true, order: 5 },
      { name: 'Horizon Cloud', logoUrl: partnerBadgeSvg('HORIZON', '#F8FAFC'), websiteUrl: 'https://example.com', tier: 'Infrastructure', featured: true, order: 6 },
    ]);
  }

  // 16. Contact Messages
  if ((await db.contact_messages.countDocuments()) === 0) {
    await db.contact_messages.insertMany([
      {
        name: 'Oliver Grant',
        email: 'oliver.grant@globalpublisher.com',
        subject: 'Q2 2027 Regional Championship RFP',
        category: 'Tournament Production',
        message:
          'We are preparing our 2027 championship RFP for a 16-team LAN finals in Q2 and would like to schedule a technical capability briefing with YRT Production.',
        read: false,
        status: 'new',
      },
      {
        name: 'Sophia Chen',
        email: 'sophia@kestrelaudio.io',
        subject: 'Broadcast Headset Sponsorship Package',
        category: 'Brand Partnerships',
        message:
          'Interested in exploring official audio partner inventory for the upcoming YRT Winter Major broadcast.',
        read: true,
        status: 'replied',
      },
    ]);
  }

  // 17. Media Library
  if ((await db.media.countDocuments()) === 0) {
    await db.media.insertMany([
      { title: 'YRT Esports / YRT Production Official Logo', url: YRT_LOGO_PATH, mimeType: 'image/png', size: 128000, folder: 'logos', altText: 'YRT Esports Official Logo' },
      { title: 'Championship Arena Stage', url: IMG_HERO, mimeType: 'image/jpeg', size: 420000, folder: 'events', altText: 'Main arena stage' },
      { title: 'Master Control Broadcast Room', url: IMG_STUDIO, mimeType: 'image/jpeg', size: 390000, folder: 'portfolio', altText: 'Broadcast control room' },
      { title: 'Grand Finals Arena Crowd', url: IMG_EVENT, mimeType: 'image/jpeg', size: 410000, folder: 'events', altText: 'Packed LAN finals crowd' },
      { title: 'Executive Portrait — Aarav Shrestha', url: IMG_EXEC_1, mimeType: 'image/jpeg', size: 210000, folder: 'staff', altText: 'Aarav Shrestha portrait' },
      { title: 'Executive Portrait — Elena Rostova', url: IMG_EXEC_2, mimeType: 'image/jpeg', size: 205000, folder: 'staff', altText: 'Elena Rostova portrait' },
      { title: 'Executive Portrait — Devon Mercer', url: IMG_EXEC_3, mimeType: 'image/jpeg', size: 215000, folder: 'staff', altText: 'Devon Mercer portrait' },
    ]);
  }

  // 18. SEO Metadata
  if ((await db.seo_metadata.countDocuments()) === 0) {
    await db.seo_metadata.insertMany([
      {
        pageSlug: 'home',
        metaTitle: 'YRT Esports – International Esports Production & Agency',
        metaDescription:
          'YRT Esports & YRT Production: tournament organization, 4K60 live broadcast production, broadcast graphics, and strategic brand partnerships.',
        ogImage: YRT_LOGO_PATH,
      },
      {
        pageSlug: 'about',
        metaTitle: 'About Us – YRT Esports',
        metaDescription: 'Learn about YRT Esports & YRT Production hubs, leadership team, and competitive values.',
        ogImage: IMG_STUDIO,
      },
      {
        pageSlug: 'services',
        metaTitle: 'Services – Tournament & Broadcast Production | YRT Esports',
        metaDescription: 'Explore our 10 specialized esports agency capabilities from LAN production to global brand partnerships.',
        ogImage: IMG_STUDIO,
      },
      {
        pageSlug: 'portfolio',
        metaTitle: 'Our Work & Case Studies | YRT Esports',
        metaDescription: 'Browse completed arena championships, publisher leagues, and brand activations.',
        ogImage: IMG_HERO,
      },
      {
        pageSlug: 'events',
        metaTitle: 'Events & Tournaments Calendar | YRT Esports',
        metaDescription: 'Upcoming majors, ongoing circuits, and verified results from completed championships.',
        ogImage: IMG_EVENT,
      },
      {
        pageSlug: 'team',
        metaTitle: 'Leadership & Staff Directory | YRT Esports',
        metaDescription: 'Meet the broadcast directors, tournament administrators, and creatives powering YRT Esports.',
        ogImage: IMG_EXEC_1,
      },
      {
        pageSlug: 'careers',
        metaTitle: 'Careers & Open Positions | YRT Esports',
        metaDescription: 'Join our production, broadcast, tournament operations, and partnership teams.',
        ogImage: IMG_STUDIO,
      },
      {
        pageSlug: 'blog',
        metaTitle: 'Journal & Industry Analysis | YRT Esports',
        metaDescription: 'Technical broadcast dispatches, tournament design insights, and agency announcements.',
        ogImage: IMG_STUDIO,
      },
      {
        pageSlug: 'contact',
        metaTitle: 'Contact Our Executive Desk | YRT Esports',
        metaDescription: 'Commission a tournament, live broadcast, or brand sponsorship partnership with YRT Esports.',
        ogImage: IMG_HERO,
      },
    ]);
  }

  // 19. Reviews
  if ((await db.reviews.countDocuments()) === 0) {
    await db.reviews.insertMany([
      {
        authorName: 'Tariq Al-Harbi',
        role: 'Esports Partnerships Lead',
        organization: 'Saudi Invitational Series',
        rating: 5,
        comment:
          'YRT Production handled our live stream broadcast, team graphics, and stage cueing from start to finish with zero dropped frames.',
        serviceUsed: 'Live Broadcast Production',
        status: 'published',
        featured: true,
      },
      {
        authorName: 'Sujan Maharjan',
        role: 'Team Manager',
        organization: 'Himalayan Vanguard',
        rating: 5,
        comment:
          'Our custom sublimated pro jerseys and stage apparel arrived ahead of LAN qualifiers with sharp print quality and breathable fabric.',
        serviceUsed: 'Jersey Printing & Design Services',
        status: 'published',
        featured: true,
      },
      {
        authorName: 'Riya Gurung',
        role: 'Brand Campaign Manager',
        organization: 'PLG & Regional Telecom',
        rating: 5,
        comment:
          'Seamless tournament administration across 128 squads in PUBG Mobile and Valorant. Transparent reporting and immediate communication.',
        serviceUsed: 'Gaming & Esports Services',
        status: 'published',
        featured: true,
      },
      {
        authorName: 'Kenji Takahashi',
        role: 'Creative Director',
        organization: 'Apex Creator Cup',
        rating: 5,
        comment:
          'Their designers elevated our entire broadcast package—from animated match overlays to key art posters that drove record signups.',
        serviceUsed: 'Designer & Creative Production Services',
        status: 'published',
        featured: false,
      },
    ]);
  }

  // 20. Sticky Notes (Movable & Layer-Organized)
  if ((await db.sticky_notes.countDocuments()) === 0) {
    await db.sticky_notes.insertMany([
      {
        title: 'Kathmandu HQ Live',
        content: 'Broadcast MCR & Tournament Desk open for Q4 championships and custom jersey orders.',
        color: 'crimson',
        x: 74,
        y: 20,
        width: 235,
        rotation: -1.5,
        zIndex: 32,
        layer: 'front',
        pageSlug: 'home',
        visible: true,
        pinned: false,
      },
      {
        title: 'Supported Circuits',
        content: 'PUBG Mobile · Mobile Legends · LoL · Valorant · CS2 · FIFA · eFootball.',
        color: 'amber',
        x: 78,
        y: 52,
        width: 225,
        rotation: 1.5,
        zIndex: 28,
        layer: 'mid',
        pageSlug: 'home',
        visible: false,
        pinned: false,
      },
    ]);
  }

  // 21. Activity Logs
  if ((await db.activity_logs.countDocuments()) === 0) {
    await db.activity_logs.create({
      adminEmail: 'admin@yrtesports.gg',
      adminName: 'Aarav Shrestha',
      action: 'INITIALIZED',
      entityType: 'system',
      entityTitle: 'YRT Esports CMS Database',
      details: 'Seeded initial themes, YRT branding, pages, services, portfolio, events, staff, reviews, sticky notes, and careers.',
    });
  }
}
