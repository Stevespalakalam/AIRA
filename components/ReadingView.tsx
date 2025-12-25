import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Book, AssistantStatus, Source } from '../types';
import { dbService } from '../services/dbService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { extractTextFromPage } from '../services/pdfService';
import { askBookQuestion, searchWebForDefinition } from '../services/geminiService';
import PdfViewer from './PdfViewer';
import AssistantController from './AssistantController';
import { SpinnerIcon, ArrowLeftIcon } from './Icons';

declare const pdfjsLib: any;

// Use a short, valid WAV file for the activation sound.
const activationSound = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
activationSound.volume = 0.5;

interface ReadingViewProps {
  bookId: number;
  onExit: () => void;
}

const ReadingView = ({ bookId, onExit }: ReadingViewProps) => {
    const [book, setBook] = useState<Book | null>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null); // from pdf.js
    const [status, setStatus] = useState<AssistantStatus>(AssistantStatus.INACTIVE);
    const [assistantEnabled, setAssistantEnabled] = useState(false);
    
    const [lastUserUtterance, setLastUserUtterance] = useState('');
    const [lastAssistantResponse, setLastAssistantResponse] = useState<{ text: string; sources?: Source[] } | null>(null);

    const pageTextRef = useRef('');

    const handleSpeechEnd = useCallback(() => {
        if (assistantEnabled) {
            setStatus(AssistantStatus.LISTENING);
            setLastUserUtterance('');
            setLastAssistantResponse(null);
        } else {
            setStatus(AssistantStatus.INACTIVE);
        }
    }, [assistantEnabled]);

    const { speak } = useTextToSpeech(handleSpeechEnd);

    const processTranscript = useCallback(async (transcript: string) => {
        const lowerCaseTranscript = transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
        const activationKeyword = "hello hello";

        if (status !== AssistantStatus.LISTENING && status !== AssistantStatus.ACTIVATED) {
            return;
        }

        let question = '';

        if (status === AssistantStatus.ACTIVATED) {
            question = transcript;
        } else if (status === AssistantStatus.LISTENING) {
            if (lowerCaseTranscript.startsWith(activationKeyword)) {
                const potentialQuestion = transcript.substring(activationKeyword.length).trim();
                if (potentialQuestion) {
                    question = potentialQuestion;
                } else if (lowerCaseTranscript === activationKeyword) {
                    setStatus(AssistantStatus.ACTIVATED);
                    activationSound.play().catch(e => console.error("Error playing sound:", e));
                    return;
                } else {
                    return;
                }
            } else {
                return;
            }
        }

        if (!question) {
            return;
        }

        setStatus(AssistantStatus.THINKING);
        setLastUserUtterance(question);
        setLastAssistantResponse(null);

        let responseText: string;
        let sources: Source[] = [];
        
        const defineKeywords = ["define ", "what is the meaning of ", "what's the meaning of "];
        let term = '';
        
        for (const keyword of defineKeywords) {
            if (question.toLowerCase().startsWith(keyword)) {
                term = question.substring(keyword.length).trim().replace(/\?$/, '');
                break;
            }
        }

        if (term) {
            const result = await searchWebForDefinition(term);
            responseText = result.text;
            sources = result.sources;
        } else {
            responseText = await askBookQuestion(pageTextRef.current, question);
        }

        const cleanedResponseText = responseText.replace(/[*_#]/g, '');

        if (cleanedResponseText && cleanedResponseText.trim()) {
            speak(cleanedResponseText);
            setLastAssistantResponse({ text: responseText, sources: sources });
            setStatus(AssistantStatus.SPEAKING);
        } else {
             const fallbackText = "I'm sorry, I couldn't find an answer to that. Please try rephrasing.";
             speak(fallbackText);
             setLastAssistantResponse({ text: fallbackText });
             setStatus(AssistantStatus.SPEAKING);
        }
    }, [status, speak]);

    const { startListening, stopListening } = useSpeechRecognition(processTranscript);

    // Effect to synchronize the speech recognition engine with the desired status
    useEffect(() => {
        if (status === AssistantStatus.LISTENING || status === AssistantStatus.ACTIVATED) {
            startListening();
        } else {
            stopListening();
        }
    }, [status, startListening, stopListening]);

    // Effect to handle the master toggle switch
    useEffect(() => {
        if (assistantEnabled) {
            if (status === AssistantStatus.INACTIVE) {
                setStatus(AssistantStatus.LISTENING);
            }
        } else {
            setStatus(AssistantStatus.INACTIVE);
            setLastUserUtterance('');
            setLastAssistantResponse(null);
        }
    }, [assistantEnabled]);


    useEffect(() => {
        let isMounted = true;
        const loadBook = async () => {
            const bookData = await dbService.getBook(bookId);
            if (bookData && isMounted) {
                const pdfDataCopy = bookData.pdf.slice(0);
                setBook(bookData);
                try {
                    const typedArray = new Uint8Array(pdfDataCopy);
                    const doc = await pdfjsLib.getDocument(typedArray).promise;
                    setPdfDoc(doc);
                } catch (error) {
                    console.error("Failed to load PDF document:", error);
                }
            }
        };
        loadBook();
        return () => { isMounted = false; };
    }, [bookId]);

    useEffect(() => {
        if (!pdfDoc || !book) return;
        extractTextFromPage(pdfDoc, book.currentPage).then(text => {
            pageTextRef.current = text;
        });
    }, [pdfDoc, book?.currentPage]);

    const handlePageChange = useCallback((newPage: number) => {
        if (!book || newPage < 1 || newPage > book.totalPages) return;
        const updatedBook = { ...book, currentPage: newPage, updatedAt: new Date() };
        setBook(updatedBook);
        dbService.updateBook(updatedBook).catch(err => {
            console.error("Failed to update book page", err);
        });
    }, [book]);

    if (!book || !pdfDoc) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-100 text-slate-600">
                <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="mt-4 text-lg font-serif">Loading Book...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col">
             <header className="flex-shrink-0 w-full p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={onExit} className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition-colors" aria-label="Back to Library">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        <span className="text-sm font-semibold">Library</span>
                    </button>
                    <div className="text-center">
                        <h1 className="font-serif text-xl font-bold truncate">{book.title}</h1>
                    </div>
                    {/* Placeholder for other controls */}
                    <div className="w-24"></div> 
                </div>
            </header>
            <div className="flex-grow w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-4 lg:p-6 overflow-hidden">
                <div className="md:col-span-2 h-full min-h-0">
                    <PdfViewer
                        pdfDoc={pdfDoc}
                        pageNumber={book.currentPage}
                        totalPages={book.totalPages}
                        onPrevPage={() => handlePageChange(book.currentPage - 1)}
                        onNextPage={() => handlePageChange(book.currentPage + 1)}
                    />
                </div>
                <div className="h-full min-h-0">
                    <AssistantController
                        status={status}
                        lastUserUtterance={lastUserUtterance}
                        lastAssistantResponse={lastAssistantResponse}
                        onToggleAssistant={setAssistantEnabled}
                        isEnabled={assistantEnabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReadingView;