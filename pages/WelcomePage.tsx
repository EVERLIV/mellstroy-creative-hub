import React from 'react';
import { Trainer, Category, Event } from '../types';
import { CATEGORIES } from '../constants';
import { Star, Crown, Gift, Tag, ArrowRight, Sparkles, UtensilsCrossed, MapPin, Calendar } from 'lucide-react';
import rhinoLogo from '../src/assets/rhino-logo.png';

const categoryImages: { [key: string]: string } = {
  gym: 'https://picsum.photos/seed/gym/400/300',
  yoga: 'https://picsum.photos/seed/yoga/400/300',
  tennis: 'https://picsum.photos/seed/tennis/400/300',
  boxing: 'https://picsum.photos/seed/boxing/400/300',
  swimming: 'https://picsum.photos/seed/swimming/400/300',
  pickleball: 'https://picsum.photos/seed/pickleball/400/300',
  dance: 'https://picsum.photos/seed/dance/400/300',
  running: 'https://picsum.photos/seed/running/400/300',
};


const PremiumTrainerCard: React.FC<{ trainer: Trainer }> = ({ trainer }) => (
    <div className="w-full bg-white rounded-2xl shadow-lg shadow-slate-200/80 overflow-hidden flex p-3 gap-4 items-center">
        <img src={trainer.imageUrl} alt={trainer.name} className="h-24 w-24 object-cover rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800 truncate">{trainer.name}</h3>
                <span className="flex-shrink-0 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                </span>
            </div>
            <p className="text-sm text-slate-500 truncate">{trainer.specialty.join(', ')}</p>
            <div className="flex items-center mt-2 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-semibold text-slate-600">{trainer.rating}</span>
                <span className="text-slate-400 ml-1">({trainer.reviews})</span>
            </div>
        </div>
    </div>
);

const offers = [
    { title: "First Class 50% Off", description: "New members get a special discount.", icon: Tag, color: "bg-orange-100 text-orange-600" },
    { title: "Refer a Friend", description: "Get a free class when your friend books.", icon: Gift, color: "bg-sky-100 text-sky-600" },
];

const EventHighlightCard: React.FC<{ event: Event; onClick: () => void }> = ({ event, onClick }) => {
    const eventDate = new Date(event.date + 'T' + event.time);
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <button onClick={onClick} className="w-full bg-white rounded-2xl shadow-lg shadow-slate-200/60 overflow-hidden flex p-3 gap-4 items-center text-left hover:bg-slate-50 transition-colors">
            <img src={event.imageUrl} alt={event.title} className="h-20 w-20 object-cover rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate text-base">{event.title}</h3>
                <div className="flex items-center text-xs text-slate-500 mt-1.5">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>{formattedDate}, {formattedTime}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>
            </div>
        </button>
    );
};


interface WelcomePageProps {
    trainers: Trainer[];
    onOpenMealPlanner: () => void;
    onOpenAICoach: () => void;
    events: Event[];
    onNavigate: (page: string) => void;
    onSelectEvent: (event: Event) => void;
    onSelectTopCategory: (category: Category) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ trainers, onOpenMealPlanner, onOpenAICoach, events, onNavigate, onSelectEvent, onSelectTopCategory }) => {
    const premiumTrainers = trainers.filter(t => t.isPremium);
    const topCategories = CATEGORIES.slice(0, 6);
    const upcomingEvents = events.slice(0, 2);

    return (
        <div className="h-full overflow-y-auto bg-slate-50">
            <main className="pb-[calc(5rem+env(safe-area-inset-bottom))]">
                {/* Header */}
                <header className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img src={rhinoLogo} alt="RhinoFit" className="w-20 h-20 object-contain" />
                        <h1 className="text-3xl font-bold text-primary">
                            RhinoFit
                        </h1>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Welcome!
                    </h2>
                    <p className="text-slate-500 mt-1">Your gateway to fitness in Ho Chi Minh City.</p>
                </header>

                {/* Upcoming Events */}
                <section className="mt-6 px-6">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-slate-800">Upcoming Events</h2>
                        <button onClick={() => onNavigate('events')} className="text-sm font-semibold text-[#FF6B35] hover:text-orange-600 flex items-center transition-colors">
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {upcomingEvents.map(event => (
                            <EventHighlightCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
                        ))}
                    </div>
                </section>

                {/* Premium Tools */}
                <section className="mt-10 px-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                        <Sparkles className="w-6 h-6 mr-2 text-purple-500" /> Premium Tools
                    </h2>
                    <div className="space-y-4">
                        <button 
                            onClick={onOpenAICoach}
                            className="w-full bg-gradient-to-br from-purple-50 to-indigo-100 p-4 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-between text-left hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                                    <Sparkles className="w-7 h-7 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-bold text-slate-800">AI Fitness Coach</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Get instant advice & workout ideas</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-purple-400" />
                        </button>
                        <button 
                            onClick={onOpenMealPlanner}
                            className="w-full bg-gradient-to-br from-purple-50 to-indigo-100 p-4 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-between text-left hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                                    <UtensilsCrossed className="w-7 h-7 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-bold text-slate-800">AI Meal Planner</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Personalized plans for your goals</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-purple-400" />
                        </button>
                    </div>
                </section>
                
                {/* Premium Trainers */}
                <section className="mt-10 px-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                        <Crown className="w-6 h-6 mr-2 text-amber-400" /> Premium Trainers
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {premiumTrainers.map(trainer => (
                            <PremiumTrainerCard key={trainer.id} trainer={trainer} />
                        ))}
                    </div>
                </section>

                {/* Special Offers */}
                <section className="mt-10 px-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                        <Gift className="w-6 h-6 mr-2 text-sky-500" /> Special Offers
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {offers.map(offer => (
                            <div key={offer.title} className="bg-white p-4 rounded-xl shadow-md shadow-slate-200/60 flex items-start space-x-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${offer.color}`}>
                                    <offer.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{offer.title}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{offer.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Top Categories */}
                <section className="mt-10 px-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Top Categories</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {topCategories.map(category => (
                            <button
                              key={category.id}
                              onClick={() => onSelectTopCategory(category)}
                              className="relative h-28 rounded-xl shadow-lg shadow-slate-300/60 overflow-hidden flex items-center justify-center text-center bg-cover bg-center transition-transform transform hover:scale-105 cursor-pointer group"
                              style={{ backgroundImage: `url(${categoryImages[category.id] || 'https://picsum.photos/400/300'})` }}
                            >
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
                                <span className="font-bold text-white text-lg z-10 drop-shadow-md">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default WelcomePage;