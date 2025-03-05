# AI Interview Assistant

An AI-powered interview assistant that helps you practice for technical interviews. The application supports both Software Engineering and Technical Product Support interview types.

## Features

- Google Authentication for secure access
- Voice-based interaction with AI interviewer
- Support for different interview types:
  - Software Engineering
  - Technical Product Support
- High-quality text-to-speech using OpenAI's TTS API
- Automatic silence detection to stop recording
- Code block highlighting in responses

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory based on `.env.example`

### Setting up Firebase Authentication

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Add a web app to your project
4. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google as a sign-in provider
   - Configure the OAuth consent screen if prompted
5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the Firebase SDK configuration
6. Add the Firebase configuration to your `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Setting up OpenAI API

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to your `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

### Running the Application

```
npm run dev
```

The application will be available at http://localhost:5173

## Usage

1. Sign in with your Google account
2. Select the type of interview you want to practice
3. Click the microphone button to start recording your answer
4. The AI will respond with appropriate follow-up questions
5. You can change the voice used for the AI responses
6. Start a new interview at any time by clicking "Start New Interview"

## Technologies Used

- React
- TypeScript
- Vite
- Firebase Authentication
- OpenAI API (GPT-3.5, Whisper, TTS)
- TailwindCSS
- RecordRTC 