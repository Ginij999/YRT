import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Search, Share2 } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { BlogCategory, BlogPost, PageSection } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { ErrorPage } from './ErrorPage';
import {
  FALLBACK_BLOG_CATEGORIES,
  FALLBACK_BLOG_POSTS,
  FALLBACK_PAGE_SECTIONS,
  safeFetchJson,
} from '../data/fallbackData';

export const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK_BLOG_POSTS);
  const [categories, setCategories] = useState<BlogCategory[]>(FALLBACK_BLOG_CATEGORIES);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(FALLBACK_PAGE_SECTIONS.blog[0]);
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    Promise.all([
      safeFetchJson<BlogPost[]>('/api/public/blog', FALLBACK_BLOG_POSTS),
      safeFetchJson<BlogCategory[]>('/api/public/blog-categories', FALLBACK_BLOG_CATEGORIES),
      safeFetchJson<{ sections?: PageSection[] }>('/api/public/pages/blog', {
        sections: FALLBACK_PAGE_SECTIONS.blog,
      }),
    ]).then(([postData, catData, pageData]) => {
      setPosts(Array.isArray(postData) && postData.length > 0 ? postData : FALLBACK_BLOG_POSTS);
      setCategories(Array.isArray(catData) && catData.length > 0 ? catData : FALLBACK_BLOG_CATEGORIES);
      const secs: PageSection[] = pageData.sections || FALLBACK_PAGE_SECTIONS.blog;
      setHeaderSec(secs.find((s) => s.sectionKey === 'blog_header') || FALLBACK_PAGE_SECTIONS.blog[0]);
      setExtraSections(secs.filter((s) => s.sectionKey !== 'blog_header'));
    });
  }, []);

  const activePost = slug ? posts.find((p) => p.slug === slug) : null;

  usePageSeo(
    'blog',
    activePost ? activePost.seoTitle || `${activePost.title} – Journal` : undefined,
    activePost ? activePost.seoDescription || activePost.excerpt : undefined
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [posts, categoryFilter, searchQuery]);

  if (slug && !activePost) {
    return <ErrorPage code="404" />;
  }

  if (slug && activePost) {
    const related = posts.filter((p) => p._id !== activePost._id).slice(0, 2);
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const copyShareUrl = () => {
      navigator.clipboard?.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
      <article className="pt-28 pb-24">
        <div className="max-w-[860px] mx-auto px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold mb-8 hover:text-white transition-colors"
            style={{ color: 'var(--brand-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>

          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--brand-muted)' }}>
              <span style={{ color: 'var(--brand-accent)' }} className="font-semibold">
                {activePost.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activePost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{activePost.readTime}</span>
            </div>

            <h1
              className="font-display font-bold tracking-tight text-white text-balance leading-[1.08]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
            >
              {activePost.title}
            </h1>

            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
              {activePost.excerpt}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y mb-10" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="flex items-center gap-3">
              {activePost.authorAvatar && (
                <div className="w-10 h-10 overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
                  <MediaImage src={activePost.authorAvatar} alt={activePost.authorName} />
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-white">{activePost.authorName}</div>
                <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                  {activePost.authorRole}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShareUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium btn-brand-outline"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activePost.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium btn-brand-outline"
              >
                Post on X
              </a>
            </div>
          </div>

          <div className="aspect-[16/9] border overflow-hidden mb-10" style={{ borderColor: 'var(--brand-border)' }}>
            <MediaImage src={activePost.coverImageUrl} alt={activePost.title} loading="eager" />
          </div>

          <div
            className="prose prose-invert prose-neutral max-w-none text-neutral-200 leading-relaxed space-y-5 [&>h3]:font-display [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:pt-4"
            dangerouslySetInnerHTML={{ __html: activePost.content }}
          />

          {activePost.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
              Topics: <span className="text-neutral-200">{activePost.tags.join(' · ')}</span>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-16 pt-12 border-t space-y-6" style={{ borderColor: 'var(--brand-border)' }}>
              <h2 className="font-display text-2xl font-bold text-white">Related Dispatches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((item) => (
                  <Link
                    key={item._id}
                    to={`/blog/${item.slug}`}
                    className="group border p-5 space-y-2"
                    style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
                  >
                    <div className="text-xs" style={{ color: 'var(--brand-accent)' }}>
                      {item.category}
                    </div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:underline">
                      {item.title}
                    </h3>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--brand-muted)' }}>
                      {item.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Journal & News'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Editorial Dispatches & Case Notes'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {['All', ...categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold border transition-colors ${
                  categoryFilter === cat ? 'text-white' : 'text-neutral-300 hover:text-white'
                }`}
                style={{
                  borderColor: 'var(--brand-border)',
                  backgroundColor: categoryFilter === cat ? 'var(--brand-accent)' : 'var(--brand-surface)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-black/40 border text-white"
              style={{ borderColor: 'var(--brand-border)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPosts.map((post, idx) => (
            <Link
              key={post._id}
              to={`/blog/${post.slug}`}
              className={`group border overflow-hidden flex flex-col ${
                idx === 0 && categoryFilter === 'All' && !searchQuery ? 'md:col-span-2 lg:grid lg:grid-cols-12' : ''
              }`}
              style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
            >
              <div
                className={`${
                  idx === 0 && categoryFilter === 'All' && !searchQuery ? 'lg:col-span-6 min-h-[260px]' : 'aspect-[16/10]'
                } overflow-hidden`}
              >
                <MediaImage
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div
                className={`${
                  idx === 0 && categoryFilter === 'All' && !searchQuery ? 'lg:col-span-6' : ''
                } p-6 flex-1 flex flex-col justify-between space-y-4`}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-2 tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                    <span style={{ color: 'var(--brand-accent)' }} className="font-semibold">
                      {post.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{post.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white group-hover:underline underline-offset-4">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm line-clamp-3" style={{ color: 'var(--brand-muted)' }}>
                    {post.excerpt}
                  </p>
                </div>
                <div className="text-xs font-medium text-neutral-300">
                  By {post.authorName} · {post.authorRole}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};
