import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Loader, MoreVertical, Flag } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useToast } from '../src/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from '../components/ReportModal';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get booking details from location state
  const bookingDetails = location.state?.bookingDetails;

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

  // Load messages
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
  }, [conversationId, user]);

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

  const handleReport = (reason: string, details: string) => {
    toast({
      title: 'Report Submitted',
      description: 'Thank you for helping keep our community safe.'
    });
    setShowReportModal(false);
    setShowMenu(false);
  };

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

  if (loading) {
    return (
      <div className="bg-white h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
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
          </>
        )}
      </div>

      {/* Booking details banner if provided */}
      {bookingDetails && (
        <div className="bg-primary/5 border-b border-border p-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-foreground mb-1">{bookingDetails.class_name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>📅 {new Date(bookingDetails.booking_date).toLocaleDateString()}</span>
              <span>🕐 {bookingDetails.booking_time}</span>
              <span>ID: {bookingDetails.verification_code}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isMyMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-foreground border border-border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-card border-t border-border pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm max-h-[120px] overflow-y-auto text-foreground placeholder-muted-foreground"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
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
