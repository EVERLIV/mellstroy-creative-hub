import React from 'react';
import { Trainer } from '../types';
import { MapPin, Scale, Ruler, Cake, TrendingUp, HeartPulse, Pencil, type LucideIcon } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '@/src/components/layout/screen';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';

interface AboutMePageProps {
    user: Trainer;
    onBack: () => void;
    onEdit: () => void;
}

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number | undefined;
    unit?: string;
}

function StatCard({ icon: Icon, label, value, unit }: StatCardProps) {
    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
                <span className="text-xl font-semibold tabular-nums text-foreground">
                    {value ? `${value}${unit || ''}` : '—'}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
        </div>
    );
}

function TagList({ items, emptyText }: { items: string[] | undefined; emptyText: string }) {
    if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    }
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
                <li key={item}>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                        {item}
                    </Badge>
                </li>
            ))}
        </ul>
    );
}

const AboutMePage: React.FC<AboutMePageProps> = ({ user, onBack, onEdit }) => {
    return (
        <AppScreen>
            <ScreenHeader
                title="About me"
                description="What trainers see when you book"
                onBack={onBack}
                backLabel="Go back"
                width="detail"
                actions={
                    <Button variant="outline" size="sm" onClick={onEdit} aria-label="Edit profile">
                        <Pencil />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                }
            />

            <ScreenBody width="detail">
                <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-6">
                    <Avatar className="size-16 border-2 border-border md:size-24">
                        <AvatarImage src={user.imageUrl} alt={user.name} className="object-cover" />
                        <AvatarFallback className="text-xl font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h2 className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">{user.name}</h2>
                        {user.location && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                                <span className="truncate">{user.location}</span>
                            </p>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <StatCard icon={Cake} label="Age" value={user.age} />
                    <StatCard icon={Ruler} label="Height" value={user.height} unit=" cm" />
                    <StatCard icon={Scale} label="Weight" value={user.weight} unit=" kg" />
                </div>

                <ScreenSplit
                    main={
                        <ScreenSection title="Bio" variant="panel">
                            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                                {user.bio || 'A fitness enthusiast looking to connect with great trainers!'}
                            </p>
                        </ScreenSection>
                    }
                    aside={
                        <>
                            <ScreenSection
                                title={
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                                        Fitness goals
                                    </span>
                                }
                                variant="panel"
                            >
                                <TagList items={user.goals} emptyText="No goals set yet." />
                            </ScreenSection>
                            <ScreenSection
                                title={
                                    <span className="flex items-center gap-2">
                                        <HeartPulse className="size-4 text-primary" aria-hidden="true" />
                                        Sport interests
                                    </span>
                                }
                                variant="panel"
                            >
                                <TagList items={user.interests} emptyText="No interests set yet." />
                            </ScreenSection>
                        </>
                    }
                />
            </ScreenBody>
        </AppScreen>
    );
};

export default AboutMePage;
