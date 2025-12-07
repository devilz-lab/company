/**
 * Image generation integration
 * Supports multiple image generation providers
 */

export interface ImageGenerationOptions {
  prompt: string
  style?: string
  width?: number
  height?: number
  negative_prompt?: string
}

export interface ImageGenerationProvider {
  name: string
  generateImage: (options: ImageGenerationOptions) => Promise<string>
}

/**
 * Stability AI (requires API key)
 */
export class StabilityAIGenerator implements ImageGenerationProvider {
  name = 'Stability AI'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateImage(options: ImageGenerationOptions): Promise<string> {
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      body: (() => {
        const formData = new FormData()
        formData.append('prompt', options.prompt)
        formData.append('output_format', 'png')
        if (options.negative_prompt) {
          formData.append('negative_prompt', options.negative_prompt)
        }
        return formData
      })(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stability AI error: ${error}`)
    }

    const data = await response.json()
    return data.image // Base64 encoded image
  }
}

/**
 * Get available image generation provider
 */
export function getImageGenerator(): ImageGenerationProvider | null {
  if (process.env.NEXT_PUBLIC_STABILITY_AI_API_KEY) {
    return new StabilityAIGenerator(process.env.NEXT_PUBLIC_STABILITY_AI_API_KEY)
  }

  return null
}

