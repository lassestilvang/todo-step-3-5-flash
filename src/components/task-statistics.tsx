'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { useStore } from '@/store';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-2xl p-5 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={color}>{icon}</div>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground/60">{subtitle}</div>}
    </motion.div>
  );
}

export function TaskStatistics() {
  const tasks = useStore((s) => s.tasks);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'pending');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const overdue = tasks.filter(t => {
      if (t.status === 'completed') return false;
      const due = t.deadline || t.dueDate;
      return due ? new Date(due) < now : false;
    });
    const completedThisWeek = completed.filter(t => {
      const completedAt = t.completedAt ?? t.updatedAt;
      return completedAt && new Date(completedAt) >= weekAgo;
    });

    const avgCompletionTime = completed.length > 0
      ? Math.round(completed.reduce((acc, t) => acc + (t.estimateMinutes || 0), 0) / completed.length)
      : 0;

    const productivityScore = tasks.length > 0
      ? Math.round((completed.length / tasks.length) * 100)
      : 0;

    return {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      completedThisWeek: completedThisWeek.length,
      avgCompletionTime,
      productivityScore,
    };
  }, [tasks]);

  const streak = useMemo(() => {
    // Calculate consecutive days with at least one completed task
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedByDay = new Set<string>();
    tasks.forEach(t => {
      if (t.status === 'completed' && t.completedAt) {
        const day = new Date(t.completedAt!);
        day.setHours(0, 0, 0, 0);
        completedByDay.add(day.toISOString().split('T')[0]!);
      }
    });

    // Count consecutive days from today backwards
    let streakCount = 0;
    for (let daysAgo = 0; ; daysAgo++) {
      const checkDate = new Date(today.getTime() - daysAgo * 86400000);
      if (!completedByDay.has(checkDate.toISOString().split('T')[0]!)) break;
      streakCount++;
    }

    return streakCount;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-2">Task Statistics</h2>
        <p className="text-sm text-muted-foreground">
          Your productivity overview and progress insights
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productivity Score"
          value={`${stats.productivityScore}%`}
          icon={<span className="text-lg font-bold">{stats.productivityScore}</span>}
          color="text-primary"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle={`${stats.completedThisWeek} this week`}
          icon={<span className="text-green-500">✓</span>}
          color="text-green-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<span className="text-amber-500">⋯</span>}
          color="text-amber-500"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<span className="text-blue-500">○</span>}
          color="text-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Current Streak"
          value={streak}
          subtitle="consecutive completed tasks"
          icon={<span className="text-purple-500">🔥</span>}
          color="text-purple-500"
        />
        <StatCard
          title="Avg. Time Estimate"
          value={`${stats.avgCompletionTime}m`}
          subtitle="per task"
          icon={<span className="text-cyan-500">⏱</span>}
          color="text-cyan-500"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          subtitle="tasks need attention"
          icon={<span className="text-red-500">⚠</span>}
          color="text-red-500"
        />
      </div>

      {stats.completed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 text-center"
        >
          <div className="text-3xl font-black mb-2">
            Great job! You have completed {stats.completed} tasks.
          </div>
          <p className="text-sm text-muted-foreground">
            Keep up the momentum and continue building your productive habits.
          </p>
        </motion.div>
      )}
    </div>
  );
}