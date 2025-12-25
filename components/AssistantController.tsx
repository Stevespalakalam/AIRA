import React from 'react';
import { AssistantStatus, Source } from '../types';
import PulsingOrb from './PulsingOrb';
import ChatBubble from './ChatBubble';
import { BookOpenIcon } from './Icons';

interface AssistantControllerProps {
    status: AssistantStatus;
    lastUserUtterance: string;
    lastAssistantResponse: { text: string; sources?: Source[] } | null;
    onToggleAssistant: (enabled: boolean) => void;
    isEnabled: boolean;
}

const AssistantController = ({ status, lastUserUtterance, lastAssistantResponse, onToggleAssistant, isEnabled }: AssistantControllerProps) => {

    const showInitialMessage = !lastUserUtterance && !lastAssistantResponse && status !== AssistantStatus.ACTIVATED && isEnabled;
    const showWelcomeMessage = !isEnabled;
    
    let displayContent;

    if (showWelcomeMessage) {
        displayContent = (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                <BookOpenIcon className="w-16 h-16 mb-4"/>
                <h3 className="text-lg font-serif font-medium text-slate-700">Reading Assistant</h3>
                <p className="mt-1 text-sm">Turn on the assistant to ask questions about the book.</p>
            </div>
        );
    } else if (showInitialMessage) {
        displayContent = (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4 animate-fade-in-up">
                <h3 className="text-lg font-medium text-slate-600">Assistant is active</h3>
                <p className="mt-1 text-sm">Say <span className="font-semibold text-indigo-600">"Hello Hello"</span> followed by your question.</p>
            </div>
        );
    } else if (lastAssistantResponse) {
        displayContent = <ChatBubble message={{ role: 'assistant', text: lastAssistantResponse.text, sources: lastAssistantResponse.sources }} />;
    } else if (lastUserUtterance) {
        displayContent = <ChatBubble message={{ role: 'user', text: lastUserUtterance }} />;
    } else {
        // This case handles when the assistant is activated but waiting for a question,
        // so we don't show the initial message. The PulsingOrb will show the state.
        displayContent = <div className="min-h-[60px]"></div>; // Placeholder to prevent layout jump
    }


    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="flex-grow p-4 overflow-y-auto flex flex-col justify-end">
                {displayContent}
            </div>
            <div className="flex-shrink-0 bg-slate-100/70 p-4 flex items-center justify-between gap-4 border-t border-slate-200">
                <PulsingOrb status={status} />
                <label htmlFor="assistant-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input
                            id="assistant-toggle"
                            type="checkbox"
                            className="sr-only"
                            checked={isEnabled}
                            onChange={(e) => onToggleAssistant(e.target.checked)}
                        />
                        <div className={`block w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isEnabled ? 'transform translate-x-full' : ''}`}></div>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default AssistantController;