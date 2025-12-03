import React from 'react';
import { X, Clock, Users, Calendar, MapPin, Building, Sun, Home, Crown, ShieldCheck, Globe, Baby, Accessibility } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  description?: string;
  class_type: string;
  price: number;
  duration_minutes: number;
  capacity: number;
  image_url?: string;
  image_urls?: string[];
  schedule_days?: string[];
  schedule_time?: string;
  language?: string[];
  level?: string;
  kids_friendly?: boolean;
  disability_friendly?: boolean;
}

interface TrainerClassPreviewModalProps {
  cls: ClassData;
  bookingCount: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0 }).format(amount);
};

const TrainerClassPreviewModal: React.FC<TrainerClassPreviewModalProps> = ({
  cls,
  bookingCount,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null;

  const classTypeIcon = {
    'Indoor': <Building className="w-4 h-4" />,
    'Outdoor': <Sun className="w-4 h-4" />,
    'Home': <Home className="w-4 h-4" />
  }[cls.class_type] || <Building className="w-4 h-4" />;

  const formatSchedule = () => {
    if (!cls.schedule_days || cls.schedule_days.length === 0) return 'No schedule set';
    const days = cls.schedule_days.map(d => d.slice(0, 3)).join(', ');
    return `${days}${cls.schedule_time ? ` at ${cls.schedule_time}` : ''}`;
  };

  const images = cls.image_urls && cls.image_urls.length > 0 
    ? cls.image_urls 
    : cls.image_url 
    ? [cls.image_url] 
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
          {images.length > 0 ? (
            <img src={images[0]} alt={cls.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-card/90 backdrop-blur-sm rounded-full hover:bg-card transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* Class type badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full">
            {classTypeIcon}
            <span className="text-xs font-semibold text-foreground">{cls.class_type}</span>
          </div>

          {/* Image count */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
              {images.length} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title and Price */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">{cls.name}</h2>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">{formatVND(cls.price)} VND</span>
              <span className="text-sm text-muted-foreground">per session</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-sm font-semibold text-foreground">{cls.duration_minutes} min</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-sm font-semibold text-foreground">{bookingCount}/{cls.capacity}</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs font-semibold text-foreground">{cls.schedule_days?.length || 0} days</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-muted/30 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Schedule
            </h3>
            <p className="text-sm text-muted-foreground">{formatSchedule()}</p>
          </div>

          {/* Tags */}
          {(cls.level || (cls.language && cls.language.length > 0) || cls.kids_friendly || cls.disability_friendly) && (
            <div className="flex flex-wrap gap-2">
              {cls.level && (
                <span className="px-2.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg">
                  📚 {cls.level}
                </span>
              )}
              {cls.language && cls.language.map((lang, idx) => (
                <span key={idx} className="px-2.5 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {lang}
                </span>
              ))}
              {cls.kids_friendly && (
                <span className="px-2.5 py-1.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-medium rounded-lg flex items-center gap-1">
                  <Baby className="w-3 h-3" />
                  Kids Friendly
                </span>
              )}
              {cls.disability_friendly && (
                <span className="px-2.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-lg flex items-center gap-1">
                  <Accessibility className="w-3 h-3" />
                  Accessible
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {cls.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cls.description}</p>
            </div>
          )}

          {/* Revenue Estimate */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-foreground mb-2">Revenue Estimate</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current bookings:</span>
              <span className="font-semibold text-foreground">{bookingCount}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Potential revenue:</span>
              <span className="font-semibold text-primary">{formatVND(bookingCount * cls.price)} VND</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-card">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => { onClose(); onEdit(); }}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Edit Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerClassPreviewModal;
