import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

// Mock the WebRTC hook since we can't test real WebRTC in Jest
jest.mock('@/hooks/use-webrtc', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      isSessionActive: false,
      handleStartStopClick: jest.fn(),
      currentVolume: 0,
      startSession: jest.fn(),
      sendTextMessage: jest.fn(),
      conversation: [],
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      isPaused: false,
    })),
  }
})

// Mock the tools
jest.mock('@/lib/tools', () => ({
  tools: [],
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    header: 'header',
    nav: 'nav',
    h1: 'h1',
  },
}))

// Mock components that we don't need to test
jest.mock('@/components/landing-page', () => ({
  LandingPage: ({ onGetStarted }: { onGetStarted: () => void }) => (
    <div>
      <h1>Landing Page</h1>
      <button onClick={onGetStarted} data-testid="get-started">
        Get Started
      </button>
    </div>
  ),
}))

jest.mock('@/components/setup-modal', () => ({
  SetupModal: ({ onComplete }: { onComplete: (resume: any, job: any, voice: string) => void }) => (
    <div>
      <h2>Setup Modal</h2>
      <button 
        onClick={() => onComplete({}, { jobTitle: 'Test', companyName: 'Test', jobDescription: 'Test' }, 'ash')}
        data-testid="complete-setup"
      >
        Complete Setup
      </button>
    </div>
  ),
}))

jest.mock('@/components/left-section', () => ({
  LeftSection: ({ onStartInterview }: { onStartInterview: () => void }) => (
    <div>
      <button onClick={onStartInterview} data-testid="start-interview">
        Start Interview
      </button>
    </div>
  ),
}))

jest.mock('@/components/job-info-sidebar', () => ({
  JobInfoSidebar: () => <div>Job Info Sidebar</div>,
}))

jest.mock('@/components/interview-transcript', () => ({
  InterviewTranscript: () => <div>Interview Transcript</div>,
}))

jest.mock('@/components/ai-speech-indicator', () => ({
  AISpeechIndicator: () => <div>AI Speech Indicator</div>,
}))

jest.mock('@/components/broadcast-button', () => ({
  BroadcastButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="broadcast-button">
      Broadcast
    </button>
  ),
}))

jest.mock('@/components/pause-button', () => ({
  PauseButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="pause-button">
      Pause
    </button>
  ),
}))

jest.mock('@/components/auth/auth-modal', () => ({
  AuthModal: () => <div>Auth Modal</div>,
}))

jest.mock('@/components/usage/token-usage-display', () => ({
  TokenUsageDisplay: () => {
    const { getRemainingTokens, dbUser } = useAuth()
    const remainingTokens = getRemainingTokens()
    const isPro = dbUser?.plan === 'pro'
    const interviewsRemaining = Math.floor(remainingTokens / 750)
    
    if (isPro) {
      return <div data-testid="token-display">Pro Plan</div>
    }
    
    return <div data-testid="token-display">{interviewsRemaining} interviews left</div>
  },
}))

// Import the actual App component
import App from '@/app/page'

// Mock the reset utils
jest.mock('@/lib/reset-utils', () => ({
  registerResetCallback: jest.fn(() => jest.fn()),
  handleGlobalReset: jest.fn(),
}))

// Mock the conversation types
jest.mock('@/lib/conversations', () => ({
  Conversation: {},
}))

