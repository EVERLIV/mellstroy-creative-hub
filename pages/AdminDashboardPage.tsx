import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  UserX
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users'>('overview');

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    fetchPendingEvents();
    fetchUsers();
  }, []);

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
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Trainers and Clients
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const trainers = rolesData?.filter(r => r.role === 'trainer').length || 0;
      const clients = rolesData?.filter(r => r.role === 'client').length || 0;

      // Events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Reviews
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
          organizer:profiles!events_organizer_id_fkey(username, avatar_url)
        `)
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

      // Fetch roles for each user
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="mb-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-white/90 text-sm">Manage platform, users, and content</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-card rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Events ({stats.pendingEvents})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Users
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Trainers</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalTrainers}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Events</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalEvents}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Bookings</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Reviews</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Clients</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalClients}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingEvents}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/upload-category-icons')}
                  className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <Upload className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Upload Category Icons</p>
                    <p className="text-sm text-muted-foreground">Manage category images</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('events')}
                  className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <Calendar className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Review Events</p>
                    <p className="text-sm text-muted-foreground">{stats.pendingEvents} pending approval</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <Users className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Manage Users</p>
                    <p className="text-sm text-muted-foreground">Verify trainers & manage roles</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/events')}
                  className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">View All Events</p>
                    <p className="text-sm text-muted-foreground">See platform events</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Pending Events ({pendingEvents.length})
            </h2>
            {pendingEvents.length === 0 ? (
              <div className="bg-card rounded-lg p-8 text-center border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending events to review</p>
              </div>
            ) : (
              pendingEvents.map((event) => (
                <div key={event.id} className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>📅 {event.date}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {event.organizer.avatar_url ? (
                        <img
                          src={event.organizer.avatar_url}
                          alt={event.organizer.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {event.organizer.username}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEventAction(event.id, 'rejected')}
                        className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleEventAction(event.id, 'approved')}
                        className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              User Management ({users.length})
            </h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{user.username}</p>
                        {user.is_verified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                        {user.is_premium && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.roles.join(', ') || 'No roles'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleVerification(user.id, user.is_verified)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      user.is_verified
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {user.is_verified ? (
                      <>
                        <UserX className="w-4 h-4" />
                        Unverify
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
