'use client';

/* eslint-disable max-lines */

import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
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
      const completedAt = t.completedAt;
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

    const todayStr = today.toISOString().split('T')[0]!;
    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;

    let startDate = today;
    if (!completedByDay.has(todayStr)) {
      if (completedByDay.has(yesterdayStr)) {
        startDate = yesterday;
      } else {
        return 0;
      }
    }

    // Count consecutive days from start date backwards
    let streakCount = 0;
    for (let daysAgo = 0; ; daysAgo++) {
      const checkDate = new Date(startDate.getTime() - daysAgo * 86400000);
      if (!completedByDay.has(checkDate.toISOString().split('T')[0]!)) break;
      streakCount++;
    }

    return streakCount;
  }, [tasks]);

  const completionHistory = useMemo(() => {
    const days = [];
    const now = new Date();
    const completedByDay = new Map<string, number>();

    tasks.forEach(t => {
      if (t.status === 'completed' && t.completedAt) {
        const dateStr = new Date(t.completedAt).toDateString();
        completedByDay.set(dateStr, (completedByDay.get(dateStr) || 0) + 1);
      }
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toDateString();
      const count = completedByDay.get(dateStr) || 0;
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr,
        count
      });
    }
    return days;
  }, [tasks]);

  const tagsDistribution = useMemo(() => {
    const map = new Map<string, { count: number; color: string }>();
    tasks.forEach((t) => {
      t.labels?.forEach((l) => {
        const entry = map.get(l.name) || { count: 0, color: l.color };
        map.set(l.name, { count: entry.count + 1, color: l.color });
      });
    });
    return Array.from(map.entries())
      .map(([name, { count, color }]) => ({ name, count, color }))
      .sort((a, b) => b.count - a.count);
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

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Productivity SVG Chart */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <span>📊</span> Tasks Completed (Past 7 Days)
          </h3>
          <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
            {completionHistory.map((day) => {
              const maxCount = Math.max(...completionHistory.map(d => d.count), 1);
              const percent = (day.count / maxCount) * 100;
              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="relative w-full flex justify-center items-end h-[80%]">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-lg border shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {day.count} completed
                    </div>
                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${percent}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="w-full sm:w-8 bg-primary/20 hover:bg-primary border-t-2 border-primary rounded-t-lg transition-colors cursor-default relative overflow-hidden"
                      style={{ height: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags Distribution Bar Chart */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <span>🏷️</span> Tags & Labels Distribution
          </h3>
          {tagsDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground italic">
              No tasks have tags assigned yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {tagsDistribution.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span>{item.count} tasks</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / stats.total) * 100}%` }}
                      className="h-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gamified Streak Milestones section */}
      <div className="bg-muted/30 rounded-3xl p-6 border border-border/50">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>🏆</span> Streak Milestone Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn("p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-default", streak >= 1 ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-bold shadow-md shadow-green-500/5" : "bg-muted/10 border-border/20 text-muted-foreground opacity-50")}
          >
            <span className="text-3xl mb-1">🌱</span>
            <span className="text-xs">Day 1</span>
            <span className="text-[10px] opacity-80 font-normal">Initiated</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn("p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-default", streak >= 3 ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold shadow-md shadow-amber-500/5 animate-pulse" : "bg-muted/10 border-border/20 text-muted-foreground opacity-50")}
          >
            <span className="text-3xl mb-1">🔥</span>
            <span className="text-xs">Day 3</span>
            <span className="text-[10px] opacity-80 font-normal">Consistent</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn("p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-default", streak >= 7 ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400 font-bold shadow-md shadow-purple-500/5" : "bg-muted/10 border-border/20 text-muted-foreground opacity-50")}
          >
            <span className="text-3xl mb-1">⚡</span>
            <span className="text-xs">Day 7</span>
            <span className="text-[10px] opacity-80 font-normal">Unstoppable</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn("p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-default", streak >= 30 ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold shadow-md shadow-rose-500/5" : "bg-muted/10 border-border/20 text-muted-foreground opacity-50")}
          >
            <span className="text-3xl mb-1">👑</span>
            <span className="text-xs">Day 30</span>
            <span className="text-[10px] opacity-80 font-normal">Legendary</span>
          </motion.div>
        </div>
      </div>

      {stats.completed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 text-center"
        >
          <div className="text-3xl font-black mb-2">
            {streak >= 3 ? "🔥 You are on fire!" : "Great job!"} You have completed {stats.completed} tasks.
          </div>
          <p className="text-sm text-muted-foreground">
            {streak >= 3 
              ? `You've kept a consecutive streak alive for ${streak} days! Keep the flame burning!`
              : "Keep up the momentum and continue building your productive habits."}
          </p>
        </motion.div>
      )}
    </div>
  );
}