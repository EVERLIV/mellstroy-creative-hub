import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageCircle, Search } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { EmptyState } from '@/src/components/layout/states';
import { Button } from '@/src/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/src/components/ui/input-group';
import { Separator } from '@/src/components/ui/separator';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/integrations/supabase/client';
import ChatPeerSidebar from '@/components/chat/ChatPeerSidebar';
import ChatThreadPanel from '@/components/chat/ChatThreadPanel';
import ConversationSidebarItem from '@/components/chat/ConversationSidebarItem';
import type { ChatBookingDetails, ChatConversation } from '@/components/chat/types';

type InboxFilter = 'all' | 'unread' | 'bookings';

const MessagesHubPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [activeBooking, setActiveBooking] = useState<ChatBookingDetails | null>(
    (location.state as { bookingDetails?: ChatBookingDetails } | null)?.bookingDetails ?? null
  );
  const [activePeer, setActivePeer] = useState<ChatConversation['other_participant'] | null>(
    null
  );
  const [openingChat, setOpeningChat] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingList(true);
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;
      if (!convData?.length) {
        setConversations([]);
        return;
      }

      const enriched = await Promise.all(
        convData.map(async (conv) => {
          const otherId =
            conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select(
              'id, username, avatar_url, specialty, bio, rating, experience_years, is_verified'
            )
            .eq('id', otherId)
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

          let bookingDetails: ChatBookingDetails | null = null;
          if (conv.booking_id) {
            try {
              const { data: bookingData } = await supabase
                .from('bookings')
                .select('id, booking_date, booking_time, verification_code, class_id')
                .eq('id', conv.booking_id)
                .single();
              if (bookingData) {
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
              /* keep conversation without booking */
            }
          }

          return {
            ...conv,
            other_participant: profileData || {
              id: otherId,
              username: 'Unknown',
              avatar_url: null,
            },
            last_message: lastMessageData || undefined,
            booking_details: bookingDetails,
            unread_count: unreadCount || 0,
          } as ChatConversation;
        })
      );

      setConversations(enriched);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Deep-link from trainer cards / bookings: /messages with state.recipientId
  useEffect(() => {
    const handleAutoOpen = async () => {
      const state = location.state as
        | {
            recipientId?: string;
            bookingDetails?: ChatBookingDetails;
            context?: { bookingId?: string; classId?: string; bookingDetails?: ChatBookingDetails };
          }
        | null;
      if (!state?.recipientId || !user || openingChat || recipientId) return;

      setOpeningChat(true);
      try {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(
            `and(participant_1_id.eq.${user.id},participant_2_id.eq.${state.recipientId}),and(participant_1_id.eq.${state.recipientId},participant_2_id.eq.${user.id})`
          )
          .maybeSingle();

        if (!existingConv) {
          let bookingId = state.context?.bookingId || null;
          if (!bookingId && state.context?.classId) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('id')
              .eq('class_id', state.context.classId)
              .eq('client_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            bookingId = bookingData?.id || null;
          }

          await supabase.from('conversations').insert({
            participant_1_id: user.id,
            participant_2_id: state.recipientId,
            last_message_at: new Date().toISOString(),
            booking_id: bookingId,
          });
        }

        navigate(`/messages/${state.recipientId}`, {
          replace: true,
          state: {
            bookingDetails:
              state.bookingDetails || state.context?.bookingDetails || null,
          },
        });
        await loadConversations();
      } catch (error) {
        console.error('Error opening chat:', error);
      } finally {
        setOpeningChat(false);
      }
    };
    handleAutoOpen();
  }, [location.state, user, openingChat, recipientId, navigate, loadConversations]);

  // Refresh inbox when any message arrives
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-hub-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          loadConversations();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadConversations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'unread' && !(c.unread_count > 0)) return false;
      if (filter === 'bookings' && !c.booking_details) return false;
      if (q && !c.other_participant.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [conversations, filter, query]);

  const showListOnMobile = !recipientId;
  const showThreadOnMobile = Boolean(recipientId);

  return (
    <AppScreen className="flex min-w-0 flex-col overflow-x-hidden bg-background">
      <div
        className={cn(
          APP_CONTENT,
          'flex flex-col py-2 md:py-3',
          // Chat panel fills the viewport; site footer sits below and is reachable by page scroll.
          'h-[calc(100dvh-3.5rem-4.75rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)]'
        )}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Left conversation list */}
        <aside
          className={cn(
            'w-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-card lg:w-96',
            showListOnMobile ? 'flex' : 'hidden lg:flex'
          )}
        >
          <div className="flex shrink-0 flex-col gap-3 border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-bold text-foreground">Messages</h1>
              <Button type="button" size="sm" variant="outline" onClick={() => navigate('/explore')}>
                Find coaches
              </Button>
            </div>
            <InputGroup className="bg-background">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search direct messages…"
                aria-label="Search conversations"
              />
            </InputGroup>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => {
                if (value) setFilter(value as InboxFilter);
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              aria-label="Filter conversations"
            >
              <ToggleGroupItem value="all" className="flex-1 rounded-full px-2.5 text-xs">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="unread" className="flex-1 rounded-full px-2.5 text-xs">
                Unread
              </ToggleGroupItem>
              <ToggleGroupItem value="bookings" className="flex-1 rounded-full px-2.5 text-xs">
                Bookings
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            {loadingList ? (
              <div className="flex flex-col divide-y divide-border" aria-busy="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex gap-3 px-3.5 py-3.5">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageCircle}
                  title={query || filter !== 'all' ? 'No matches' : 'No conversations yet'}
                  description={
                    query
                      ? 'Try another name.'
                      : 'Book a class with a trainer to start chatting.'
                  }
                  action={
                    !query && filter === 'all' ? (
                      <Button onClick={() => navigate('/explore')}>Find a trainer</Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((conv) => (
                  <ConversationSidebarItem
                    key={conv.id}
                    conversation={conv}
                    currentUserId={user?.id}
                    active={recipientId === conv.other_participant.id}
                    timestampLabel={
                      conv.last_message
                        ? formatDistanceToNowStrict(new Date(conv.last_message.created_at), {
                            addSuffix: false,
                          })
                        : undefined
                    }
                    onClick={() =>
                      navigate(`/messages/${conv.other_participant.id}`, {
                        state: { bookingDetails: conv.booking_details },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center thread */}
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            showThreadOnMobile ? 'flex' : 'hidden lg:flex'
          )}
        >
          {recipientId ? (
            <ChatThreadPanel
              key={recipientId}
              recipientId={recipientId}
              bookingDetailsFromNav={
                (location.state as { bookingDetails?: ChatBookingDetails } | null)
                  ?.bookingDetails ?? null
              }
              onBack={() => navigate('/messages')}
              onBookingLoaded={setActiveBooking}
              onPeerLoaded={setActivePeer}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/20 p-8">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="size-7" aria-hidden />
              </div>
              <div className="max-w-sm text-center">
                <h2 className="text-lg font-bold text-foreground">Select a conversation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a coach or student from the list to continue your realtime chat.
                </p>
              </div>
              <Button type="button" onClick={() => navigate('/explore')}>
                Find coaches
              </Button>
            </div>
          )}
        </div>

        {/* Right peer panel */}
        {recipientId && activePeer ? (
          <ChatPeerSidebar
            peer={activePeer}
            bookingDetails={activeBooking}
            onViewProfile={() => navigate(`/trainer/${activePeer.id}`)}
          />
        ) : recipientId ? (
          <aside className="hidden min-h-0 w-80 shrink-0 overflow-y-auto border-l border-border bg-card xl:block">
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="mx-auto h-4 w-32" />
              <Skeleton className="mx-auto h-3 w-24" />
              <Separator />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </aside>
        ) : null}
        </div>
      </div>
    </AppScreen>
  );
};

export default MessagesHubPage;
