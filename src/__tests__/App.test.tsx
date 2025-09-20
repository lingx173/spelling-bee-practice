import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock the page components
vi.mock('../components/pages/Home', () => ({
  Home: () => <div data-testid="home-page">Home Page</div>
}))

vi.mock('../components/pages/Practice', () => ({
  Practice: () => <div data-testid="practice-page">Practice Page</div>
}))

vi.mock('../components/pages/Upload', () => ({
  Upload: () => <div data-testid="upload-page">Upload Page</div>
}))

vi.mock('../components/pages/WordList', () => ({
  WordList: () => <div data-testid="word-list-page">Word List Page</div>
}))

vi.mock('../components/pages/Settings', () => ({
  Settings: () => <div data-testid="settings-page">Settings Page</div>
}))

vi.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">
      <nav data-testid="navigation">Navigation</nav>
      {children}
    </div>
  )
}))

vi.mock('../components/ui/PWAUpdateNotification', () => ({
  PWAUpdateNotification: () => <div data-testid="pwa-update">PWA Update</div>
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}))

const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Routing', () => {
    it('should render home page by default', () => {
      renderApp()
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('should render practice page at /practice', () => {
      renderApp('/practice')
      
      expect(screen.getByTestId('practice-page')).toBeInTheDocument()
    })

    it('should render upload page at /upload', () => {
      renderApp('/upload')
      
      expect(screen.getByTestId('upload-page')).toBeInTheDocument()
    })

    it('should render word list page at /words', () => {
      renderApp('/words')
      
      expect(screen.getByTestId('word-list-page')).toBeInTheDocument()
    })

    it('should render settings page at /settings', () => {
      renderApp('/settings')
      
      expect(screen.getByTestId('settings-page')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should render layout wrapper', () => {
      renderApp()
      
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      expect(screen.getByTestId('navigation')).toBeInTheDocument()
    })

    it('should render PWA update notification', () => {
      renderApp()
      
      expect(screen.getByTestId('pwa-update')).toBeInTheDocument()
    })

    it('should render toast notification system', () => {
      renderApp()
      
      expect(screen.getByTestId('toaster')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply correct CSS classes', () => {
      renderApp()
      
      const mainDiv = screen.getByTestId('layout').parentElement
      expect(mainDiv).toHaveClass('min-h-screen', 'bg-gray-50')
    })
  })
})
