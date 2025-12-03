import React, { useState, useEffect } from 'react';
import { X, Eye, TrendingUp, TrendingDown, Users, Loader2, Calendar, BarChart3 } from 'lucide-react';
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
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, classId, period]);

  const fetchStats = async () => {
    setLoading(true);
    setSelectedDay(null);
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

  const formatWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{className}</p>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Period Tabs */}
        <div className="px-5 py-3 border-b border-border/30">
          <div className="flex bg-muted/50 rounded-xl p-1">
            {(['7', '14', '30'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p} days
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : totalViews === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium text-foreground">No views yet</p>
              <p className="text-sm text-muted-foreground mt-1">Views will appear when students visit your class</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 text-center">
                  <Eye className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{totalViews}</div>
                  <div className="text-xs text-muted-foreground">Total Views</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 text-center">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{uniqueViewers}</div>
                  <div className="text-xs text-muted-foreground">Unique</div>
                </div>
                
                <div className={`rounded-2xl p-4 text-center ${
                  trend.direction === 'up' 
                    ? 'bg-gradient-to-br from-green-500/10 to-green-500/5' 
                    : trend.direction === 'down' 
                    ? 'bg-gradient-to-br from-red-500/10 to-red-500/5' 
                    : 'bg-gradient-to-br from-muted/50 to-muted/30'
                }`}>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  ) : trend.direction === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  )}
                  <div className={`text-2xl font-bold ${
                    trend.direction === 'up' ? 'text-green-500' : 
                    trend.direction === 'down' ? 'text-red-500' : 'text-foreground'
                  }`}>
                    {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}{trend.percent}%
                  </div>
                  <div className="text-xs text-muted-foreground">Trend</div>
                </div>
              </div>

              {/* Interactive Chart */}
              <div className="bg-muted/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Daily Views</span>
                  {selectedDay && (
                    <span className="text-xs text-primary font-medium">
                      {formatDate(selectedDay.date)}: {selectedDay.views} views
                    </span>
                  )}
                </div>
                
                {/* Chart Area */}
                <div className="h-32 flex items-end gap-1">
                  {stats.map((day, idx) => {
                    const height = Math.max((day.views / maxViews) * 100, 4);
                    const isSelected = selectedDay?.date === day.date;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
                      >
                        <div 
                          className={`w-full rounded-t-md transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary shadow-lg shadow-primary/30' 
                              : isToday(day.date)
                              ? 'bg-primary/80 group-hover:bg-primary'
                              : 'bg-primary/40 group-hover:bg-primary/70'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </button>
                    );
                  })}
                </div>
                
                {/* X-axis Labels */}
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[10px] text-muted-foreground">{formatDate(stats[0]?.date || '')}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(stats[stats.length - 1]?.date || '')}</span>
                </div>
              </div>

              {/* Selected Day Details */}
              {selectedDay && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{formatDate(selectedDay.date)}</div>
                      <div className="text-xs text-muted-foreground">{formatWeekday(selectedDay.date)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-xl p-3">
                      <div className="text-lg font-bold text-foreground">{selectedDay.views}</div>
                      <div className="text-xs text-muted-foreground">Page Views</div>
                    </div>
                    <div className="bg-card rounded-xl p-3">
                      <div className="text-lg font-bold text-foreground">{selectedDay.uniqueViewers}</div>
                      <div className="text-xs text-muted-foreground">Unique Visitors</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Recent Activity</span>
                </div>
                <div className="space-y-2">
                  {[...stats].reverse().slice(0, 5).map((day, idx) => {
                    const isSelected = selectedDay?.date === day.date;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            day.views > 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`} />
                          <div className="text-left">
                            <div className="text-sm font-medium text-foreground">{formatDate(day.date)}</div>
                            <div className="text-xs text-muted-foreground">{formatWeekday(day.date)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{day.views}</div>
                          <div className="text-xs text-muted-foreground">{day.uniqueViewers} unique</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-border/30">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassStatisticsModal;
