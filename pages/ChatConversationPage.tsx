import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Loader, Calendar, MessageCircle, MoreVertical } from 'lucide-react';
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

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'fire';
  created_at: string;
}

interface Participant {
  id: string;
  username: string;
  avatar_url: string | null;
  location: string | null;
  specialty: string[] | null;
  rating: number | null;
  last_seen: string | null;
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
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reactions, setReactions] = useState<{ [messageId: string]: MessageReaction[] }>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          .select('id, username, avatar_url, location, specialty, rating, last_seen')
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
          
          // Load booking details if conversation has booking_id
          if (existingConversation.booking_id) {
            const { data: booking } = await supabase
              .from('bookings')
              .select(`
                *,
                class:classes(name, schedule_time)
              `)
              .eq('id', existingConversation.booking_id)
              .single();
            
            if (booking) {
              setBookingDetails({
                class_name: booking.class?.name,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time,
                verification_code: booking.verification_code
              });
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

  // Load messages and reactions
  useEffect(() => {
    if (!conversationId) return;

    const loadMessagesAndReactions = async () => {
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Load reactions for all messages
        if (messagesData && messagesData.length > 0) {
          const messageIds = messagesData.map(m => m.id);
          const { data: reactionsData, error: reactionsError } = await supabase
            .from('message_reactions')
            .select('*')
            .in('message_id', messageIds);

          if (!reactionsError && reactionsData) {
            const reactionsByMessage: { [messageId: string]: MessageReaction[] } = {};
            reactionsData.forEach(reaction => {
              if (!reactionsByMessage[reaction.message_id]) {
                reactionsByMessage[reaction.message_id] = [];
              }
              reactionsByMessage[reaction.message_id].push(reaction as MessageReaction);
            });
            setReactions(reactionsByMessage);
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

    loadMessagesAndReactions();
  }, [conversationId, user]);

  // Subscribe to real-time messages, reactions, and typing presence
  useEffect(() => {
    if (!conversationId || !user) return;

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const newReaction = payload.new as MessageReaction;
          setReactions(prev => ({
            ...prev,
            [newReaction.message_id]: [
              ...(prev[newReaction.message_id] || []),
              newReaction
            ]
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const deletedReaction = payload.old as MessageReaction;
          setReactions(prev => ({
            ...prev,
            [deletedReaction.message_id]: (prev[deletedReaction.message_id] || []).filter(
              r => r.id !== deletedReaction.id
            )
          }));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserPresence = Object.values(state).find(
          (presences: any) => presences[0]?.user_id !== user.id
        ) as any;
        setIsTyping(otherUserPresence?.[0]?.typing || false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, typing: false });
        }
      });

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

  const handleInput = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;

    // Send typing indicator
    if (conversationId && user) {
      const channel = supabase.channel(`conversation-${conversationId}`);
      await channel.track({ user_id: user.id, typing: true });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(async () => {
        await channel.track({ user_id: user.id, typing: false });
      }, 2000);
    }
  };

  const handleReaction = async (messageId: string, reactionType: 'like' | 'love' | 'fire') => {
    if (!user) return;

    const messageReactions = reactions[messageId] || [];
    const existingReaction = messageReactions.find(
      r => r.user_id === user.id && r.reaction_type === reactionType
    );

    try {
      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }
      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive'
      });
    }
  };

  const getReactionEmoji = (type: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'fire': return '🔥';
      default: return '👍';
    }
  };

  const getReactionCounts = (messageId: string) => {
    const messageReactions = reactions[messageId] || [];
    const counts: { [key: string]: { count: number; users: string[] } } = {};
    
    messageReactions.forEach(reaction => {
      if (!counts[reaction.reaction_type]) {
        counts[reaction.reaction_type] = { count: 0, users: [] };
      }
      counts[reaction.reaction_type].count++;
      counts[reaction.reaction_type].users.push(reaction.user_id);
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="bg-white h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  const getOnlineStatus = () => {
    if (!recipient?.last_seen) return { text: 'Offline', color: 'text-muted-foreground', dot: '⚪' };
    
    const lastSeen = new Date(recipient.last_seen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
    
    if (diffMinutes < 5) return { text: 'Online', color: 'text-green-600', dot: '🟢' };
    if (diffMinutes < 60) return { text: `Seen ${diffMinutes} min ago`, color: 'text-yellow-600', dot: '🟡' };
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return { text: `Seen ${hours}h ago`, color: 'text-orange-600', dot: '🟠' };
    }
    const days = Math.floor(diffMinutes / 1440);
    return { text: `Seen ${days}d ago`, color: 'text-muted-foreground', dot: '⚪' };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      {/* Header - WhatsApp/Telegram style */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/messages')} 
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          {/* Clickable Trainer Info - opens profile */}
          {recipient && (
            <button
              onClick={() => navigate(`/messages/${recipientId}/info`)}
              className="flex items-center gap-3 flex-1 min-w-0 py-1 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              {/* Avatar with online status */}
              <div className="relative flex-shrink-0">
                <img
                  src={recipient.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                  alt={recipient.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card flex items-center justify-center text-[8px] leading-none">
                  {onlineStatus.dot}
                </span>
              </div>
              
              {/* Trainer Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {recipient.username}
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${onlineStatus.color} font-medium`}>
                    {onlineStatus.text}
                  </span>
                  {recipient.rating && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        ⭐ {recipient.rating.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          )}
          
          {/* More Options Button */}
          <button 
            onClick={() => navigate(`/messages/${recipientId}/info`)} 
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Chat options"
          >
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Booking details banner with payment warning */}
      {bookingDetails && (
        <div className="bg-muted/50 border-b border-border flex-shrink-0">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{bookingDetails.class_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(bookingDetails.booking_date).toLocaleDateString()} • {bookingDetails.booking_time}
                </p>
              </div>
              <span className="px-2 py-1 bg-card border border-border rounded-md text-[10px] font-mono font-bold text-foreground flex-shrink-0">
                #{bookingDetails.verification_code}
              </span>
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-amber-600 text-lg flex-shrink-0">⚠️</span>
              <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong className="font-semibold">Payment at Meeting Only:</strong> Pay your trainer in person at the class. Never send money through chat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground text-center">Start the conversation!</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">Send a message to break the ice</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {messages.map((message, index) => {
              const isMyMessage = message.sender_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
              const isConsecutive = index > 0 && messages[index - 1]?.sender_id === message.sender_id;
              
              return (
                <div key={message.id} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isMyMessage && (
                    <div className="w-6 h-6 flex-shrink-0">
                      {showAvatar && (
                        <img
                          src={recipient?.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                          alt={recipient?.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="relative group">
                      <div
                        className={`px-3 py-2 ${
                          isMyMessage
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm'
                            : 'bg-card text-foreground border border-border rounded-2xl rounded-bl-sm'
                        } ${isConsecutive ? 'mt-0.5' : 'mt-1'}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Reaction button - show on hover */}
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                        className={`absolute ${isMyMessage ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-1.5 hover:bg-muted shadow-sm`}
                      >
                        <span className="text-sm">😊</span>
                      </button>
                      
                      {/* Reaction picker */}
                      {showReactionPicker === message.id && (
                        <div className={`absolute ${isMyMessage ? 'right-0' : 'left-0'} -top-12 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg flex gap-1 z-10 animate-in slide-in-from-bottom-2`}>
                          {(['like', 'love', 'fire'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => handleReaction(message.id, type)}
                              className="hover:scale-125 transition-transform p-1"
                            >
                              <span className="text-lg">{getReactionEmoji(type)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Reactions display */}
                    {reactions[message.id] && reactions[message.id].length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(getReactionCounts(message.id)).map(([type, { count, users }]) => (
                          <button
                            key={type}
                            onClick={() => handleReaction(message.id, type as any)}
                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all ${
                              users.includes(user?.id || '')
                                ? 'bg-primary/20 border border-primary/40'
                                : 'bg-card border border-border hover:bg-muted'
                            }`}
                          >
                            <span>{getReactionEmoji(type)}</span>
                            {count > 1 && <span className="text-[10px] font-medium text-foreground">{count}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {(!isConsecutive || index === messages.length - 1) && (
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                        </span>
                        {isMyMessage && (
                          <div className="flex items-center">
                            <div className="w-1 h-1 rounded-full bg-primary mr-0.5" />
                            <div className="w-1 h-1 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 flex-shrink-0">
                  <img
                    src={recipient?.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                    alt={recipient?.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>
                <div className="bg-card text-foreground border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - No bottom nav needed */}
      <div className="px-3 py-3 bg-card border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2 bg-background rounded-2xl p-2 border border-border focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none px-2 py-1.5 bg-transparent focus:outline-none text-sm max-h-[120px] overflow-y-auto text-foreground placeholder-muted-foreground"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 bg-primary text-primary-foreground p-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            {sending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
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
