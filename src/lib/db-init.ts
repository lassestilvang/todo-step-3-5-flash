/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// Database initialization module
// This module handles the creation of the database connection
// This file is server-side only - better-sqlite3 is a Node.js module

// Check if we're in a test environment before importing
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

let dbInstance: any = null;

// Get the database instance
// This function is called lazily to allow test mocks to be set up first
export function getDb(): any {
  if (dbInstance !== null) return dbInstance;

  if (isTestEnv) {
    // In test environment, use the mock from mocks/better-sqlite3.ts
    const mockDb = require('../../src/__tests__/mocks/better-sqlite3.ts').default;
    dbInstance = mockDb;
    return dbInstance;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3').default;
  dbInstance = new Database(':memory:');
  dbInstance.pragma('foreign_keys = ON');
  return dbInstance;
}