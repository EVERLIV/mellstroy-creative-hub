import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, X } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { CATEGORIES } from '../constants';
import type { Class, Trainer } from '../types';
import CategoryFilters from '../components/CategoryFilters';
import ViewToggle from '../components/ViewToggle';
import {
  DiscoveryClassCard,
  DiscoveryClassListItem,
  DiscoveryCoachCard,
} from '../components/explore/ExploreDiscoveryCards';
import { AppScreen } from '@/src/components/layout/screen';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/src/components/ui/breadcrumb';
import { Button } from '@/src/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/src/components/ui/carousel';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/src/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/src/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';
import { formatVND } from '@/src/lib/format';

type ClassEntry = { cls: Class; trainer: Trainer };
type ViewMode = 'grid' | 'list' | 'map';

const BANNERS = [
  {
    id: 'summer',
    title: 'Summer fight camp',
    subtitle: 'Boxing · Muay Thai · 20% off first pack',
    cta: 'View offers',
    image:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1400&q=80',
    href: '/explore?category=boxing',
  },
  {
    id: 'yoga',
    title: 'Sunrise yoga weeks',
    subtitle: 'Outdoor rooftop sessions across District 1 & 2',
    cta: 'Book sunrise',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=80',
    href: '/explore?category=yoga',
  },
  {
    id: 'swim',
    title: 'Technique swim series',
    subtitle: 'Small groups · verified coaches · open spots this week',
    cta: 'See swim classes',
    image:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1400&q=80',
    href: '/explore?category=swimming',
  },
] as const;

const allCategories = [{ id: 'all', name: 'All', icon: 'grid' }, ...CATEGORIES];

const transformClass = (c: any): Class => ({
  id: c.id as any,
  name: c.name,
  language: c.language || [],
  level: c.level || '',
  description: c.description || '',
  duration: c.duration_minutes,
  price: Number(c.price),
  imageUrl: c.image_url || '',
  imageUrls: c.image_urls || [],
  capacity: c.capacity,
  classType: c.class_type as Class['classType'],
  schedule:
    c.schedule_days && c.schedule_time
      ? { days: c.schedule_days, time: c.schedule_time }
      : undefined,
  bookings: [],
  kids_friendly: c.kids_friendly || false,
  disability_friendly: c.disability_friendly || false,
});

const transformTrainer = (profile: any, classes: Class[]): Trainer => ({
  id: profile.id,
  name: profile.username,
  specialty: profile.specialty || [],
  rating: Number(profile.rating) || 0,
  reviews: profile.reviews_count || 0,
  location: profile.location || '',
  price: Number(profile.price_per_hour) || 0,
  imageUrl: profile.avatar_url || '',
  verificationStatus: profile.is_verified ? 'verified' : 'unverified',
  isPremium: !!profile.is_premium,
  bio: profile.bio || '',
  shortDescription: profile.short_description || '',
  experienceYears: profile.experience_years || undefined,
  lastSeen: profile.last_seen || null,
  reviewsData: [],
  classes,
  chatHistory: [],
});

