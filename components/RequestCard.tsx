import React from 'react';
import { MapPin, Wallet, User, MessageCircle, Clock, Home, Building2, Trees } from 'lucide-react';
import { TrainingRequest } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { formatVND } from '../src/lib/format';
import { Card, CardContent, CardFooter, CardHeader } from '../src/components/ui/card';
import { Badge } from '../src/components/ui/badge';
import { Button } from '../src/components/ui/button';
import { StatusBadge } from '../src/components/ui/status-badge';

interface RequestCardProps {
  request: TrainingRequest;
  userRole: 'student' | 'trainer';
  currentUserId: string;
  onRespond?: (request: TrainingRequest) => void;
  onViewResponses?: (request: TrainingRequest) => void;
  onClick?: () => void;
}

const LOCATION_META: Record<string, { label: string; icon: typeof Home }> = {
  home: { label: 'At Home', icon: Home },
  gym: { label: 'At Gym', icon: Building2 },
  outdoor: { label: 'Outdoor', icon: Trees },
};

function DetailRow({ icon: Icon, children }: { icon: typeof Home; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  userRole,
  currentUserId,
  onRespond,
  onViewResponses,
  onClick,
}) => {
  const isOwner = request.student_id === currentUserId;
  const canRespond = userRole === 'trainer' && !isOwner && request.status === 'open';
  const hasResponses = (request.responses_count || 0) > 0;
  const location = request.location_type ? LOCATION_META[request.location_type] : undefined;

  return (
    <Card
      onClick={onClick}
      className="flex h-full cursor-pointer flex-col rounded-2xl border-border/80 shadow-none transition-colors hover:border-primary/40"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{request.category}</Badge>
          <StatusBadge status={request.status} />
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
        {isOwner && (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3.5" aria-hidden="true" />
            Your request
          </div>
        )}

        <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{request.description}</p>

        <div className="grid gap-1.5 sm:grid-cols-2">
          <DetailRow icon={MapPin}>{request.district}</DetailRow>
          {request.preferred_time && <DetailRow icon={Clock}>{request.preferred_time}</DetailRow>}
          {request.location_type && (
            <DetailRow icon={location?.icon ?? MapPin}>{location?.label ?? 'Not specified'}</DetailRow>
          )}
          <DetailRow icon={Wallet}>Desired: {formatVND(request.desired_price)}/hour</DetailRow>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted-foreground">Level:</span>
          <Badge variant="outline">{request.level}</Badge>
        </div>

        {hasResponses && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5">
            <MessageCircle className="size-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-foreground">
              {request.responses_count} {request.responses_count === 1 ? 'response' : 'responses'}
            </span>
          </div>
        )}
      </CardContent>

      {(canRespond || (isOwner && hasResponses)) && (
        <CardFooter className="mt-auto flex gap-2 border-t border-border/70 p-4">
          {canRespond && (
            <Button
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onRespond?.(request);
              }}
            >
              Respond
            </Button>
          )}
          {isOwner && hasResponses && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewResponses?.(request);
              }}
            >
              View Responses
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default RequestCard;
