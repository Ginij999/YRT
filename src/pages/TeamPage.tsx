import React, { useEffect, useMemo, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { Department, PageSection, StaffMember } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';

export const TeamPage: React.FC = () => {
  usePageSeo('team');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(null);
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'current' | 'former' | 'alumni'>('current');
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/staff').then((r) => r.json()),
      fetch('/api/public/departments').then((r) => r.json()),
      fetch('/api/public/pages/team').then((r) => r.json()),
    ]).then(([staffData, deptData, pageData]) => {
      setStaff(Array.isArray(staffData) ? staffData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      const secs: PageSection[] = pageData.sections || [];
      setHeaderSec(secs.find((s) => s.sectionKey === 'team_header') || null);
      setExtraSections(secs.filter((s) => s.sectionKey !== 'team_header'));
    });
  }, []);

  const filtered = useMemo(() => {
    return staff.filter((m) => {
      if (m.employmentStatus !== statusFilter) return false;
      if (deptFilter !== 'All' && m.department !== deptFilter) return false;
      return true;
    });
  }, [staff, statusFilter, deptFilter]);

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Our Team'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Producers, Operators & Strategists'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        {/* Employment Status Tabs & Department Select */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div
            className="flex items-center gap-1 p-1 border"
            style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
          >
            {[
              { id: 'current', label: 'Current Staff' },
              { id: 'former', label: 'Former Staff' },
              { id: 'alumni', label: 'Alumni' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === tab.id ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
                style={statusFilter === tab.id ? { backgroundColor: 'var(--brand-accent)' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 text-xs font-medium bg-black/40 border text-white"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <option value="All" className="bg-neutral-900">
              All Departments
            </option>
            {departments.map((d) => (
              <option key={d._id} value={d.name} className="bg-neutral-900">
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-14 border text-center" style={{ borderColor: 'var(--brand-border)' }}>
            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              No team members listed in this category and department combination.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => setSelectedMember(member)}
                className="text-left group border overflow-hidden flex flex-col"
                style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
              >
                <div className="aspect-square w-full overflow-hidden">
                  <MediaImage
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 space-y-2 flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--brand-accent)' }}>
                      <span>{member.department}</span>
                      {member.joiningDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                            Since {member.joiningDate.slice(0, 4)}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white group-hover:underline underline-offset-4">
                      {member.fullName}
                    </h2>
                    <p className="text-sm text-neutral-300 mt-0.5">{member.jobTitle}</p>
                    <p className="text-xs leading-relaxed mt-3 line-clamp-3" style={{ color: 'var(--brand-muted)' }}>
                      {member.bio}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t text-xs font-semibold text-white" style={{ borderColor: 'var(--brand-border)' }}>
                    View Profile
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Staff Detail Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-2xl w-full border overflow-hidden"
            style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--brand-border)' }}>
              <span className="text-xs font-semibold capitalize" style={{ color: 'var(--brand-accent)' }}>
                {selectedMember.employmentStatus} · {selectedMember.department}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1.5 text-neutral-400 hover:text-white"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12">
              <div className="sm:col-span-5 aspect-square">
                <MediaImage src={selectedMember.photoUrl} alt={selectedMember.fullName} />
              </div>
              <div className="sm:col-span-7 p-6 space-y-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-white">{selectedMember.fullName}</h2>
                  <p className="text-sm text-neutral-300">{selectedMember.jobTitle}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {selectedMember.bio}
                </p>
                {selectedMember.joiningDate && (
                  <p className="text-xs tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                    Joined: {selectedMember.joiningDate}
                  </p>
                )}
                <div className="pt-3 flex flex-wrap items-center gap-4 text-xs">
                  {selectedMember.email && (
                    <a
                      href={`mailto:${selectedMember.email}`}
                      className="inline-flex items-center gap-1.5 text-white hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedMember.email}
                    </a>
                  )}
                  {selectedMember.socialLinks?.linkedin && (
                    <a
                      href={selectedMember.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-white underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {selectedMember.socialLinks?.twitter && (
                    <a
                      href={selectedMember.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-white underline"
                    >
                      X / Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};
