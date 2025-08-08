/**
 * Tests for HeroSection component
 * Covers hero content rendering, CTA functionality, and responsive layout
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HeroSection from '@/components/HeroSection'
import { useAuth } from '@/contexts/AuthContext'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('HeroSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    } as any)
  })

  describe('Content Rendering', () => {
    it('renders hero content correctly', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      // Check main heading
      expect(screen.getByText('Secure Your Web')).toBeInTheDocument()
      expect(screen.getByText('In Seconds')).toBeInTheDocument()

      // Check SecCheck logo/title
      expect(screen.getByText('SecCheck')).toBeInTheDocument()

      // Check subtitle with OWASP mention
      expect(screen.getAllByText(/OWASP Top 10/)).toHaveLength(2) // One in subtitle, one in indicators
      expect(screen.getByText(/Professional-grade automated security testing/)).toBeInTheDocument()
    })

    it('displays security indicators correctly', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      // Check quick info indicators - use getAllByText for multiple matches
      expect(screen.getByText('Safe & Non-invasive')).toBeInTheDocument()
      expect(screen.getAllByText('OWASP Top 10')).toHaveLength(2) // One in subtitle, one in indicators
      expect(screen.getByText('Instant Results')).toBeInTheDocument()
    })

    it('renders URL input with correct placeholder', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      const urlInput = screen.getByPlaceholderText('https://example.com')
      expect(urlInput).toBeInTheDocument()
    })

    it('renders start scan button', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      const startScanButton = screen.getByText('Start Scan')
      expect(startScanButton).toBeInTheDocument()
    })
  })

  describe('CTA Button Functionality', () => {
    it('redirects unauthenticated users to sign-up', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      const urlInput = screen.getByPlaceholderText('https://example.com')
      const startScanButton = screen.getByText('Start Scan')

      // Fill in URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
      
      // Click start scan button
      fireEvent.click(startScanButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/sign-up?redirectUrl=https%3A%2F%2Fexample.com')
      })
    })

    it('redirects authenticated users to dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false,
      } as any)

      render(<HeroSection />)

      const urlInput = screen.getByPlaceholderText('https://example.com')
      const startScanButton = screen.getByText('Start Scan')

      // Fill in URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
      
      // Click start scan button
      fireEvent.click(startScanButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/scan?url=https%3A%2F%2Fexample.com')
      })
    })

    it('handles URL encoding correctly', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      const urlInput = screen.getByPlaceholderText('https://example.com')
      const startScanButton = screen.getByText('Start Scan')

      // Fill in URL with special characters
      fireEvent.change(urlInput, { target: { value: 'https://example.com/path?query=value&other=test' } })
      
      // Click start scan button
      fireEvent.click(startScanButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/sign-up?redirectUrl=https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue%26other%3Dtest')
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      } as any)

      render(<HeroSection />)

      // Should still render the component but auth state might be different
      expect(screen.getByText('SecCheck')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      // Check for h1 (SecCheck title)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('SecCheck')

      // Check for h2 (main heading)
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
    })

    it('has accessible form elements', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      render(<HeroSection />)

      const urlInput = screen.getByPlaceholderText('https://example.com')
      const startButton = screen.getByText('Start Scan')

      // Check that form elements are accessible
      expect(urlInput).toBeInTheDocument()
      expect(startButton).toBeInTheDocument()
      
      // Button should be clickable (might be inside a button element)
      expect(startButton.closest('button')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('renders with responsive classes', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      const { container } = render(<HeroSection />)

      // Check that the component has responsive container classes
      const section = container.querySelector('section')
      expect(section).toHaveClass('px-6')
      expect(section).toHaveClass('lg:px-8')
    })
  })
})