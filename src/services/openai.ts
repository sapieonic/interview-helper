import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Interview types
export type InterviewType = 'software-engineer' | 'technical-product-support';

// System prompts for different interview types
export const SYSTEM_PROMPTS: Record<InterviewType, string> = {
  'software-engineer': `You are an experienced technical interviewer conducting a software engineering interview. 
Your role is to:
1. Ask relevant technical questions based on the candidate's responses
2. Evaluate their answers professionally
3. Probe deeper into their technical knowledge
4. Focus on software engineering principles, system design, and coding practices
5. Maintain a professional and constructive tone
6. Keep responses concise and focused
7. After 2-3 follow-up questions on the same topic, move to a new topic to explore the candidate's breadth of knowledge

If this is the start of the conversation, begin by introducing yourself briefly and asking an initial technical question.
If this is a follow-up, evaluate their response and ask a relevant follow-up question.`,

  'technical-product-support': `You are an experienced technical interviewer conducting an interview for a Technical Product Support role. 
Your role is to:
1. Ask relevant questions about customer support, troubleshooting, and technical problem-solving
2. Evaluate their answers professionally
3. Probe deeper into their customer service skills and technical knowledge
4. Focus on communication skills, empathy, problem-solving methodology, and technical aptitude
5. Maintain a professional and constructive tone
6. Keep responses concise and focused
7. After 2-3 follow-up questions on the same topic, move to a new topic to explore the candidate's breadth of knowledge

If this is the start of the conversation, begin by introducing yourself briefly and asking an initial question about technical support.
If this is a follow-up, evaluate their response and ask a relevant follow-up question.`
};

// Token counting helper functions
export const countTokens = (text: string): number => {
  // Simple approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Calculate tokens for a message array
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
}

// Transcribe audio using Whisper API
export const transcribeAudio = async (audioBlob: Blob): Promise<{ text: string, usage: { totalTokens: number } }> => {
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
    model: 'whisper-1',
  });
  
  // Estimate token usage for audio transcription
  // This is an approximation as Whisper doesn't return token counts
  const estimatedTokens = countTokens(transcription.text);
  
  return {
    text: transcription.text,
    usage: {
      totalTokens: estimatedTokens
    }
  };
};

// Generate chat completion using GPT
export const generateChatCompletion = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  onChunk: (content: string) => void
): Promise<{ response: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  });

  let fullResponse = '';
  let promptTokens = calculateMessageTokens(messages);
  let completionTokens = 0;

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;
    completionTokens += countTokens(content);
    onChunk(fullResponse);
  }

  return {
    response: fullResponse,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    }
  };
};

// Generate speech using TTS API
export const generateSpeech = async (
  text: string, 
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
): Promise<{ audio: ArrayBuffer, usage: { totalTokens: number } }> => {
  // Process the text to remove code blocks
  let processedText = text;
  
  // Remove code blocks with triple backticks
  processedText = processedText.replace(/```[\s\S]*?```/g, ' Code sample omitted. ');
  
  // Remove inline code with single backticks
  processedText = processedText.replace(/`[^`]+`/g, ' code reference ');
  
  // Remove code blocks with indentation (4+ spaces at start of line)
  processedText = processedText.replace(/(?:\n {4,}[^\n]+)+/g, ' Code sample omitted. ');
  
  // Remove any remaining code-like patterns
  processedText = processedText.replace(/\[\s*code\s*\]/gi, ' Code sample omitted. ');
  
  // Estimate token usage for TTS
  const estimatedTokens = countTokens(processedText);
  
  // Create a speech synthesis request to OpenAI
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: processedText,
  });
  
  // Convert the response to an ArrayBuffer
  const audioBuffer = await mp3.arrayBuffer();
  
  return {
    audio: audioBuffer,
    usage: {
      totalTokens: estimatedTokens
    }
  };
};

// Generate feedback on the interview
export const generateInterviewFeedback = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[]
): Promise<{ feedback: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Create a copy of the messages to avoid modifying the original
  const feedbackMessages = [...messages];
  
  // Add a system message requesting feedback
  feedbackMessages.push({
    role: 'system',
    content: `Please review the above interview conversation and provide constructive feedback. 
    Include the following sections:
    1. Overall Assessment
    2. Strengths
    3. Areas for Improvement
    4. Specific Recommendations
    5. Final Thoughts
    
    Focus on both technical content and communication style. Be specific, constructive, and actionable in your feedback.
    Format your response with clear headings and bullet points where appropriate.`
  });
  
  // Calculate prompt tokens
  const promptTokens = calculateMessageTokens(feedbackMessages);
  
  // Generate the feedback
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: feedbackMessages,
    temperature: 0.7,
    max_tokens: 1000,
  });
  
  // Get the feedback text
  const feedback = completion.choices[0]?.message?.content || 'Unable to generate feedback.';
  
  // Calculate completion tokens
  const completionTokens = countTokens(feedback);
  
  return {
    feedback,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    }
  };
};

export default openai; 