"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ApiService } from "@/services/api";

type SessionContextType = {
  userId: string | null;
  sessionId: string | null;
};

const SessionContext = createContext<SessionContextType>({
  userId: null,
  sessionId: null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      console.log("Initializing session...");

      // Get or generate userId (persisted)
      let storedUserId = localStorage.getItem("eduai_user_id");
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem("eduai_user_id", storedUserId);
      }

      // Always create a new session
      const { sessionId: newSessionId } = await ApiService.initializeSession(
        storedUserId
      );

      setUserId(storedUserId);
      setSessionId(newSessionId);

      console.log("Session initialized:", {
        userId: storedUserId,
        sessionId: newSessionId,
      });
    }

    init();
  }, []);

  return (
    <SessionContext.Provider value={{ userId, sessionId }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
