import React, { useState, useEffect } from 'react';
import { X, Eye, TrendingUp, TrendingDown, Calendar, Users, Loader2 } from 'lucide-react';
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

      // Fetch view data
      const { data } = await supabase
        .from('class_views')
        .select('view_date, view_count, viewer_id')
        .eq('class_id', classId)
        .gte('view_date', startDateStr)
        .order('view_date', { ascending: true });

      // Generate all dates in range
      const allDates: DayStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        allDates.push({ date: dateStr, views: 0, uniqueViewers: 0 });
      }

      // Fill in actual data
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

        // Calculate totals
        const total = allDates.reduce((sum, d) => sum + d.views, 0);
        const unique = new Set(data.filter(d => d.viewer_id).map(d => d.viewer_id)).size;
        setTotalViews(total);
        setUniqueViewers(unique);

        // Calculate trend (compare first half to second half)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">View Statistics</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[250px]">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 p-4 border-b border-border">
          {(['7', '14', '30'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                period === p 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p} days
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold text-foreground">{totalViews}</div>
                  <div className="text-xs text-muted-foreground">Total Views</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-foreground">{uniqueViewers}</div>
                  <div className="text-xs text-muted-foreground">Unique</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${
                  trend.direction === 'up' ? 'bg-green-500/10' : 
                  trend.direction === 'down' ? 'bg-red-500/10' : 'bg-muted'
                }`}>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  ) : trend.direction === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  )}
                  <div className={`text-xl font-bold ${
                    trend.direction === 'up' ? 'text-green-600' : 
                    trend.direction === 'down' ? 'text-red-500' : 'text-foreground'
                  }`}>
                    {trend.percent}%
                  </div>
                  <div className="text-xs text-muted-foreground">Trend</div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Daily Views
                </h3>
                
                {/* Bar Chart */}
                <div className="h-40 flex items-end gap-1">
                  {stats.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary min-h-[2px]"
                        style={{ height: `${Math.max((day.views / maxViews) * 100, 2)}%` }}
                        title={`${formatDate(day.date)}: ${day.views} views`}
                      />
                    </div>
                  ))}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(stats[0]?.date || '')}</span>
                  <span>{formatDate(stats[Math.floor(stats.length / 2)]?.date || '')}</span>
                  <span>{formatDate(stats[stats.length - 1]?.date || '')}</span>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...stats].reverse().slice(0, 7).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{formatDate(day.date)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground font-medium">{day.views} views</span>
                        <span className="text-xs text-muted-foreground">{day.uniqueViewers} unique</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalViews === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No views recorded yet</p>
                  <p className="text-xs mt-1">Views will appear here when students visit your class</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassStatisticsModal;
