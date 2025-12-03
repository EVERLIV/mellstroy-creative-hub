import React from 'react';
import { Calendar, Search, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../src/components/ui/button';
import { UserRole } from '../types';

interface EmptyBookingsStateProps {
  type: 'upcoming' | 'past';
  userRole?: UserRole;
}

const EmptyBookingsState: React.FC<EmptyBookingsStateProps> = ({ type, userRole = 'student' }) => {
  const navigate = useNavigate();
  const isTrainer = userRole === 'trainer';

  const content = {
    upcoming: isTrainer ? {
      title: "No Upcoming Bookings",
      description: "You don't have any upcoming client bookings yet. Share your classes to get more bookings!",
      icon: Users,
      buttonText: "View My Classes",
      buttonAction: () => navigate('/profile')
    } : {
      title: "No Upcoming Classes",
      description: "You haven't booked any classes yet. Start your fitness journey today!",
      icon: Calendar,
      buttonText: "Browse Classes",
      buttonAction: () => navigate('/explore')
    },
    past: isTrainer ? {
      title: "No Past Bookings",
      description: "Your completed client sessions will appear here once you start teaching.",
      icon: Sparkles,
      buttonText: "View My Classes",
      buttonAction: () => navigate('/profile')
    } : {
      title: "No Past Classes",
      description: "Your completed classes will appear here. Book your first class to get started!",
      icon: Sparkles,
      buttonText: "Find a Class",
      buttonAction: () => navigate('/explore')
    }
  };

  const { title, description, icon: Icon, buttonText, buttonAction } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <Search className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-foreground mb-2 text-center">
        {title}
      </h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        {description}
      </p>

      {/* CTA Button */}
      <Button 
        onClick={buttonAction}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-semibold transition-all hover:scale-105"
      >
        {buttonText}
      </Button>

      {/* Decorative elements */}
      <div className="flex gap-2 mt-8 opacity-30">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default EmptyBookingsState;