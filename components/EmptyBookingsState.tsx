import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../src/components/ui/button';
import { EmptyState } from '../src/components/layout/states';

interface EmptyBookingsStateProps {
  type: 'upcoming' | 'past';
}

const CONTENT = {
  upcoming: {
    title: 'No upcoming classes',
    description: "You haven't booked any classes yet. Start your fitness journey today!",
    icon: Calendar,
    buttonText: 'Browse classes',
  },
  past: {
    title: 'No past classes',
    description: 'Your completed classes will appear here. Book your first class to get started!',
    icon: Sparkles,
    buttonText: 'Find a class',
  },
} as const;

const EmptyBookingsState: React.FC<EmptyBookingsStateProps> = ({ type }) => {
  const navigate = useNavigate();
  const { title, description, icon, buttonText } = CONTENT[type];

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      className="animate-fade-in"
      action={<Button onClick={() => navigate('/explore')}>{buttonText}</Button>}
    />
  );
};

export default EmptyBookingsState;
