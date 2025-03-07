// Token counting utilities and types
export type InterviewType = 'software-engineer' | 'technical-product-support';

// System prompts for different interview types
export const SYSTEM_PROMPTS = {
  'software-engineer': `You are an experienced technical interviewer for a software engineering position. Your task is to conduct a technical interview that assesses the candidate's programming knowledge, problem-solving abilities, and system design skills. Ask challenging but fair questions, follow up on the candidate's responses, and provide a realistic interview experience. Be conversational and encouraging, but also thorough in your evaluation.`,
  
  'technical-product-support': `You are an experienced technical interviewer for a technical product support position. Your task is to conduct a technical interview that assesses the candidate's troubleshooting skills, customer service abilities, and technical knowledge. Ask questions about handling difficult customer situations, diagnosing technical problems, and explaining complex concepts in simple terms. Be conversational and encouraging, but also thorough in your evaluation.`
};

// Count tokens in a string (simple approximation)
export const countTokens = (text: string): number => {
  if (!text) return 0;
  
  // Simple approximation: 1 token ≈ 4 characters or 0.75 words
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
};

// Calculate tokens for a set of messages
export const calculateMessageTokens = (messages: { role: string, content: string }[]): number => {
  let totalTokens = 0;
  
  for (const message of messages) {
    // Add tokens for the content
    totalTokens += countTokens(message.content);
    
    // Add a small overhead for message metadata (role, etc.)
    totalTokens += 4;
  }
  
  // Add a small overhead for the request itself
  totalTokens += 3;
  
  return totalTokens;
};

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Transcribe audio using backend API
export const transcribeAudio = async (audioBlob: Blob): Promise<{ text: string, usage: { totalTokens: number } }> => {
  // Convert blob to base64
  const reader = new FileReader();
  const audioBase64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(audioBlob);
  });
  
  const audioData = await audioBase64Promise;
  
  // Call backend API
  const response = await fetch(`${API_BASE_URL}/openai/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audioData }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to transcribe audio');
  }
  
  return await response.json();
};

// Generate chat completion using backend API
export const generateChatCompletion = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  onChunk: (content: string) => void
): Promise<{ response: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Call backend API with streaming
  const response = await fetch(`${API_BASE_URL}/openai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate chat completion');
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }
  
  const decoder = new TextDecoder();
  let done = false;
  let fullResponse = '';
  let usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
  
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;
      
      try {
        const data = JSON.parse(line.substring(6));
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.done) {
          fullResponse = data.response;
          usage = data.usage;
          done = true;
          break;
        }
        
        if (data.content) {
          fullResponse = data.content;
          onChunk(data.content);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    }
  }
  
  return {
    response: fullResponse,
    usage
  };
};

// Generate speech using backend API
export const generateSpeech = async (
  text: string, 
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
): Promise<{ audio: ArrayBuffer, usage: { totalTokens: number } }> => {
  // Call backend API
  const response = await fetch(`${API_BASE_URL}/openai/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to generate speech');
  }
  
  // Get audio buffer
  const audioBuffer = await response.arrayBuffer();
  
  // Estimate token usage
  const estimatedTokens = countTokens(text);
  
  return {
    audio: audioBuffer,
    usage: {
      totalTokens: estimatedTokens
    }
  };
};

// Generate interview feedback using backend API
export const generateInterviewFeedback = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[]
): Promise<{ feedback: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Call backend API
  const response = await fetch(`${API_BASE_URL}/openai/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate feedback');
  }
  
  const data = await response.json();
  
  return {
    feedback: data.feedback,
    usage: data.usage
  };
}; 