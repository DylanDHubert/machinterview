import '@testing-library/jest-dom'

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
} 