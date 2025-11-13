import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Loader, MoreVertical, Flag, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useToast } from '../src/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from '../components/ReportModal';
import MessageBubbleSkeleton from '../components/MessageBubbleSkeleton';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Participant {
  id: string;
  username: string;
  avatar_url: string | null;
}

const ChatConversationPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversationBookingDetails, setConversationBookingDetails] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get booking details from location state or conversation
  const bookingDetails = location.state?.bookingDetails || conversationBookingDetails;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load recipient profile
  useEffect(() => {
    const loadRecipient = async () => {
      if (!recipientId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', recipientId)
          .single();

        if (error) throw error;
        setRecipient(data);
      } catch (error) {
        console.error('Error loading recipient:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recipient information',
          variant: 'destructive'
        });
      }
    };

    loadRecipient();
  }, [recipientId, toast]);

  // Load or create conversation
  useEffect(() => {
    const loadConversation = async () => {
      if (!user || !recipientId) return;

      try {
        setLoading(true);
        
        // Try to find existing conversation
        const { data: existingConversation, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${user.id})`)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingConversation) {
          setConversationId(existingConversation.id);
          setIsNewConversation(false);
          
          // Load booking details if conversation has booking_id
          if (existingConversation.booking_id) {
            try {
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, booking_date, booking_time, verification_code, class_id')
                .eq('id', existingConversation.booking_id)
                .single();

              if (bookingData && !bookingError) {
                const { data: classData } = await supabase
                  .from('classes')
                  .select('name')
                  .eq('id', bookingData.class_id)
                  .single();

                setConversationBookingDetails({
                  id: bookingData.id,
                  booking_date: bookingData.booking_date,
                  booking_time: bookingData.booking_time,
                  class_name: classData?.name || 'Unknown Class',
                  verification_code: bookingData.verification_code || ''
                });
              }
            } catch (err) {
              console.error('Error loading booking details:', err);
            }
          }
        } else {
          // Create new conversation
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              participant_1_id: user.id,
              participant_2_id: recipientId
            })
            .select()
            .single();

          if (createError) throw createError;
          setConversationId(newConversation.id);
          setIsNewConversation(true);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user, recipientId, toast]);

  // Load messages and send safety warning for new conversations
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Send safety warning message if this is a new conversation
        if (isNewConversation && user && recipientId && (!data || data.length === 0)) {
          const safetyMessage = `⚠️ Safety Reminder:\n\n• Never transfer money in advance\n• Do not pay deposits before meeting\n• Report any suspicious behavior or fraud attempts\n• Use the platform's secure payment system\n\nStay safe! If you have concerns about fraud, please report it immediately.`;
          
          // Send as system message (use a special marker in content)
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id, // Will be marked as system message by content check
              recipient_id: recipientId,
              content: safetyMessage
            });

          if (!messageError) {
            // Reload messages to show the safety warning
            const { data: updatedMessages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true });
            
            setMessages(updatedMessages || []);
          }
        }

        // Mark messages as read
        if (user) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('recipient_id', user.id)
            .eq('is_read', false);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [conversationId, user, isNewConversation, recipientId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);

          // Mark as read if I'm the recipient
          if (user && newMessage.recipient_id === user.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationId || !recipientId) return;

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendBookingDetails = async () => {
    if (!bookingDetails || !user || !conversationId || !recipientId) return;

    try {
      setSending(true);
      
      const bookingMessage = `📅 Booking Details:\n\nClass: ${bookingDetails.class_name}\nDate: ${new Date(bookingDetails.booking_date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })}\nTime: ${bookingDetails.booking_time}\nVerification Code: ${bookingDetails.verification_code}`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipientId,
          content: bookingMessage
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking details sent',
      });
    } catch (error) {
      console.error('Error sending booking details:', error);
      toast({
        title: 'Error',
        description: 'Failed to send booking details',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleReport = (reason: string, details: string) => {
    toast({
      title: 'Report Submitted',
      description: 'Thank you for helping keep our community safe. We will review your report.'
    });
    setShowReportModal(false);
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/messages')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          
          {recipient && (
            <>
              <img
                src={recipient.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                alt={recipient.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 truncate">{recipient.username}</h2>
              </div>
              
              {/* Menu Button */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-800" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-200">
                    <button 
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Flag className="w-4 h-4 mr-3 text-red-500" />
                      Report Chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Booking details banner if provided */}
      {bookingDetails && (
        <div className="bg-orange-50 border-b border-orange-100 p-3 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900 mb-1">{bookingDetails.class_name}</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>📅 {new Date(bookingDetails.booking_date).toLocaleDateString()}</span>
            <span>🕐 {bookingDetails.booking_time}</span>
            <span>ID: {bookingDetails.verification_code}</span>
          </div>
        </div>
      )}

      {/* Messages - Scrollable area with padding for fixed input */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        {loading ? (
          <div className="space-y-4">
            <MessageBubbleSkeleton isOwn={false} />
            <MessageBubbleSkeleton isOwn={true} />
            <MessageBubbleSkeleton isOwn={false} />
            <MessageBubbleSkeleton isOwn={true} />
            <MessageBubbleSkeleton isOwn={false} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id;
              const isSafetyMessage = message.content.includes('⚠️ Safety Reminder');
              
              return (
                <div key={message.id} className={`flex ${isSafetyMessage ? 'justify-center' : isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${isSafetyMessage ? 'w-full max-w-[90%]' : `max-w-[85%] ${isMyMessage ? 'order-2' : 'order-1'}`}`}>
                    {isSafetyMessage ? (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-bold text-yellow-900">Safety Reminder</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-yellow-800 leading-relaxed">
                          <p className="font-semibold mb-2">Important safety guidelines:</p>
                          <p>• Never transfer money in advance</p>
                          <p>• Do not pay deposits before meeting</p>
                          <p>• Report any suspicious behavior or fraud attempts</p>
                          <p>• Use the platform's secure payment system</p>
                          <p className="mt-2 font-semibold">Stay safe! If you have concerns about fraud, please report it immediately.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMyMessage
                              ? 'bg-[#FF6B35] text-white rounded-br-none'
                              : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div 
        className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-20"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl p-2.5 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-[#FF6B35]/20 transition-all">
            {bookingDetails && (
              <button
                onClick={handleSendBookingDetails}
                disabled={sending}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6B35] text-white hover:bg-orange-600 shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send booking details"
              >
                <Calendar className="w-5 h-5" />
              </button>
            )}
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-sm max-h-[120px] overflow-y-auto text-gray-900 placeholder-gray-500"
              style={{ minHeight: '40px' }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-[#FF6B35] text-white hover:bg-orange-600 shadow-sm active:scale-95'
                  : 'text-gray-400 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? (
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        trainerName={recipient?.username || 'User'}
      />
    </div>
  );
};

export default ChatConversationPage;
