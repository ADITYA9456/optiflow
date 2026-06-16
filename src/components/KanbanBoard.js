'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';

export const KANBAN_COLUMNS = [
  { key: 'backlog', label: 'Backlog', statusOnMove: 'blocked' },
  { key: 'todo', label: 'To Do', statusOnMove: 'pending' },
  { key: 'in-progress', label: 'In Progress', statusOnMove: 'in-progress' },
  { key: 'review', label: 'Review', statusOnMove: 'review' },
  { key: 'done', label: 'Done', statusOnMove: 'completed' },
];

const STATUS_TO_COLUMN = {
  pending: 'todo',
  'in-progress': 'in-progress',
  review: 'review',
  blocked: 'backlog',
  completed: 'done',
};

const getColumnFromTask = (task) => task?.boardColumn || STATUS_TO_COLUMN[task?.status] || 'todo';

function TaskItem({ task, onEdit, onDelete, canManage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="card touch-none p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          {...listeners}
          {...attributes}
          className="flex-1 cursor-grab active:cursor-grabbing"
          aria-label="Drag task"
        >
          <Link
            href={`/tasks/${task._id}`}
            className="text-sm font-semibold leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {task.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {task.description}
          </p>
        </div>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
            color: 'var(--accent)',
          }}
          title="AI priority score"
        >
          {task.aiPriorityScore || 50}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {task.deadline && (
          <span
            className="rounded-md border px-1.5 py-0.5 text-[10px]"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          >
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {canManage && (
        <div className="mt-2 flex justify-end gap-2 text-[10px]">
          <button onClick={() => onEdit?.(task)} className="btn-ghost px-2 py-0.5">
            Edit
          </button>
          <button onClick={() => onDelete?.(task._id)} className="btn-ghost px-2 py-0.5" style={{ color: 'var(--danger)' }}>
            Delete
          </button>
        </div>
      )}
    </article>
  );
}

function Column({ column, tasks, onEdit, onDelete, canManage }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl border p-3 transition"
      style={{
        background: isOver
          ? 'color-mix(in srgb, var(--accent) 12%, var(--surface) 88%)'
          : 'var(--surface)',
        borderColor: isOver ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--border)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {column.label}
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[11px]"
          style={{ background: 'var(--surface-strong)', color: 'var(--text-secondary)' }}
        >
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[80px]">
          {tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              canManage={canManage}
            />
          ))}
          {tasks.length === 0 && (
            <p
              className="rounded-xl border border-dashed p-3 text-center text-[11px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Drop tasks here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ tasks, onMoveColumn, onEdit, onDelete, canManage = false }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [activeId, setActiveId] = useState(null);

  const grouped = useMemo(() => {
    const map = { backlog: [], todo: [], 'in-progress': [], review: [], done: [] };
    for (const task of tasks) {
      const col = getColumnFromTask(task);
      (map[col] || map.todo).push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0));
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find((t) => t._id === active.id);
    if (!draggedTask) return;

    let targetColumn = over.id;
    const overTask = tasks.find((t) => t._id === over.id);
    if (overTask) targetColumn = getColumnFromTask(overTask);

    const currentColumn = getColumnFromTask(draggedTask);
    if (targetColumn === currentColumn) return;

    onMoveColumn?.(draggedTask._id, targetColumn);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((col) => (
          <Column
            key={col.key}
            column={col}
            tasks={grouped[col.key] || []}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div
            className="card p-3 shadow-2xl"
            style={{
              width: 260,
              border: '1px solid color-mix(in srgb, var(--accent) 60%, transparent)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeTask.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {activeTask.description}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
