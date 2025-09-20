import { TTSOptions } from '../types'

class TTSService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private preferredVoice: SpeechSynthesisVoice | null = null
  private isSupported = false

  constructor() {
    this.init()
  }

  private init(): void {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.isSupported = true
      
      // Load voices when available
      if (this.synth.getVoices().length > 0) {
        this.loadVoices()
      } else {
        this.synth.addEventListener('voiceschanged', () => {
          this.loadVoices()
        })
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return
    
    this.voices = this.synth.getVoices()
    
    // Find preferred US English voice
    this.preferredVoice = this.findBestEnglishVoice()
  }

  private findBestEnglishVoice(): SpeechSynthesisVoice | null {
    // Priority order for US English voices
    const priorities = [
      'en-US',
      'en_US',
      'en-us',
      'en',
      'English (United States)',
      'English'
    ]

    for (const priority of priorities) {
      const voice = this.voices.find(v => 
        v.lang.includes(priority) || 
        v.name.includes(priority)
      )
      if (voice) return voice
    }

    // Fallback to any English voice
    return this.voices.find(v => 
      v.lang.toLowerCase().startsWith('en')
    ) || this.voices[0] || null
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.toLowerCase().startsWith('en')
    )
  }

  public setPreferredVoice(voiceName: string): void {
    const voice = this.voices.find(v => v.name === voiceName)
    if (voice) {
      this.preferredVoice = voice
    }
  }

  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported || !this.synth) {
      throw new Error('Text-to-speech is not supported in this browser')
    }

    // Cancel any ongoing speech
    this.synth.cancel()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Set voice
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice
      }
      
      // Set options
      utterance.rate = options.rate ?? 0.9
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      utterance.lang = options.lang ?? 'en-US'
      
      // Event handlers
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))
      
      // Speak
      this.synth?.speak(utterance)
    })
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public get isAvailable(): boolean {
    return this.isSupported && this.voices.length > 0
  }

  public get currentVoice(): SpeechSynthesisVoice | null {
    return this.preferredVoice
  }
}

export const ttsService = new TTSService()
