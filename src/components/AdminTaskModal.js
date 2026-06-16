'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const EMPTY = {
  title: '',
  description: '',
  deadline: '',
  priority: 'medium',
  taskType: 'feature',
  effortPoints: 3,
  labels: '',
  assignmentType: 'user',
  assignedTo: '',
  teamId: '',
};

export default function AdminTaskModal({ isOpen, onClose, onSubmit, task = null }) {
  const [formData, setFormData] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      title: task?.title || '',
      description: task?.description || '',
      deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      priority: task?.priority || 'medium',
      taskType: task?.taskType || 'feature',
      effortPoints: task?.effortPoints || 3,
      labels: Array.isArray(task?.labels) ? task.labels.join(', ') : '',
      assignmentType: task?.assignedTo ? 'user' : task?.teamId ? 'team' : 'user',
      assignedTo: task?.assignedTo?._id || '',
      teamId: task?.teamId?._id || '',
    });
  }, [task, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    (async () => {
      try {
        const [u, t] = await Promise.all([authFetch('/api/users'), authFetch('/api/teams')]);
        if (!alive) return;
        if (u.ok) setUsers((await u.json()).users || []);
        if (t.ok) setTeams((await t.json()).teams || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (formData.assignmentType === 'user' && !formData.assignedTo) {
      toast.error('Pick a user to assign or switch to team assignment.');
      return;
    }
    if (formData.assignmentType === 'team' && !formData.teamId) {
      toast.error('Pick a team to assign or switch to user assignment.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        priority: formData.priority,
        taskType: formData.taskType,
        effortPoints: Number(formData.effortPoints || 3),
        labels: String(formData.labels || '')
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 8),
        assignedTo: formData.assignmentType === 'user' ? formData.assignedTo : null,
        teamId: formData.assignmentType === 'team' ? formData.teamId : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-label={task ? 'Edit task' : 'Assign task'}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}
      >
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {task ? 'Edit task' : 'Assign new task'}
          </h2>
          <button onClick={onClose} className="btn-ghost px-2" aria-label="Close">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-3 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Title
            </label>
            <input required name="title" value={formData.title} onChange={onChange} className="surface-input text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              required
              name="description"
              rows={3}
              value={formData.description}
              onChange={onChange}
              className="surface-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Deadline
              </label>
              <input required type="date" name="deadline" value={formData.deadline} onChange={onChange} className="surface-input text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Priority
              </label>
              <select name="priority" value={formData.priority} onChange={onChange} className="surface-input text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Type
              </label>
              <select name="taskType" value={formData.taskType} onChange={onChange} className="surface-input text-sm">
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="chore">Chore</option>
                <option value="research">Research</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Effort
              </label>
              <input type="number" min={1} max={13} name="effortPoints" value={formData.effortPoints} onChange={onChange} className="surface-input text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Labels
            </label>
            <input name="labels" value={formData.labels} onChange={onChange} className="surface-input text-sm" placeholder="frontend, sprint-4" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Assign to
            </label>
            <div className="flex gap-2">
              {['user', 'team'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, assignmentType: mode }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs uppercase tracking-wide ${
                    formData.assignmentType === mode ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {formData.assignmentType === 'user' ? (
              <select required name="assignedTo" value={formData.assignedTo} onChange={onChange} className="surface-input mt-2 text-sm">
                <option value="">Select a user…</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} · {u.role?.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <select required name="teamId" value={formData.teamId} onChange={onChange} className="surface-input mt-2 text-sm">
                <option value="">Select a team…</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {task ? 'Save changes' : 'Assign task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
