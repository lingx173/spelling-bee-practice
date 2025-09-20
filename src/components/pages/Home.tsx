import { Link } from 'react-router-dom'
import { BookOpen, Upload, List, Download, Settings as SettingsIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { wordService } from '../../services/word-service'

export function Home() {
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    loadWordCount()
  }, [])

  const loadWordCount = async () => {
    try {
      const count = await wordService.getWordCount()
      setWordCount(count)
    } catch (error) {
      console.error('Failed to load word count:', error)
    }
  }

  const handleExportWords = async () => {
    try {
      const data = await wordService.exportWords()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spelling-bee-words-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export words:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🐝 Spelling Bee Practice
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Practice spelling with {wordCount} words in your collection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Practice Button */}
        <Link
          to="/practice"
          className="card hover:shadow-md transition-shadow group"
          aria-label="Start practicing spelling bee words"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
              <BookOpen className="w-8 h-8 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Start Practice
              </h2>
              <p className="text-gray-600">
                Practice spelling with random words from your collection
              </p>
            </div>
          </div>
        </Link>

        {/* Upload PDF Button */}
        <Link
          to="/upload"
          className="card hover:shadow-md transition-shadow group"
          aria-label="Upload a PDF with word lists"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
              <Upload className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Word List
              </h2>
              <p className="text-gray-600">
                Add words by uploading a PDF file
              </p>
            </div>
          </div>
        </Link>

        {/* Manage Words Button */}
        <Link
          to="/words"
          className="card hover:shadow-md transition-shadow group"
          aria-label="View and manage your word collection"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <List className="w-8 h-8 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Words
              </h2>
              <p className="text-gray-600">
                View, edit, and organize your word collection
              </p>
            </div>
          </div>
        </Link>

        {/* Settings Button */}
        <Link
          to="/settings"
          className="card hover:shadow-md transition-shadow group"
          aria-label="Adjust app settings and preferences"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
              <SettingsIcon className="w-8 h-8 text-gray-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Settings
              </h2>
              <p className="text-gray-600">
                Customize voice and practice preferences
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportWords}
            className="btn-secondary flex items-center space-x-2"
            aria-label="Export all words to JSON file"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export Words</span>
          </button>
        </div>
      </div>

      {wordCount === 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Get Started
              </h3>
              <p className="text-blue-800 mb-4">
                You don't have any words yet! Upload a PDF file or add words manually to start practicing.
              </p>
              <Link
                to="/upload"
                className="btn-primary"
                aria-label="Upload your first word list"
              >
                Upload Your First Word List
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
