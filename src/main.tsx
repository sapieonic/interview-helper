import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check for Web Speech API support
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  console.warn('Web Speech API is not supported in this browser. Original speech transcription will not be available.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
