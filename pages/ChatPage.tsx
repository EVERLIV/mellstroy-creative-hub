import React, { useState, useRef, useEffect } from 'react';
import { Trainer, Booking, UserRole } from '../types';
import { Send, MoreVertical, AlertTriangle, Flag, Plus, Mic, CheckCircle, XCircle, Check, CheckCheck } from 'lucide-react';
import { AppScreen, ScreenHeader } from '../src/components/layout/screen';
import { ABOVE_MOBILE_NAV, SCREEN_GUTTER, SCREEN_WIDTH } from '../src/components/layout/shell';
import MessageBubble from '../components/chat/MessageBubble';
import { Avatar, AvatarFallback, AvatarImage } from '../src/components/ui/avatar';
import { Button } from '../src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../src/components/ui/dropdown-menu';
import { Textarea } from '../src/components/ui/textarea';
import { cn } from '../src/lib/utils';

interface BookingConfirmationBarProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const BookingConfirmationBar: React.FC<BookingConfirmationBarProps> = ({ onConfirm, onCancel }) => (
    <div className="animate-fade-in rounded-xl border border-primary/30 bg-primary/10 p-3">
        <p className="mb-2 text-center text-sm font-semibold text-primary">This chat is regarding a booked class.</p>
        <div className="grid grid-cols-2 gap-2">
            <Button onClick={onConfirm} className="w-full font-semibold">
                <CheckCircle /> Confirm attendance
            </Button>
            <Button onClick={onCancel} variant="destructive" className="w-full font-semibold">
                <XCircle /> Cancel booking
            </Button>
        </div>
    </div>
);

interface ChatPageProps {
    personToChatWith: Trainer;
    context?: {
        classId: number;
        className: string;
        bookingDate?: string;
        studentId: string;
    };
    onBack: () => void;
    onSendMessage: (trainerId: string, messageText: string) => void;
    onOpenReportModal: (trainer: Trainer) => void;
    userRole: UserRole;
    currentUser: Trainer;
    onUpdateBookingStatus: (trainerId: string, classId: number, bookingDate: string, studentId: string, status: 'attended' | 'cancelled') => void;
    bookingStatus?: Booking['status'];
}

const ChatPage: React.FC<ChatPageProps> = ({ personToChatWith, context, onBack, onSendMessage, onOpenReportModal, userRole, currentUser, onUpdateBookingStatus, bookingStatus }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [personToChatWith.chatHistory]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(personToChatWith.id, message.trim());
            setMessage('');
            const textarea = textareaRef.current;
            if (textarea) textarea.style.height = 'auto';
        }
    };
    
    const handleAddPhotoClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSendMessage(personToChatWith.id, `Sent an image: ${file.name}`);
        }
    };

    const handleConfirmAttendance = () => {
        if (context?.bookingDate) {
            onUpdateBookingStatus(currentUser.id, context.classId, context.bookingDate, context.studentId, 'attended');
        }
    };

    const handleCancelBookingByTrainer = () => {
        if (context?.bookingDate) {
            onUpdateBookingStatus(currentUser.id, context.classId, context.bookingDate, context.studentId, 'cancelled');
        }
    };

    return (
        <AppScreen className="flex flex-col">
            <ScreenHeader
                width="form"
                onBack={onBack}
                title={
                    <span className="flex items-center gap-3">
                        <Avatar className="size-9 md:size-10">
                            <AvatarImage src={personToChatWith.imageUrl} alt={personToChatWith.name} className="object-cover" />
                            <AvatarFallback>{personToChatWith.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                            <span className="block truncate text-base md:text-lg">{personToChatWith.name}</span>
                            <span
                                className="block truncate text-xs font-normal text-muted-foreground"
                                title={context ? `Regarding: ${context.className}${context.bookingDate ? ` on ${context.bookingDate}` : ''}` : undefined}
                            >
                                {context ? `Re: ${context.className}` : personToChatWith.specialty.join(', ')}
                            </span>
                        </span>
                    </span>
                }
                actions={
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Conversation options">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onOpenReportModal(personToChatWith)}
                            >
                                <Flag /> Report chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />

            {/* Messages: bottom padding clears the fixed composer (+ MorphicNavbar on mobile) */}
            <div className="flex-1 bg-muted/30">
                <div
                    className={cn(
                        'mx-auto flex w-full flex-col gap-4 py-4 pb-[calc(10rem_+_env(safe-area-inset-bottom))] md:pb-28',
                        SCREEN_WIDTH.form,
                        SCREEN_GUTTER
                    )}
                >
                    {userRole === 'trainer' && bookingStatus === 'booked' && (
                        <BookingConfirmationBar onConfirm={handleConfirmAttendance} onCancel={handleCancelBookingByTrainer} />
                    )}

                    {personToChatWith.aiWarning && (
                        <div role="alert" className="flex animate-fade-in items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                            <div className="flex flex-col gap-0.5">
                                <h4 className="font-semibold text-foreground">AI Warning</h4>
                                <p className="text-sm text-muted-foreground">{personToChatWith.aiWarning}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {personToChatWith.chatHistory.map((msg) => {
                            const isUser = msg.sender === 'user';
                            return (
                                <div key={msg.id} className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                                    {!isUser && (
                                        <Avatar className="size-6 shrink-0">
                                            <AvatarImage src={personToChatWith.imageUrl} alt="" className="object-cover" />
                                            <AvatarFallback className="text-[10px]">{personToChatWith.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <MessageBubble
                                        className="min-w-0 flex-1"
                                        isOwn={isUser}
                                        timestamp={msg.timestamp}
                                        body={
                                            <span className="whitespace-pre-wrap break-words">
                                                {msg.text}
                                                {isUser && (
                                                    <span className="ml-2 inline-flex translate-y-0.5 align-middle">
                                                        {msg.status === 'read' ? (
                                                            <CheckCheck size={16} aria-label="Read" />
                                                        ) : (
                                                            <Check size={16} className="opacity-70" aria-label="Sent" />
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        }
                                    />
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Composer: above MorphicNavbar on mobile, aligned with the message column */}
            <div className={cn('fixed inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur', ABOVE_MOBILE_NAV)}>
                <div className={cn('mx-auto w-full py-3', SCREEN_WIDTH.form, SCREEN_GUTTER)}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-ring">
                        <Button variant="ghost" size="icon" onClick={handleAddPhotoClick} className="shrink-0 rounded-full" aria-label="Attach file">
                            <Plus />
                        </Button>
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleInput}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            aria-label="Message"
                            rows={1}
                            className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
                        />
                        {message.trim() ? (
                            <Button size="icon" onClick={handleSend} className="shrink-0 rounded-full" aria-label="Send message">
                                <Send />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" aria-label="Use voice input">
                                <Mic />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppScreen>
    );
};

export default ChatPage;