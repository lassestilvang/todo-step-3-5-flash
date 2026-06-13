/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TaskCard } from '@/components/task-card';
import type { Task } from '@/types';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      return <div {...props}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      return <button {...props}>{children}</button>;
    },
    span: ({ children, ...props }: any) => {
      return <span {...props}>{children}</span>;
    },
    p: ({ children, ...props }: any) => {
      return <p {...props}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({}),
}));

const mockToggleTaskComplete = vi.fn();
const mockOpenEditTask = vi.fn();
const mockSetSelectedTask = vi.fn();

const mockStore = {
  toggleTaskComplete: mockToggleTaskComplete,
  openEditTask: mockOpenEditTask,
  setSelectedTask: mockSetSelectedTask,
  selectedTaskId: null,
};

vi.mock('@/store', () => ({
  useStore: vi.fn(() => mockStore),
}));

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    listId: 'inbox',
    parentId: undefined,
    title: 'Test Task',
    description: 'A test description',
    dueDate: undefined,
    deadline: undefined,
    estimateMinutes: 0,
    actualMinutes: 0,
    status: 'pending',
    priority: 'none',
    recurrence: undefined,
    recurrenceRule: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: undefined,
    labels: [],
    subtasks: [],
    attachments: [],
    reminders: [],
    changeLogs: [],
    list: { name: 'Inbox', icon: '📥', color: '#3b80f6' },
    ...overrides,
  } as Task;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskCard', () => {
  it('renders task title and description', () => {
    const task = createMockTask();
    render(<TaskCard task={task} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('renders list name and icon', () => {
    const task = createMockTask({
      list: { name: 'My List', icon: '📁', color: '#ffffff' },
    });
    render(<TaskCard task={task} />);

    expect(screen.getByText('My List')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('calls toggleTaskComplete when checkbox is clicked', () => {
    const task = createMockTask();
    render(<TaskCard task={task} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggleTaskComplete).toHaveBeenCalledWith('task-1', 'completed');
  });

  it('calls openEditTask when edit button is clicked', () => {
    const task = createMockTask();
    render(<TaskCard task={task} />);

    const editButton = screen.getByLabelText('Edit task');
    fireEvent.click(editButton);

    expect(mockOpenEditTask).toHaveBeenCalledWith('task-1');
  });

  it('displays due date badge when dueDate is today', () => {
    const today = new Date();
    const task = createMockTask({ dueDate: today });
    render(<TaskCard task={task} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays due date badge with formatted date for future dates', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const task = createMockTask({ dueDate: nextWeek });
    render(<TaskCard task={task} />);

    // Format: e.g., "Feb 2"
    const formatted = nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it('displays estimate time when estimateMinutes > 0', () => {
    const task = createMockTask({ estimateMinutes: 90 });
    render(<TaskCard task={task} />);

    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('displays priority badge when priority is not none', () => {
    const task = createMockTask({ priority: 'high' });
    render(<TaskCard task={task} />);

    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('displays subtasks progress', () => {
    const task = createMockTask({
      subtasks: [
        { id: 's1', taskId: 't1', title: 'Sub1', completed: true, order: 0, createdAt: new Date() },
        {
          id: 's2',
          taskId: 't1',
          title: 'Sub2',
          completed: false,
          order: 1,
          createdAt: new Date(),
        },
      ],
    });
    render(<TaskCard task={task} />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('displays overdue styling for overdue tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const task = createMockTask({
      deadline: yesterday,
      status: 'pending',
    });
    render(<TaskCard task={task} />);

    const card = screen.getByText('Test Task').closest('div');
    expect(card).toBeInTheDocument();
  });
});