import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types';
import { Send, Sparkles, Loader, Bot, User, ArrowLeft, Settings } from 'lucide-react';

interface AICoachPageProps {
    messages: Message[];
    onSendMessage: (messageText: string) => void;
    isLoading: boolean;
    onClose: () => void;
}

// Component to handle typing animation for AI messages
const TypingMessage: React.FC<{ text: string; isLatest: boolean }> = ({ text, isLatest }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isLatest) {
            setDisplayedText(text);
            return;
        }

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 20);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text, isLatest]);

    // Format text with structure
    const formatText = (rawText: string) => {
        const paragraphs = rawText.split('\n\n');
        return paragraphs.map((paragraph, idx) => {
            // Check for bullet points
            if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                const items = paragraph.split('\n').filter(line => line.trim());
                return (
                    <ul key={idx} className="list-disc list-inside space-y-1 my-2">
                        {items.map((item, i) => (
                            <li key={i} className="text-sm">
                                {item.replace(/^[•\-]\s*/, '')}
                            </li>
                        ))}
                    </ul>
                );
            }
            
            // Check for numbered lists
            if (/^\d+\./.test(paragraph.trim())) {
                const items = paragraph.split('\n').filter(line => line.trim());
                return (
                    <ol key={idx} className="list-decimal list-inside space-y-1 my-2">
                        {items.map((item, i) => (
                            <li key={i} className="text-sm">
                                {item.replace(/^\d+\.\s*/, '')}
                            </li>
                        ))}
                    </ol>
                );
            }

            // Check for bold text markers
            const boldText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            return (
                <p 
                    key={idx} 
                    className="text-sm leading-relaxed mb-2 last:mb-0"
                    dangerouslySetInnerHTML={{ __html: boldText }}
                />
            );
        });
    };

    return (
        <div>
            {formatText(displayedText)}
            {isLatest && currentIndex < text.length && (
                <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
            )}
        </div>
    );
};

const AICoachPage: React.FC<AICoachPageProps> = ({ messages, onSendMessage, isLoading, onClose }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

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
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card shadow-sm z-20 flex-shrink-0 border-b border-border">
                <button 
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-lg font-bold text-foreground">AI Fitness Coach</h1>
                <button 
                    onClick={() => navigate('/ai-coach/profile')}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    aria-label="Profile settings"
                >
                    <Settings className="w-5 h-5 text-foreground" />
                </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-6 max-w-4xl mx-auto w-full">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Start a conversation</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
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
                                    className="px-4 py-3 bg-card rounded-xl text-sm text-foreground hover:bg-muted transition-colors text-left border border-border shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isLatestAI = msg.sender === 'trainer' && index === messages.length - 1;
                    
                    return (
                        <div 
                            key={msg.id} 
                            className={`flex items-start gap-3 animate-fade-in ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                                msg.sender === 'user' 
                                    ? 'bg-gradient-to-br from-primary to-accent' 
                                    : 'bg-gradient-to-br from-primary/10 to-accent/10'
                            }`}>
                                {msg.sender === 'user' ? (
                                    <User className="w-5 h-5 text-primary-foreground" />
                                ) : (
                                    <Bot className="w-5 h-5 text-primary" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className="flex flex-col max-w-[80%]">
                                <div className={`px-4 py-3 rounded-2xl shadow-md ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-tr-md' 
                                        : 'bg-card text-foreground rounded-tl-md border border-border'
                                }`}>
                                    {msg.sender === 'user' ? (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.text}
                                        </p>
                                    ) : (
                                        <TypingMessage text={msg.text} isLatest={isLatestAI && !isLoading} />
                                    )}
                                </div>
                                <span className={`text-xs mt-1 px-2 ${
                                    msg.sender === 'user' ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'
                                }`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 shadow-md">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col max-w-[75%]">
                            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-card shadow-md border border-border">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe flex-shrink-0">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleInput}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask your fitness coach anything..."
                            rows={1}
                            className="flex-1 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-32 text-sm py-2 px-3 text-foreground placeholder:text-muted-foreground"
                            style={{ minHeight: '40px' }}
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={!message.trim() || isLoading}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            aria-label="Send message"
                        >
                            {isLoading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICoachPage;
