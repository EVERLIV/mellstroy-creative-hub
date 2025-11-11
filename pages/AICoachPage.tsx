import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Sparkles, Loader, ArrowLeft } from 'lucide-react';

interface AICoachPageProps {
    messages: Message[];
    onSendMessage: (messageText: string) => void;
    isLoading: boolean;
    onClose: () => void;
}

const AICoachPage: React.FC<AICoachPageProps> = ({ messages, onSendMessage, isLoading, onClose }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    const handleSend = () => {
        if (message.trim() && !isLoading) {
            onSendMessage(message.trim());
            setMessage('');
            const textarea = textareaRef.current;
            if (textarea) textarea.style.height = 'auto';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100">
            <div className="p-4 flex items-center justify-center relative">
                <button onClick={onClose} className="absolute left-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                        <Sparkles className="w-5 h-5"/>
                    </div>
                    <h1 className="font-bold text-lg text-gray-800 ml-3">AI Fitness Coach</h1>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'trainer' && 
                            <div className="w-6 h-6 rounded-full mr-2 flex-shrink-0 flex items-center justify-center bg-purple-500 text-white">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        }
                        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-[#FF6B35] text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none'
                        }`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-orange-100' : 'text-gray-400'} text-right`}>{msg.timestamp}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end justify-start">
                        <div className="w-6 h-6 rounded-full mr-2 flex-shrink-0 flex items-center justify-center bg-purple-500 text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm bg-white text-gray-800 rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-0"></span>
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-150"></span>
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-300"></span>
                            </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            <div className="px-3 pt-3 bg-white border-t border-slate-200 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div className="flex items-end space-x-3 bg-slate-100 rounded-2xl p-2">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInput}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask for fitness advice..."
                        rows={1}
                        className="flex-1 w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none max-h-32 text-sm py-2 text-slate-800 placeholder:text-slate-500"
                    />
                    <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#FF6B35] text-white hover:bg-orange-600 transition-colors disabled:bg-slate-400 disabled:cursor-wait" aria-label="Send message">
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AICoachPage;