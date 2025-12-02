import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="bg-background h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background h-screen flex flex-col overflow-hidden">
      {/* Header - matching AI Coach style */}
      <div className="bg-gradient-to-br from-primary to-accent px-4 py-4 relative flex-shrink-0">
        <h1 className="text-lg font-semibold text-primary-foreground text-center">Messages</h1>
        <p className="text-xs text-primary-foreground/80 text-center mt-1">
          {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="bg-primary/10 p-6 rounded-full mb-4">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">No Conversations Yet</p>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
                Book a class with a trainer to start chatting.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const isMyMessage = conv.last_message?.sender_id === user?.id;
                const hasUnread = conv.unread_count > 0;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.other_participant.id}`, {
                      state: { 
                        conversationId: conv.id,
                        recipientName: conv.other_participant.username,
                        recipientAvatar: conv.other_participant.avatar_url,
                        bookingDetails: conv.booking_details 
                      }
                    })}
                    className="w-full p-3 rounded-2xl border transition-all text-left group hover:scale-[1.02] active:scale-[0.98] bg-card border-border hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={conv.other_participant.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                          alt={conv.other_participant.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/20"
                        />
                        {hasUnread && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-semibold'} text-foreground`}>
                            {conv.other_participant.username}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {conv.last_message && (
                              <span className={`text-[10px] ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Booking Badge */}
                        {conv.booking_details && (
                          <div className="mb-1.5 inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md">
                            <span className="text-[10px] font-semibold text-primary">📅 {conv.booking_details.class_name}</span>
                          </div>
                        )}

                        {/* Last Message Preview */}
                        <div className="flex items-center justify-between">
                          {conv.last_message && (
                            <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {isMyMessage && <span className="text-primary mr-1">You:</span>}
                              {conv.last_message.content}
                            </p>
                          )}
                          {hasUnread && (
                            <div className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-[10px] font-bold">{conv.unread_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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