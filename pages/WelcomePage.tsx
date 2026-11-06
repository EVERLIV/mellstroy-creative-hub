import React from 'react';
import { Trainer, Category, Event } from '../types';
import { CATEGORIES } from '../constants';
import { Star, Crown, Gift, Tag, ArrowRight, Sparkles, UtensilsCrossed, MapPin, Calendar, type LucideIcon } from 'lucide-react';
import rhinoLogo from '../src/assets/rhino-logo.png';
import { AppScreen, ScreenBody, ScreenSection } from '@/src/components/layout/screen';
import { EmptyState } from '@/src/components/layout/states';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import AttractButton from '@/src/components/kokonutui/attract-button';
import { cn } from '@/src/lib/utils';

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

const TOP_CATEGORY_COUNT = 6;
const UPCOMING_EVENT_COUNT = 2;

const PremiumTrainerCard: React.FC<{ trainer: Trainer }> = ({ trainer }) => (
  <div className="flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm">
    <img src={trainer.imageUrl} alt={trainer.name} loading="lazy" className="size-24 shrink-0 rounded-xl object-cover" />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <h3 className="truncate font-bold text-foreground">{trainer.name}</h3>
        <Badge className="shrink-0 gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
          <Crown className="size-3" />
          PREMIUM
        </Badge>
      </div>
      <p className="truncate text-sm text-muted-foreground">{trainer.specialty.join(', ')}</p>
      <div className="mt-1 flex items-center gap-1 text-sm">
        <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
        <span className="font-semibold text-foreground">{trainer.rating}</span>
        <span className="text-muted-foreground">({trainer.reviews})</span>
      </div>
    </div>
  </div>
);

interface Offer {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

const offers: readonly Offer[] = [
  { title: 'First Class 50% Off', description: 'New members get a special discount.', icon: Tag, tone: 'bg-primary/10 text-primary' },
  { title: 'Refer a Friend', description: 'Get a free class when your friend books.', icon: Gift, tone: 'bg-muted text-foreground' },
];

const EventHighlightCard: React.FC<{ event: Event; onClick: () => void }> = ({ event, onClick }) => {
  const eventDate = new Date(event.date + 'T' + event.time);
  const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img src={event.imageUrl} alt={event.title} loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="truncate text-base font-bold text-foreground">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <span>
            {formattedDate}, {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
    </button>
  );
};

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon: Icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
  >
    <div className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
        <Icon className="size-6 text-primary" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <ArrowRight className="size-5 shrink-0 text-primary/70 transition-transform group-hover:translate-x-1" />
  </button>
);

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
  const premiumTrainers = trainers.filter((t) => t.isPremium);
  const topCategories = CATEGORIES.slice(0, TOP_CATEGORY_COUNT);
  const upcomingEvents = events.slice(0, UPCOMING_EVENT_COUNT);

  return (
    <AppScreen>
      {/* Hero: full-bleed brand band */}
      <section className="border-b border-border bg-primary/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:gap-10 md:px-6 md:py-14 lg:px-8">
          <div className="flex flex-col gap-5 md:max-w-xl">
            <img src={rhinoLogo} alt="RhinoFit" className="size-20 object-contain" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">RhinoFit</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">Welcome!</h1>
              <p className="text-base text-muted-foreground md:text-lg">
                Your gateway to fitness in Ho Chi Minh City.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-6 px-1 py-2 sm:w-auto sm:min-w-56">
            <AttractButton
              containerClassName="w-full"
              className="h-12 w-full text-base font-semibold"
              onClick={() => onNavigate('explore')}
            >
              Find a trainer
            </AttractButton>
            <AttractButton
              containerClassName="w-full"
              className="h-12 w-full border border-border bg-card text-base font-semibold text-foreground hover:bg-muted active:bg-muted"
              onClick={() => onNavigate('events')}
            >
              Browse events
            </AttractButton>
          </div>
        </div>
      </section>

      <ScreenBody width="feed">
        {/* Bento: events + premium tools */}
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <ScreenSection
            className="lg:col-span-3"
            title="Upcoming events"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('events')} className="text-primary">
                View all
                <ArrowRight />
              </Button>
            }
          >
            {upcomingEvents.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventHighlightCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Calendar} title="No upcoming events" description="New events will show up here." />
            )}
          </ScreenSection>

          <ScreenSection className="lg:col-span-2" title={<SectionTitle icon={Sparkles}>Premium tools</SectionTitle>}>
            <div className="flex flex-col gap-3">
              <ToolCard icon={Sparkles} title="AI Fitness Coach" description="Get instant advice & workout ideas" onClick={onOpenAICoach} />
              <ToolCard icon={UtensilsCrossed} title="AI Meal Planner" description="Personalized plans for your goals" onClick={onOpenMealPlanner} />
            </div>
          </ScreenSection>
        </div>

        <ScreenSection title="Top categories">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
            {topCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectTopCategory(category)}
                className="group relative flex h-28 items-end justify-start overflow-hidden rounded-2xl bg-cover bg-center p-3 text-left shadow-sm transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-36"
                style={{ backgroundImage: `url(${categoryImages[category.id] || 'https://picsum.photos/400/300'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent transition-opacity group-hover:opacity-90" />
                <span className="relative z-10 text-base font-bold text-primary-foreground drop-shadow-md md:text-lg">{category.name}</span>
              </button>
            ))}
          </div>
        </ScreenSection>

        {premiumTrainers.length > 0 && (
          <ScreenSection title={<SectionTitle icon={Crown}>Premium trainers</SectionTitle>}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {premiumTrainers.map((trainer) => (
                <PremiumTrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          </ScreenSection>
        )}

        <ScreenSection title={<SectionTitle icon={Gift}>Special offers</SectionTitle>}>
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <div key={offer.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', offer.tone)}>
                  <offer.icon className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-foreground">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScreenSection>
      </ScreenBody>
    </AppScreen>
  );
};

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      {children}
    </span>
  );
}

export default WelcomePage;
