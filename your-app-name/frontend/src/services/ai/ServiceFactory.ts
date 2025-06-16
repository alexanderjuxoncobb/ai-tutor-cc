import { AIProvider } from '../../core/AIProvider';
import type { AIProviderConfig } from '../../core/types';
import { OpenAIProvider } from './OpenAIProvider';

export class ServiceFactory {
  static createProvider(config: AIProviderConfig): AIProvider {
    switch (config.type) {
      case 'openai-realtime':
        return new OpenAIProvider(config);
      
      // Future providers can be added here
      // case 'gemini':
      //   return new GeminiProvider(config);
      // case 'openai-tutor':
      //   return new OpenAITutorProvider(config);
      
      default:
        throw new Error(`Unsupported AI provider type: ${config.type}`);
    }
  }
}