// Server-side Gemini AI integration with safety checks
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger';

// Validate API key on module load
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY is not configured - AI suggestions will fail');
}

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.model = null;
    this.maxRetries = 2;
    this.timeout = 10000; // 10 seconds
  }

  initialize() {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }
    
    if (!this.model) {
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });
    }
    
    return this.model;
  }

  async generateWithRetry(prompt, retries = 0) {
    try {
      const model = this.initialize();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.timeout)
      );

      // Race between generation and timeout
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      const response = await result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      logger.warn('Gemini API call failed', {
        attempt: retries + 1,
        error: error.message
      });

      // Retry on rate limit or timeout
      if (retries < this.maxRetries && 
          (error.message.includes('rate limit') || 
           error.message.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.generateWithRetry(prompt, retries + 1);
      }

      throw error;
    }
  }

  async generateTaskSuggestions(tasks) {
    try {
      const taskSummary = tasks.map(task => ({
        title: task.title,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline
      }));

      const prompt = `You are a workflow optimization AI assistant. Analyze the following tasks and provide 3-5 actionable workflow suggestions to improve productivity.

Tasks:
${JSON.stringify(taskSummary, null, 2)}

Provide suggestions in the following JSON format (respond with ONLY valid JSON, no markdown):
[
  {
    "title": "Short suggestion title",
    "description": "Detailed actionable description",
    "category": "productivity|priority|time-management|delegation",
    "impact": "high|medium|low"
  }
]

Focus on:
- Task prioritization strategies
- Time management improvements
- Workload balance
- Deadline management
- Productivity enhancements`;

      const responseText = await this.generateWithRetry(prompt);
      
      // Parse and validate response
      const suggestions = this.parseAndValidateSuggestions(responseText);
      
      logger.info('Successfully generated AI suggestions', {
        count: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error('Failed to generate AI suggestions', {
        error: error.message
      });

      // Return fallback suggestions on failure
      return this.getFallbackSuggestions(tasks);
    }
  }

  parseAndValidateSuggestions(responseText) {
    try {
      // Remove markdown code blocks if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const suggestions = JSON.parse(jsonText);

      // Validate schema
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      const validCategories = ['productivity', 'priority', 'time-management', 'delegation'];
      const validImpacts = ['high', 'medium', 'low'];

      const validatedSuggestions = suggestions
        .filter(s => 
          s.title && 
          s.description && 
          s.category && 
          s.impact &&
          validCategories.includes(s.category) &&
          validImpacts.includes(s.impact)
        )
        .slice(0, 5); // Limit to 5 suggestions

      if (validatedSuggestions.length === 0) {
        throw new Error('No valid suggestions found');
      }

      return validatedSuggestions;
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error.message,
        responsePreview: responseText?.slice(0, 200)
      });
      throw new Error('Invalid AI response format');
    }
  }

  getFallbackSuggestions(tasks) {
    const suggestions = [];
    
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    const overdueTasks = tasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date()
    );

    if (overdueTasks.length > 0) {
      suggestions.push({
        title: 'Address Overdue Tasks',
        description: `You have ${overdueTasks.length} overdue task(s). Review and reschedule or complete them urgently to stay on track.`,
        category: 'time-management',
        impact: 'high'
      });
    }

    if (highPriorityTasks.length > 0) {
      suggestions.push({
        title: 'Prioritize High-Impact Work',
        description: `Focus on ${highPriorityTasks.length} high-priority task(s) first to maximize your impact and meet critical deadlines.`,
        category: 'priority',
        impact: 'high'
      });
    }

    if (pendingTasks.length > 5) {
      suggestions.push({
        title: 'Reduce Task Backlog',
        description: `With ${pendingTasks.length} pending tasks, consider delegating, deferring, or breaking down large tasks into smaller steps.`,
        category: 'productivity',
        impact: 'medium'
      });
    }

    suggestions.push({
      title: 'Daily Planning Routine',
      description: 'Start each day by reviewing your top 3 priorities. This simple habit can boost productivity by 25%.',
      category: 'productivity',
      impact: 'medium'
    });

    return suggestions.slice(0, 5);
  }
}

// Singleton instance
const geminiService = new GeminiService();
export default geminiService;
