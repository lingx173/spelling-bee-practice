import { useState, useEffect } from 'react'
import { Volume2, Save, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'
import { Settings as SettingsType } from '../../types'
import { db } from '../../lib/database'
import { ttsService } from '../../services/tts'

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testText] = useState('Beautiful')

  useEffect(() => {
    loadSettings()
    loadVoices()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await db.settings.get('default')
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVoices = () => {
    const voices = ttsService.getAvailableVoices()
    setAvailableVoices(voices)
  }

  const handleVoiceSettingChange = (key: keyof SettingsType['voiceSettings'], value: any) => {
    if (!settings) return

    setSettings({
      ...settings,
      voiceSettings: {
        ...settings.voiceSettings,
        [key]: value
      }
    })
  }

  const handlePracticeSettingChange = (key: keyof SettingsType['practiceSettings'], value: any) => {
    if (!settings) return

    setSettings({
      ...settings,
      practiceSettings: {
        ...settings.practiceSettings,
        [key]: value
      }
    })
  }

  const handleTestVoice = async () => {
    if (!settings) return

    try {
      // Set the preferred voice if selected
      if (settings.voiceSettings.preferredVoice) {
        ttsService.setPreferredVoice(settings.voiceSettings.preferredVoice)
      }

      await ttsService.speak(testText, {
        rate: settings.voiceSettings.rate,
        pitch: settings.voiceSettings.pitch,
        volume: settings.voiceSettings.volume
      })
    } catch (error) {
      console.error('TTS test failed:', error)
      toast.error('Failed to test voice. Please check your browser settings.')
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const updatedSettings = {
        ...settings,
        lastUpdated: new Date().toISOString()
      }

      await db.settings.put(updatedSettings)
      
      // Apply voice settings to TTS service
      if (settings.voiceSettings.preferredVoice) {
        ttsService.setPreferredVoice(settings.voiceSettings.preferredVoice)
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings Error</h2>
          <p className="text-gray-600 mb-6">
            Failed to load settings. Please try refreshing the page.
          </p>
          <button onClick={loadSettings} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
        <p className="text-gray-600">
          Customize your spelling bee practice experience
        </p>
      </div>

      {/* Voice Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Volume2 className="w-5 h-5 mr-2" />
          Voice & Pronunciation
        </h2>

        <div className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Voice
            </label>
            <select
              id="voice-select"
              value={settings.voiceSettings.preferredVoice || ''}
              onChange={(e) => handleVoiceSettingChange('preferredVoice', e.target.value)}
              className="input-field"
            >
              <option value="">Default (Auto-select)</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Choose a voice for word pronunciation. US English voices are recommended.
            </p>
          </div>

          {/* Speech Rate */}
          <div>
            <label htmlFor="speech-rate" className="block text-sm font-medium text-gray-700 mb-2">
              Speech Rate: {settings.voiceSettings.rate.toFixed(1)}x
            </label>
            <input
              id="speech-rate"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voiceSettings.rate}
              onChange={(e) => handleVoiceSettingChange('rate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label htmlFor="speech-pitch" className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {settings.voiceSettings.pitch.toFixed(1)}
            </label>
            <input
              id="speech-pitch"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voiceSettings.pitch}
              onChange={(e) => handleVoiceSettingChange('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (0.5)</span>
              <span>Normal (1.0)</span>
              <span>High (2.0)</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <label htmlFor="speech-volume" className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {Math.round(settings.voiceSettings.volume * 100)}%
            </label>
            <input
              id="speech-volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.voiceSettings.volume}
              onChange={(e) => handleVoiceSettingChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Mute (0%)</span>
              <span>Half (50%)</span>
              <span>Full (100%)</span>
            </div>
          </div>

          {/* Test Voice */}
          <div>
            <button
              onClick={handleTestVoice}
              className="btn-secondary flex items-center space-x-2"
              disabled={!ttsService.isAvailable}
            >
              <TestTube className="w-4 h-4" />
              <span>Test Voice with "{testText}"</span>
            </button>
            {!ttsService.isAvailable && (
              <p className="text-sm text-red-600 mt-2">
                Text-to-speech is not available in your browser
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Practice Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Practice Preferences
        </h2>

        <div className="space-y-4">
          {/* Case Sensitivity */}
          <div className="flex items-center">
            <input
              id="case-sensitive"
              type="checkbox"
              checked={settings.practiceSettings.caseSensitive}
              onChange={(e) => handlePracticeSettingChange('caseSensitive', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="case-sensitive" className="ml-2 block text-sm text-gray-900">
              Case-sensitive spelling
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            When enabled, capitalization must match exactly (not recommended for most users)
          </p>

          {/* Show Definitions */}
          <div className="flex items-center">
            <input
              id="show-definitions"
              type="checkbox"
              checked={settings.practiceSettings.showDefinitions}
              onChange={(e) => handlePracticeSettingChange('showDefinitions', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="show-definitions" className="ml-2 block text-sm text-gray-900">
              Show word definitions and examples
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Display definitions and example sentences after answering (when available)
          </p>

          {/* Slow Playback */}
          <div className="flex items-center">
            <input
              id="slow-playback"
              type="checkbox"
              checked={settings.practiceSettings.slowPlayback}
              onChange={(e) => handlePracticeSettingChange('slowPlayback', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="slow-playback" className="ml-2 block text-sm text-gray-900">
              Use slower speech rate for practice
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Automatically use a slower speech rate (0.7x) during practice sessions
          </p>
        </div>
      </div>

      {/* App Information */}
      <div className="card bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          About Spelling Bee Practice
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Last Updated:</strong> {new Date(settings.lastUpdated).toLocaleString()}</p>
          <p><strong>Database:</strong> IndexedDB (offline-capable)</p>
          <p><strong>TTS Status:</strong> {ttsService.isAvailable ? 'Available' : 'Not Available'}</p>
          {ttsService.currentVoice && (
            <p><strong>Current Voice:</strong> {ttsService.currentVoice.name}</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  )
}
