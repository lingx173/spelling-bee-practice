import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock TTS API calls if needed
  http.post('/api/tts', () => {
    return HttpResponse.json({ success: true })
  }),
  
  // Mock any other API endpoints as needed
  // Add more handlers here as the application grows
]
