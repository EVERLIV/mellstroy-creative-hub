import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  BookOpen,
  Star,
  Upload,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  FileText,
  Crown,
  ChevronRight,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '@/src/components/layout/screen';
import { PageLoader, EmptyState } from '@/src/components/layout/states';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { StatusBadge } from '@/src/components/ui/status-badge';
import SmoothTab from '@/src/components/kokonutui/smooth-tab';
import { cn } from '@/src/lib/utils';

interface Stats {
  totalUsers: number;
  totalTrainers: number;
  totalClients: number;
  totalEvents: number;
  pendingEvents: number;
  totalBookings: number;
  totalReviews: number;
  avgRating: number;
}

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: {
    username: string;
    avatar_url: string | null;
  };
}

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_premium: boolean;
  roles: string[];
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTrainers: 0,
    totalClients: 0,
    totalEvents: 0,
    pendingEvents: 0,
    totalBookings: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users' | 'documents'>('overview');

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    fetchPendingEvents();
    fetchUsers();
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('trainer_documents')
        .select(`
          *,
          trainer:profiles!trainer_documents_trainer_id_fkey(id, username, is_premium)`)
        .eq('is_verified', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching pending documents:', error);
    }
  };

  const handleDocumentVerification = async (documentId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {
        is_verified: action === 'approve',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      };

      if (action === 'reject' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      } else {
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from('trainer_documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      fetchPendingDocuments();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update document',
        variant: 'destructive',
      });
    }
  };

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const trainers = rolesData?.filter(r => r.role === 'trainer').length || 0;
      const clients = rolesData?.filter(r => r.role === 'client').length || 0;

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      const { data: avgRatingData } = await supabase
        .from('reviews')
        .select('rating');

      const avgRating = avgRatingData && avgRatingData.length > 0
        ? avgRatingData.reduce((sum, r) => sum + r.rating, 0) / avgRatingData.length
        : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalTrainers: trainers,
        totalClients: clients,
        totalEvents: eventsCount || 0,
        pendingEvents: pendingCount || 0,
        totalBookings: bookingsCount || 0,
        totalReviews: reviewsCount || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          date,
          time,
          location,
          organizer:profiles!events_organizer_id_fkey(username, avatar_url)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingEvents(data?.map(event => ({
        ...event,
        organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
      })) || []);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_verified, is_premium')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: rolesData?.map(r => r.role) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEventAction = async (eventId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: action })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Event ${action === 'approved' ? 'approved' : 'rejected'} successfully`,
      });

      fetchPendingEvents();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <PageLoader title="Loading admin dashboard…" className="min-h-svh" />
      </AppScreen>
    );
  }

  const pendingDocumentsCount = pendingDocuments.length;

  const metricGroups: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<{ icon: LucideIcon; label: string; value: number | string }>;
  }> = [
    {
      title: 'People',
      items: [
        { icon: Users, label: 'Total users', value: stats.totalUsers },
        { icon: TrendingUp, label: 'Trainers', value: stats.totalTrainers },
        { icon: Users, label: 'Clients', value: stats.totalClients },
      ],
    },
    {
      title: 'Activity',
      items: [
        { icon: BookOpen, label: 'Bookings', value: stats.totalBookings },
        { icon: Calendar, label: 'Events', value: stats.totalEvents },
        { icon: Star, label: 'Reviews', value: stats.totalReviews },
        { icon: Star, label: 'Avg rating', value: stats.avgRating },
      ],
    },
  ];

  const quickActions: ReadonlyArray<{ icon: LucideIcon; title: string; text: string; onClick: () => void }> = [
    { icon: Upload, title: 'Upload media files', text: 'Upload images to storage buckets', onClick: () => navigate('/media-upload') },
    { icon: Calendar, title: 'Review events', text: `${stats.pendingEvents} pending approval`, onClick: () => setActiveTab('events') },
    { icon: Users, title: 'Manage users', text: 'Verify trainers & manage roles', onClick: () => setActiveTab('users') },
    { icon: TrendingUp, title: 'View all events', text: 'See platform events', onClick: () => navigate('/events') },
  ];

  const overviewContent = (
    <div className="flex flex-col gap-6 pt-4 md:gap-8">
      {/* What needs a decision right now */}
      <section aria-label="Needs attention" className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="size-6" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-3xl font-semibold tabular-nums text-foreground">{stats.pendingEvents}</span>
            <span className="text-sm text-muted-foreground">Events awaiting approval</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-3xl font-semibold tabular-nums text-foreground">{pendingDocumentsCount}</span>
            <span className="text-sm text-muted-foreground">Documents to verify</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </section>

      <ScreenSplit
        main={
          <>
            {metricGroups.map((group) => (
              <ScreenSection key={group.title} title={group.title}>
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {group.items.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                        <stat.icon className="size-4 text-primary" aria-hidden="true" />
                        {stat.label}
                      </dt>
                      <dd className="text-2xl font-semibold tabular-nums text-foreground">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </ScreenSection>
            ))}
          </>
        }
        aside={
          <ScreenSection title="Quick actions">
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {quickActions.map((action) => (
                <li key={action.title}>
                  <button
                    type="button"
                    onClick={action.onClick}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <action.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold text-foreground">{action.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{action.text}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </ScreenSection>
        }
      />
    </div>
  );

  const eventsContent = (
    <div className="flex flex-col gap-4 pt-4">
      {pendingEvents.length === 0 ? (
        <EmptyState icon={Calendar} title="No pending events" description="Nothing to review right now." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {pendingEvents.map((event) => (
            <li key={event.id}>
              <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-foreground md:text-lg">{event.title}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{event.date}</span>
                    <span>{event.time}</span>
                    <span>{event.location}</span>
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={event.organizer.avatar_url || undefined} alt={event.organizer.username} />
                      <AvatarFallback>{event.organizer.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-foreground">{event.organizer.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEventAction(event.id, 'rejected')}>
                      <XCircle /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleEventAction(event.id, 'approved')}>
                      <CheckCircle /> Approve
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const documentsContent = (
    <div className="flex flex-col gap-4 pt-4">
      {pendingDocuments.length === 0 ? (
        <EmptyState icon={FileText} title="No pending documents" description="All trainer documents are reviewed." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {pendingDocuments.map((doc) => {
            const trainer = doc.trainer as any;
            return (
              <li key={doc.id}>
                <article
                  className={cn(
                    'flex h-full gap-4 rounded-2xl border bg-card p-4',
                    trainer?.is_premium ? 'border-primary/50' : 'border-border'
                  )}
                >
                  <img src={doc.file_url} alt={doc.title} className="size-24 shrink-0 rounded-xl bg-muted object-cover md:size-28" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">{doc.title}</h3>
                      {trainer?.is_premium && (
                        <StatusBadge tone="primary">
                          <Crown className="size-3" /> Priority
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="capitalize">{doc.document_type}</span> · {trainer?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    {doc.rejection_reason && (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                        <strong>Previous rejection:</strong> {doc.rejection_reason}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      <Button size="sm" onClick={() => handleDocumentVerification(doc.id, 'approve')}>
                        <CheckCircle /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          if (reason !== null) {
                            handleDocumentVerification(doc.id, 'reject', reason || undefined);
                          }
                        }}
                      >
                        <XCircle /> Reject
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const usersContent = (
    <div className="pt-4">
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" description="New sign-ups appear here." />
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{user.username}</p>
                    {user.is_verified && <StatusBadge status="verified" />}
                    {user.is_premium && <StatusBadge tone="primary">Premium</StatusBadge>}
                  </div>
                  <p className="truncate text-xs capitalize text-muted-foreground">{user.roles.join(', ') || 'No roles'}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={user.is_verified ? 'outline' : 'default'}
                onClick={() => toggleVerification(user.id, user.is_verified)}
                className="shrink-0"
              >
                {user.is_verified ? (
                  <>
                    <UserX /> Unverify
                  </>
                ) : (
                  <>
                    <UserCheck /> Verify
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <AppScreen>
      <ScreenHeader
        title={
          <span className="flex items-center gap-2">
            <Shield className="size-5 text-primary" aria-hidden="true" />
            Admin dashboard
          </span>
        }
        description="Manage platform, users, and content"
        onBack={() => navigate('/profile')}
        width="feed"
        breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'Admin' }]}
      />

      <ScreenBody width="feed">
        <SmoothTab
          label="Admin sections"
          value={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          items={[
            { id: 'overview', title: 'Overview', icon: LayoutDashboard, content: overviewContent },
            { id: 'events', title: `Events (${stats.pendingEvents})`, icon: Calendar, content: eventsContent },
            { id: 'users', title: 'Users', icon: Users, content: usersContent },
            { id: 'documents', title: `Documents (${pendingDocumentsCount})`, icon: FileText, content: documentsContent },
          ]}
        />
      </ScreenBody>
    </AppScreen>
  );
};

export default AdminDashboardPage;
