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

If this is the start of the conversation, begin by introducing yourself briefly and asking an initial question about technical support.
If this is a follow-up, evaluate their response and ask a relevant follow-up question.`
};

// Transcribe audio using Whisper API
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
    model: 'whisper-1',
  });
  
  return transcription.text;
};

// Generate chat completion using GPT
export const generateChatCompletion = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  onChunk: (content: string) => void
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    stream: true,
  });

  let fullResponse = '';

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;
    onChunk(fullResponse);
  }

  return fullResponse;
};

// Generate speech using TTS API
export const generateSpeech = async (
  text: string, 
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
): Promise<ArrayBuffer> => {
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
  
  // Create a speech synthesis request to OpenAI
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: processedText,
  });
  
  // Convert the response to an ArrayBuffer
  return mp3.arrayBuffer();
};

export default openai; 