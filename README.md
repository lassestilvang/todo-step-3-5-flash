# Task Planner

A modern, professional daily task planner built with Next.js, TypeScript, Tailwind CSS, and SQLite.

## Features

- Create, edit, and delete tasks and lists
- Organize tasks with labels, subtasks, and priorities
- View tasks by Today, This Week, Upcoming, or All
- Search and filter functionality
- Dark mode support
- Persistent local storage with SQLite
- Responsive design with mobile support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: SQLite with better-sqlite3
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- Bun (https://bun.sh)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build & Production

```bash
# Build for production
bun run build

# Start production server
bun start
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```bash
# Database directory path (absolute or relative to project root)
# Defaults to ./data if not set
DATABASE_PATH=./data
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production |
| `bun start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run tests with Vitest |
| `bun run test:ui` | Open Vitest UI |
| `bun run test:coverage` | Generate coverage report |

## Database

The application uses SQLite for data persistence. The database file is stored at `data/task-planner.db` by default.

### Migrations

Database migrations run automatically on startup. See `src/lib/db.ts` for the schema.

## Project Structure

```
src/
  app/           # Next.js App Router pages and actions
  components/    # React components (UI and feature)
  lib/           # Utility functions and database
  store/         # Zustand state management
  types/         # TypeScript type definitions
  __tests__/     # Test files
```

## Code Style

This project uses:
- ESLint with Next.js recommended rules + custom rules
- TypeScript strict mode
- Prettier formatting (run with `bun format` if installed)

## Testing

Tests are located in `src/__tests__/` and use Vitest + React Testing Library.

```bash
# Run tests
bun test

# Run tests with UI
bun test:ui

# Generate coverage report
bun test:coverage
```

## Deployment

Build the application and deploy to any platform that supports Node.js:

```bash
bun run build
```

The `standalone` output mode is configured, making the app easy to containerize.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure tests pass
5. Submit a pull request

## License

MIT
