/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// Database initialization module
// This module handles the creation of the database connection

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

  // Import better-sqlite3 only in non-test environments
  const Database = require('better-sqlite3').default;

  // Check if it's a mock (object with prepare method) or constructor
  if (Database && typeof Database.prepare === 'function') {
    // It's a mock object
    dbInstance = Database;
  } else if (typeof Database === 'function') {
    // It's a constructor
    dbInstance = new Database(':memory:');
  } else {
    throw new Error('Could not initialize database');
  }

  // Add no-op pragma for test environments
  if (dbInstance && typeof dbInstance.pragma !== 'function') {
    dbInstance.pragma = (_cmd: string) => ({});
  }

  return dbInstance;
}