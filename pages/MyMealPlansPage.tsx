import React, { useState } from 'react';
import { MealPlan } from '../types';
import { ChevronDown, UtensilsCrossed, Calendar } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '@/src/components/layout/stitch-page';
import { EmptyState } from '@/src/components/layout/states';
import { Button } from '@/src/components/ui/button';
import { StatusBadge } from '@/src/components/ui/status-badge';
import HoldButton from '@/src/components/kokonutui/hold-button';
import { cn } from '@/src/lib/utils';

interface MyMealPlansPageProps {
  plans: MealPlan[];
  onDelete: (planId: number) => void;
  onBack: () => void;
}

const MyMealPlansPage: React.FC<MyMealPlansPageProps> = ({ plans, onDelete, onBack }) => {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const togglePlan = (planId: string) => {
    setActivePlanId((prev) => (prev === planId ? null : planId));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <AppScreen className="min-w-0 animate-fade-in bg-[#f9fafb] dark:bg-background">
      <StitchCanvas>
        <StitchPageHeader
          title={
            <span className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-orange-50 text-[#fd651e]">
                <UtensilsCrossed className="size-4" aria-hidden />
              </span>
              My meal plans
            </span>
          }
          description={
            plans.length > 0
              ? `${plans.length} saved ${plans.length === 1 ? 'plan' : 'plans'}`
              : 'Plans you save from the AI meal planner'
          }
          actions={
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          }
        />

        {plans.length > 0 ? (
          <ul className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {plans.map((plan) => {
              const isOpen = activePlanId === plan.id;
              return (
                <li key={plan.id} className={cn(isOpen && 'lg:col-span-2')}>
                  <StitchPanel className="overflow-hidden">
                    <div className="flex flex-col gap-4 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-[#fd651e]">
                          <UtensilsCrossed className="size-5" aria-hidden />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <h2 className="truncate text-base font-semibold text-foreground">{plan.name}</h2>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3" aria-hidden />
                            Saved on {formatDate(plan.createdAt)}
                            <span aria-hidden>•</span>
                            {plan.plan.length} {plan.plan.length === 1 ? 'day' : 'days'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <StatusBadge tone="primary">{plan.preferences.dietType}</StatusBadge>
                            <StatusBadge tone="neutral">{plan.preferences.eatingStyle}</StatusBadge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePlan(plan.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? 'Hide plan details' : 'Show plan details'}
                        >
                          <ChevronDown
                            className={cn(
                              'size-5 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </Button>
                      </div>

                      {isOpen && (
                        <div className="animate-fade-in space-y-3 border-t border-border pt-4">
                          {plan.plan.map((dailyPlan) => (
                            <div key={dailyPlan.day} className="rounded-xl bg-muted/50 p-3">
                              <p className="mb-2 text-sm font-semibold text-foreground">{dailyPlan.day}</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {Object.keys(dailyPlan.meals).map((mealType) => {
                                  const meal =
                                    dailyPlan.meals[mealType as keyof typeof dailyPlan.meals];
                                  return (
                                    <div key={mealType} className="rounded-lg bg-card p-2.5">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        {mealType}
                                      </p>
                                      <p className="text-sm font-medium text-foreground">{meal.name}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <HoldButton
                            variant="red"
                            className="w-full"
                            holdingLabel="Keep holding…"
                            completeLabel="Deleted"
                            onHoldComplete={() => onDelete(Number(plan.id))}
                          >
                            Hold to delete plan
                          </HoldButton>
                        </div>
                      )}
                    </div>
                  </StitchPanel>
                </li>
              );
            })}
          </ul>
        ) : (
          <StitchPanel className="p-6">
            <EmptyState
              icon={UtensilsCrossed}
              title="No meal plans yet"
              description="Generate a plan from the AI meal planner and save it here."
              action={
                <Button className="bg-[#fd651e] text-white hover:bg-[#a73a00]" onClick={onBack}>
                  Back to profile
                </Button>
              }
            />
          </StitchPanel>
        )}
      </StitchCanvas>
    </AppScreen>
  );
};

export default MyMealPlansPage;
