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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">AI Coach Profile</h1>
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="p-4 space-y-6">
          {/* Fitness Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fitness Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FITNESS_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, fitness_level: level })}
                  className={`p-3 rounded-lg border transition-all capitalize ${
                    profile.fitness_level === level
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Goals (select multiple)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => setProfile({
                    ...profile,
                    goals: toggleArrayValue(profile.goals, goal)
                  })}
                  className={`p-3 rounded-lg border transition-all text-sm ${
                    profile.goals.includes(goal)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {goal.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Access */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Equipment Access
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EQUIPMENT_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setProfile({ ...profile, equipment_access: option })}
                  className={`p-3 rounded-lg border transition-all capitalize ${
                    profile.equipment_access === option
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Training Days */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Training Days Per Week: {profile.training_days_per_week}
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={profile.training_days_per_week}
              onChange={(e) => setProfile({
                ...profile,
                training_days_per_week: parseInt(e.target.value)
              })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dietary Restrictions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_RESTRICTIONS.map(restriction => (
                <button
                  key={restriction}
                  onClick={() => setProfile({
                    ...profile,
                    dietary_restrictions: toggleArrayValue(profile.dietary_restrictions, restriction)
                  })}
                  className={`p-3 rounded-lg border transition-all text-sm ${
                    profile.dietary_restrictions.includes(restriction)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {restriction.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Training Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Preferred Training Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRAINING_TIMES.map(time => (
                <button
                  key={time}
                  onClick={() => setProfile({ ...profile, preferred_training_time: time })}
                  className={`p-3 rounded-lg border transition-all capitalize ${
                    profile.preferred_training_time === time
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Health Limitations */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Health Limitations or Injuries
            </label>
            <textarea
              value={profile.health_limitations}
              onChange={(e) => setProfile({ ...profile, health_limitations: e.target.value })}
              placeholder="Any injuries, health conditions, or limitations..."
              className="w-full p-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
