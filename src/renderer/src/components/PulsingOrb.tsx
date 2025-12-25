import React from 'react';
import { AssistantStatus } from '../types';

const ThreeDotsWave = () => (
    <div className="flex items-center justify-center space-x-1.5 h-16">
        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce-sm [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce-sm [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce-sm"></div>
    </div>
);

interface PulsingOrbProps {
    status: AssistantStatus;
}

const PulsingOrb = ({ status }: PulsingOrbProps) => {
    if (status === AssistantStatus.ACTIVATED) {
        return (
            <div className="flex flex-col items-center justify-center gap-2">
                <ThreeDotsWave />
                <p className="text-slate-500 text-xs font-medium tracking-wide min-h-[16px]">Assistant is active...</p>
            </div>
        );
    }

  const getOrbState = () => {
    switch (status) {
      case AssistantStatus.LISTENING:
        return {
          className: 'bg-indigo-500 animate-pulse shadow-indigo-400/50',
          text: 'Listening...'
        };
      case AssistantStatus.THINKING:
        return {
          className: 'bg-purple-500 animate-pulse [animation-duration:1s] shadow-purple-400/50',
          text: 'Thinking...'
        };
      case AssistantStatus.SPEAKING:
        return {
          className: 'bg-teal-500 shadow-teal-400/60',
          text: 'Speaking...'
        };
       case AssistantStatus.ERROR:
        return {
          className: 'bg-amber-500 shadow-amber-500/50',
          text: 'Error'
        };
      case AssistantStatus.INACTIVE:
      default:
        return {
          className: 'bg-slate-400 shadow-slate-400/30',
          text: 'Assistant is Off'
        };
    }
  };

  const state = getOrbState();

  return (
    <div className="flex flex-col items-center justify-center gap-2">
        <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${state.className} shadow-lg blur-sm`}></div>
            <div className={`relative w-full h-full rounded-full transition-colors duration-500 ${state.className} shadow-inner`}></div>
        </div>
        <p className="text-slate-500 text-xs font-medium tracking-wide min-h-[16px]">{state.text}</p>
    </div>
  );
};

export default PulsingOrb;
