import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Sparkles, Loader, ArrowLeft, Bot, User } from 'lucide-react';

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
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
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

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 pt-6 pb-8 px-4 relative shadow-lg">
                <button 
                    onClick={onClose} 
                    className="absolute top-6 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div className="max-w-4xl mx-auto pt-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm mb-3 shadow-lg">
                        <Sparkles className="w-8 h-8 text-white"/>
                    </div>
                    <h1 className="text-2xl font-bold text-white">AI Fitness Coach</h1>
                    <p className="text-white/90 text-sm mt-1">Your 24/7 personal fitness assistant</p>
                </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32 max-w-4xl mx-auto w-full">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-[#FF6B35]" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Start a conversation</h3>
                        <p className="text-sm text-slate-600 max-w-sm mb-6">
                            Ask me anything about fitness, nutrition, workout plans, or health tips!
                        </p>
                        <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                            {[
                                "How do I build muscle?",
                                "Create a workout plan for me",
                                "What should I eat pre-workout?"
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setMessage(suggestion);
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                    className="px-4 py-3 bg-white rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border border-slate-200 shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 animate-fade-in ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                            msg.sender === 'user' 
                                ? 'bg-gradient-to-br from-orange-500 to-pink-500' 
                                : 'bg-gradient-to-br from-orange-100 to-pink-100'
                        }`}>
                            {msg.sender === 'user' ? (
                                <User className="w-5 h-5 text-white" />
                            ) : (
                                <Bot className="w-5 h-5 text-[#FF6B35]" />
                            )}
                        </div>

                        {/* Message Bubble */}
                        <div className="flex flex-col max-w-[75%]">
                            <div className={`px-4 py-3 rounded-2xl shadow-md ${
                                msg.sender === 'user' 
                                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-tr-md' 
                                    : 'bg-white text-slate-900 rounded-tl-md border border-slate-100'
                            }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.text}
                                </p>
                            </div>
                            <span className={`text-xs mt-1 px-2 ${
                                msg.sender === 'user' ? 'text-right text-slate-500' : 'text-left text-slate-400'
                            }`}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100 shadow-md">
                            <Bot className="w-5 h-5 text-[#FF6B35]" />
                        </div>
                        <div className="flex flex-col max-w-[75%]">
                            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white shadow-md border border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl pb-safe">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleInput}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask your fitness coach anything..."
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:outline-none resize-none max-h-32 text-sm py-2 px-2 text-slate-900 placeholder:text-slate-400"
                            style={{ minHeight: '40px' }}
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={!message.trim() || isLoading}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none" 
                            aria-label="Send message"
                        >
                            {isLoading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        AI can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AICoachPage;