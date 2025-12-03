import React, { useState, useEffect } from 'react';
import { X, Eye, TrendingUp, TrendingDown, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

interface DayStats {
  date: string;
  views: number;
  uniqueViewers: number;
}

interface ClassStatisticsModalProps {
  classId: string;
  className: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClassStatisticsModal: React.FC<ClassStatisticsModalProps> = ({
  classId,
  className,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '14' | '30'>('7');
  const [stats, setStats] = useState<DayStats[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueViewers, setUniqueViewers] = useState(0);
  const [trend, setTrend] = useState({ percent: 0, direction: 'neutral' as 'up' | 'down' | 'neutral' });
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, classId, period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data } = await supabase
        .from('class_views')
        .select('view_date, view_count, viewer_id')
        .eq('class_id', classId)
        .gte('view_date', startDateStr)
        .order('view_date', { ascending: true });

      const allDates: DayStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        allDates.push({ date: dateStr, views: 0, uniqueViewers: 0 });
      }

      if (data) {
        const dateMap = new Map<string, { views: number; viewers: Set<string> }>();
        
        data.forEach(row => {
          const existing = dateMap.get(row.view_date) || { views: 0, viewers: new Set() };
          existing.views += row.view_count || 0;
          if (row.viewer_id) existing.viewers.add(row.viewer_id);
          dateMap.set(row.view_date, existing);
        });

        allDates.forEach(day => {
          const dayData = dateMap.get(day.date);
          if (dayData) {
            day.views = dayData.views;
            day.uniqueViewers = dayData.viewers.size;
          }
        });

        const total = allDates.reduce((sum, d) => sum + d.views, 0);
        const unique = new Set(data.filter(d => d.viewer_id).map(d => d.viewer_id)).size;
        setTotalViews(total);
        setUniqueViewers(unique);

        const halfPoint = Math.floor(allDates.length / 2);
        const firstHalf = allDates.slice(0, halfPoint).reduce((sum, d) => sum + d.views, 0);
        const secondHalf = allDates.slice(halfPoint).reduce((sum, d) => sum + d.views, 0);
        
        if (firstHalf > 0) {
          const change = ((secondHalf - firstHalf) / firstHalf) * 100;
          setTrend({
            percent: Math.abs(Math.round(change)),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
          });
        } else if (secondHalf > 0) {
          setTrend({ percent: 100, direction: 'up' });
        } else {
          setTrend({ percent: 0, direction: 'neutral' });
        }
      }

      setStats(allDates);
    } catch (error) {
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxViews = Math.max(...stats.map(s => s.views), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div 
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85dvh] overflow-hidden flex flex-col animate-slide-in-right sm:animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">Statistics</h2>
            <p className="text-xs text-muted-foreground truncate">{className}</p>
          </div>
          
          {/* Inline Period Selector */}
          <div className="flex items-center gap-1 mr-2">
            {(['7', '14', '30'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === p 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : totalViews === 0 ? (
            <div className="text-center py-6">
              <Eye className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No views yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Views appear when students visit</p>
            </div>
          ) : (
            <>
              {/* Compact Stats Row */}
              <div className="flex gap-2">
                <div className="flex-1 bg-primary/10 rounded-xl p-2.5 flex items-center gap-2">
                  <div className="p-1.5 bg-primary/20 rounded-lg">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground leading-none">{totalViews}</div>
                    <div className="text-[10px] text-muted-foreground">Views</div>
                  </div>
                </div>
                
                <div className="flex-1 bg-secondary rounded-xl p-2.5 flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <Users className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground leading-none">{uniqueViewers}</div>
                    <div className="text-[10px] text-muted-foreground">Unique</div>
                  </div>
                </div>
                
                <div className={`flex-1 rounded-xl p-2.5 flex items-center gap-2 ${
                  trend.direction === 'up' ? 'bg-green-500/10' : 
                  trend.direction === 'down' ? 'bg-red-500/10' : 'bg-muted'
                }`}>
                  <div className={`p-1.5 rounded-lg ${
                    trend.direction === 'up' ? 'bg-green-500/20' : 
                    trend.direction === 'down' ? 'bg-red-500/20' : 'bg-muted'
                  }`}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : trend.direction === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className={`text-lg font-bold leading-none ${
                      trend.direction === 'up' ? 'text-green-600' : 
                      trend.direction === 'down' ? 'text-red-500' : 'text-foreground'
                    }`}>
                      {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}{trend.percent}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Trend</div>
                  </div>
                </div>
              </div>

              {/* Compact Chart */}
              <div className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">Daily Views</span>
                  <span className="text-[10px] text-muted-foreground">Last {period} days</span>
                </div>
                
                {/* Mini Bar Chart */}
                <div className="h-24 flex items-end gap-px">
                  {stats.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      <div 
                        className="w-full bg-primary/70 rounded-t-sm transition-all group-hover:bg-primary"
                        style={{ height: `${Math.max((day.views / maxViews) * 100, 3)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        {day.views}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* X-axis */}
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{formatShortDate(stats[0]?.date || '')}</span>
                  <span>{formatShortDate(stats[stats.length - 1]?.date || '')}</span>
                </div>
              </div>

              {/* Collapsible Breakdown */}
              <button 
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 rounded-xl text-xs font-medium text-foreground"
              >
                <span>Daily Breakdown</span>
                {showBreakdown ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {showBreakdown && (
                <div className="bg-muted/20 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto">
                  {[...stats].reverse().slice(0, 7).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/30">
                      <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{day.views}</span>
                        <span className="text-[10px] text-muted-foreground">({day.uniqueViewers} unique)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Compact Footer */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassStatisticsModal;
