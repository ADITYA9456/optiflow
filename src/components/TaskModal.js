'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

const EMPTY = {
  title: '',
  description: '',
  deadline: '',
  priority: 'medium',
  taskType: 'feature',
  effortPoints: 3,
  labels: '',
};

export default function TaskModal({ isOpen, onClose, onSubmit, task = null }) {
  const [formData, setFormData] = useState(EMPTY);
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
    });
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        effortPoints: Number(formData.effortPoints || 3),
        labels: String(formData.labels || '')
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 8),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-label={task ? 'Edit task' : 'Add task'}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}
      >
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={onClose} className="btn-ghost px-2" aria-label="Close">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Title
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={onChange}
              className="surface-input text-sm"
              placeholder="Concise, outcome-focused title"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              required
              name="description"
              rows={4}
              value={formData.description}
              onChange={onChange}
              className="surface-input text-sm"
              placeholder="What needs to ship? Acceptance criteria, links, context."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Deadline
              </label>
              <input
                required
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={onChange}
                className="surface-input text-sm"
              />
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
              <input
                type="number"
                min={1}
                max={13}
                name="effortPoints"
                value={formData.effortPoints}
                onChange={onChange}
                className="surface-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Labels (comma separated)
            </label>
            <input
              name="labels"
              value={formData.labels}
              onChange={onChange}
              className="surface-input text-sm"
              placeholder="frontend, sprint-4"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
