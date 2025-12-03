import React, { useState, useMemo } from 'react';
import { Plus, Users, Calendar, MapPin, User, DollarSign, Crown, List, LayoutGrid, Dumbbell, Building2, Search, SlidersHorizontal, X, ArrowUpDown, ChevronRight } from 'lucide-react';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS } from '../constants';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image_url: string | null;
    organizer: { username: string; is_premium?: boolean } | null;
    status: string;
    participant_count?: number;
    event_type?: string;
    price?: number;
    max_participants?: number;
    sport_category?: string;
    district?: string;
  };
  onSelect: () => void;
}

const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
        partner_search: 'Looking for Partner',
        sparring: 'Sparring Session',
        group_class: 'Group Class',
        ride: 'Ride/Run',
        competition: 'Competition',
        general: 'General Event'
    };
    return types[type] || 'General Event';
};

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(0) + 'K';
    }
    return price.toString();
};

const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
    const eventDate = new Date(event.date);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = eventDate.getDate();
    const organizerName = event.organizer?.username || 'Unknown';
    const isOrganizerPremium = event.organizer?.is_premium || false;
    const participantCount = event.participant_count || 0;
    const isFree = !event.price || event.price === 0;

    return (
        <button onClick={onSelect} className="w-full bg-card rounded-2xl border border-border overflow-hidden text-left hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative">
                <img 
                  src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} 
                  alt={event.title} 
                  className="h-44 w-full object-cover" 
                />
                <div className="absolute top-3 right-3 bg-card rounded-xl p-2 text-center shadow-md">
                    <p className="text-sm font-bold text-primary">{month}</p>
                    <p className="text-2xl font-extrabold text-foreground -mt-1">{day}</p>
                </div>
                {event.event_type && event.event_type !== 'general' && (
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">
                    {getEventTypeLabel(event.event_type)}
                  </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-foreground text-lg truncate">{event.title}</h3>
                
                {/* Sport Category & District Badges */}
                {(event.sport_category || event.district) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {event.sport_category && (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-md">
                                <Dumbbell className="w-3 h-3" />
                                {event.sport_category}
                            </span>
                        )}
                        {event.district && (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-md">
                                <Building2 className="w-3 h-3" />
                                {event.district}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Organized by <span className="font-semibold">{organizerName}</span></span>
                        {isOrganizerPremium && (
                            <Crown className="w-3.5 h-3.5 ml-1.5 text-primary flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    {!isFree && (
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="font-semibold text-primary">
                                {formatPrice(event.price!)}₫
                            </span>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1.5" />
                        <span className="font-semibold">{participantCount}</span>
                        {event.max_participants && <span className="ml-1">/ {event.max_participants}</span>}
                        <span className="ml-1">Joined</span>
                    </div>
                    <div className="flex items-center justify-center bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg text-sm">
                        View Details
                    </div>
                </div>
            </div>
        </button>
    )
};


interface EventsPageProps {
    events: any[];
    isPremium: boolean;
    onBack: () => void;
    onSelectEvent: (event: any) => void;
    onOpenCreate: () => void;
}

type SortOption = 'date' | 'popularity' | 'price';

const EventsPage: React.FC<EventsPageProps> = ({ events, isPremium, onBack, onSelectEvent, onOpenCreate }) => {
    const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('date');

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        let result = events.filter(event => {
            const matchesSearch = !searchQuery || 
                event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = !selectedCategory || event.sport_category === selectedCategory;
            const matchesDistrict = !selectedDistrict || event.district === selectedDistrict;
            
            return matchesSearch && matchesCategory && matchesDistrict;
        });

        // Sort events
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'popularity':
                    return (b.participant_count || 0) - (a.participant_count || 0);
                case 'price':
                    return (a.price || 0) - (b.price || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [events, searchQuery, selectedCategory, selectedDistrict, sortBy]);

    const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedDistrict ? 1 : 0);

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedDistrict('');
        setSearchQuery('');
    };

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'date', label: 'Date' },
        { value: 'popularity', label: 'Popular' },
        { value: 'price', label: 'Price' },
    ];

    return (
        <div className="bg-background h-full flex flex-col">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-primary to-accent pt-4 pb-5 px-4 flex-shrink-0">
                <div className="max-w-2xl mx-auto">
                    {/* Title Row with Create Button */}
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-primary-foreground">Community Events</h1>
                        <button 
                            onClick={onOpenCreate}
                            className="w-10 h-10 flex items-center justify-center bg-card text-primary rounded-xl shadow-lg hover:bg-muted transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-md"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-xl shadow-md transition-colors ${
                                showFilters || activeFiltersCount > 0
                                    ? 'bg-card text-primary'
                                    : 'bg-card/80 text-foreground hover:bg-card'
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter Dropdowns */}
                    {showFilters && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-md appearance-none"
                            >
                                <option value="">All Sports</option>
                                {FITNESS_ACTIVITIES.map(activity => (
                                    <option key={activity} value={activity}>{activity}</option>
                                ))}
                            </select>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-md appearance-none"
                            >
                                <option value="">All Districts</option>
                                {HCMC_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Active Filters Tags */}
            {(activeFiltersCount > 0 || searchQuery) && (
                <div className="px-4 py-2 bg-muted/50 flex flex-wrap items-center gap-2 flex-shrink-0">
                    {searchQuery && (
                        <span className="inline-flex items-center gap-1 bg-card text-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border">
                            <Search className="w-3 h-3" />
                            "{searchQuery}"
                            <button onClick={() => setSearchQuery('')} className="ml-0.5 hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Dumbbell className="w-3 h-3" />
                            {selectedCategory}
                            <button onClick={() => setSelectedCategory('')} className="ml-0.5 hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedDistrict && (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Building2 className="w-3 h-3" />
                            {selectedDistrict}
                            <button onClick={() => setSelectedDistrict('')} className="ml-0.5 hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    <button 
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-destructive ml-auto"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* View Toggle & Sort */}
            <div className="flex items-center justify-between py-3 px-4 bg-background flex-shrink-0 border-b border-border">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg font-medium text-xs transition-colors ${
                            viewMode === 'cards'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        <List className="w-3.5 h-3.5" />
                        Cards
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg font-medium text-xs transition-colors ${
                            viewMode === 'compact'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Compact
                    </button>
                </div>

                {/* Sort Buttons */}
                <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                    {sortOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setSortBy(option.value)}
                            className={`px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
                                sortBy === option.value
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Content */}
            <main className="flex-1 overflow-y-auto px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                {viewMode === 'cards' ? (
                    <>
                        <div className="flex items-center justify-between my-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                {filteredEvents.length === events.length 
                                    ? 'Upcoming Events' 
                                    : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event)} />
                            ))}
                        </div>
                        {filteredEvents.length === 0 && (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">No events found</p>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                                {activeFiltersCount > 0 && (
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-3 text-sm text-primary font-medium hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between my-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                {filteredEvents.length === events.length 
                                    ? 'Upcoming Events' 
                                    : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`}
                            </h2>
                        </div>
                        
                        {/* Modern Compact Cards */}
                        <div className="space-y-2">
                            {filteredEvents.map(event => {
                                const eventDate = new Date(event.date);
                                const participantCount = event.participant_count || 0;
                                const freeSlots = event.max_participants ? event.max_participants - participantCount : null;
                                const isFull = event.max_participants && participantCount >= event.max_participants;
                                
                                return (
                                    <button 
                                        key={event.id} 
                                        onClick={() => onSelectEvent(event)}
                                        className="w-full bg-card rounded-xl border border-border p-3 text-left hover:border-primary/50 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Date Badge */}
                                            <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-bold text-primary uppercase leading-none">
                                                    {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-bold text-primary leading-none mt-0.5">
                                                    {eventDate.getDate()}
                                                </span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Title */}
                                                <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
                                                    {event.title}
                                                </h3>
                                                
                                                {/* Location */}
                                                {event.location && (
                                                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                                        <span className="text-[11px] truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                
                                                {/* Category & Slots Row */}
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {event.sport_category && (
                                                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                                            <Dumbbell className="w-2.5 h-2.5" />
                                                            {event.sport_category}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Free Slots Badge */}
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                                        isFull 
                                                            ? 'bg-destructive/10 text-destructive' 
                                                            : freeSlots !== null && freeSlots <= 3 
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    }`}>
                                                        <Users className="w-2.5 h-2.5" />
                                                        {isFull 
                                                            ? 'Full' 
                                                            : freeSlots !== null 
                                                                ? `${freeSlots} slots left`
                                                                : `${participantCount} joined`
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Arrow */}
                                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {filteredEvents.length === 0 && (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">No events found</p>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                                {activeFiltersCount > 0 && (
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-3 text-sm text-primary font-medium hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default EventsPage;