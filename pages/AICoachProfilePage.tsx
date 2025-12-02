import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useToast } from '../src/hooks/use-toast';
import { Button } from '../src/components/ui/button';

interface AICoachProfile {
  fitness_level: string;
  goals: string[];
  equipment_access: string;
  training_days_per_week: number;
  dietary_restrictions: string[];
  health_limitations: string;
  preferred_training_time: string;
}

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GOALS = [
  'build_muscle',
  'lose_weight',
  'improve_endurance',
  'increase_flexibility',
  'general_fitness',
  'sports_performance'
];
const EQUIPMENT_OPTIONS = ['home', 'gym', 'both'];
const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'lactose_intolerant',
  'gluten_free',
  'halal',
  'none'
];
const TRAINING_TIMES = ['morning', 'afternoon', 'evening', 'flexible'];

export default function AICoachProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AICoachProfile>({
    fitness_level: '',
    goals: [],
    equipment_access: '',
    training_days_per_week: 3,
    dietary_restrictions: [],
    health_limitations: '',
    preferred_training_time: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          fitness_level: data.fitness_level || '',
          goals: data.goals || [],
          equipment_access: data.equipment_access || '',
          training_days_per_week: data.training_days_per_week || 3,
          dietary_restrictions: data.dietary_restrictions || [],
          health_limitations: data.health_limitations || '',
          preferred_training_time: data.preferred_training_time || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ai_coach_profiles')
        .upsert({
          user_id: user.id,
          ...profile
        });

      if (error) throw error;

      toast({
        title: 'Profile saved',
        description: 'Your AI Coach profile has been updated successfully'
      });

      navigate(-1);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayValue = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter(v => v !== value);
    }
    return [...array, value];
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between p-4 sm:p-5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Coach Settings</h1>
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Fitness Level */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              💪 Fitness Level
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {FITNESS_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, fitness_level: level })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 capitalize font-medium text-sm sm:text-base ${
                    profile.fitness_level === level
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-card/50 backdrop-blur-sm border-border text-foreground hover:border-primary/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              🎯 Goals <span className="text-xs text-muted-foreground font-normal">(select multiple)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => setProfile({
                    ...profile,
                    goals: toggleArrayValue(profile.goals, goal)
                  })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-xs sm:text-sm font-medium ${
                    profile.goals.includes(goal)
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-card/50 backdrop-blur-sm border-border text-foreground hover:border-primary/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {goal.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Access */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              🏋️ Equipment Access
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {EQUIPMENT_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setProfile({ ...profile, equipment_access: option })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 capitalize font-medium text-sm sm:text-base ${
                    profile.equipment_access === option
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-card/50 backdrop-blur-sm border-border text-foreground hover:border-primary/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Training Days */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                📅 Training Days Per Week
              </label>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profile.training_days_per_week}
              </span>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <input
                type="range"
                min="1"
                max="7"
                value={profile.training_days_per_week}
                onChange={(e) => setProfile({
                  ...profile,
                  training_days_per_week: parseInt(e.target.value)
                })}
                className="w-full h-2 accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              🥗 Dietary Restrictions
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {DIETARY_RESTRICTIONS.map(restriction => (
                <button
                  key={restriction}
                  onClick={() => setProfile({
                    ...profile,
                    dietary_restrictions: toggleArrayValue(profile.dietary_restrictions, restriction)
                  })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-xs sm:text-sm font-medium ${
                    profile.dietary_restrictions.includes(restriction)
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-card/50 backdrop-blur-sm border-border text-foreground hover:border-primary/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {restriction.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Training Time */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              ⏰ Preferred Training Time
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {TRAINING_TIMES.map(time => (
                <button
                  key={time}
                  onClick={() => setProfile({ ...profile, preferred_training_time: time })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 capitalize font-medium text-sm sm:text-base ${
                    profile.preferred_training_time === time
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-card/50 backdrop-blur-sm border-border text-foreground hover:border-primary/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Health Limitations */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              🏥 Health Limitations or Injuries
            </label>
            <textarea
              value={profile.health_limitations}
              onChange={(e) => setProfile({ ...profile, health_limitations: e.target.value })}
              placeholder="Any injuries, health conditions, or limitations..."
              className="w-full p-4 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 min-h-[120px] text-sm sm:text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
