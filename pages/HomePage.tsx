import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import VenueCard from '../components/VenueCard';
import RequestCard from '../components/RequestCard';
import { Trainer, Class, UserRole, Venue, TrainingRequest } from '../types';
import { CATEGORIES } from '../constants';
import { mockVenues } from '../data/mockVenues';
import DistrictFilterModal from '../components/DistrictFilterModal';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { Calendar, MessageCircle, Building, FileText, ArrowRight, MapPin, ChevronDown, Search, type LucideIcon } from 'lucide-react';
import TrainerCarousel from '../components/TrainerCarousel';
import ClassCarousel, { type ClassWithTrainer } from '../components/ClassCarousel';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '@/src/components/layout/screen';
import { EmptyState } from '../src/components/layout/states';
import CategoryFilters from '../components/CategoryFilters';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Skeleton } from '../src/components/ui/skeleton';
import { cn } from '../src/lib/utils';

interface HomePageProps {
    trainers: Trainer[];
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
    userRole: UserRole;
    currentUserId: string;
    favoriteTrainerIds: string[];
    onToggleFavorite: (trainerId: string) => void;
    onOpenReviewsModal: (trainer: Trainer) => void;
}

const allCategories = [{ id: 'all', name: 'All', icon: 'grid' }, ...CATEGORIES];

const MAX_DISTRICT_TRAINERS = 10;
const MAX_FEATURED_CLASSES = 12;
const REQUEST_SKELETONS = 4;
const VENUES_PREVIEW = 3;

