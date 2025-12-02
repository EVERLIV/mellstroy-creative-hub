import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Crown } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  event_type?: string;
  organizer?: { username: string; is_premium?: boolean }[];
  participant_count?: number;
}

interface EventCalendarProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events, onSelectEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInCurrentMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg p-4 border border-border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">{monthName}</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayEvents = getEventsForDate(date);
          const hasEvents = dayEvents.length > 0;
          const today = isToday(date);
          const past = isPastDate(date);

          return (
            <div
              key={date.toISOString()}
              className={`aspect-square border border-border rounded-lg p-1 ${
                today ? 'bg-primary/10 border-primary' : 'bg-card'
              } ${past ? 'opacity-50' : ''} ${hasEvents ? 'hover:shadow-md transition-shadow' : ''}`}
            >
              <div className="h-full flex flex-col">
                <div className={`text-xs font-semibold text-center mb-1 ${
                  today ? 'text-primary' : 'text-foreground'
                }`}>
                  {date.getDate()}
                </div>
                
                {hasEvents && (
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const isOrganizerPremium = event.organizer?.[0]?.is_premium || false;
                      return (
                        <button
                          key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className="w-full text-left px-1 py-0.5 bg-primary/20 hover:bg-primary/30 rounded text-xs truncate transition-colors"
                          title={event.title}
                        >
                          <div className="flex items-center gap-0.5">
                            <span className="truncate flex-1">{event.title}</span>
                            {isOrganizerPremium && (
                              <Crown className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-center text-muted-foreground font-medium">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/10 border border-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>Has Events</span>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
