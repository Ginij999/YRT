import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { ReviewItem } from '../types/cms';
import { FillButtonContent } from '../components/FillButtonContent';
import { FALLBACK_REVIEWS, safeFetchJson } from '../data/fallbackData';

const REVIEW_FP_KEY = 'yrt_review_fp';
const REVIEW_SENT_KEY = 'yrt_review_sent_count';

function getSessionFingerprint(): string {
  try {
    let fp = localStorage.getItem(REVIEW_FP_KEY);
    if (!fp) {
      fp = `yrt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(REVIEW_FP_KEY, fp);
    }
    return fp;
  } catch {
    return 'yrt-session';
  }
}

const SERVICE_OPTIONS = [
  'Esports Tournament Production',
  'Live Broadcast Production',
  'Jersey Printing & Design Services',
  'Gaming & Esports Services',
  'Designer & Creative Production Services',
  'Brand Partnerships & Activation',
];

export const ReviewsPage: React.FC = () => {
  usePageSeo('reviews', 'Client Reviews & Testimonials', 'Verified feedback and ratings from tournament partners, teams, and esports brands.');

  const [reviews, setReviews] = useState<ReviewItem[]>(FALLBACK_REVIEWS);
  const [totalPublished, setTotalPublished] = useState(FALLBACK_REVIEWS.length);
  const [config, setConfig] = useState({
    reviewsEnabled: true,
    reviewMaxCount: 50,
    reviewPerSessionLimit: 2,
  });
  const [loading, setLoading] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [serviceUsed, setServiceUsed] = useState(SERVICE_OPTIONS[0]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localSubmittedCount, setLocalSubmittedCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(REVIEW_SENT_KEY) || '0');
    } catch {
      return 0;
    }
  });

  const loadReviews = async () => {
    try {
      const data = await safeFetchJson<{
        reviews?: ReviewItem[];
        totalPublished?: number;
        config?: typeof config;
      } | null>('/api/public/reviews', null);
      if (data) {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        setTotalPublished(Number(data.totalPublished ?? data.reviews?.length ?? 0));
        if (data.config) setConfig(data.config);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const totalCapReached = totalPublished >= config.reviewMaxCount;
  const sessionCapReached = localSubmittedCount >= config.reviewPerSessionLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          role,
          organization,
          serviceUsed,
          rating,
          comment,
          sessionFingerprint: getSessionFingerprint(),
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.toLowerCase().includes('application/json')) {
        setError('Review service unavailable on static preview without API server.');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit review.');
      } else {
        const nextCount = localSubmittedCount + 1;
        setLocalSubmittedCount(nextCount);
        try {
          localStorage.setItem(REVIEW_SENT_KEY, String(nextCount));
        } catch {
          // ignore
        }
        setSubmitted(true);
        setAuthorName('');
        setRole('');
        setOrganization('');
        setComment('');
        setRating(5);
        await loadReviews();
      }
    } catch {
      setError('Network error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6 space-y-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
        >
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--brand-accent)' }}>
              Verified Client Feedback
            </p>
            <h1
              className="font-display font-bold tracking-tight text-white leading-[1.03]"
              style={{ fontSize: 'clamp(2.35rem, 4.5vw, 4rem)' }}
            >
              Partner &amp; Client Reviews
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
              Ratings from tournament organizers, publishers, jersey apparel clients, and brand sponsors across our studio productions.
            </p>
          </div>

          <div className="apple-glass rounded-[2px] px-6 py-4 flex items-center gap-6 self-start lg:self-auto">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">Average Score</div>
              <div className="font-display text-3xl font-bold text-white flex items-center gap-2 tabular-nums">
                <span>{averageRating}</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">Published Cap</div>
              <div className="font-mono-num text-sm font-bold text-white tabular-nums">
                {totalPublished} / {config.reviewMaxCount}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Reviews Feed */}
          <div className="lg:col-span-7 space-y-5">
            {loading && reviews.length === 0 ? (
              <div className="p-8 rounded-[2px] apple-glass-card text-xs text-neutral-400">
                Loading client reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 rounded-[2px] apple-glass-card text-sm text-neutral-300">
                No reviews published yet. Be the first partner to leave feedback.
              </div>
            ) : (
              reviews.map((rev, idx) => (
                <motion.article
                  key={rev._id}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 rounded-[2px] apple-glass-card wise-card-motion space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Number(rev.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.serviceUsed && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-[2px] bg-white/5 border border-white/10 text-neutral-300">
                        {rev.serviceUsed}
                      </span>
                    )}
                  </div>

                  <p className="text-sm md:text-base leading-relaxed text-neutral-100">
                    “{rev.comment}”
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{rev.authorName}</span>
                      {(rev.role || rev.organization) && (
                        <span className="text-neutral-400 ml-2">
                          {[rev.role, rev.organization].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                </motion.article>
              ))
            )}
          </div>

          {/* Review Submission Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 p-7 rounded-[2px] apple-glass-card space-y-5">
              <div className="flex items-center gap-2.5">
                <MessageSquareQuote className="w-5 h-5" style={{ color: 'var(--brand-accent)' }} />
                <h2 className="font-display text-2xl font-bold text-white">Submit a Review</h2>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Limit: up to <strong className="text-white">{config.reviewPerSessionLimit}</strong> submission(s) per visitor and{' '}
                <strong className="text-white">{config.reviewMaxCount}</strong> total published reviews.
              </p>

              {!config.reviewsEnabled ? (
                <div className="p-4 rounded-[2px] bg-white/5 border border-white/10 text-xs text-neutral-300">
                  Public review submissions are currently paused by the administrator.
                </div>
              ) : totalCapReached ? (
                <div className="p-4 rounded-[2px] bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                  The maximum review limit ({config.reviewMaxCount}) has been reached.
                </div>
              ) : sessionCapReached ? (
                <div className="p-4 rounded-[2px] bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                  Thank you — you have reached your visitor submission limit ({config.reviewPerSessionLimit}).
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitted && (
                    <div className="p-3 rounded-[2px] bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Your review is live!</span>
                    </div>
                  )}
                  {error && (
                    <div className="p-3 rounded-[2px] bg-red-950/60 border border-red-600/50 text-xs text-red-200">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Aarav Shrestha"
                        className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 rounded-[2px] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-300 mb-1">Role / Title</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Marketing Lead"
                        className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 rounded-[2px] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-300 mb-1">Organization / Team</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Team / Brand"
                        className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 rounded-[2px] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-300 mb-1">Service Used</label>
                      <select
                        value={serviceUsed}
                        onChange={(e) => setServiceUsed(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 rounded-[2px] text-white"
                      >
                        {SERVICE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-neutral-900">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-300 mb-1.5">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="p-1.5 rounded-[2px] border border-white/10 bg-black/40 hover:border-amber-400/50 transition-colors"
                          aria-label={`Rate ${num} out of 5`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              num <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono-num text-neutral-300 ml-1">{rating}.0 / 5.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">Your Review *</label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience working with YRT Esports..."
                      className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 rounded-[2px] text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center py-3 text-xs font-semibold btn-brand disabled:opacity-50"
                  >
                    <FillButtonContent>
                      <span>{submitting ? 'Submitting Review...' : 'Post Review'}</span>
                    </FillButtonContent>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
