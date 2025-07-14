import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

// Mock component to test the useAuth hook
const TestComponent = () => {
  const { 
    user, 
    dbUser, 
    loading, 
    updateTokenCount, 
    canUseTokens, 
    getRemainingTokens,
    signOut 
  } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user?.email || 'no-user'}</div>
      <div data-testid="db-user">{dbUser?.email || 'no-db-user'}</div>
      <div data-testid="token-count">{dbUser?.token_count || 0}</div>
      <div data-testid="remaining-tokens">{getRemainingTokens()}</div>
      <div data-testid="can-use-50-tokens">{canUseTokens(50) ? 'yes' : 'no'}</div>
      <div data-testid="can-use-20000-tokens">{canUseTokens(20000) ? 'yes' : 'no'}</div>
      <button onClick={() => updateTokenCount(100)} data-testid="update-tokens">
        Update Tokens
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock
    ;(window.localStorage.getItem as jest.Mock).mockClear()
    ;(window.localStorage.setItem as jest.Mock).mockClear()
    ;(window.localStorage.removeItem as jest.Mock).mockClear()
  })

  describe('Initial State', () => {
    it('should start with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })

    it('should initialize with no user when not authenticated', async () => {
      // Mock no user authenticated
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('db-user')).toHaveTextContent('no-db-user')
      expect(screen.getByTestId('token-count')).toHaveTextContent('0')
    })
  })

  describe('User Creation with Token Count', () => {
    it('should create new user with 10,000 tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'free',
        token_count: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock authenticated user
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      // Mock user doesn't exist in database
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue({ code: 'PGRST116' }), // Not found
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      })

      // Mock user creation
      const mockInsert = jest.fn().mockResolvedValue({
        data: mockDbUser,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue({ code: 'PGRST116' }),
        insert: mockInsert,
        update: jest.fn().mockReturnThis(),
      }))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Verify user creation was called with correct token count
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'free',
        token_count: 10000,
      })
    })

    it('should fix existing user with 0 tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockDbUserWith0Tokens = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'free',
        token_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock authenticated user
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      const mockUpdate = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      // Mock existing user with 0 tokens
      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbUserWith0Tokens,
          error: null,
        }),
        update: mockUpdate,
      }))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Verify user was updated with correct token count
      expect(mockUpdate).toHaveBeenCalledWith({ token_count: 10000 })
      expect(screen.getByTestId('token-count')).toHaveTextContent('10000')
    })
  })

  describe('Token Management Functions', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'free',
        token_count: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock authenticated user with 5000 tokens
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbUser,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }))
    })

    it('should calculate remaining tokens correctly', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      expect(screen.getByTestId('remaining-tokens')).toHaveTextContent('5000')
    })

    it('should check if user can use tokens correctly', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      expect(screen.getByTestId('can-use-50-tokens')).toHaveTextContent('yes')
      expect(screen.getByTestId('can-use-20000-tokens')).toHaveTextContent('no')
    })

    it('should update token count when interview is used', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            plan: 'free',
            token_count: 5000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
        update: mockUpdate,
      }))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Simulate using 100 tokens during interview
      act(() => {
        screen.getByTestId('update-tokens').click()
      })

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          token_count: 5100,
          updated_at: expect.any(String),
        })
      })
    })
  })

  describe('Pro Plan Users', () => {
    it('should allow unlimited tokens for pro users', async () => {
      const mockUser = {
        id: 'user-pro',
        email: 'pro@example.com',
      }

      const mockDbUser = {
        id: 'user-pro',
        email: 'pro@example.com',
        plan: 'pro',
        token_count: 50000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock authenticated pro user
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbUser,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Pro users can use any amount of tokens
      expect(screen.getByTestId('can-use-50-tokens')).toHaveTextContent('yes')
      expect(screen.getByTestId('can-use-20000-tokens')).toHaveTextContent('yes')
    })
  })

  describe('Sign Out', () => {
    it('should clear localStorage and sign out properly', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      // Mock authenticated user
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            plan: 'free',
            token_count: 5000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }))

      // Mock localStorage with Supabase keys
      ;(window.localStorage.key as jest.Mock)
        .mockReturnValueOnce('sb-auth-token')
        .mockReturnValueOnce('sb-user-session')
        .mockReturnValueOnce('other-key')
        .mockReturnValue(null)

      Object.defineProperty(window.localStorage, 'length', { value: 3 })

      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Click sign out
      act(() => {
        screen.getByTestId('sign-out').click()
      })

      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('sb-auth-token')
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('sb-user-session')
        expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('other-key')
        expect(supabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      // Mock authenticated user
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      })

      // Mock database error
      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error')),
        update: jest.fn().mockReturnThis(),
      }))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Should not crash and should show no db user
      expect(screen.getByTestId('db-user')).toHaveTextContent('no-db-user')
      expect(console.error).toHaveBeenCalledWith('Error in fetchDbUser:', expect.any(Error))
    })
  })
}) 