import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types';
import { Send, Sparkles, Loader, Bot, User, ArrowLeft, Settings, Copy, Check } from 'lucide-react';
import { useToast } from '../src/hooks/use-toast';

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
    const [hasStartedTyping, setHasStartedTyping] = useState(false);

    useEffect(() => {
        // If not latest or already started typing for this message, show full text immediately
        if (!isLatest || hasStartedTyping) {
            setDisplayedText(text);
            return;
        }

        // Mark that we've started typing for this message
        setHasStartedTyping(true);

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 20);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text, isLatest, hasStartedTyping]);

    // Reset state when text changes (new message)
    useEffect(() => {
        if (isLatest) {
            setDisplayedText('');
            setCurrentIndex(0);
            setHasStartedTyping(false);
        }
    }, [text, isLatest]);

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
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = () => {
        if (message.trim() && !isLoading) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopyMessage = async (messageText: string, messageId: number) => {
        try {
            await navigator.clipboard.writeText(messageText);
            setCopiedId(messageId);
            toast({
                title: "Copied!",
                description: "AI response copied to clipboard",
            });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast({
                title: "Copy failed",
                description: "Failed to copy to clipboard",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-accent px-4 py-4 relative flex-shrink-0">
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-card/20 hover:bg-card/30 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-primary-foreground" />
                </button>
                <button onClick={() => navigate('/ai-coach/profile')} className="absolute top-4 right-4 p-2 rounded-full bg-card/20 hover:bg-card/30 transition-colors">
                    <Settings className="w-5 h-5 text-primary-foreground" />
                </button>
                <h1 className="text-lg font-semibold text-primary-foreground text-center">AI Coach</h1>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 max-w-4xl mx-auto w-full min-h-0">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl"></div>
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">Welcome to AI Coach</h3>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                            Your personal fitness assistant. Ask about workouts, nutrition, or get customized training plans!
                        </p>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                            {[
                                { text: "How do I build muscle?", icon: "💪" },
                                { text: "Create a workout plan for me", icon: "🏋️" },
                                { text: "What should I eat pre-workout?", icon: "🥗" }
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setMessage(suggestion.text);
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                    className="group px-5 py-4 bg-card/50 backdrop-blur-sm rounded-2xl text-sm text-foreground hover:bg-card transition-all duration-200 text-left border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="mr-2 text-lg">{suggestion.icon}</span>
                                    <span className="group-hover:text-primary transition-colors">{suggestion.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => {
                    // Only apply typing effect to the very last AI message
                    const isLatestAI = msg.sender === 'trainer' && index === messages.length - 1;
                    const isCopied = copiedId === msg.id;
                    
                    return (
                        <div 
                            key={msg.id} 
                            className={`flex items-start gap-3 sm:gap-4 animate-fade-in ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Avatar */}
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                                msg.sender === 'user' 
                                    ? 'bg-gradient-to-br from-primary to-accent ring-2 ring-primary/20' 
                                    : 'bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20'
                            }`}>
                                {msg.sender === 'user' ? (
                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                                ) : (
                                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className="flex flex-col flex-1 max-w-[85%] sm:max-w-[80%]">
                                <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl shadow-lg transition-all duration-200 ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground rounded-tr-sm hover:shadow-xl' 
                                        : 'bg-card/80 backdrop-blur-sm text-foreground rounded-tl-sm border border-border/50 hover:border-primary/30 hover:shadow-xl'
                                }`}>
                                    {msg.sender === 'user' ? (
                                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.text}
                                        </p>
                                    ) : (
                                        <TypingMessage text={msg.text} isLatest={isLatestAI} />
                                    )}
                                    
                                    {/* Copy Button for AI messages - inside at bottom */}
                                    {msg.sender === 'trainer' && (
                                        <button
                                            onClick={() => handleCopyMessage(msg.text, msg.id)}
                                            className="mt-3 pt-3 border-t border-border/30 w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                            aria-label="Copy message"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                                    <span className="text-green-500 font-medium">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <span className={`text-xs mt-2 px-2 font-medium ${
                                    msg.sender === 'user' ? 'text-right text-muted-foreground/70' : 'text-left text-muted-foreground/70'
                                }`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-center gap-3 sm:gap-4 animate-fade-in">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 animate-pulse">
                            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="flex gap-3 items-center px-5 py-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                            <Loader className="w-5 h-5 text-primary animate-spin" />
                            <span className="text-sm sm:text-base text-muted-foreground font-medium">AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-border bg-background px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative bg-muted rounded-lg px-3 py-2 flex items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about fitness, nutrition, workouts..."
                                className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || isLoading}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICoachPage;
