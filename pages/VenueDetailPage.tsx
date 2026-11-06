import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Dumbbell,
  Images,
  MapPin,
  Phone,
  Share2,
  ShoppingBag,
  ShowerHead,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { Venue } from '../types';
import ImageGalleryModal from '../components/ImageGalleryModal';
import MembershipPurchaseModal from '../components/MembershipPurchaseModal';
import { VENUE_CATEGORY_LABELS } from '../components/VenueCard';
import { AppScreen } from '@/src/components/layout/screen';
import { DetailContextStrip } from '@/src/components/layout/detail-context-strip';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Separator } from '@/src/components/ui/separator';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';

interface VenueDetailPageProps {
  venue: Venue;
  onBack: () => void;
}

type MembershipPlan = Venue['membershipPlans'][number];

const RHINOFIT_DISCOUNT = 0.1;

/** Venue product page — gallery, plans, sticky pass tray (Kinetic / Stitch mock). */
const VenueDetailPage: React.FC<VenueDetailPageProps> = ({ venue, onBack }) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedMembershipPlan, setSelectedMembershipPlan] = useState<MembershipPlan | null>(
    null
  );
  const [cartPlan, setCartPlan] = useState<MembershipPlan | null>(
    venue.membershipPlans[0] ?? null
  );

  const gallery = useMemo(() => {
    const urls = [venue.imageUrl, ...(venue.imageUrls || [])].filter(Boolean);
    return urls.length ? Array.from(new Set(urls)) : [venue.imageUrl];
  }, [venue.imageUrl, venue.imageUrls]);

  const sideImages = gallery.slice(1, 3);
  const extraPhotoCount = Math.max(0, gallery.length - 1);

  const discounted = (price: number) => Math.round(price * (1 - RHINOFIT_DISCOUNT));

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: venue.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
  };

  const scrollToPlans = () => {
    document.getElementById('venue-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cartOriginal = cartPlan?.price ?? 0;
  const cartFinal = cartPlan ? discounted(cartPlan.price) : 0;
  const cartDiscount = cartOriginal - cartFinal;

  return (
    <AppScreen className="min-w-0 bg-background">
      <div className={cn(APP_CONTENT, 'flex flex-col gap-6 py-4 md:py-6')}>
        <DetailContextStrip
          backLabel="Back to Venues"
          onBack={onBack}
          crumbs={[
            { label: 'Venues', href: '/venues' },
            {
              label: venue.district || 'Location',
              href: venue.district
                ? `/venues?district=${encodeURIComponent(venue.district)}`
                : '/venues',
            },
            { label: venue.name },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm">
                <Bookmark data-icon="inline-start" />
                Save
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                <Share2 data-icon="inline-start" />
                Share
              </Button>
            </div>
          }
        />

        {/* Title + badges */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{VENUE_CATEGORY_LABELS[venue.category]}</Badge>
              {venue.trainerAvailability ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 aria-hidden />
                  Trainers available
                </Badge>
              ) : null}
              {venue.operatingHours[0] ? (
                <Badge variant="outline" className="gap-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
                  Open · {venue.operatingHours[0].open}–{venue.operatingHours[0].close}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {venue.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="text-primary" aria-hidden />
                {venue.district}, Ho Chi Minh City
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <Star className="fill-primary text-primary" aria-hidden />
                <span className="font-semibold text-foreground">{venue.rating.toFixed(1)}</span>
                <span>({venue.reviews} athlete reviews)</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Dumbbell aria-hidden />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">RhinoFit Partner</p>
              <p className="text-xs font-semibold text-foreground">
                {RHINOFIT_DISCOUNT * 100}% off all passes
              </p>
            </div>
          </div>
        </div>

        {/* Media gallery bento */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <button
            type="button"
            onClick={() => openGallery(0)}
            className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted md:col-span-8 md:aspect-auto md:h-[420px]"
          >
            <img
              src={gallery[0]}
              alt={venue.name}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-primary-foreground">
              <div className="text-left">
                <p className="text-sm font-semibold drop-shadow">{venue.name}</p>
                <p className="text-xs opacity-80">
                  Capacity {venue.capacity} · {VENUE_CATEGORY_LABELS[venue.category]}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
                <Images aria-hidden />
                Gallery
              </span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3 md:col-span-4 md:h-[420px] md:grid-cols-1">
            {(sideImages.length ? sideImages : [gallery[0], gallery[0]]).map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => openGallery(Math.min(i + 1, gallery.length - 1))}
                className="group relative h-[140px] overflow-hidden rounded-xl border border-border md:h-[202px]"
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {i === 1 && extraPhotoCount > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm">
                      <Images aria-hidden />
                      +{extraPhotoCount} photos
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-foreground/20 transition-colors group-hover:bg-transparent" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main + sticky aside */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-foreground">About the facility</h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                {venue.description}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
                {[
                  { label: 'Capacity', value: `Up to ${venue.capacity}` },
                  { label: 'Category', value: VENUE_CATEGORY_LABELS[venue.category] },
                  { label: 'District', value: venue.district },
                  {
                    label: 'From',
                    value: formatVND(venue.pricePerHour),
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                    <span className="text-xs font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Membership plans */}
            <section
              id="venue-plans"
              className="scroll-mt-24 rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Membership plans & day passes</h2>
                  <p className="text-sm text-muted-foreground">
                    Book through RhinoFit and save {RHINOFIT_DISCOUNT * 100}% on passes.
                  </p>
                </div>
                <Badge variant="secondary">Automatic member discount</Badge>
              </div>

              {venue.membershipPlans.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {venue.membershipPlans.map((plan, index) => {
                    const finalPrice = discounted(plan.price);
                    const featured = index === 1;
                    const selected = cartPlan?.name === plan.name;
                    return (
                      <div
                        key={plan.name}
                        className={cn(
                          'relative flex flex-col justify-between rounded-xl border-2 bg-card p-5 transition-all',
                          featured || selected
                            ? 'border-primary shadow-sm'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {featured ? (
                          <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                            Most popular
                          </span>
                        ) : null}
                        <div>
                          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                            <Badge variant="secondary">{plan.duration}</Badge>
                            <Badge variant="outline">
                              RhinoFit {RHINOFIT_DISCOUNT * 100}% off
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                          <div className="mb-4 mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                              {formatVND(finalPrice)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatVND(plan.price)}
                            </span>
                          </div>
                          {plan.features.length > 0 ? (
                            <ul className="flex flex-col gap-2.5 border-t border-border pt-4 text-sm text-muted-foreground">
                              {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                  <CheckCircle2
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                    aria-hidden
                                  />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                          <span className="text-[11px] text-muted-foreground">{plan.duration}</span>
                          <Button
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCartPlan(plan)}
                          >
                            {selected ? 'Selected' : 'Select pass'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Day pass strip */}
              <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Clock aria-hidden />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Single session / day pass
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Full facility access for one training day.
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                  <div className="text-right">
                    <span className="block text-lg font-bold text-foreground">
                      {formatVND(venue.pricePerHour)}
                    </span>
                    <span className="text-xs text-muted-foreground">per session</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCartPlan({
                        name: 'Day Pass',
                        duration: '1 day',
                        price: Math.round(venue.pricePerHour / (1 - RHINOFIT_DISCOUNT)),
                        features: ['Full day access'],
                      })
                    }
                  >
                    Add pass
                  </Button>
                </div>
              </div>
            </section>

            {/* Amenities + equipment */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {venue.amenities.length > 0 ? (
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <ShowerHead className="text-primary" aria-hidden />
                    <h3 className="text-base font-semibold text-foreground">
                      Amenities & facilities
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}
              {venue.equipment.length > 0 ? (
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Dumbbell className="text-primary" aria-hidden />
                    <h3 className="text-base font-semibold text-foreground">Available gear</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {venue.equipment.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Location */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-foreground">Location & access</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {venue.address}, {venue.district}, Ho Chi Minh City.
              </p>
              <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.12),transparent_55%)]" />
                <div className="relative z-10 mx-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
                  <MapPin className="shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{venue.address}</p>
                    <p className="text-[11px] text-muted-foreground">{venue.district}</p>
                  </div>
                </div>
                <a
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-muted"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${venue.address}, ${venue.district}, Ho Chi Minh City`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              </div>
            </section>
          </div>

          {/* Sticky right column */}
          <aside className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-20">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Facility overview</span>
                <Badge variant="secondary">{VENUE_CATEGORY_LABELS[venue.category]}</Badge>
              </div>
              <div className="flex flex-col gap-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-semibold text-foreground">{venue.address}</p>
                    <p className="text-muted-foreground">{venue.district}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="shrink-0 fill-primary text-primary" aria-hidden />
                  <p>
                    <span className="font-semibold text-foreground">
                      {venue.rating.toFixed(1)} / 5.0
                    </span>
                    <span className="ml-1 text-muted-foreground">({venue.reviews} reviews)</span>
                  </p>
                </div>
                {venue.phone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="shrink-0 text-muted-foreground" aria-hidden />
                    <a
                      href={`tel:${venue.phone}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {venue.phone}
                    </a>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <Users className="shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-muted-foreground">
                    Capacity:{' '}
                    <strong className="text-foreground">Up to {venue.capacity} people</strong>
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Per session</span>
                  <span className="font-bold text-foreground">{formatVND(venue.pricePerHour)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Per month</span>
                  <span className="text-base font-bold text-primary">
                    {formatVND(discounted(venue.pricePerMonth))}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Members save {RHINOFIT_DISCOUNT * 100}% via RhinoFit
                </p>
              </div>
            </div>

            {venue.operatingHours.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="text-primary" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">Operating hours</h3>
                </div>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {venue.operatingHours.map((schedule) => (
                    <div
                      key={schedule.day}
                      className="flex items-center justify-between gap-2 border-b border-border py-1 last:border-0"
                    >
                      <dt className="font-medium text-muted-foreground">{schedule.day}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {schedule.open} – {schedule.close}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {/* Selected pass tray */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-card p-5 shadow-md">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-primary" aria-hidden />
                  <h3 className="text-base font-semibold text-foreground">Selected pass</h3>
                </div>
                <Badge>{cartPlan ? '1 item' : '0 items'}</Badge>
              </div>

              {cartPlan ? (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{cartPlan.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cartPlan.duration} · RhinoFit −{RHINOFIT_DISCOUNT * 100}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatVND(cartFinal)}</p>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-destructive hover:underline"
                      onClick={() => setCartPlan(null)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                  Choose a plan above to continue.
                </div>
              )}

              <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatVND(cartOriginal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-primary">
                  <span>RhinoFit {RHINOFIT_DISCOUNT * 100}% discount</span>
                  <span>−{formatVND(cartDiscount)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span className="text-primary">{formatVND(cartFinal)}</span>
                </div>
              </div>

              <Button
                type="button"
                className="mt-4 w-full"
                size="lg"
                disabled={!cartPlan}
                onClick={() => cartPlan && setSelectedMembershipPlan(cartPlan)}
              >
                <Zap data-icon="inline-start" />
                Proceed to booking
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Instant confirmation via RhinoFit digital pass
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-[11px] text-muted-foreground">Starts from</p>
          <p className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">{formatVND(venue.pricePerHour)}</span>
            <span className="text-xs text-muted-foreground">/ session</span>
          </p>
        </div>
        <Button type="button" onClick={scrollToPlans}>
          Choose pass
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />

      {isGalleryOpen ? (
        <ImageGalleryModal
          images={gallery}
          startIndex={selectedImageIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      ) : null}

      {selectedMembershipPlan ? (
        <MembershipPurchaseModal
          isOpen={!!selectedMembershipPlan}
          onClose={() => setSelectedMembershipPlan(null)}
          venue={venue}
          membershipPlan={selectedMembershipPlan}
        />
      ) : null}
    </AppScreen>
  );
};

export default VenueDetailPage;
