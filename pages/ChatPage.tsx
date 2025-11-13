import React, { useState, useRef, useEffect } from 'react';
import { Trainer, Booking, UserRole } from '../types';
import { ArrowLeft, Send, MoreVertical, AlertTriangle, Flag, Plus, Mic, CheckCircle, XCircle, Check, CheckCheck } from 'lucide-react';

interface BookingConfirmationBarProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const BookingConfirmationBar: React.FC<BookingConfirmationBarProps> = ({ onConfirm, onCancel }) => (
    <div className="bg-blue-50 border border-blue-200 p-3 animate-fade-in rounded-lg">
        <p className="text-sm font-semibold text-blue-800 text-center mb-2">This chat is regarding a booked class.</p>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={onConfirm} className="flex items-center justify-center w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Confirm Attendance
            </button>
            <button onClick={onCancel} className="flex items-center justify-center w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                <XCircle className="w-4 h-4 mr-1.5" /> Cancel Booking
            </button>
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [personToChatWith.chatHistory]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        <div className="flex flex-col h-screen bg-slate-100 relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-20 bg-white shadow-md p-2 rounded-full text-gray-800 hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
             <div className="absolute top-4 right-4 z-20" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-6 h-6" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-slate-200 animate-fade-in-fast">
                        <button 
                            onClick={() => { onOpenReportModal(personToChatWith); setIsMenuOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
                            <Flag className="w-4 h-4 mr-3" /> Report Chat
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pt-20">
                 <div className="flex flex-col items-center px-4 pb-4">
                     <img src={personToChatWith.imageUrl} alt={personToChatWith.name} className="w-16 h-16 rounded-full object-cover" />
                    <h2 className="font-bold text-xl text-gray-800 mt-2">{personToChatWith.name}</h2>
                    {context ? (
                        <p className="text-xs text-gray-500" title={`Regarding: ${context.className}${context.bookingDate ? ` on ${context.bookingDate}` : ''}`}>
                            Re: {context.className}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500">{personToChatWith.specialty.join(', ')}</p>
                    )}
                </div>
                
                <div className="px-4 space-y-2 mb-4">
                    {userRole === 'trainer' && bookingStatus === 'booked' && (
                        <BookingConfirmationBar onConfirm={handleConfirmAttendance} onCancel={handleCancelBookingByTrainer} />
                    )}
                    
                    {personToChatWith.aiWarning && (
                        <div className="bg-yellow-100 border border-yellow-300 p-3 flex items-start space-x-3 animate-fade-in rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-yellow-800">AI Warning</h4>
                                <p className="text-sm text-yellow-700">{personToChatWith.aiWarning}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-4">
                    {personToChatWith.chatHistory.map(msg => (
                        <div key={msg.id} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'trainer' && <img src={personToChatWith.imageUrl} className="w-6 h-6 rounded-full mr-2" />}
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                msg.sender === 'user' 
                                ? 'bg-[#FF6B35] text-white rounded-br-none' 
                                : 'bg-white text-gray-800 rounded-bl-none'
                            }`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</p>
                                <div className="flex items-center justify-end mt-1">
                                    <p className={`text-xs ${msg.sender === 'user' ? 'text-orange-100' : 'text-gray-400'}`}>{msg.timestamp}</p>
                                    {msg.sender === 'user' && (
                                        msg.status === 'read'
                                        ? <CheckCheck size={16} className="ml-1.5 text-blue-300" />
                                        : <Check size={16} className="ml-1.5 text-orange-100/80" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="px-3 pt-3 bg-white border-t border-slate-200 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div className="flex items-end space-x-3 bg-slate-100 rounded-2xl p-2">
                    <button onClick={handleAddPhotoClick} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors" aria-label="Attach file">
                        <Plus className="w-5 h-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInput}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none max-h-32 text-sm py-2 text-slate-800 placeholder:text-slate-500"
                    />
                    {message.trim() ? (
                        <button onClick={handleSend} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#FF6B35] text-white hover:bg-orange-600 transition-colors" aria-label="Send message">
                            <Send className="w-5 h-5" />
                        </button>
                    ) : (
                        <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors" aria-label="Use voice input">
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;