const HomePage: React.FC<HomePageProps> = ({ trainers, onInitiateBooking, onOpenChat, selectedCategory, onSelectCategory, userRole, currentUserId, favoriteTrainerIds, onToggleFavorite, onOpenReviewsModal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trainer-specific state
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // User district for "Trainers in your district" section
  const [userDistrict, setUserDistrict] = useState<string | null>(null);

  // Load user district for students
  useEffect(() => {
    if (userRole === 'student' && user) {
      loadUserDistrict();
    }
  }, [userRole, user]);

  // Load requests for trainers
  useEffect(() => {
    if (userRole === 'trainer' && user) {
      loadRequests();
    }
  }, [userRole, user]);
  
  const loadUserDistrict = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location, district')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        // Use district if available, otherwise fall back to location
        setUserDistrict(data.district || data.location || null);
      }
    } catch (error) {
      console.error('Error loading user district:', error);
    }
  };

  // Simulate loading when component mounts or filters change
  useEffect(() => {
    if (userRole === 'student') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Simulate network delay

      return () => clearTimeout(timer);
    }
  }, [selectedCategory, selectedDistrict, searchQuery, userRole]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setRequestsLoading(true);

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedRequests: TrainingRequest[] = (data || []).map((req: any) => {
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

      // Load responses count
      const requestsWithCounts = await Promise.all(
        transformedRequests.map(async (req) => {
          const { count } = await supabase
            .from('trainer_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', req.id)
            .eq('trainer_id', user.id);

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
      setRequestsLoading(false);
    }
  };

  const filteredTrainers = useMemo(() => {
      const categorySpecialtyMap: { [key: string]: string[] } = {
          gym: ['strength training', 'hiit', 'personal training', 'gym coach'],
          yoga: ['yoga', 'pilates'],
          tennis: ['tennis'],
          boxing: ['boxing', 'kickboxing', 'mma'],
          swimming: ['swimming'],
          pickleball: ['pickleball'],
          dance: ['dance fitness'],
          running: ['running'],
      };

      const isAllCategories = selectedCategory === 'all';
      const categoryObject = CATEGORIES.find(c => c.id === selectedCategory);
      const relevantSpecialties = !isAllCategories ? (categorySpecialtyMap[selectedCategory] || (categoryObject ? [categoryObject.name.toLowerCase()] : [])) : [];
      
      const lowerCaseQuery = searchQuery.toLowerCase();

      return trainers.filter(trainer => {
          const queryMatch = lowerCaseQuery === '' ||
              trainer.name.toLowerCase().includes(lowerCaseQuery) ||
              trainer.specialty.some(s => s.toLowerCase().includes(lowerCaseQuery));

          const categoryMatch = isAllCategories || trainer.specialty.some(spec =>
              relevantSpecialties.some(rs => rs && spec.toLowerCase().includes(rs))
          );
          const districtMatch = selectedDistrict === 'All Districts' || trainer.location === selectedDistrict;

          return queryMatch && categoryMatch && districtMatch;
      });
  }, [trainers, selectedCategory, selectedDistrict, searchQuery]);

  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
  };

  const handleBackToList = () => {
    setIsExitingDetail(true);
    setTimeout(() => {
      setSelectedTrainer(null);
      setIsExitingDetail(false);
    }, 350);
  };
  
  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setIsDistrictModalOpen(false);
  };

  const districtTrainers = useMemo(
    () =>
      userDistrict
        ? trainers.filter(
            (trainer) =>
              trainer.isPremium && (trainer.location === userDistrict || trainer.location?.includes(userDistrict))
          )
        : [],
    [trainers, userDistrict]
  );

  const featuredClasses = useMemo<ClassWithTrainer[]>(
    () =>
      filteredTrainers
        .flatMap((trainer) => (trainer.classes ?? []).map((cls) => ({ cls, trainer })))
        .slice(0, MAX_FEATURED_CLASSES),
    [filteredTrainers]
  );

  // Trainer Home Page
  if (userRole === 'trainer') {
    return (
      <AppScreen>
        <ScreenHeader title="Dashboard" description="Requests, bookings and venues at a glance" width="feed" />
        <ScreenBody width="feed">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <QuickAction icon={Calendar} title="My Bookings" description="View all bookings" onClick={() => navigate('/bookings')} />
            <QuickAction icon={MessageCircle} title="Messages" description="Chat with clients" onClick={() => navigate('/messages')} />
            <QuickAction icon={FileText} title="Requests" description="Find new students" onClick={() => navigate('/requests/explore')} />
            <QuickAction icon={Building} title="Venues" description="Rent a space" onClick={() => navigate('/venues')} />
          </div>

          <ScreenSplit
            main={
              <ScreenSection
                title="Recent requests"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/requests/explore')} className="text-primary">
                    Explore all
                    <ArrowRight />
                  </Button>
                }
              >
                {requestsLoading ? (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {Array.from({ length: REQUEST_SKELETONS }, (_, i) => (
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
                        Explore requests
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {requests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        userRole="trainer"
                        currentUserId={currentUserId}
                        onRespond={(req) => navigate(`/requests/${req.id}/respond`, { state: { request: req } })}
                        onClick={() => navigate(`/requests/${request.id}/respond`, { state: { request } })}
                      />
                    ))}
                  </div>
                )}
              </ScreenSection>
            }
            aside={
              <ScreenSection
                title="Venues for rent"
                variant="panel"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/venues')} className="text-primary">
                    View all
                    <ArrowRight />
                  </Button>
                }
              >
                <div className="flex flex-col gap-3">
                  {mockVenues.slice(0, VENUES_PREVIEW).map((venue) => (
                    <VenueCard key={venue.id} venue={venue} onSelect={() => navigate('/venues')} />
                  ))}
                </div>
              </ScreenSection>
            }
          />
        </ScreenBody>
      </AppScreen>
    );
  }

  // Student Home Page
  return (
    <AppScreen className="relative">
      {selectedTrainer && (
        <div
          key={selectedTrainer.id}
          className={cn(
            'absolute inset-x-0 top-0 bottom-0 z-30 bg-background',
            isExitingDetail ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'
          )}
        >
          <TrainerDetailPage
            trainer={selectedTrainer}
            onBack={handleBackToList}
            onInitiateBooking={onInitiateBooking}
            userRole={userRole}
            currentUserId={currentUserId}
            isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
            onToggleFavorite={onToggleFavorite}
            onOpenReviewsModal={onOpenReviewsModal}
          />
        </div>
      )}

      <div className={cn('transition-opacity duration-300', selectedTrainer ? 'pointer-events-none opacity-0' : 'opacity-100')}>
        <ScreenHeader
          title="Home"
          description="Trainers, classes and requests near you"
          width="feed"
          actions={
            <Button
              variant="outline"
              onClick={() => setIsDistrictModalOpen(true)}
              aria-label={`District: ${selectedDistrict}. Change district`}
              className="h-10 gap-1 rounded-full px-3"
            >
              <MapPin className="text-muted-foreground" />
              <span className="max-w-[120px] truncate">{selectedDistrict}</span>
              <ChevronDown className="text-muted-foreground" />
            </Button>
          }
        >
          <div className="relative md:max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainers or specialties..."
              aria-label="Search trainers or specialties"
              className="h-11 rounded-xl bg-muted pl-9"
            />
          </div>
          <CategoryFilters
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </ScreenHeader>

        <ScreenBody width="feed">
          {userRole === 'student' && userDistrict && (
            districtTrainers.length > 0 ? (
              <TrainerCarousel
                title="Trainers in your district"
                eyebrow={userDistrict}
                trainers={districtTrainers.slice(0, MAX_DISTRICT_TRAINERS)}
                favoriteTrainerIds={favoriteTrainerIds}
                onToggleFavorite={onToggleFavorite}
                onSelectTrainer={handleSelectTrainer}
              />
            ) : (
              <ScreenSection title="Trainers in your district">
                <EmptyState
                  icon={MapPin}
                  title="No premium trainers here yet"
                  description={`Premium trainers from ${userDistrict} will show up here as soon as they join.`}
                />
              </ScreenSection>
            )
          )}

          {!isLoading && (
            <ClassCarousel
              title="Classes to book"
              eyebrow="Popular right now"
              classes={featuredClasses}
              onSelectClass={({ cls }) => navigate(`/class/${cls.id}`)}
            />
          )}

          <ScreenSection
            title="Nearby trainers"
            description={isLoading ? undefined : `${filteredTrainers.length} trainers`}
            action={<ViewToggle viewMode={viewMode} setViewMode={setViewMode} />}
          >
            <TrainerGrid
              trainers={filteredTrainers}
              viewMode={viewMode}
              onSelectTrainer={handleSelectTrainer}
              isLoading={isLoading}
              favoriteTrainerIds={favoriteTrainerIds}
              onToggleFavorite={onToggleFavorite}
            />
          </ScreenSection>
        </ScreenBody>
      </div>

      {isDistrictModalOpen && (
        <DistrictFilterModal
          isOpen={isDistrictModalOpen}
          onClose={() => setIsDistrictModalOpen(false)}
          onSelectDistrict={handleSelectDistrict}
          currentDistrict={selectedDistrict}
        />
      )}
    </AppScreen>
  );
};
interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, title, description, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] md:p-5"
    >
      <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

export default HomePage;