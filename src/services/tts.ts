export interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

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

  public async ensureReady(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Text-to-speech is not supported in this browser')
    }

    // If voices are already loaded, we're ready
    if (this.voices.length > 0) {
      return
    }

    // Wait for voices to be loaded with a timeout
    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max wait
      
      const checkVoices = () => {
        attempts++
        
        if (this.voices.length > 0) {
          resolve()
        } else if (attempts >= maxAttempts) {
          console.warn('TTS voices not loaded after timeout, proceeding anyway')
          resolve() // Resolve anyway to not block the app
        } else {
          setTimeout(checkVoices, 100)
        }
      }
      checkVoices()
    })
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
        v.lang.toLowerCase().includes(priority.toLowerCase()) || 
        v.name.toLowerCase().includes(priority.toLowerCase())
      )
      if (voice) return voice
    }

    // Fallback to any English voice
    return this.voices.find(v => v.lang.toLowerCase().startsWith('en')) || null
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.toLowerCase().startsWith('en'))
  }

  public get currentVoice(): SpeechSynthesisVoice | null {
    return this.preferredVoice || this.findBestEnglishVoice()
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

    // Ensure TTS is ready before speaking
    await this.ensureReady()

    // Cancel any ongoing speech
    this.synth.cancel()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Set voice
      utterance.voice = options.lang 
        ? this.voices.find(v => v.lang === options.lang) || this.currentVoice
        : this.currentVoice
      
      // Set options
      utterance.rate = options.rate ?? 0.9
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      utterance.lang = utterance.voice?.lang || 'en-US' // Ensure lang is set

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
}

export const ttsService = new TTSService()