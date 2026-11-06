import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import ConversationCardSkeleton from '../components/ConversationCardSkeleton';
import { AppScreen } from '../src/components/layout/screen';
import { DetailContextStrip } from '../src/components/layout/detail-context-strip';
import { StitchCanvas, StitchPageHeader } from '../src/components/layout/stitch-page';
import { EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../src/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '../src/components/ui/toggle-group';
import ConversationRow from '../components/chat/ConversationRow';

const SKELETON_COUNT = 5;

type InboxFilter = 'all' | 'unread' | 'bookings';

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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);

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

        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            const otherParticipantId =
              conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id;

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

            let bookingDetails = null;
            if (conv.booking_id) {
              try {
                const { data: bookingData, error: bookingError } = await supabase
                  .from('bookings')
                  .select('id, booking_date, booking_time, verification_code, class_id')
                  .eq('id', conv.booking_id)
                  .single();

                if (bookingData && !bookingError) {
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
                    verification_code: bookingData.verification_code || '',
                  };
                }
              } catch {
                /* conversation still shows */
              }
            }

            return {
              ...conv,
              other_participant: profileData || {
                id: otherParticipantId,
                username: 'Unknown',
                avatar_url: null,
              },
              last_message: lastMessageData || undefined,
              booking_details: bookingDetails,
              unread_count: unreadCount || 0,
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

  useEffect(() => {
    const handleAutoOpenChat = async () => {
      const state = location.state as
        | { recipientId?: string; recipientName?: string; context?: any }
        | null;

      if (!state?.recipientId || !user || openingChat) return;

      setOpeningChat(true);

      try {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(
            `and(participant_1_id.eq.${user.id},participant_2_id.eq.${state.recipientId}),and(participant_1_id.eq.${state.recipientId},participant_2_id.eq.${user.id})`
          )
          .maybeSingle();

        let conversationId = existingConv?.id;

        if (!conversationId) {
          let bookingId = state.context?.bookingId || null;

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
              booking_id: bookingId,
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

        navigate(`/messages/${state.recipientId}`, {
          state: {
            bookingDetails: state.context?.bookingDetails || null,
          },
          replace: true,
        });
      } catch (error) {
        console.error('Error opening chat:', error);
      } finally {
        setOpeningChat(false);
      }
    };

    handleAutoOpenChat();
  }, [location.state, user, navigate, openingChat]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
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
          const otherParticipantId =
            conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id;

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

          let bookingDetails = null;
          if (conv.booking_id) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select(
                `
                id,
                booking_date,
                booking_time,
                verification_code,
                classes:class_id (
                  name
                )`
              )
              .eq('id', conv.booking_id)
              .single();

            if (bookingData) {
              bookingDetails = {
                id: bookingData.id,
                booking_date: bookingData.booking_date,
                booking_time: bookingData.booking_time,
                class_name: (bookingData.classes as any)?.name || 'Unknown Class',
                verification_code: bookingData.verification_code,
              };
            }
          }

          return {
            ...conv,
            other_participant: profileData || {
              id: otherParticipantId,
              username: 'Unknown',
              avatar_url: null,
            },
            last_message: lastMessageData || undefined,
            booking_details: bookingDetails,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    }
  };

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const bookingsCount = conversations.filter((c) => !!c.booking_details).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'unread' && !(c.unread_count > 0)) return false;
      if (filter === 'bookings' && !c.booking_details) return false;
      if (q && !c.other_participant.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [conversations, filter, query]);

  return (
    <AppScreen className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#f9fafb] dark:bg-background">
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <StitchCanvas className="!space-y-0 flex flex-col gap-3 !py-4">
          <DetailContextStrip
            backLabel="Back to Home"
            onBack={() => navigate('/')}
            crumbs={[
              { label: 'Home', href: '/' },
              { label: 'Messages', href: '/messages' },
            ]}
            actions={
              <Button type="button" size="sm" onClick={() => navigate('/explore')}>
                <Search data-icon="inline-start" />
                Find coaches
              </Button>
            }
          />
          <StitchPageHeader
            title="Messages"
            description={
              unreadTotal > 0
                ? `Chats with trainers and students · ${unreadTotal} unread`
                : 'Chats with your trainers and students'
            }
          >
            <div className="flex flex-col gap-3">
              <InputGroup className="max-w-xl bg-background">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                />
              </InputGroup>

              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={(value) => {
                  if (value) setFilter(value as InboxFilter);
                }}
                className="justify-start"
                aria-label="Filter conversations"
              >
                <ToggleGroupItem value="all" aria-label="All conversations">
                  All ({conversations.length})
                </ToggleGroupItem>
                <ToggleGroupItem value="unread" aria-label="Unread conversations">
                  Unread ({unreadTotal})
                </ToggleGroupItem>
                <ToggleGroupItem value="bookings" aria-label="Booking conversations">
                  Bookings ({bookingsCount})
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </StitchPageHeader>
        </StitchCanvas>
      </div>

      <div className="flex-1 overflow-y-auto">
        <StitchCanvas className="!space-y-0 !pt-4">
          {loading ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              {Array.from({ length: SKELETON_COUNT }, (_, idx) => (
                <ConversationCardSkeleton key={idx} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title={query || filter !== 'all' ? 'No matches' : 'No conversations yet'}
              description={
                query
                  ? 'Try another name.'
                  : filter === 'unread'
                    ? 'You’re all caught up.'
                    : filter === 'bookings'
                      ? 'No booking-linked chats yet.'
                      : 'Book a class with a trainer to start chatting.'
              }
              action={
                !query && filter === 'all' ? (
                  <Button onClick={() => navigate('/explore')}>Find a trainer</Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((conv) => {
                const isMyMessage = conv.last_message?.sender_id === user?.id;
                const bookingLabel = conv.booking_details
                  ? [
                      conv.booking_details.class_name,
                      new Date(conv.booking_details.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }),
                      conv.booking_details.booking_time,
                      conv.booking_details.verification_code
                        ? `ID ${conv.booking_details.verification_code}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : undefined;

                return (
                  <li key={conv.id}>
                    <ConversationRow
                      name={conv.other_participant.username}
                      avatarUrl={conv.other_participant.avatar_url}
                      preview={
                        conv.last_message
                          ? `${isMyMessage ? 'You: ' : ''}${conv.last_message.content}`
                          : undefined
                      }
                      timestamp={
                        conv.last_message
                          ? formatDistanceToNow(new Date(conv.last_message.created_at), {
                              addSuffix: true,
                            })
                          : undefined
                      }
                      unreadCount={conv.unread_count}
                      bookingLabel={bookingLabel}
                      onClick={() =>
                        navigate(`/messages/${conv.other_participant.id}`, {
                          state: { bookingDetails: conv.booking_details },
                        })
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </StitchCanvas>
      </div>
    </AppScreen>
  );
};

export default MessageListPage;
