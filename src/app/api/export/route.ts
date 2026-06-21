import { NextResponse } from 'next/server';

import { getAllLists, getAllLabels, getAllTasks } from '@/lib/db';

export function GET() {
  const tasks = getAllTasks();
  const lists = getAllLists();
  const labels = getAllLabels();

  const listMap = new Map(lists.map((l) => [l.id, l.name]));
  const labelMap = new Map(labels.map((l) => [l.id, l.name]));

  const header =
    'ID,Title,Description,Status,Priority,List,Due Date,Deadline,Estimate (min),Labels,Created,Updated\n';
  const rows = tasks.map((t) => {
    const dueDate = t.due_date
      ? t.due_date instanceof Date
        ? t.due_date.toISOString().split('T')[0]
        : ''
      : '';
    const deadline = t.deadline
      ? t.deadline instanceof Date
        ? t.deadline.toISOString().split('T')[0]
        : ''
      : '';
    const created = t.created_at instanceof Date ? t.created_at.toISOString().split('T')[0] : '';
    const updated = t.updated_at instanceof Date ? t.updated_at.toISOString().split('T')[0] : '';
    const labelNames = t.labels.map((l) => labelMap.get(l.id) || l.name).join('; ');
    const escaped = (s: string) => `"${s.replace(/"/g, '""')}"`;

    return [
      escaped(t.id),
      escaped(t.title),
      escaped(t.description),
      t.status,
      t.priority,
      escaped(listMap.get(t.list_id) || ''),
      dueDate,
      deadline,
      String(t.estimate_minutes),
      escaped(labelNames),
      created,
      updated,
    ].join(',');
  });

  const csv = `\uFEFF${header}${rows.join('\n')}`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="taskplanner-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
