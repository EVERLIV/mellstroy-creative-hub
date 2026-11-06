import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, UserRole } from '../types';
import {
  ArrowRight,
  Calendar,
  Camera,
  ChevronRight,
  Crown,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
  User as UserIcon,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { AppScreen } from '@/src/components/layout/screen';
import { PageLoader } from '@/src/components/layout/states';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { AddToCartButton } from '@/src/components/kokonutui/cart-button';
import { useOptionalCartQuantities } from '@/src/hooks/useCartQuantities';
import AboutMePage from './AboutMePage';
import EditAboutMePage from './EditAboutMePage';
import FavoritesPage from './FavoritesPage';
import MyMealPlansPage from './MyMealPlansPage';
import { isStudentProfileComplete } from '../utils/profile';
import ProfileActionMenu from '../components/ProfileActionMenu';

const ANIMATION_DURATION = 300;

interface StudentProfilePageProps {
  currentUser: Trainer | null;
  userRole: UserRole;
  onNavigateToBookings: () => void;
  onNavigateToChats: () => void;
  onEditProfile: () => void;
  onSaveProfile: (updatedUser: Trainer) => void;
  onLogout: () => void;
}

type SubPage = 'about' | 'edit-about' | 'favorites' | 'meal-plans';

interface ProfileMenuItem {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = (props) => {
  const navigate = useNavigate();
  const cart = useOptionalCartQuantities();
  const {
    currentUser,
    userRole,
    onNavigateToBookings,
    onNavigateToChats,
    onEditProfile,
    onSaveProfile,
    onLogout,
  } = props;
  const [activeSubPage, setActiveSubPage] = useState<SubPage | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [dismissPrompt, setDismissPrompt] = useState(false);
  const profileIsIncomplete = currentUser ? !isStudentProfileComplete(currentUser) : false;

  const handleNavigateTo = (page: SubPage) => {
    setActiveSubPage(page);
    setIsExiting(false);
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveSubPage(null);
    }, ANIMATION_DURATION);
  };

  const handleBackToParent = (page: SubPage) => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveSubPage(page);
    }, ANIMATION_DURATION);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My RhinoFit profile', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
  };

  const renderSubPage = () => {
    if (!activeSubPage || !currentUser) return null;

    switch (activeSubPage) {
      case 'about':
        return (
          <AboutMePage
            user={currentUser}
            onBack={handleBack}
            onEdit={() => handleNavigateTo('edit-about')}
          />
        );
      case 'edit-about':
        return (
          <EditAboutMePage
            user={currentUser}
            onCancel={() => handleBackToParent('about')}
            onSave={(updatedUser) => {
              onSaveProfile(updatedUser);
              handleBackToParent('about');
            }}
          />
        );
      case 'favorites':
        return (
          <FavoritesPage
            trainers={[]}
            favoriteTrainerIds={[]}
            onToggleFavorite={() => {}}
            onBack={handleBack}
            onInitiateBooking={() => {}}
            onOpenChat={() => {}}
            userRole="student"
            currentUserId=""
            onOpenReviewsModal={() => {}}
          />
        );
      case 'meal-plans':
        return <MyMealPlansPage plans={[]} onBack={handleBack} onDelete={() => {}} />;
      default:
        return null;
    }
  };

  if (!currentUser) {
    return (
      <AppScreen>
        <PageLoader title="Loading profile…" />
      </AppScreen>
    );
  }

  const menuItems: ProfileMenuItem[] = [
    {
      label: 'About me',
      description: 'Your details and goals',
      icon: UserIcon,
      onClick: () => handleNavigateTo('about'),
    },
    {
      label: 'My bookings',
      description: 'Upcoming and past classes',
      icon: Calendar,
      onClick: onNavigateToBookings,
    },
    {
      label: 'My chats',
      description: 'Conversations with trainers',
      icon: MessageCircle,
      onClick: onNavigateToChats,
    },
    {
      label: 'My favorites',
      description: 'Trainers you saved',
      icon: Heart,
      onClick: () => handleNavigateTo('favorites'),
    },
    {
      label: 'My meal plans',
      description: 'Saved nutrition plans',
      icon: UtensilsCrossed,
      onClick: () => handleNavigateTo('meal-plans'),
    },
  ];

  const bodyStats = [
    { label: 'Age', value: currentUser.age, unit: '' },
    { label: 'Height', value: currentUser.height, unit: ' cm' },
    { label: 'Weight', value: currentUser.weight, unit: ' kg' },
    {
      label: 'Goals',
      value: currentUser.goals?.length || null,
      unit: currentUser.goals?.length === 1 ? ' goal' : ' goals',
    },
  ].filter((s) => s.value != null && s.value !== 0);

  const initials = (currentUser.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppScreen className="relative min-w-0 bg-[#f9fafb] dark:bg-background">
      <div className={cn(APP_CONTENT, 'space-y-6 py-6')}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Athlete Profile</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your account, goals, bookings and RhinoFit membership
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 shadow-sm">
            <span className="hidden rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 sm:inline dark:bg-blue-950 dark:text-blue-300">
              Member
            </span>
            <ProfileActionMenu
              user={currentUser}
              userRole={userRole}
              onEditProfile={onEditProfile}
              onLogout={onLogout}
            />
          </div>
        </div>

        {profileIsIncomplete && !dismissPrompt ? (
          <div className="relative flex flex-col justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm dark:border-orange-900 dark:bg-orange-950/40 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                <Lightbulb className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-950 dark:text-orange-100">
                  Complete your athlete profile
                </p>
                <p className="mt-0.5 text-sm text-orange-800 dark:text-orange-200/90">
                  Add fitness stats and goals to get better coach recommendations across Saigon.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <Button
                type="button"
                className="gap-1.5 bg-[#fd651e] text-white hover:bg-[#a73a00]"
                onClick={() => handleNavigateTo('edit-about')}
              >
                Edit Profile
                <ArrowRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-orange-700 hover:bg-orange-100"
                aria-label="Dismiss"
                onClick={() => setDismissPrompt(true)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Hero — same architecture as trainer */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="relative h-28 w-full bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-950 sm:h-40">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#fd651e 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
              aria-hidden
            />
            <div className="absolute right-4 top-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-border bg-card/90 backdrop-blur-sm"
                onClick={() => handleNavigateTo('edit-about')}
              >
                <Camera className="size-3.5" />
                Change Cover
              </Button>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 mb-5 flex flex-col justify-between gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="flex items-end gap-4">
                <Avatar className="size-20 rounded-2xl border-4 border-card shadow-md sm:size-24">
                  <AvatarImage src={currentUser.imageUrl} alt="" className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {currentUser.name || 'Athlete'}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    {currentUser.location ? (
                      <>
                        <MapPin className="size-4 text-[#fd651e]" />
                        <span>{currentUser.location}</span>
                        <span className="mx-1 text-border">•</span>
                      </>
                    ) : null}
                    <span className="font-semibold text-primary">RhinoFit Member</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                  <Share2 className="size-3.5" />
                  Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleNavigateTo('edit-about')}
                >
                  <Pencil className="size-3.5" />
                  Edit profile
                </Button>
              </div>
            </div>

            {currentUser.interests?.length || currentUser.goals?.length ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {(currentUser.interests?.length ? currentUser.interests : currentUser.goals || [])
                  .slice(0, 6)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-border bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            ) : null}

            {bodyStats.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {bodyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border bg-muted/50 p-3.5"
                  >
                    <span className="mb-1 block text-xs text-muted-foreground">{stat.label}</span>
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                      {stat.value}
                      <span className="text-sm font-normal text-muted-foreground">{stat.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Premium strip — same architecture as trainer Coach Pro card */}
        <div
          className={cn(
            'flex flex-col justify-between gap-4 rounded-xl p-4 shadow-sm sm:flex-row sm:items-center',
            currentUser.isPremium
              ? 'border border-border bg-card'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-xl',
                currentUser.isPremium ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'
              )}
            >
              <Crown className={cn('size-6', !currentUser.isPremium && 'fill-white')} />
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-bold',
                  currentUser.isPremium ? 'text-foreground' : 'text-white'
                )}
              >
                {currentUser.isPremium ? 'RhinoFit Premium' : 'Upgrade to Premium'}
              </p>
              <p
                className={cn(
                  'text-xs',
                  currentUser.isPremium ? 'text-muted-foreground' : 'text-orange-100'
                )}
              >
                Exclusive meal plans, AI coach, priority bookings and personalised programs.
              </p>
            </div>
          </div>
          {currentUser.isPremium ? (
            <Button type="button" variant="outline" onClick={() => navigate('/subscription')}>
              Manage
            </Button>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <AddToCartButton
                name="RhinoFit Premium"
                label="Add"
                max={1}
                quantity={cart?.getQuantity('premium:rhinofit') ?? 0}
                onQuantityChange={(qty) => {
                  cart?.setQuantity('premium:rhinofit', qty);
                  if (qty > 0) navigate('/subscription');
                }}
              />
              <Button
                type="button"
                className="bg-white font-bold text-orange-700 hover:bg-orange-50"
                onClick={() => navigate('/subscription')}
              >
                Upgrade Now
              </Button>
            </div>
          )}
        </div>

        {/* Two-column: shortcuts + quick links */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 border-b border-border pb-3">
                <h3 className="text-lg font-bold text-foreground">Shortcuts</h3>
                <p className="text-xs text-muted-foreground">Jump to bookings, chats and saved plans</p>
              </div>
              <ul className="divide-y divide-border">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#fd651e] dark:bg-orange-950">
                        <item.icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-foreground">Quick actions</h4>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/explore')}
                >
                  Find coaches
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate('/venues')}
                >
                  Book a court
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  type="button"
                  className="w-full justify-between bg-[#fd651e] text-white hover:bg-[#a73a00]"
                  onClick={onNavigateToBookings}
                >
                  My bookings
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {activeSubPage ? (
        <div
          className={cn(
            'absolute inset-0 z-30 bg-background transition-transform duration-300',
            isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          )}
        >
          {renderSubPage()}
        </div>
      ) : null}
    </AppScreen>
  );
};

export default StudentProfilePage;
