import React, { useState } from 'react';
import { MapPin, Dumbbell } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { SCREEN_BOTTOM_SAFE, SCREEN_GUTTER } from '@/src/components/layout/shell';
import {
  ActiveBookingCard,
  BookingConfirmedCard,
  BookingSummaryCard,
  CardSectionLabel,
  ClassSessionCard,
  DenseListCard,
  DenseListRow,
  SessionInspectCard,
  TrainerCompactCard,
  TrainerMagazineCard,
  TrainerProfileCard,
  VenueDeepDiveCard,
  VenueFacilityCard,
} from '@/src/components/design-system/cards';
import { cn } from '@/src/lib/utils';

type Filter = 'all' | 'trainers' | 'classes' | 'venues';

const SAMPLE_IMG =
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80';
const SAMPLE_IMG_2 =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80';
const SAMPLE_IMG_3 =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80';

/**
 * Internal showcase for the RhinoFit Performance Card System.
 * Route: /design-system/cards
 */
export default function DesignSystemCardsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [courtId, setCourtId] = useState('c1');

  const show = (key: Filter) => filter === 'all' || filter === key;

  return (
    <AppScreen className="bg-muted/20">
      <div className={cn('mx-auto w-full max-w-7xl space-y-8 py-6', SCREEN_GUTTER, SCREEN_BOTTOM_SAFE)}>
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                RhinoFit Card Ecosystem
              </span>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-900 dark:bg-orange-950 dark:text-orange-200">
                Design System Library
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Card System</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Modular card elements for trainers, classes, venues, and booking states. Import from{' '}
              <code className="rounded bg-muted px-1 text-xs">@/src/components/design-system/cards</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
            {(
              [
                ['all', 'All Cards'],
                ['trainers', 'Trainers'],
                ['classes', 'Masterclasses'],
                ['venues', 'Venues'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {show('trainers') ? (
          <section className="space-y-4">
            <CardSectionLabel title="1. Trainer Profile & Verification" meta="Detailed + Compact + Magazine" />
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <TrainerProfileCard
                  name="Coach Minh Vu"
                  imageUrl={SAMPLE_IMG}
                  title="Performance & Tennis Coach • PTR Certified"
                  bio="12+ years optimizing kinetic power for competitors and amateurs. Specialized in serve mechanics, agility footwork, and tactical endurance."
                  rating={4.9}
                  reviews={84}
                  specialties={['Serve Mechanics', 'Strength & Conditioning', 'Match Tactics', 'Video Analysis']}
                  availableToday
                  verified
                  nextSlotLabel="Tomorrow, 07:00 AM (Court 1)"
                  nextSlotUrgency="Fast Filling"
                  testimonial={{
                    quote: 'Minh fixed my second serve slice within two drills.',
                    author: 'Tuan Nguyen',
                  }}
                  price={650000}
                  onViewProfile={() => undefined}
                  onBook={() => undefined}
                />
              </div>
              <div className="space-y-4 lg:col-span-4">
                <TrainerCompactCard
                  name="Elena Rostova"
                  imageUrl={SAMPLE_IMG_2}
                  subtitle="Padel & Reaction Drill Coach"
                  rating={4.95}
                  reviews={112}
                  price={720000}
                  verified
                  onReserve={() => undefined}
                />
                <ActiveBookingCard
                  title="1-on-1 Serve Mechanics with Coach Minh"
                  whenLabel="Saturday, Oct 26 • 08:00 – 09:00 AM"
                  courtLabel="Court: Indoor AC #2"
                  initials="MV"
                  onAddToCalendar={() => undefined}
                />
                <div className="mx-auto w-48">
                  <TrainerMagazineCard
                    name="Minh Vu"
                    imageUrl={SAMPLE_IMG}
                    rating={4.9}
                    reviews={84}
                    location="District 1"
                    price={650000}
                    tag="Tennis"
                    isPremium
                    verified
                    onSelect={() => undefined}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {show('classes') ? (
          <section className="space-y-4">
            <CardSectionLabel
              color="secondary"
              title="2. Training Class & Masterclass"
              meta="Live roster + mini-cart"
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ClassSessionCard
                title="High-Intensity Padel Masterclass"
                description="Wall volley transitions, Bandeja precision, and match-pressure rounds."
                imageUrl={SAMPLE_IMG_3}
                levelLabel="Intermediate / Advanced"
                durationMin={60}
                venueLabel="Court 3 — Indoor AC"
                capacity={8}
                filled={5}
                coachName="Coach Minh Vu"
                coachRole="Lead Tactical Strategist"
                coachImageUrl={SAMPLE_IMG}
                price={350000}
                compareAt={390000}
                slots={['Thu, 18:30', 'Sat, 09:00']}
                onReserve={() => undefined}
              />
              <ClassSessionCard
                title="Speed Agility & Core Plyometrics"
                description="Build deceleration mechanics and hip rotation for multi-set matches."
                imageUrl={SAMPLE_IMG_2}
                levelLabel="All Levels"
                durationMin={45}
                venueLabel="Outdoor Rooftop Arena"
                capacity={10}
                filled={2}
                coachName="Coach Elena Rostova"
                coachRole="Conditioning Specialist"
                coachImageUrl={SAMPLE_IMG_2}
                price={280000}
                memberPerk={false}
                slots={['Fri, 07:00', 'Sun, 08:00']}
                onReserve={() => undefined}
              />
              <BookingSummaryCard
                items={[
                  { title: 'Cardio Tennis & Drills', meta: 'Coach Minh • Thu 18:30', amount: 350000 },
                  { title: 'Pro Racket Rental', meta: 'Wilson Blade 98', amount: 80000 },
                ]}
                discountAmount={43000}
                total={387000}
                onConfirm={() => undefined}
              />
            </div>
          </section>
        ) : null}

        {show('venues') ? (
          <section className="space-y-4">
            <CardSectionLabel color="success" title="3. Venue Facility Cards" meta="List + deep-dive" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VenueFacilityCard
                name="Elite Tennis Club"
                imageUrl={SAMPLE_IMG}
                categoryLabel="Tennis"
                address="123 Nguyen Hue"
                district="District 1"
                rating={4.8}
                reviews={156}
                pricePerHour={500000}
                amenities={['Parking', 'Locker Room', 'Shower']}
                trainersAvailable
                onDetails={() => undefined}
                onBook={() => undefined}
              />
              <VenueFacilityCard
                name="Saigon Padel Arena"
                imageUrl={SAMPLE_IMG_3}
                categoryLabel="Padel"
                address="45 Le Duan"
                district="District 1"
                rating={4.9}
                reviews={92}
                pricePerHour={420000}
                amenities={['Equipment rental', 'Coaching']}
                onDetails={() => undefined}
                onBook={() => undefined}
              />
            </div>
            <VenueDeepDiveCard
              name="Saigon Padel & Elite Tennis Club"
              address="188 Nguyen Van Huong, Thao Dien, Thu Duc City"
              rating={4.92}
              reviews={340}
              gallery={[SAMPLE_IMG, SAMPLE_IMG_2, SAMPLE_IMG_3]}
              amenities={[
                { label: 'Floodlights' },
                { label: 'Ice Baths' },
                { label: 'Pro Shop' },
                { label: 'Racket Rental' },
                { label: 'Cafe' },
                { label: 'Parking' },
              ]}
              courts={[
                {
                  id: 'c1',
                  label: 'Court 01 • Blue Acrylic',
                  title: 'Covered Grandstand Court',
                  description: 'ITF Category 3 surface, high canopy',
                  pricePerHour: 320000,
                  availabilityLabel: '3 Slots Open',
                  available: true,
                },
                {
                  id: 'c2',
                  label: 'Court 02 • Panoramic Padel',
                  title: 'Super-Panoramic Court',
                  description: 'Tempered glass, Mondo turf',
                  pricePerHour: 450000,
                  availabilityLabel: '1 Slot Open',
                  available: true,
                },
                {
                  id: 'c3',
                  label: 'Court 03 • Natural Clay',
                  title: 'Roland Garros Red Clay',
                  description: 'Slow bounce, drainage system',
                  pricePerHour: 380000,
                  availabilityLabel: 'Booked for Peak',
                  available: false,
                },
              ]}
              selectedCourtId={courtId}
              onSelectCourt={setCourtId}
              onBook={() => undefined}
              onContact={() => undefined}
            />
          </section>
        ) : null}

        {show('all') ? (
          <section className="space-y-4">
            <CardSectionLabel color="accent" title="4. Transactional States" meta="List / inspect / confirmed" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <DenseListCard>
                <DenseListRow
                  icon={<Dumbbell className="size-5" />}
                  title="Court 04 (Hard Indoors)"
                  meta="16:00 – 17:00 • District 2"
                  price={290000}
                  status="available"
                />
                <DenseListRow
                  icon={<MapPin className="size-5" />}
                  title="Padel Center Court"
                  meta="18:00 – 19:30 • Thao Dien"
                  price={520000}
                  status="limited"
                />
                <DenseListRow
                  icon={<Dumbbell className="size-5" />}
                  title="Clay Court 01"
                  meta="20:00 – 21:00 • District 7"
                  price={340000}
                  status="booked"
                />
              </DenseListCard>
              <SessionInspectCard
                subtitle="PTR Tactical Assessment with Coach Minh"
                rows={[
                  { label: 'Assigned Court', value: 'Court 1 (Indoor AC)' },
                  { label: 'Duration', value: '60 min on-court' },
                  { label: 'Equipment', value: 'Balls + Video Rig', accent: true },
                ]}
                total={650000}
                onConfirm={() => undefined}
              />
              <BookingConfirmedCard
                onViewTicket={() => undefined}
                onDirections={() => undefined}
              />
            </div>
          </section>
        ) : null}
      </div>
    </AppScreen>
  );
}
