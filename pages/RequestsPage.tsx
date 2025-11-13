import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader, Filter } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest, UserRole } from '../types';
import RequestCard from '../components/RequestCard';
import { CATEGORIES } from '../constants';
import { HCMC_DISTRICTS } from '../constants';

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role === 'trainer' ? 'trainer' : 'student');
      }
    };

    loadUserRole();
  }, [user]);

  // Load requests
  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, [user, userRole, selectedCategory, selectedDistrict]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Filter by user role
      if (userRole === 'student') {
        // Students see only their own requests
        query = query.eq('student_id', user.id);
      } else {
        // Trainers see all open requests
        query = query.eq('status', 'open');
      }

      // Apply filters
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      if (selectedDistrict !== 'all') {
        query = query.eq('district', selectedDistrict);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedRequests: TrainingRequest[] = (data || []).map((req: any) => {
        // Get responses count
        return {
          id: req.id,
          student_id: req.student_id,
          student_name: req.student?.username,
          student_avatar: req.student?.avatar_url,
          category: req.category,
          district: req.district,
          description: req.description,
          desired_price: parseFloat(req.desired_price),
          level: req.level,
          preferred_time: req.preferred_time,
          location_type: req.location_type,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at,
        };
      });

      // Load responses count for each request
      const requestsWithCounts = await Promise.all(
        transformedRequests.map(async (req) => {
          const { count } = await supabase
            .from('trainer_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', req.id);

          return {
            ...req,
            responses_count: count || 0
          };
        })
      );

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (request: TrainingRequest) => {
    navigate(`/requests/${request.id}/respond`, { state: { request } });
  };

  const handleViewResponses = (request: TrainingRequest) => {
    navigate(`/requests/${request.id}/responses`, { state: { request } });
  };

  const handleRequestClick = (request: TrainingRequest) => {
    if (userRole === 'student' && request.student_id === user?.id) {
      navigate(`/requests/${request.id}/responses`, { state: { request } });
    } else if (userRole === 'trainer') {
      navigate(`/requests/${request.id}/respond`, { state: { request } });
    }
  };

  return (
    <div className="bg-white h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 flex-shrink-0">
        <div className="w-9"></div>
        <h1 className="text-base font-bold text-gray-900">
          {userRole === 'student' ? 'My Requests' : 'Training Requests'}
        </h1>
        <div className="flex items-center gap-2">
          {userRole === 'trainer' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 -mr-2"
            >
              <Filter className="w-5 h-5 text-gray-800" />
            </button>
          )}
          {userRole === 'student' && (
            <button
              onClick={() => navigate('/requests/create')}
              className="p-2 -mr-2"
            >
              <Plus className="w-5 h-5 text-gray-800" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && userRole === 'trainer' && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900"
              >
                <option value="all">All Districts</option>
                {HCMC_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gray-50 pb-safe-nav">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-gray-800 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center mt-12">
              <p className="text-sm font-bold text-gray-900 mt-4">
                {userRole === 'student' 
                  ? 'No requests yet' 
                  : 'No open requests found'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {userRole === 'student'
                  ? 'Create your first training request to find a trainer'
                  : 'Try adjusting your filters'}
              </p>
              {userRole === 'student' && (
                <button
                  onClick={() => navigate('/requests/create')}
                  className="mt-4 bg-blue-600 text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200"
                >
                  Create Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  userRole={userRole}
                  currentUserId={user?.id || ''}
                  onRespond={handleRespond}
                  onViewResponses={handleViewResponses}
                  onClick={() => handleRequestClick(request)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;

