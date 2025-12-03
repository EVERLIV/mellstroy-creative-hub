import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Trash2, Users, Clock, TrendingUp, Eye, MoreVertical, Calendar, DollarSign } from 'lucide-react';

interface TrainerClassCardProps {
  cls: {
    id: string;
    name: string;
    description?: string;
    class_type: string;
    price: number;
    duration_minutes: number;
    capacity: number;
    image_url?: string;
    schedule_days?: string[];
    schedule_time?: string;
    created_at?: string;
  };
  bookingCount?: number;
  onEdit: () => void;
  onDelete: () => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0
  }).format(amount);
};

// Mock view statistics - in production this would come from analytics table
const getMockViewStats = (classId: string) => {
  const seed = classId.charCodeAt(0) + classId.charCodeAt(5);
  return {
    totalViews: Math.floor(seed * 12 + 50),
    weeklyViews: Math.floor(seed * 2 + 10),
    trend: seed % 2 === 0 ? 'up' : 'down',
    trendPercent: Math.floor(seed % 30) + 5
  };
};

const TrainerClassCard: React.FC<TrainerClassCardProps> = ({ cls, bookingCount = 0, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const viewStats = getMockViewStats(cls.id);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      onDelete();
    }
    setShowMenu(false);
  };

  const formatSchedule = () => {
    if (!cls.schedule_days || cls.schedule_days.length === 0) return 'No schedule set';
    const days = cls.schedule_days.map(d => d.slice(0, 3)).join(', ');
    return `${days}${cls.schedule_time ? ` at ${cls.schedule_time}` : ''}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header with image and actions */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {cls.image_url ? (
            <img src={cls.image_url} alt={cls.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary/40" />
            </div>
          )}
        </div>
        
        {/* Action menu */}
        <div className="absolute top-2 right-2" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-card/90 backdrop-blur-sm rounded-lg hover:bg-card transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-foreground" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 bg-popover rounded-lg shadow-lg border border-border py-1 z-20 min-w-[140px]">
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Class
              </button>
              <button
                onClick={() => navigate(`/class/${cls.id}`)}
                className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Class type badge */}
        <div className="absolute bottom-2 left-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm text-foreground">
            {cls.class_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-foreground text-base truncate flex-1 mr-2">{cls.name}</h3>
          <span className="text-primary font-bold text-sm whitespace-nowrap">{formatVND(cls.price)} VND</span>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-foreground">{cls.duration_minutes} min</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-foreground">{bookingCount}/{cls.capacity}</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-foreground">{bookingCount * cls.price > 0 ? formatVND(bookingCount * cls.price).slice(0, -3) + 'k' : '0'}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="text-xs text-muted-foreground mb-4">
          <Calendar className="w-3 h-3 inline mr-1" />
          {formatSchedule()}
        </div>

        {/* View statistics */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-primary" />
              View Statistics
            </span>
            <span className={`text-xs font-semibold flex items-center gap-0.5 ${
              viewStats.trend === 'up' ? 'text-green-600' : 'text-red-500'
            }`}>
              <TrendingUp className={`w-3 h-3 ${viewStats.trend === 'down' ? 'rotate-180' : ''}`} />
              {viewStats.trendPercent}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-foreground">{viewStats.totalViews}</span>
            </div>
            <div>
              <span className="text-muted-foreground">This week: </span>
              <span className="font-semibold text-foreground">{viewStats.weeklyViews}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onEdit}
            className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex-1 bg-secondary text-secondary-foreground text-xs font-semibold py-2.5 rounded-lg hover:bg-secondary/80 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerClassCard;
