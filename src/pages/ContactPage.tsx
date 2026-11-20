import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { usePageSeo, useSite } from '../context/SiteContext';
import { PageSection } from '../types/cms';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { GlobalNetworkMap } from '../components/GlobalNetworkMap';

const INQUIRY_CATEGORIES = [
  'Tournament Production',
  'Live Broadcast Production',
  'Brand Partnerships & Sponsorship',
  'Esports Marketing',
  'Team Management',
  'Press & Media',
  'General Inquiry',
];

export const ContactPage: React.FC = () => {
  usePageSeo('contact');
  const { settings } = useSite();
  const [searchParams] = useSearchParams();

  const [headerSec, setHeaderSec] = useState<PageSection | null>(null);
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(
    searchParams.get('category') || INQUIRY_CATEGORIES[0]
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/public/pages/contact')
      .then((r) => r.json())
      .then((data) => {
        const secs: PageSection[] = data.sections || [];
        setHeaderSec(secs.find((s) => s.sectionKey === 'contact_header') || null);
        setExtraSections(secs.filter((s) => s.sectionKey !== 'contact_header'));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send message.');
      } else {
        setSubmitted(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Network error while sending message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-14 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Contact Us'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Start a Conversation With Our Executive Desk'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="p-8 rounded-3xl apple-glass-card space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full apple-glass-pill text-[11px] font-semibold text-white">
                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
                <span>Kathmandu, Nepal (KTM HQ)</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Direct Desk Information</h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-1 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                  <div>
                    <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Email</div>
                    <a href={`mailto:${settings?.contactEmail}`} className="text-white font-medium hover:underline">
                      {settings?.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-1 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                  <div>
                    <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Telephone</div>
                    <div className="text-white font-medium tabular-nums">{settings?.contactPhone}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                  <div>
                    <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Headquarters</div>
                    <div className="text-white font-medium">{settings?.headquarters || 'Kathmandu, Nepal'}</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t space-y-3" style={{ borderColor: 'var(--brand-border)' }}>
                <div className="text-xs font-semibold text-white">Official Social Channels</div>
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--brand-muted)' }}>
                  {settings?.socialLinks?.twitter && (
                    <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                      X / Twitter
                    </a>
                  )}
                  {settings?.socialLinks?.linkedin && (
                    <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                      LinkedIn
                    </a>
                  )}
                  {settings?.socialLinks?.youtube && (
                    <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                      YouTube
                    </a>
                  )}
                  {settings?.socialLinks?.twitch && (
                    <a href={settings.socialLinks.twitch} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                      Twitch
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <div className="p-8 rounded-3xl apple-glass-card">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                  <h2 className="font-display text-3xl font-bold text-white">Inquiry Received</h2>
                  <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--brand-muted)' }}>
                    Your message has been stored in our producer inbox. A specialist will respond within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 text-xs font-semibold btn-brand"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-display text-2xl font-bold text-white">Submit Business Inquiry</h2>

                  {error && (
                    <div className="p-3 bg-red-950/60 border border-red-700 text-xs text-red-200">{error}</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                        style={{ borderColor: 'var(--brand-border)' }}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Business Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                        style={{ borderColor: 'var(--brand-border)' }}
                        placeholder="jane@organization.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Inquiry Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                        style={{ borderColor: 'var(--brand-border)' }}
                      >
                        {INQUIRY_CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-neutral-900">
                            {c}
                          </option>
                        ))}
                        {!INQUIRY_CATEGORIES.includes(category) && (
                          <option value={category} className="bg-neutral-900">
                            {category}
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">Subject *</label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                        style={{ borderColor: 'var(--brand-border)' }}
                        placeholder="Q3 Regional Championship Brief"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Project Brief / Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                      style={{ borderColor: 'var(--brand-border)' }}
                      placeholder="Share your target game titles, expected dates, location, or sponsorship goals..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3.5 text-xs font-semibold btn-brand disabled:opacity-50"
                  >
                    {submitting ? 'Sending Inquiry...' : 'Send Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-12">
        <GlobalNetworkMap compact />
      </div>

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};
