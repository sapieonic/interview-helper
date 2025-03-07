import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Firebase Admin
let firebaseInitialized = false;
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
  firebaseInitialized = true;
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

const db = firebaseInitialized ? admin.firestore() : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// OpenAI API endpoints
app.post('/api/openai/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audioData.split(',')[1], 'base64');
    
    // Create a temporary file
    const tempFilePath = join(dirname(fileURLToPath(import.meta.url)), 'temp.webm');
    
    // Write buffer to file
    const fs = await import('fs/promises');
    await fs.writeFile(tempFilePath, buffer);
    
    // Create a File object from the buffer
    const file = await fs.readFile(tempFilePath);
    
    // Call OpenAI API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });
    
    // Clean up temp file
    await fs.unlink(tempFilePath);
    
    // Estimate token usage
    const estimatedTokens = transcription.text.split(/\s+/).length * 1.3;
    
    res.status(200).json({
      text: transcription.text,
      usage: {
        totalTokens: Math.ceil(estimatedTokens)
      }
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Set up streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;
    
    // Estimate prompt tokens
    for (const message of messages) {
      promptTokens += message.content.split(/\s+/).length * 1.3;
    }
    
    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      completionTokens += content.split(/\s+/).length * 1.3;
      
      // Send chunk to client
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
    }
    
    // Send final response
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      response: fullResponse,
      usage: {
        promptTokens: Math.ceil(promptTokens),
        completionTokens: Math.ceil(completionTokens),
        totalTokens: Math.ceil(promptTokens + completionTokens)
      }
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Error generating chat completion:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.post('/api/openai/speech', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    // Call OpenAI API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
    });
    
    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Estimate token usage
    const estimatedTokens = text.split(/\s+/).length * 1.3;
    
    // Set headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    
    // Send response
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openai/feedback', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });
    
    const feedback = completion.choices[0].message.content;
    
    res.status(200).json({
      feedback,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      }
    });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Firebase API endpoints
app.post('/api/firebase/create-session', async (req, res) => {
  try {
    if (!firebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }
    
    const { userId, userEmail, interviewType } = req.body;
    
    // Create a new session
    const sessionRef = db.collection('sessions').doc();
    const sessionId = sessionRef.id;
    
    await sessionRef.set({
      userId,
      userEmail,
      interviewType,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      endTime: null,
      totalTokens: 0,
      completed: false
    });
    
    res.status(200).json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/firebase/update-session', async (req, res) => {
  try {
    if (!firebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }
    
    const { sessionId, tokenCount } = req.body;
    
    // Update session
    const sessionRef = db.collection('sessions').doc(sessionId);
    await sessionRef.update({
      totalTokens: admin.firestore.FieldValue.increment(tokenCount)
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/firebase/complete-session', async (req, res) => {
  try {
    if (!firebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }
    
    const { sessionId } = req.body;
    
    // Complete session
    const sessionRef = db.collection('sessions').doc(sessionId);
    await sessionRef.update({
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      completed: true
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/firebase/session/:sessionId', async (req, res) => {
  try {
    if (!firebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }
    
    const { sessionId } = req.params;
    
    // Get session
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(sessionDoc.data());
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/firebase/user-sessions/:userId', async (req, res) => {
  try {
    if (!firebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }
    
    const { userId } = req.params;
    
    // Get user sessions
    const sessionsRef = db.collection('sessions');
    const querySnapshot = await sessionsRef
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc')
      .get();
    
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 