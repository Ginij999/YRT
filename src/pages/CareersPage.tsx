import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, MapPin, Upload, X } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { JobPosition, PageSection } from '../types/cms';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { FALLBACK_JOBS, FALLBACK_PAGE_SECTIONS, safeFetchJson } from '../data/fallbackData';

export const CareersPage: React.FC = () => {
  usePageSeo('careers');
  const [jobs, setJobs] = useState<JobPosition[]>(FALLBACK_JOBS);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(
    FALLBACK_PAGE_SECTIONS.careers[0] || null
  );
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(FALLBACK_JOBS[0] || null);
  const [applyingJob, setApplyingJob] = useState<JobPosition | null>(null);

  // Application form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      safeFetchJson<JobPosition[]>('/api/public/careers', FALLBACK_JOBS),
      safeFetchJson<{ sections?: PageSection[] }>('/api/public/pages/careers', {
        sections: FALLBACK_PAGE_SECTIONS.careers,
      }),
    ]).then(([jobsData, pageData]) => {
      const list = Array.isArray(jobsData) && jobsData.length > 0 ? jobsData : FALLBACK_JOBS;
      setJobs(list);
      if (list.length > 0) setSelectedJob(list[0]);
      const secs: PageSection[] = pageData?.sections || FALLBACK_PAGE_SECTIONS.careers;
      setHeaderSec(secs.find((s) => s.sectionKey === 'careers_header') || null);
      setExtraSections(secs.filter((s) => s.sectionKey !== 'careers_header'));
    });
  }, []);

  const departments = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.department)))], [jobs]);
  const filteredJobs = useMemo(
    () => (deptFilter === 'All' ? jobs : jobs.filter((j) => j.department === deptFilter)),
    [jobs, deptFilter]
  );

  const openApplicationForm = (job: JobPosition) => {
    setApplyingJob(job);
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    if (!cvFile) {
      setSubmitError('Please attach your CV or resume file (PDF, DOC, or DOCX).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('positionId', applyingJob._id);
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('portfolioUrl', portfolioUrl);
      formData.append('coverLetter', coverLetter);
      formData.append('additionalInfo', additionalInfo);
      formData.append('cv', cvFile);

      const res = await fetch('/api/public/careers/apply', {
        method: 'POST',
        body: formData,
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.toLowerCase().includes('application/json') ? await res.json() : {};
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit application.');
      } else {
        setSubmitSuccess(true);
        setFullName('');
        setEmail('');
        setPhone('');
        setPortfolioUrl('');
        setCoverLetter('');
        setAdditionalInfo('');
        setCvFile(null);
      }
    } catch {
      setSubmitError('Network error while submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Careers & Recruitment'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Join Our International Production Team'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setDeptFilter(dept)}
              className={`px-4 py-2 text-xs font-semibold border transition-colors ${
                deptFilter === dept ? 'text-white' : 'text-neutral-300 hover:text-white'
              }`}
              style={{
                borderColor: 'var(--brand-border)',
                backgroundColor: deptFilter === dept ? 'var(--brand-accent)' : 'var(--brand-surface)',
              }}
            >
              {dept}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-16 border text-center" style={{ borderColor: 'var(--brand-border)' }}>
            <p className="text-base text-white font-semibold">No open positions currently listed in this department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Positions List */}
            <div className="lg:col-span-5 space-y-4">
              {filteredJobs.map((job) => {
                const isSelected = selectedJob?._id === job._id;
                return (
                  <button
                    key={job._id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="w-full text-left p-6 border transition-colors space-y-3"
                    style={{
                      backgroundColor: isSelected ? 'var(--brand-surface-elevated)' : 'var(--brand-surface)',
                      borderColor: isSelected ? 'var(--brand-accent)' : 'var(--brand-border)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--brand-accent)' }}>
                      <span className="font-semibold">{job.department}</span>
                      <span className="tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                        {job.workMode}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--brand-muted)' }}>
                      <span>{job.employmentType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.location}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Job Detail */}
            <div className="lg:col-span-7">
              {selectedJob && (
                <div
                  className="p-8 border space-y-7"
                  style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--brand-accent)' }}>
                        {selectedJob.department} · {selectedJob.employmentType}
                      </p>
                      <h2 className="font-display text-3xl font-bold text-white">{selectedJob.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {selectedJob.location} ({selectedJob.workMode})
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Apply by {selectedJob.deadline}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openApplicationForm(selectedJob)}
                      className="px-5 py-3 text-xs font-semibold btn-brand whitespace-nowrap shrink-0"
                    >
                      Apply for This Role
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Role Overview</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      {selectedJob.description}
                    </p>
                  </div>

                  {selectedJob.responsibilities.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-white">Key Responsibilities</h3>
                      <ul className="space-y-2 text-sm list-disc pl-5" style={{ color: 'var(--brand-muted)' }}>
                        {selectedJob.responsibilities.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.qualifications.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-white">Required Qualifications</h3>
                      <ul className="space-y-2 text-sm list-disc pl-5" style={{ color: 'var(--brand-muted)' }}>
                        {selectedJob.qualifications.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application Modal */}
      {applyingJob && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto p-4 flex items-start justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-2xl w-full border my-8 overflow-hidden"
            style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--brand-border)' }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Briefcase className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                <span>Apply: {applyingJob.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="p-1.5 text-neutral-400 hover:text-white"
                aria-label="Close application modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-10 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <h3 className="font-display text-2xl font-bold text-white">Application Received</h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--brand-muted)' }}>
                  Thank you for applying for {applyingJob.title}. Our HR team has logged your CV and will review your profile shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-6 py-2.5 text-xs font-semibold btn-brand"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="p-6 md:p-8 space-y-5">
                {submitError && (
                  <div className="p-3 bg-red-950/60 border border-red-700 text-xs text-red-200">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                      style={{ borderColor: 'var(--brand-border)' }}
                      placeholder="Alex Mercer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                      style={{ borderColor: 'var(--brand-border)' }}
                      placeholder="alex@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                      style={{ borderColor: 'var(--brand-border)' }}
                      placeholder="+44 7700 900123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Portfolio / Reel Link</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                      style={{ borderColor: 'var(--brand-border)' }}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">CV / Resume Upload (PDF, DOC, DOCX) *</label>
                  <label
                    className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed cursor-pointer hover:border-white/40 transition-colors"
                    style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-surface)' }}
                  >
                    <span className="text-xs text-neutral-300 truncate">
                      {cvFile ? `${cvFile.name} (${Math.round(cvFile.size / 1024)} KB)` : 'Select CV / Resume file from device'}
                    </span>
                    <Upload className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Cover Letter *</label>
                  <textarea
                    required
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                    style={{ borderColor: 'var(--brand-border)' }}
                    placeholder="Outline your relevant tournament, broadcast, or agency experience..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Additional Information (Notice period, languages, etc.)</label>
                  <input
                    type="text"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/50 border text-white"
                    style={{ borderColor: 'var(--brand-border)' }}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingJob(null)}
                    className="px-4 py-2.5 text-xs font-semibold btn-brand-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-semibold btn-brand disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};
