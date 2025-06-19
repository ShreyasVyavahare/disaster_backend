const axios = require('axios');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    if (!this.apiKey) {
      logger.warn('Gemini API key not configured. Location extraction and image verification will be limited.');
    }
  }

  async extractLocation(description) {
    const cacheKey = `gemini_location_${Buffer.from(description).toString('base64').substring(0, 50)}`;
    
    return cacheManager.cached(cacheKey, async () => {
      if (!this.apiKey) {
        return this.fallbackLocationExtraction(description);
      }

      try {
        const prompt = `Extract the location name from this disaster description. Return only the location name in a simple format like "City, State" or "City, Country". If no clear location is found, return null.

Description: "${description}"

Location:`;

        const response = await axios.post(
          `${this.baseURL}/gemini-pro:generateContent?key=${this.apiKey}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const location = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (location && location.toLowerCase() !== 'null') {
          logger.info(`Location extracted: ${location} from description`);
          return location;
        }

        return null;
      } catch (error) {
        logger.error('Gemini location extraction error:', error.message);
        return this.fallbackLocationExtraction(description);
      }
    }, 1800);
  }

  async verifyImage(imageUrl) {
    const cacheKey = `gemini_verify_${Buffer.from(imageUrl).toString('base64').substring(0, 50)}`;
    
    return cacheManager.cached(cacheKey, async () => {
      if (!this.apiKey) {
        return this.fallbackImageVerification(imageUrl);
      }

      try {
        const prompt = `Analyze this image for signs of manipulation or verify if it shows a real disaster context. Check for:
1. Signs of digital manipulation (Photoshop artifacts, inconsistent lighting, etc.)
2. Whether the image shows a real disaster situation
3. If the image appears to be authentic and relevant

Return a JSON response with:
{
  "authentic": true/false,
  "confidence": 0.0-1.0,
  "manipulation_detected": true/false,
  "disaster_context": true/false,
  "notes": "brief explanation"
}`;

        const response = await axios.post(
          `${this.baseURL}/gemini-pro-vision:generateContent?key=${this.apiKey}`,
          {
            contents: [{
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: await this.getImageAsBase64(imageUrl)
                  }
                }
              ]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        try {
          const parsed = JSON.parse(result);
          logger.info(`Image verification completed for ${imageUrl}: ${parsed.authentic ? 'Authentic' : 'Suspicious'}`);
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse Gemini image verification response:', parseError);
          return this.fallbackImageVerification(imageUrl);
        }
      } catch (error) {
        logger.error('Gemini image verification error:', error.message);
        return this.fallbackImageVerification(imageUrl);
      }
    }, 3600);
  }

  async getImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      return buffer.toString('base64');
    } catch (error) {
      logger.error('Failed to fetch image for verification:', error.message);
      throw new Error('Failed to fetch image');
    }
  }

  fallbackLocationExtraction(description) {
    const locationPatterns = [
      /(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)/g
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match) {
        const location = match[1] || match[0];
        logger.info(`Fallback location extracted: ${location}`);
        return location;
      }
    }

    return null;
  }

  fallbackImageVerification(imageUrl) {
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl);
    
    return {
      authentic: isImageUrl,
      confidence: isImageUrl ? 0.3 : 0.0,
      manipulation_detected: false,
      disaster_context: true,
      notes: isImageUrl ? 'Basic URL validation only - Gemini API not available' : 'Invalid image URL'
    };
  }
}

module.exports = new GeminiService(); 