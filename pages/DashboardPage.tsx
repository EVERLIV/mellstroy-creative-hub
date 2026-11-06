import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building,
  Calendar,
  FileText,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useEffectiveRole } from '../src/hooks/useViewMode';
import VenueCard from '../components/VenueCard';
import RequestCard from '../components/RequestCard';
import { mockVenues } from '../data/mockVenues';
import { TrainingRequest } from '../types';
import {
  AppScreen,
  ScreenBody,
  ScreenHeader,
  ScreenSection,
  ScreenSplit,
} from '@/src/components/layout/screen';
import { EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { Skeleton } from '../src/components/ui/skeleton';
import { cn } from '../src/lib/utils';
import AthleteHubDashboard from './AthleteHubDashboard';

const SKELETON_COUNT = 4;
const VENUES_PREVIEW = 3;

function ActionTile({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition',
        'hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = useEffectiveRole();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'trainer' || !user) return;
    let cancelled = false;
    (async () => {
      setRequestsLoading(true);
      try {
        const { data, error } = await supabase
          .from('training_requests')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6);
        if (error) throw error;
        if (!cancelled) setRequests((data as TrainingRequest[]) || []);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole, user]);

  if (userRole === 'trainer') {
    return (
      <AppScreen>
        <ScreenHeader
          title="Dashboard"
          description="Requests, bookings and venues at a glance"
          width="feed"
        />
        <ScreenBody width="feed">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <ActionTile
              icon={Calendar}
              title="My Bookings"
              description="View all bookings"
              onClick={() => navigate('/bookings')}
            />
            <ActionTile
              icon={MessageCircle}
              title="Messages"
              description="Chat with clients"
              onClick={() => navigate('/messages')}
            />
            <ActionTile
              icon={FileText}
              title="Requests"
              description="Find new students"
              onClick={() => navigate('/requests/explore')}
            />
            <ActionTile
              icon={Building}
              title="Venues"
              description="Rent a space"
              onClick={() => navigate('/venues')}
            />
          </div>

          <ScreenSplit
            main={
              <ScreenSection
                title="Recent Requests"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => navigate('/requests/explore')}
                  >
                    Explore All
                    <ArrowRight />
                  </Button>
                }
              >
                {requestsLoading ? (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No open requests"
                    description="New requests from students will appear here."
                    action={
                      <Button variant="outline" onClick={() => navigate('/requests/explore')}>
                        Explore Requests
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {requests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </ScreenSection>
            }
            aside={
              <ScreenSection title="Featured venues">
                <div className="space-y-3">
                  {mockVenues.slice(0, VENUES_PREVIEW).map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      onSelect={() => navigate('/venues')}
                    />
                  ))}
                </div>
              </ScreenSection>
            }
          />
        </ScreenBody>
      </AppScreen>
    );
  }

  // Student — full Stitch Athlete & Customer Hub
  return <AthleteHubDashboard />;
};

export default DashboardPage;