describe('Interview Token Usage Integration', () => {
  let mockUpdateTokenCount: jest.Mock
  let mockWebRTCHook: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated user with tokens
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockDbUser = {
      id: 'user-123',
      email: 'test@example.com',
      plan: 'free',
      token_count: 1000, // User has used 1000 tokens, so 9000 remaining
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Mock Supabase auth
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser }
    })

    // Mock database operations
    mockUpdateTokenCount = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    })

    ;(supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockDbUser,
        error: null,
      }),
      update: mockUpdateTokenCount,
    }))

    // Mock WebRTC hook
    mockWebRTCHook = require('@/hooks/use-webrtc').default
  })

  it('should properly track and deduct tokens during interview usage', async () => {
    const user = userEvent.setup()

    // Setup WebRTC hook to simulate interview session
    let isSessionActive = false
    const mockConversation = [
      { id: '1', role: 'user', text: 'Hello', timestamp: new Date().toISOString() },
      { id: '2', role: 'assistant', text: 'Hi there!', timestamp: new Date().toISOString() },
      { id: '3', role: 'user', text: 'Tell me about yourself', timestamp: new Date().toISOString() },
      { id: '4', role: 'assistant', text: 'I am an AI interviewer', timestamp: new Date().toISOString() },
    ]

    mockWebRTCHook.mockImplementation(() => ({
      isSessionActive,
      handleStartStopClick: jest.fn(() => {
        isSessionActive = !isSessionActive
      }),
      currentVolume: 0,
      startSession: jest.fn().mockResolvedValue(undefined),
      sendTextMessage: jest.fn(),
      conversation: isSessionActive ? mockConversation : [],
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      isPaused: false,
    }))

    // Render the app in interview mode (development mode)
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true
    })
    
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull()
    })

    // Should show interview count
    await waitFor(() => {
      expect(screen.getByTestId('token-display').textContent).toBe('2 interviews left')
    })

    // Start interview by clicking the broadcast button
    const startButton = screen.getByTestId('broadcast-button')
    await act(async () => {
      await user.click(startButton)
    })

    // Update the mock to reflect active session
    isSessionActive = true
    mockWebRTCHook.mockImplementation(() => ({
      isSessionActive: true,
      handleStartStopClick: jest.fn(),
      currentVolume: 0,
      startSession: jest.fn(),
      sendTextMessage: jest.fn(),
      conversation: mockConversation,
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      isPaused: false,
    }))

    // Re-render to update the hook state
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    // Wait for interview to be active
    await waitFor(() => {
      expect(screen.getByTestId('broadcast-button')).not.toBeNull()
    })

    // End interview by clicking broadcast button again
    const endButton = screen.getByTestId('broadcast-button')
    await act(async () => {
      await user.click(endButton)
    })

    // Check that updateTokenCount was called with estimated tokens
    // 4 messages * 50 tokens per message = 200 tokens
    await waitFor(() => {
      expect(mockUpdateTokenCount).toHaveBeenCalledWith({
        token_count: 1200, // 1000 + 200 estimated tokens
        updated_at: expect.any(String),
      })
    })
  })

  it('should prevent interview when user has insufficient tokens', async () => {
    const user = userEvent.setup()

    // Mock user with insufficient tokens
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockDbUser = {
      id: 'user-123',
      email: 'test@example.com',
      plan: 'free',
      token_count: 1800, // User has used 1800 tokens, only 200 remaining (0 interviews)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

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

    // Mock alert
    window.alert = jest.fn()

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('token-display').textContent).toBe('0 interviews left')
    })

    // Try to start interview
    const startButton = screen.getByTestId('broadcast-button')
    await act(async () => {
      await user.click(startButton)
    })

    // Should show alert about insufficient tokens
    expect(window.alert).toHaveBeenCalledWith(
      "You've reached your free tier limit. Please upgrade to Pro to continue."
    )
  })

  it('should allow unlimited usage for pro users', async () => {
    const user = userEvent.setup()

    // Mock pro user
    const mockUser = {
      id: 'user-pro',
      email: 'pro@example.com',
    }

    const mockDbUser = {
      id: 'user-pro',
      email: 'pro@example.com',
      plan: 'pro',
      token_count: 50000, // Pro user with high usage
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

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
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('token-display').textContent).toBe('Pro Plan')
    })

    // Pro user should be able to start interview regardless of usage
    const startButton = screen.getByTestId('broadcast-button')
    await act(async () => {
      await user.click(startButton)
    })

    // Should not show any alerts
    expect(window.alert).not.toHaveBeenCalled()
  })
}) 