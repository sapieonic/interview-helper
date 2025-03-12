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

If a job description is provided, you should:
- Tailor your questions to assess skills specifically mentioned in the job description
- Focus on technologies, frameworks, and methodologies listed in the requirements
- Evaluate the candidate's responses in the context of what the role demands
- Structure your questions to determine if the candidate would be a good fit for this specific position

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

If a job description is provided, you should:
- Tailor your questions to assess skills specifically mentioned in the job description
- Focus on support scenarios relevant to the products/services mentioned
- Evaluate the candidate's responses in the context of what the role demands
- Structure your questions to determine if the candidate would be a good fit for this specific position

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

// Transcribe audio using Whisper API and Web Speech API
export const transcribeAudio = async (audioBlob: Blob): Promise<{
  text: string,
  originalText: string | null,
  usage: { totalTokens: number }
}> => {
  // Start both transcription processes in parallel
  const [whisperPromise, webSpeechPromise] = await Promise.all([
    // OpenAI Whisper transcription
    (async () => {
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
      });
      return transcription.text;
    })(),

    // Web Speech API transcription (browser's built-in speech recognition)
    (async () => {
      try {
        // Create an audio URL from the blob
        const audioUrl = URL.createObjectURL(audioBlob);

        // Use the Web Speech API for local transcription
        return new Promise<string>((resolve) => {
          // Check if SpeechRecognition is available
          const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognitionAPI) {
            console.error('Speech Recognition API not supported in this browser');
            resolve('');
            return;
          }

          // Create a new audio context for processing
          const audioContext = new AudioContext();
          const audioElement = new Audio(audioUrl);

          // Set up the recognition
          const recognition = new SpeechRecognitionAPI();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.continuous = true;
          recognition.maxAlternatives = 1;

          // Store all transcription results
          let fullTranscript = '';

          // Set up recognition event handlers
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Get the latest result
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript;
                fullTranscript += ' ' + transcript;
              }
            }
          };

          recognition.onerror = (event) => {
            console.error('Web Speech API error:', event);
            // Still resolve with whatever we have
            resolve(fullTranscript.trim());

            // Clean up
            URL.revokeObjectURL(audioUrl);
            audioElement.pause();
            audioContext.close();
          };

          recognition.onend = () => {
            console.log('Web Speech recognition ended');
            resolve(fullTranscript.trim());

            // Clean up
            URL.revokeObjectURL(audioUrl);
            audioElement.pause();
            audioContext.close();
          };

          // Start recognition when audio plays
          audioElement.oncanplaythrough = () => {
            // Connect audio to the audio context
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(audioContext.destination);

            // Start recognition and play audio
            recognition.start();
            audioElement.play();

            // When audio ends, stop recognition
            audioElement.onended = () => {
              recognition.stop();
            };
          };

          // If recognition doesn't complete in a reasonable time, force it to end
          setTimeout(() => {
            if (recognition) {
              recognition.stop();
            }
          }, 15000); // 15 seconds timeout
        });
      } catch (error) {
        console.error('Error using Web Speech API:', error);
        return null; // Return null if Web Speech API fails
      }
    })()
  ]);

  // Get results from both APIs
  const whisperText = await whisperPromise;
  const webSpeechText = await webSpeechPromise;

  // Estimate token usage for audio transcription
  // This is an approximation as Whisper doesn't return token counts
  const estimatedTokens = countTokens(whisperText);

  return {
    text: whisperText,
    originalText: webSpeechText,
    usage: {
      totalTokens: estimatedTokens
    }
  };
};

// Generate chat completion using GPT
export const generateChatCompletion = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string, originalContent?: string }[],
  onChunk: (content: string) => void
): Promise<{ response: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Filter out originalContent from messages before sending to OpenAI
  const processedMessages = messages.map(({ role, content }) => ({ role, content }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: processedMessages,
    stream: true,
  });

  let fullResponse = '';
  let promptTokens = calculateMessageTokens(processedMessages);
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
  messages: { role: 'user' | 'assistant' | 'system', content: string, originalContent?: string }[]
): Promise<{ feedback: string, usage: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Create a copy of the messages to avoid modifying the original
  const feedbackMessages = [...messages];

  // Transform messages to include original speech information
  const processedMessages = feedbackMessages.map(msg => {
    if (msg.role === 'user' && msg.originalContent) {
      // Include both OpenAI transcription and original speech for user messages
      return {
        role: msg.role,
        content: `${msg.content}\n[Original: ${msg.originalContent}]`
      };
    }
    return {
      role: msg.role,
      content: msg.content
    };
  });

  // Add a system message requesting feedback
  processedMessages.push({
    role: 'system',
    content: `You are tasked with providing candid feedback on an interview conversation. This feedback is crucial for helping the interviewer improve their skills and make informed hiring decisions. Please carefully review the above interview:

After thoroughly analyzing the transcript, provide detailed feedback without sugarcoating. Focus on what needs to be improved and be straightforward in your assessment. Your feedback should include the following sections:

1. Overall Assessment
2. Strengths
3. Areas for Improvement
4. Specific Recommendations
5. Speech Recognition Accuracy
6. Final Thoughts
7. Hiring Likelihood Score

For each section, follow these guidelines:

1. Overall Assessment: Provide a concise summary of your evaluation of the interview, highlighting the most significant aspects.

2. Strengths: List the positive aspects of the candidate's performance, focusing on skills, experiences, or qualities that stood out.

3. Areas for Improvement: Identify specific weaknesses or areas where the candidate could enhance their performance. Be direct but constructive.

4. Specific Recommendations: Offer actionable advice for how the candidate can address the areas for improvement you've identified.

5. Speech Recognition Accuracy: Compare the original speech to the AI transcription, noting any significant discrepancies or errors that may have affected the interview's interpretation.

6. Final Thoughts: Summarize your overall impression and provide any additional insights not covered in the previous sections.

7. Hiring Likelihood Score: Before providing the score, explain your reasoning for the score you're about to give. Then, on a scale of 1 to 10, rate how likely you would be to hire this candidate, with 1 being extremely unlikely and 10 being extremely likely.

When writing your feedback:
- Be specific, constructive, and actionable in your comments.
- Use clear, professional language.
- Avoid unnecessary politeness or softening of criticism – be direct while remaining respectful.
- Support your observations with specific examples from the transcript where possible.

Format your response with clear headings for each section and use bullet points where appropriate to enhance readability.

Please provide your complete feedback. Begin now.`
  });

  // Calculate prompt tokens
  const promptTokens = calculateMessageTokens(processedMessages);

  // Generate the feedback
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: processedMessages,
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