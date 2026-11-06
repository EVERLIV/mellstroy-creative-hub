import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, User, Check, Clock, MapPin, Home, Building2, Trees, MessageSquare } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest, TrainerResponse } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '../src/components/layout/screen';
import { PageLoader, EmptyState } from '../src/components/layout/states';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../src/components/ui/avatar';
import ParticleButton from '../src/components/kokonutui/particle-button';
import { Badge } from '../src/components/ui/badge';
import { StatusBadge } from '../src/components/ui/status-badge';
import { formatVND } from '../src/lib/format';
import { cn } from '../src/lib/utils';

const LOCATION_META = {
  home: { label: 'At Home', icon: Home },
  gym: { label: 'At Gym', icon: Building2 },
  outdoor: { label: 'Outdoor', icon: Trees },
} as const;

const RequestResponsesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<TrainingRequest | null>(
    location.state?.request || null
  );
  const [responses, setResponses] = useState<TrainerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    // Extract request ID from URL if not in state
    const pathParts = location.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    if (id && id !== 'responses') {
      setRequestId(id);
      if (!request) {
        loadRequest(id);
      }
      loadResponses(id);
    } else if (request) {
      loadResponses(request.id);
    }
  }, [location.pathname, request]);

  const loadRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)`)
        .eq('id', id)
        .single();

      if (error) throw error;

      setRequest({
        id: data.id,
        student_id: data.student_id,
        student_name: data.student?.username,
        student_avatar: data.student?.avatar_url,
        category: data.category,
        district: data.district,
        description: data.description,
        desired_price: parseFloat(data.desired_price),
        level: data.level,
        preferred_time: data.preferred_time,
        location_type: data.location_type,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (error) {
      console.error('Error loading request:', error);
      navigate('/requests');
    }
  };

  const loadResponses = async (id: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('trainer_responses')
        .select(`
          *,
          trainer:profiles!trainer_responses_trainer_id_fkey(
            username,
            avatar_url,
            rating,
            reviews_count
          )`)
        .eq('request_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedResponses: TrainerResponse[] = (data || []).map((resp: any) => ({
        id: resp.id,
        request_id: resp.request_id,
        trainer_id: resp.trainer_id,
        trainer_name: resp.trainer?.username,
        trainer_avatar: resp.trainer?.avatar_url,
        trainer_rating: resp.trainer?.rating || 0,
        trainer_reviews: resp.trainer?.reviews_count || 0,
        message: resp.message,
        proposed_price: parseFloat(resp.proposed_price),
        status: resp.status,
        created_at: resp.created_at,
        updated_at: resp.updated_at,
      }));

      setResponses(transformedResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    if (!user || !request) return;

    try {
      // Update response status to accepted
      const { error: responseError } = await supabase
        .from('trainer_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      if (responseError) throw responseError;

      // Reject all other responses
      const { error: rejectError } = await supabase
        .from('trainer_responses')
        .update({ status: 'rejected' })
        .eq('request_id', request.id)
        .neq('id', responseId);

      if (rejectError) throw rejectError;

      // Update request status to accepted
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      toast({
        title: 'Success',
        description: 'Response accepted! You can now contact the trainer.',
      });

      // Reload responses
      loadResponses(request.id);
      if (requestId) {
        loadRequest(requestId);
      }
    } catch (error: any) {
      console.error('Error accepting response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept response',
        variant: 'destructive',
      });
    }
  };

  if (!request) {
    return (
      <AppScreen>
        <PageLoader title="Loading request..." />
      </AppScreen>
    );
  }

  const isOwner = request.student_id === user?.id;
  const requestLocation = request.location_type
    ? LOCATION_META[request.location_type as keyof typeof LOCATION_META]
    : undefined;
  const responsesSummary = loading
    ? undefined
    : `${responses.length} ${responses.length === 1 ? 'response' : 'responses'}`;

  const main = (
    <ScreenSection title="Trainer offers" description={responsesSummary}>
      {loading ? (
        <PageLoader title="Loading responses..." className="min-h-[30vh]" />
      ) : responses.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No responses yet"
          description="Trainers will see your request and can respond"
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={cn(
                'flex flex-col rounded-2xl shadow-none',
                response.status === 'accepted' && 'border-2 border-primary'
              )}
            >
              <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pb-3">
                <Avatar className="size-10 shrink-0">
                  {response.trainer_avatar ? (
                    <AvatarImage src={response.trainer_avatar} alt={response.trainer_name} />
                  ) : null}
                  <AvatarFallback>
                    <User className="size-5 text-muted-foreground" aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate text-sm">
                      {response.trainer_name || 'Unknown Trainer'}
                    </CardTitle>
                    <StatusBadge status={response.status} />
                  </div>
                  {response.trainer_rating > 0 && (
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
                      <span>{response.trainer_rating.toFixed(1)}</span>
                      <span>({response.trainer_reviews} reviews)</span>
                    </CardDescription>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{response.message}</p>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                  <span className="text-xs font-semibold text-foreground">Proposed price</span>
                  <span className="text-sm font-bold text-primary">{formatVND(response.proposed_price)}/hour</span>
                </div>
              </CardContent>

              <CardFooter className="mt-auto items-center justify-between gap-2 p-4 pt-0">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                </span>
                {isOwner && request.status === 'open' && response.status === 'pending' && (
                  <ParticleButton
                    onClick={() => handleAcceptResponse(response.id)}
                    icon={<Check />}
                    pendingLabel="Accepting"
                    successLabel="Accepted"
                  >
                    Accept
                  </ParticleButton>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </ScreenSection>
  );

  const aside = (
    <Card className="lg:sticky lg:top-24">
      <CardHeader className="gap-3 pb-3">
        <CardTitle className="text-base">Your request</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full border-transparent bg-primary/10 font-medium text-primary hover:bg-primary/15">
            {request.category}
          </Badge>
          <StatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{request.description}</p>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            {request.district}
          </div>
          {request.preferred_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" aria-hidden="true" />
              {request.preferred_time}
            </div>
          )}
          {requestLocation && (
            <div className="flex items-center gap-1.5">
              <requestLocation.icon className="size-3.5 text-primary" aria-hidden="true" />
              {requestLocation.label}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm font-medium text-foreground">
        Desired: {formatVND(request.desired_price)}/hour
      </CardFooter>
    </Card>
  );

  return (
    <AppScreen>
      <ScreenHeader
        title="Responses"
        description="Offers from trainers for your request."
        onBack={() => navigate(-1)}
        width="detail"
      />
      <ScreenBody width="detail">
        <ScreenSplit main={main} aside={aside} />
      </ScreenBody>
    </AppScreen>
  );
};

export default RequestResponsesPage;
