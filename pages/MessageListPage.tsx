import React from 'react';
import { Trainer, Message } from '../types';
import { MessageCircle, Sparkles } from 'lucide-react';

interface MessageListPageProps {
    trainers: Trainer[];
    onSelectChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
    currentUserId: string;
}

const MessageListPage: React.FC<MessageListPageProps> = ({ trainers, onSelectChat, currentUserId }) => {
    const conversations = trainers.filter(t => t.chatHistory.length > 0);

    const findBookingContext = (trainer: Trainer, userId: string) => {
        for (const cls of trainer.classes) {
            const userBooking = cls.bookings?.find(b => b.userId === userId);
            if (userBooking) {
                return { className: cls.name, bookingDate: userBooking.date };
            }
        }
        return null;
    };
    
    return (
        <div className="bg-slate-100 h-full overflow-y-auto">
            <div className="p-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">Messages</h1>
                <div className="space-y-3">
                    {conversations.map(trainer => {
                        const lastMessage = trainer.chatHistory[trainer.chatHistory.length - 1];
                        const isUserSender = lastMessage.sender === 'user';
                        const bookingContext = findBookingContext(trainer, currentUserId);
                        const hasUnread = trainer.chatHistory.some(msg => msg.sender === 'trainer' && msg.status !== 'read');
                        
                        return (
                            <button 
                                key={trainer.id}
                                onClick={() => onSelectChat(trainer, bookingContext ?? undefined)}
                                className="w-full flex items-center p-3 bg-white rounded-xl shadow-sm shadow-slate-200/80 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <img src={trainer.imageUrl} alt={trainer.name} className="w-12 h-12 rounded-full object-cover" />
                                    {hasUnread && (
                                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
                                    )}
                                </div>
                                <div className="ml-3 flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <h3 className={`font-bold text-slate-800 truncate ${hasUnread ? 'font-extrabold' : 'font-bold'}`}>{trainer.name}</h3>
                                        <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{lastMessage.timestamp}</p>
                                    </div>
                                    {bookingContext && (
                                        <p className="text-xs text-blue-600 font-semibold truncate mt-0.5" title={`Regarding: ${bookingContext.className} on ${bookingContext.bookingDate}`}>
                                            Re: {bookingContext.className} ({bookingContext.bookingDate})
                                        </p>
                                    )}
                                    <p className={`text-sm truncate mt-0.5 ${hasUnread ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                                        {isUserSender && <span className="font-semibold">You: </span>}
                                        {lastMessage.text}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {conversations.length === 0 && (
                    <div className="text-center mt-12">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600 mt-4">No Trainer Conversations Yet</p>
                        <p className="text-sm text-slate-400 mt-2">
                            Book a class with a trainer to start a conversation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageListPage;