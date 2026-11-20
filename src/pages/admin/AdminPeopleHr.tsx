import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit2,
  ExternalLink,
  MailOpen,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import {
  AdminRole,
  AdminUser,
  ApplicationStatus,
  ContactMessage,
  Department,
  JobApplication,
  JobPosition,
  MediaAsset,
  StaffMember,
} from '../../types/cms';
import { ConfirmModal, ImagePickerField } from './AdminShared';

type NotifyFn = (msg: string, type?: 'success' | 'error') => void;

// ==========================================
// 1. STAFF & DEPARTMENTS MANAGEMENT
// ==========================================
export const AdminStaff: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<Partial<StaffMember> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const [sRes, dRes] = await Promise.all([
      apiFetch('/api/admin/staff'),
      apiFetch('/api/admin/departments'),
    ]);
    if (sRes.ok) setStaff(await sRes.json());
    if (dRes.ok) setDepartments(await dRes.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/staff' : `/api/admin/staff/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Staff member added.' : 'Staff member updated.');
    } else notify('Failed to save staff member', 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff &amp; Leadership Directory</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage current staff, former staff, alumni, departments, and featured leadership.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              fullName: '',
              jobTitle: '',
              department: departments[0]?.name || 'Management',
              bio: '',
              photoUrl: '',
              email: '',
              joiningDate: new Date().toISOString().slice(0, 10),
              employmentStatus: 'current',
              featured: false,
              order: staff.length + 1,
              socialLinks: {},
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Staff Member
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {staff.map((m) => (
          <div key={m._id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={m.photoUrl} alt={m.fullName} className="w-10 h-10 object-cover border border-white/10 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{m.fullName}</div>
                <div className="text-xs text-neutral-400 capitalize">
                  {m.jobTitle} · {m.department} · {m.employmentStatus}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(m)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(m._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-2xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Staff Member' : 'New Staff Member'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input required placeholder="Full Name *" value={editing.fullName || ''} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input required placeholder="Job Title *" value={editing.jobTitle || ''} onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={editing.department || ''} onChange={(e) => setEditing({ ...editing, department: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                {departments.map((d) => <option key={d._id} value={d.name} className="bg-neutral-900">{d.name}</option>)}
              </select>
              <select value={editing.employmentStatus || 'current'} onChange={(e) => setEditing({ ...editing, employmentStatus: e.target.value as any })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                <option value="current" className="bg-neutral-900">Current Staff</option>
                <option value="former" className="bg-neutral-900">Former Staff</option>
                <option value="alumni" className="bg-neutral-900">Alumni</option>
              </select>
              <input type="date" value={editing.joiningDate || ''} onChange={(e) => setEditing({ ...editing, joiningDate: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <textarea rows={3} placeholder="Short Biography" value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <ImagePickerField label="Profile Photo *" value={editing.photoUrl || ''} onChange={(url) => setEditing({ ...editing, photoUrl: url })} folder="staff" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="email" placeholder="Work Email (optional)" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input type="url" placeholder="X / Twitter URL" value={editing.socialLinks?.twitter || ''} onChange={(e) => setEditing({ ...editing, socialLinks: { ...editing.socialLinks, twitter: e.target.value } })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input type="url" placeholder="LinkedIn URL" value={editing.socialLinks?.linkedin || ''} onChange={(e) => setEditing({ ...editing, socialLinks: { ...editing.socialLinks, linkedin: e.target.value } })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Member</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Remove Staff Member"
        description="Delete this team member from the staff directory?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/staff/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Staff member removed.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 2. CAREERS / OPEN POSITIONS MANAGEMENT
// ==========================================
export const AdminCareers: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [editing, setEditing] = useState<Partial<JobPosition> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/jobs');
    if (res.ok) setJobs(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/jobs' : `/api/admin/jobs/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Open position published.' : 'Job listing updated.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Careers &amp; Open Positions</h1>
          <p className="text-xs text-neutral-400 mt-1">Create and manage active recruitment listings.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              department: 'Broadcast',
              employmentType: 'Full-time',
              location: 'Kathmandu, Nepal',
              workMode: 'Hybrid',
              description: '',
              qualifications: [],
              responsibilities: [],
              deadline: '2026-12-31',
              active: true,
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Position
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {jobs.map((job) => (
          <div key={job._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">{job.title}</div>
              <div className="text-xs text-neutral-400 tabular-nums">
                {job.department} · {job.employmentType} · {job.location} ({job.workMode}) · Deadline: {job.deadline} · {job.active ? 'Active' : 'Closed'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(job)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(job._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-2xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Position' : 'New Open Position'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Job Title *" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input required placeholder="Department *" value={editing.department || ''} onChange={(e) => setEditing({ ...editing, department: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={editing.employmentType || 'Full-time'} onChange={(e) => setEditing({ ...editing, employmentType: e.target.value as any })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                <option value="Full-time" className="bg-neutral-900">Full-time</option>
                <option value="Part-time" className="bg-neutral-900">Part-time</option>
                <option value="Contract" className="bg-neutral-900">Contract</option>
                <option value="Internship" className="bg-neutral-900">Internship</option>
              </select>
              <select value={editing.workMode || 'Hybrid'} onChange={(e) => setEditing({ ...editing, workMode: e.target.value as any })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                <option value="Remote" className="bg-neutral-900">Remote</option>
                <option value="On-site" className="bg-neutral-900">On-site</option>
                <option value="Hybrid" className="bg-neutral-900">Hybrid</option>
              </select>
              <input placeholder="Location" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input type="date" value={editing.deadline || ''} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <textarea required rows={3} placeholder="Role Description *" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <textarea rows={3} placeholder="Responsibilities (one per line)" value={(editing.responsibilities || []).join('\n')} onChange={(e) => setEditing({ ...editing, responsibilities: e.target.value.split('\n').filter(Boolean) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <textarea rows={3} placeholder="Required Qualifications (one per line)" value={(editing.qualifications || []).join('\n')} onChange={(e) => setEditing({ ...editing, qualifications: e.target.value.split('\n').filter(Boolean) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              <span>Position Open / Accepting Applications</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Position</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Job Position"
        description="Remove this recruitment position?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/jobs/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Position deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 3. JOB APPLICATIONS ATS MANAGEMENT
// ==========================================
const APP_STATUSES: ApplicationStatus[] = [
  'New',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Accepted',
  'Rejected',
];

export const AdminApplications: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('New');

  const load = async () => {
    const res = await apiFetch('/api/admin/applications');
    if (res.ok) setApps(await res.json());
  };
  useEffect(() => { load(); }, []);

  const positions = useMemo(() => ['All', ...Array.from(new Set(apps.map((a) => a.positionTitle)))], [apps]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (positionFilter !== 'All' && a.positionTitle !== positionFilter) return false;
      return true;
    });
  }, [apps, statusFilter, positionFilter]);

  const openReview = (app: JobApplication) => {
    setSelected(app);
    setStatus(app.status);
    setNotes(app.internalNotes || '');
  };

  const saveReview = async () => {
    if (!selected) return;
    const res = await apiFetch(`/api/admin/applications/${selected._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, internalNotes: notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      await load();
      notify(`Updated ${updated.fullName} status to ${updated.status}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Job Applications &amp; Candidate Pipeline</h1>
        <p className="text-xs text-neutral-400 mt-1">Review applicants, download CVs, update hiring stages, and record internal HR notes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-xs bg-[#111115] border border-white/10 text-white">
          <option value="All" className="bg-neutral-900">All Statuses</option>
          {APP_STATUSES.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
        </select>
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="px-3 py-2 text-xs bg-[#111115] border border-white/10 text-white">
          {positions.map((p) => <option key={p} value={p} className="bg-neutral-900">{p === 'All' ? 'All Positions' : p}</option>)}
        </select>
      </div>

      <div className="bg-[#111115] border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 text-neutral-400">
            <tr>
              <th className="py-3 px-4 font-semibold">Candidate</th>
              <th className="py-3 px-4 font-semibold">Position</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Applied</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 tabular-nums">
            {filtered.map((app) => (
              <tr key={app._id} className="hover:bg-white/[0.03]">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white">{app.fullName}</div>
                  <div className="text-neutral-400">{app.email}</div>
                </td>
                <td className="py-3.5 px-4 text-neutral-200">{app.positionTitle}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-200">{app.status}</span>
                </td>
                <td className="py-3.5 px-4 text-neutral-400">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="py-3.5 px-4 text-right space-x-3">
                  <a
                    href={app.cvUrl}
                    download={app.cvOriginalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-neutral-300 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> CV
                  </a>
                  <button type="button" onClick={() => openReview(app)} className="text-red-400 hover:underline font-semibold">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <div className="max-w-2xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.fullName}</h2>
                <p className="text-xs text-neutral-400">{selected.positionTitle} · {selected.email} · {selected.phone}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-white">Cover Letter</div>
              <p className="p-3 bg-black/40 border border-white/10 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {selected.coverLetter}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <a
                href={selected.cvUrl}
                download={selected.cvOriginalName}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1.5 font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Download CV ({selected.cvOriginalName})
              </a>
              {selected.portfolioUrl && (
                <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-red-400 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Portfolio Link
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Pipeline Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  {APP_STATUSES.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => setStatus('Shortlisted')} className="px-3 py-2 text-xs border border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40">Shortlist</button>
                <button type="button" onClick={() => setStatus('Accepted')} className="px-3 py-2 text-xs border border-white/20 text-white hover:bg-white/10">Mark Hired</button>
                <button type="button" onClick={() => setStatus('Rejected')} className="px-3 py-2 text-xs border border-red-600/50 text-red-400 hover:bg-red-950/40">Reject</button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Internal HR Notes</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" placeholder="Interview feedback, compensation expectations..." />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Close</button>
              <button type="button" onClick={saveReview} className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. CONTACT MESSAGES INBOX
// ==========================================
export const AdminMessages: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/messages');
    if (res.ok) setMessages(await res.json());
  };
  useEffect(() => { load(); }, []);

  const markRead = async (m: ContactMessage) => {
    await apiFetch(`/api/admin/messages/${m._id}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true, status: m.status === 'new' ? 'replied' : m.status }),
    });
    await load();
    notify('Message marked as reviewed.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Contact &amp; Business Inquiries</h1>
        <p className="text-xs text-neutral-400 mt-1">All inquiries submitted through the public Contact page.</p>
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m._id} className={`p-5 border space-y-3 ${m.read ? 'bg-[#111115] border-white/10' : 'bg-[#18181D] border-red-600/40'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{m.subject}</span>
                  {!m.read && <span className="text-[11px] font-semibold text-red-400">· Unread</span>}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 tabular-nums">
                  {m.name} ({m.email}) · {m.category} · {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!m.read && (
                  <button type="button" onClick={() => markRead(m)} className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1.5">
                    <MailOpen className="w-3.5 h-3.5" /> Mark Read
                  </button>
                )}
                <button type="button" onClick={() => setDeleteId(m._id)} className="p-2 text-neutral-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{m.message}</p>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Inquiry"
        description="Permanently delete this contact message?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/messages/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Message deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 5. MEDIA LIBRARY
// ==========================================
const FOLDERS: MediaAsset['folder'][] = ['logos', 'events', 'portfolio', 'staff', 'blog', 'documents', 'general'];

export const AdminMedia: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folderFilter, setFolderFilter] = useState('all');
  const [uploadFolder, setUploadFolder] = useState<MediaAsset['folder']>('general');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/media');
    if (res.ok) setAssets(await res.json());
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name);
      fd.append('folder', uploadFolder);
      const res = await apiFetch('/api/admin/media/upload', { method: 'POST', body: fd });
      if (res.ok) {
        await load();
        notify(`Uploaded ${file.name} to ${uploadFolder}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const replaceFile = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiFetch(`/api/admin/media/${id}`, { method: 'PUT', body: fd });
    if (res.ok) {
      await load();
      notify('Asset replaced.');
    }
  };

  const visible = folderFilter === 'all' ? assets : assets.filter((a) => a.folder === folderFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Centralized Media Library</h1>
          <p className="text-xs text-neutral-400 mt-1">Upload logos, event banners, staff portraits, videos, and documents.</p>
        </div>

        <div className="flex items-center gap-2">
          <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as any)} className="px-3 py-2 text-xs bg-[#111115] border border-white/10 text-white">
            {FOLDERS.map((f) => <option key={f} value={f} className="bg-neutral-900">Folder: {f}</option>)}
          </select>
          <label className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Asset'}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['all', ...FOLDERS].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolderFilter(f)}
            className={`px-3 py-1.5 text-xs capitalize border ${folderFilter === f ? 'bg-white text-black font-semibold border-white' : 'bg-[#111115] border-white/10 text-neutral-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((asset) => {
          const isImg = asset.mimeType.startsWith('image/') || asset.url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|svg)$/i.test(asset.url);
          return (
            <div key={asset._id} className="bg-[#111115] border border-white/10 overflow-hidden flex flex-col">
              <div className="aspect-video bg-black/60 flex items-center justify-center overflow-hidden">
                {isImg ? (
                  <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-mono text-neutral-400">{asset.mimeType}</span>
                )}
              </div>
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white truncate">{asset.title}</div>
                  <div className="text-[11px] text-neutral-400 capitalize">{asset.folder} · {Math.round((asset.size || 0) / 1024)} KB</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(asset.url);
                      notify('Copied asset URL to clipboard.');
                    }}
                    className="text-[11px] text-neutral-300 hover:text-white inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy URL
                  </button>
                  <div className="flex items-center gap-2">
                    <label className="text-neutral-400 hover:text-white cursor-pointer" title="Replace file">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceFile(asset._id, f); }} />
                    </label>
                    <button type="button" onClick={() => setDeleteId(asset._id)} className="text-neutral-400 hover:text-red-400" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Media Asset"
        description="Remove this asset from the Media Library?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/media/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Media asset deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 6. ADMIN USERS & RBAC MANAGEMENT
// ==========================================
const ROLES: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'content_manager', label: 'Content Manager' },
];

export const AdminUsersManager: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<(Partial<AdminUser> & { password?: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/admin-users');
    if (res.ok) setUsers(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/admin-users' : `/api/admin/admin-users/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Admin account created.' : 'Admin account updated.');
    } else {
      notify(data.error || 'Operation failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Users &amp; Role-Based Access</h1>
          <p className="text-xs text-neutral-400 mt-1">Assign Super Admin, Admin, Editor, HR Manager, and Content Manager permissions.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ name: '', email: '', password: '', role: 'editor', active: true })}
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Admin User
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {users.map((u) => (
          <div key={u._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">{u.name}</div>
              <div className="text-xs text-neutral-400">{u.email} · Role: {u.role} · {u.active ? 'Active' : 'Disabled'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(u)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(u._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center">
          <form onSubmit={save} className="max-w-md w-full bg-[#111115] border border-white/15 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Admin Account' : 'Create Admin Account'}</h2>
            <input required placeholder="Full Name" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <input required type="email" disabled={!!editing._id} placeholder="Email Address" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white disabled:opacity-50" />
            <input type="password" required={!editing._id} placeholder={editing._id ? 'New Password (leave blank to keep)' : 'Password *'} value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <select value={editing.role || 'editor'} onChange={(e) => setEditing({ ...editing, role: e.target.value as AdminRole })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
              {ROLES.map((r) => <option key={r.value} value={r.value} className="bg-neutral-900">{r.label}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              <span>Account Active</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-red-600 text-white">Save User</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Admin User"
        description="Revoke access and remove this administrator account?"
        onConfirm={async () => {
          if (deleteId) {
            const res = await apiFetch(`/api/admin/admin-users/${deleteId}`, { method: 'DELETE' });
            const d = await res.json();
            setDeleteId(null);
            if (res.ok) {
              await load();
              notify('Admin user removed.');
            } else notify(d.error || 'Could not remove user', 'error');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
