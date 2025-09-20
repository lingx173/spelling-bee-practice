import { Link, useLocation } from 'react-router-dom'
import { 
  Home as HomeIcon, 
  BookOpen, 
  Upload, 
  List, 
  Settings as SettingsIcon 
} from 'lucide-react'
import { clsx } from 'clsx'

const navigationItems = [
  { path: '/', icon: HomeIcon, label: 'Home', ariaLabel: 'Go to home page' },
  { path: '/practice', icon: BookOpen, label: 'Practice', ariaLabel: 'Start practice session' },
  { path: '/upload', icon: Upload, label: 'Upload PDF', ariaLabel: 'Upload word list PDF' },
  { path: '/words', icon: List, label: 'Words', ariaLabel: 'Manage word lists' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings', ariaLabel: 'App settings' },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            aria-label="Spelling Bee Practice - Go to home page"
          >
            🐝 Spelling Bee
          </Link>
          
          <div className="flex space-x-1">
            {navigationItems.map(({ path, icon: Icon, label, ariaLabel }) => {
              const isActive = location.pathname === path
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'min-h-[44px] min-w-[44px]', // Accessibility: minimum tap target
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  aria-label={ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
