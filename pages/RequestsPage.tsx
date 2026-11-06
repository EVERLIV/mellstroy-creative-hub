import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, FileText } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection } from '../src/components/layout/screen';
import { PageLoader, EmptyState } from '../src/components/layout/states';
import { Field, FieldGroup, FieldLabel } from '../src/components/ui/field';
import { NativeSelect } from '../src/components/ui/native-select';
import { Button } from '../src/components/ui/button';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useEffectiveRole } from '../src/hooks/useViewMode';
import { TrainingRequest } from '../types';
import RequestCard from '../components/RequestCard';
import { CATEGORIES } from '../constants';
import { HCMC_DISTRICTS } from '../constants';

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = useEffectiveRole();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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
          student:profiles!requests_student_id_fkey(username, avatar_url)`)
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

  const isStudent = userRole === 'student';

  return (
    <AppScreen>
      <ScreenHeader
        title={isStudent ? 'My Requests' : 'Training Requests'}
        description={isStudent ? 'Requests you posted and the offers trainers sent you.' : 'Open requests from students looking for a trainer.'}
        width="detail"
        actions={
          <>
            {userRole === 'trainer' && (
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Filters"
                aria-expanded={showFilters}
              >
                <Filter />
              </Button>
            )}
            {isStudent && (
              <Button onClick={() => navigate('/requests/create')} aria-label="Create request">
                <Plus />
                <span className="hidden sm:inline">New request</span>
              </Button>
            )}
          </>
        }
      />

      <ScreenBody width="detail">
        {showFilters && userRole === 'trainer' && (
          <ScreenSection title="Filters" variant="panel">
            <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
              <Field>
                <FieldLabel htmlFor="requests-filter-category">Category</FieldLabel>
                <NativeSelect id="requests-filter-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="requests-filter-district">District</FieldLabel>
                <NativeSelect id="requests-filter-district" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="all">All Districts</option>
                  {HCMC_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
          </ScreenSection>
        )}

        {loading ? (
          <PageLoader title="Loading requests..." className="min-h-[40vh]" />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isStudent ? 'No requests yet' : 'No open requests found'}
            description={isStudent ? 'Create your first training request to find a trainer' : 'Try adjusting your filters'}
            action={
              isStudent && (
                <Button onClick={() => navigate('/requests/create')}>
                  <Plus />
                  Create Request
                </Button>
              )
            }
          />
        ) : (
          <ScreenSection
            title={isStudent ? 'Your requests' : 'Open requests'}
            description={`${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`}
          >
            <div className="grid gap-3 lg:grid-cols-2">
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
          </ScreenSection>
        )}
      </ScreenBody>
    </AppScreen>
  );
};

export default RequestsPage;