export default function ClassesPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ClassEntry[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: trainerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');
      const trainerIds = trainerRoles?.map((r) => r.user_id) || [];
      if (trainerIds.length === 0) {
        setEntries([]);
        setTrainers([]);
        return;
      }

      const [profilesResult, classesResult] = await Promise.all([
        supabase.from('profiles').select('*').in('id', trainerIds),
        supabase.from('classes').select('*').in('trainer_id', trainerIds),
      ]);

      const profiles = profilesResult.data || [];
      const classRows = classesResult.data || [];
      const byTrainer = new Map<string, Class[]>();
      for (const row of classRows) {
        const list = byTrainer.get(row.trainer_id) || [];
        list.push(transformClass(row));
        byTrainer.set(row.trainer_id, list);
      }

      const trainerList = profiles.map((p) =>
        transformTrainer(p, byTrainer.get(p.id) || [])
      );
      setTrainers(trainerList);

      const flat: ClassEntry[] = [];
      for (const t of trainerList) {
        for (const cls of t.classes) {
          flat.push({ cls, trainer: t });
        }
      }
      setEntries(flat);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter(({ cls, trainer }) => {
      if (selectedCategory && selectedCategory !== 'all') {
        const cat = CATEGORIES.find((c) => c.id === selectedCategory);
        const name = cat?.name?.toLowerCase() || selectedCategory;
        const hit =
          trainer.specialty?.some((s) => s.toLowerCase().includes(name)) ||
          cls.name.toLowerCase().includes(name);
        if (!hit) return false;
      }
      if (!q) return true;
      return (
        cls.name.toLowerCase().includes(q) ||
        trainer.name.toLowerCase().includes(q) ||
        trainer.location?.toLowerCase().includes(q) ||
        cls.level?.toLowerCase().includes(q) ||
        (cls.language || []).some((l) => l.toLowerCase().includes(q))
      );
    });
  }, [entries, searchQuery, selectedCategory]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.cls.price - b.cls.price);
      case 'price-desc':
        return list.sort((a, b) => b.cls.price - a.cls.price);
      case 'rating':
        return list.sort((a, b) => b.trainer.rating - a.trainer.rating);
      case 'duration':
        return list.sort((a, b) => a.cls.duration - b.cls.duration);
      default:
        return list.sort(
          (a, b) =>
            b.trainer.rating * 10 +
            b.trainer.reviews -
            (a.trainer.rating * 10 + a.trainer.reviews)
        );
    }
  }, [filtered, sortBy]);

  const topTrainers = useMemo(
    () =>
      [...trainers]
        .filter((t) => t.classes.length > 0)
        .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
        .slice(0, 8),
    [trainers]
  );

  const districts = useMemo(() => {
    const map = new Map<string, ClassEntry[]>();
    for (const entry of sorted) {
      const key = entry.trainer.location || 'Ho Chi Minh City';
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [sorted]);

  const selectedEntry =
    sorted.find((e) => `${e.trainer.id}:${e.cls.id}` === selectedMapId) ||
    sorted[0] ||
    null;

  return (
    <AppScreen className="relative min-w-0 bg-muted/30">
      <div className={cn(APP_CONTENT, 'flex flex-col gap-8 py-6')}>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <Breadcrumb>
                <BreadcrumbList className="text-[11px] font-semibold uppercase tracking-wide">
                  <BreadcrumbItem>
                    <span className="text-primary">Discover</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold uppercase text-muted-foreground">
                      Classes
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-bold tracking-tight md:text-[32px] md:leading-10">
                Book a class
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Sales drops, open spots, and top-rated coaches — search sessions, not profiles.{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate('/explore')}
                >
                  Find a coach instead
                </button>
              </p>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" aria-label="Sort classes">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Coach rating</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                  <SelectItem value="duration">Shortest first</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <InputGroup className="h-11 flex-1 bg-card">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search classes, coaches, districts…"
                aria-label="Search classes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          </div>

          <CategoryFilters
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Promo banners */}
        <section aria-label="Promotions">
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {BANNERS.map((banner) => (
                <CarouselItem key={banner.id} className="basis-full pl-3 md:basis-[85%] lg:basis-[70%]">
                  <button
                    type="button"
                    onClick={() => navigate(banner.href)}
                    className="relative block h-44 w-full overflow-hidden rounded-xl text-left sm:h-52"
                  >
                    <img
                      src={banner.image}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-5 text-white sm:p-6">
                      <Badge variant="secondary" className="w-fit">
                        Featured
                      </Badge>
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{banner.title}</h2>
                      <p className="max-w-md text-sm text-white/85">{banner.subtitle}</p>
                      <span className="text-sm font-semibold underline-offset-4">{banner.cta} →</span>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 hidden sm:flex" />
            <CarouselNext className="right-2 hidden sm:flex" />
          </Carousel>
        </section>

        {/* Top rated coaches */}
        {!loading && topTrainers.length > 0 ? (
          <section className="flex flex-col gap-3" aria-label="Top rated coaches">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Leaderboard
                </span>
                <h2 className="text-lg font-bold tracking-tight">Top rated coaches</h2>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/explore')}>
                All coaches
              </Button>
            </div>
            <Carousel opts={{ align: 'start' }} className="w-full">
              <CarouselContent className="-ml-3">
                {topTrainers.map((trainer, index) => (
                  <CarouselItem
                    key={trainer.id}
                    className="basis-[70%] pl-3 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  >
                    <div className="relative">
                      <Badge className="absolute left-2 top-2 z-10 tabular-nums">#{index + 1}</Badge>
                      <DiscoveryCoachCard
                        trainer={trainer}
                        isFavorite={false}
                        onSelect={() => navigate(`/trainer/${trainer.id}`)}
                        onBook={() => navigate(`/trainer/${trainer.id}`)}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-3 hidden sm:flex" />
              <CarouselNext className="-right-3 hidden sm:flex" />
            </Carousel>
          </section>
        ) : null}

        {/* Class results */}
        <section className="flex flex-col gap-4" aria-label="Class results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {loading ? 'Loading classes…' : `${sorted.length} class${sorted.length === 1 ? '' : 'es'}`}
              </h2>
              <p className="text-xs text-muted-foreground">Cards · list · map — same inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} withMap />
              <Badge variant="secondary" className="capitalize">
                {viewMode}
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Empty className="border border-dashed bg-card">
              <EmptyHeader>
                <EmptyTitle>No classes found</EmptyTitle>
                <EmptyDescription>Try another category or clear search.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset
                </Button>
              </EmptyContent>
            </Empty>
          ) : viewMode === 'map' ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="flex max-h-[640px] flex-col gap-2 overflow-y-auto pr-1">
                {districts.map(([district, list]) => (
                  <div key={district} className="flex flex-col gap-2">
                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/30 py-1 backdrop-blur">
                      <MapPin className="size-3.5 text-primary" />
                      <span className="text-xs font-semibold">{district}</span>
                      <Badge variant="secondary" className="tabular-nums">
                        {list.length}
                      </Badge>
                    </div>
                    {list.map((entry) => {
                      const id = `${entry.trainer.id}:${entry.cls.id}`;
                      const active = selectedEntry
                        ? `${selectedEntry.trainer.id}:${selectedEntry.cls.id}` === id
                        : false;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedMapId(id)}
                          className={cn(
                            'rounded-xl border bg-card p-3 text-left transition-colors',
                            active ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/40'
                          )}
                        >
                          <p className="truncate text-sm font-semibold">{entry.cls.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {entry.trainer.name} · {entry.cls.duration} min
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-0.5 font-semibold">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              {entry.trainer.rating.toFixed(1)}
                            </span>
                            <span className="font-bold tabular-nums text-primary">
                              {formatVND(entry.cls.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <Card className="overflow-hidden">
                <div className="relative h-56 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_70%_60%,hsl(var(--primary)/0.12),transparent_50%)] sm:h-72">
                  <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]" />
                  {districts.slice(0, 8).map(([district, list], i) => (
                    <Badge
                      key={district}
                      variant="secondary"
                      className="absolute shadow-sm"
                      style={{
                        left: `${12 + (i % 4) * 22}%`,
                        top: `${18 + Math.floor(i / 4) * 34}%`,
                      }}
                    >
                      <MapPin className="size-3" />
                      {district.split(' ')[0]} · {list.length}
                    </Badge>
                  ))}
                  <p className="absolute bottom-3 left-3 text-[11px] text-muted-foreground">
                    HCMC coverage map · select a pin group from the list
                  </p>
                </div>
                {selectedEntry ? (
                  <>
                    <CardHeader className="gap-1">
                      <CardTitle className="text-base">{selectedEntry.cls.name}</CardTitle>
                      <CardDescription>
                        {selectedEntry.trainer.name} · {selectedEntry.trainer.location || 'HCMC'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">
                        {selectedEntry.cls.description ||
                          `${selectedEntry.cls.duration} min · ${selectedEntry.cls.classType} · ${selectedEntry.cls.level || 'All levels'}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          {selectedEntry.trainer.rating.toFixed(1)} ({selectedEntry.trainer.reviews})
                        </Badge>
                        <Badge variant="outline">{selectedEntry.cls.classType}</Badge>
                        {selectedEntry.cls.level ? (
                          <Badge variant="outline">{selectedEntry.cls.level}</Badge>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        onClick={() => navigate(`/class/${selectedEntry.cls.id}`)}
                      >
                        Open class
                      </Button>
                    </CardContent>
                  </>
                ) : null}
              </Card>
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {sorted.map(({ cls, trainer }) => (
                <DiscoveryClassListItem
                  key={`${trainer.id}:${cls.id}`}
                  cls={cls}
                  trainer={trainer}
                  onSelect={() => navigate(`/class/${cls.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sorted.map(({ cls, trainer }) => (
                <DiscoveryClassCard
                  key={`${trainer.id}:${cls.id}`}
                  cls={cls}
                  trainer={trainer}
                  onSelect={() => navigate(`/class/${cls.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppScreen>
  );
}
