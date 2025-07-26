// src/contexts/useSession.tsx

// Change these placeholder values
const defaultSessionState: SessionState = {
  userId: "local-dev-user", // Use a static ID for local development
  sessionId: null,
  isSessionActive: false,
};

const SESSION_STORAGE_KEY = "edu-ai-session"; // Give it a unique name

const BASE_API_URL = "http://localhost:8080"; // Set your actual backend URL