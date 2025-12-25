import React, { useState, useEffect } from 'react';
import LibraryView from './components/LibraryView';
import ReadingView from './components/ReadingView';
import { dbService } from './services/dbService';

declare const pdfjsLib: any;

declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string | undefined>;
    }
  }
}

export default function App() {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [speechSupportError, setSpeechSupportError] = useState(false);

  useEffect(() => {
    // Check for API Key
    const checkApiKey = async () => {
        try {
            const key = await window.electronAPI.getApiKey();
            if (!key) {
                setApiKeyError(true);
                console.error("Gemini API key is missing. Please add it to the .env file in the project root.");
            }
        } catch (e) {
            console.error("Error checking API key:", e);
            setApiKeyError(true);
        }
    };
    checkApiKey();

    // Check for Browser feature support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.speechSynthesis) {
        setSpeechSupportError(true);
    }

    // Configure PDF.js worker - NOTE: For a real app, this should be hosted locally
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    // Initialize Database
    dbService.initDB().then(() => {
        setDbReady(true);
    }).catch(err => {
        console.error("Database failed to initialize", err);
        setApiKeyError(true); // Treat DB error as a fatal error
    });
  }, []);

  const handleSelectBook = (id: number) => {
    setSelectedBookId(id);
  };

  const handleExitBook = () => {
    setSelectedBookId(null);
  };

  if (apiKeyError) {
    return <div className="flex items-center justify-center h-screen text-red-500 bg-red-50 text-center p-4 font-serif"><div className="bg-white p-8 rounded-lg shadow-xl">Error: Gemini API key is not configured. Please create a <code>.env</code> file in the project root and add your key.</div></div>;
  }
  
  if (speechSupportError) {
    return <div className="flex items-center justify-center h-screen text-amber-600 bg-amber-50 text-center p-4 font-serif"><div className="bg-white p-8 rounded-lg shadow-xl">Error: Speech recognition or synthesis is not supported. On some systems this may require specific configuration.</div></div>;
  }

  if (!dbReady) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 text-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-lg font-serif">Initializing Library...</p>
        </div>
      );
  }

  return (
    <main className="h-screen w-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
        {selectedBookId === null ? (
            <LibraryView onSelectBook={handleSelectBook} />
        ) : (
            <ReadingView bookId={selectedBookId} onExit={handleExitBook} />
        )}
    </main>
  );
}
