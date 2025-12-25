import React from 'react';
import { ChatMessage } from '../types';

const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex flex-col my-2 animate-fade-in-up items-${isUser ? 'end' : 'start'}`}>
            <div className={`rounded-xl px-4 py-3 max-w-sm md:max-w-md shadow-sm ${isUser ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
            {message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-xs text-slate-500 max-w-sm md:max-w-md bg-slate-200/70 rounded-lg p-2 w-full">
                    <p className="font-semibold mb-1 text-slate-600">Sources:</p>
                    <ul className="space-y-1">
                        {message.sources.map((source, index) => (
                            <li key={index} className="truncate">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">{source.title}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ChatBubble;