import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import ConversationCardSkeleton from '../components/ConversationCardSkeleton';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  booking_id?: string | null;
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  other_participant: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  booking_details?: {
    id: string;
    booking_date: string;
    booking_time: string;
    class_name: string;
    verification_code: string;
  } | null;
  unread_count: number;
}

const MessageListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get all conversations for this user
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (convError) throw convError;

        if (!convData || convData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get last message and other participant info for each conversation
        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            const otherParticipantId = conv.participant_1_id === user.id 
              ? conv.participant_2_id 
              : conv.participant_1_id;

            // Get other participant profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', otherParticipantId)
              .single();

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('content, sender_id, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('recipient_id', user.id)
              .eq('is_read', false);

            // Get booking details if booking_id exists
            let bookingDetails = null;
            if (conv.booking_id) {
              try {
                const { data: bookingData, error: bookingError } = await supabase
                  .from('bookings')
                  .select('id, booking_date, booking_time, verification_code, class_id')
                  .eq('id', conv.booking_id)
                  .single();

                if (bookingData && !bookingError) {
                  // Get class name separately
                  const { data: classData } = await supabase
                    .from('classes')
                    .select('name')
                    .eq('id', bookingData.class_id)
                    .single();

                  bookingDetails = {
                    id: bookingData.id,
                    booking_date: bookingData.booking_date,
                    booking_time: bookingData.booking_time,
                    class_name: classData?.name || 'Unknown Class',
                    verification_code: bookingData.verification_code || ''
                  };
                }
              } catch (err) {
                // Silently fail for booking details - conversation should still show
              }
            }

            return {
              ...conv,
              other_participant: profileData || { id: otherParticipantId, username: 'Unknown', avatar_url: null },
              last_message: lastMessageData || undefined,
              booking_details: bookingDetails,
              unread_count: unreadCount || 0
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Handle automatic chat opening from navigation state
  useEffect(() => {
    const handleAutoOpenChat = async () => {
      const state = location.state as { recipientId?: string; recipientName?: string; context?: any } | null;
      
      if (!state?.recipientId || !user || openingChat) return;

      setOpeningChat(true);

      try {
        // Check if conversation already exists
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${state.recipientId}),and(participant_1_id.eq.${state.recipientId},participant_2_id.eq.${user.id})`)
          .maybeSingle();

        let conversationId = existingConv?.id;

        // Create conversation if it doesn't exist
        if (!conversationId) {
          // Get booking_id from context if available
          let bookingId = state.context?.bookingId || null;
          
          // If bookingId not in context, try to find it by classId
          if (!bookingId && state.context?.classId) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('id')
              .eq('class_id', state.context.classId)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            bookingId = bookingData?.id || null;
          }

          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              participant_1_id: user.id,
              participant_2_id: state.recipientId,
              last_message_at: new Date().toISOString(),
              booking_id: bookingId
            })
            .select('id')
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
            setOpeningChat(false);
            return;
          }

          conversationId = newConv.id;
        }

        // Navigate to chat
        navigate(`/messages/${state.recipientId}`, {
          state: {
            bookingDetails: state.context?.bookingDetails || null
          },
          replace: true
        });
      } catch (error) {
        console.error('Error opening chat:', error);
      } finally {
        setOpeningChat(false);
      }
    };

    handleAutoOpenChat();
  }, [location.state, user, navigate, openingChat]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Reload conversations when new message arrives
          loadConversationsQuick();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversationsQuick = async () => {
    if (!user) return;

    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (convData) {
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          const otherParticipantId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          // Get booking details if booking_id exists
          let bookingDetails = null;
          if (conv.booking_id) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select(`
                id,
                booking_date,
                booking_time,
                verification_code,
                classes:class_id (
                  name
                )
              `)
              .eq('id', conv.booking_id)
              .single();

            if (bookingData) {
              bookingDetails = {
                id: bookingData.id,
                booking_date: bookingData.booking_date,
                booking_time: bookingData.booking_time,
                class_name: (bookingData.classes as any)?.name || 'Unknown Class',
                verification_code: bookingData.verification_code
              };
            }
          }

          return {
            ...conv,
            other_participant: profileData || { id: otherParticipantId, username: 'Unknown', avatar_url: null },
            last_message: lastMessageData || undefined,
            booking_details: bookingDetails,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    }
  };

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm z-20 flex-shrink-0">
        <div className="w-9"></div>
        <h1 className="text-base font-bold text-foreground">Messages</h1>
        <div className="w-9"></div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-muted/30 pb-safe-nav">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <ConversationCardSkeleton key={idx} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center mt-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-900 mt-4">No Conversations Yet</p>
              <p className="text-xs text-gray-600 mt-2">
                Book a class with a trainer to start chatting.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const isMyMessage = conv.last_message?.sender_id === user?.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.other_participant.id}`, {
                      state: { bookingDetails: conv.booking_details }
                    })}
                    className="w-full bg-card rounded-lg p-3 mb-3 shadow-sm border border-border hover:bg-muted transition-colors text-left"
                  >
                    {/* Header with avatar, name, time and unread badge */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {conv.other_participant.avatar_url ? (
                          <img 
                            src={conv.other_participant.avatar_url} 
                            alt={conv.other_participant.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MessageCircle className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      
                      {/* Name and message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm ${conv.unread_count > 0 ? 'font-bold' : 'font-semibold'} text-foreground`}>
                                    {conv.other_participant.username}
                                  </span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {conv.unread_count > 0 && (
                                      <div className="px-2 py-0.5 bg-primary rounded-full">
                                        <span className="text-primary-foreground text-xs font-bold">{conv.unread_count}</span>
                                      </div>
                                    )}
                                    {conv.last_message && (
                                      <span className={`text-xs ${conv.unread_count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Last message preview */}
                                {conv.last_message && (
                                  <p className={`text-xs truncate ${conv.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {isMyMessage && <span className="text-muted-foreground">You: </span>}
                                    {conv.last_message.content}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Booking details if available */}
                            {conv.booking_details && (
                              <div className="mt-2 p-2.5 bg-muted rounded-lg border border-border">
                                <p className={`text-xs mb-1.5 ${conv.unread_count > 0 ? 'font-bold' : 'font-semibold'} text-foreground`}>
                                  {conv.booking_details.class_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-card rounded">
                                    <span className="font-semibold text-foreground">Date:</span>
                                    <span className="text-muted-foreground">
                                      {new Date(conv.booking_details.booking_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-card rounded">
                                    <span className="font-semibold text-foreground">Time:</span>
                                    <span className="text-muted-foreground">{conv.booking_details.booking_time}</span>
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-card rounded">
                                    <span className="font-semibold text-foreground">ID:</span>
                                    <span className="text-primary font-mono">{conv.booking_details.verification_code}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageListPage;