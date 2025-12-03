import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Trash2, Users, Clock, TrendingUp, Eye, MoreVertical, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import TrainerClassPreviewModal from './TrainerClassPreviewModal';

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

interface ViewStats {
  totalViews: number;
  weeklyViews: number;
  lastWeekViews: number;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0
  }).format(amount);
};

const TrainerClassCard: React.FC<TrainerClassCardProps> = ({ cls, bookingCount = 0, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchViewStats();
  }, [cls.id]);

  const fetchViewStats = async () => {
    try {
      setLoadingStats(true);
      
      // Get total views
      const { data: totalData } = await supabase
        .from('class_views')
        .select('view_count')
        .eq('class_id', cls.id);

      const totalViews = totalData?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0;

      // Get this week's views (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('class_views')
        .select('view_count')
        .eq('class_id', cls.id)
        .gte('view_date', weekAgoStr);

      const weeklyViews = weekData?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0;

      // Get last week's views (7-14 days ago) for trend calculation
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      const { data: lastWeekData } = await supabase
        .from('class_views')
        .select('view_count')
        .eq('class_id', cls.id)
        .gte('view_date', twoWeeksAgoStr)
        .lt('view_date', weekAgoStr);

      const lastWeekViews = lastWeekData?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0;

      // Calculate trend
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      let trendPercent = 0;

      if (lastWeekViews > 0) {
        const change = ((weeklyViews - lastWeekViews) / lastWeekViews) * 100;
        trendPercent = Math.abs(Math.round(change));
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      } else if (weeklyViews > 0) {
        trend = 'up';
        trendPercent = 100;
      }

      setViewStats({
        totalViews,
        weeklyViews,
        lastWeekViews,
        trend,
        trendPercent
      });
    } catch (error) {
      // Silently handle error, show zeros
      setViewStats({
        totalViews: 0,
        weeklyViews: 0,
        lastWeekViews: 0,
        trend: 'neutral',
        trendPercent: 0
      });
    } finally {
      setLoadingStats(false);
    }
  };

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
                onClick={() => { setShowPreview(true); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Class
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
            {loadingStats ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : viewStats && viewStats.trendPercent > 0 ? (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                viewStats.trend === 'up' ? 'text-green-600' : viewStats.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                <TrendingUp className={`w-3 h-3 ${viewStats.trend === 'down' ? 'rotate-180' : ''}`} />
                {viewStats.trendPercent}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex justify-between text-xs">
            {loadingStats ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold text-foreground">{viewStats?.totalViews || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">This week: </span>
                  <span className="font-semibold text-foreground">{viewStats?.weeklyViews || 0}</span>
                </div>
              </>
            )}
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

      {/* Preview Modal */}
      <TrainerClassPreviewModal
        cls={cls}
        bookingCount={bookingCount}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={onEdit}
      />
    </div>
  );
};

export default TrainerClassCard;
