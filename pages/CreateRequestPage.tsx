import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Trees, type LucideIcon } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { CATEGORIES } from '../constants';
import { HCMC_DISTRICTS } from '../constants';
import { RequestLevel } from '../types';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenStickyBar } from '../src/components/layout/screen';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../src/components/ui/field';
import { Input } from '../src/components/ui/input';
import { Textarea } from '../src/components/ui/textarea';
import { NativeSelect } from '../src/components/ui/native-select';
import { Button } from '../src/components/ui/button';
import ParticleButton from '../src/components/kokonutui/particle-button';
import { formatVND } from '../src/lib/format';
import { cn } from '../src/lib/utils';

const LEVELS: RequestLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate'];

export type RequestLocationType = 'home' | 'gym' | 'outdoor';

export interface RequestFormValues {
  category: string;
  district: string;
  description: string;
  desired_price: string;
  level: RequestLevel;
  preferred_time: string;
  location_type: RequestLocationType | '';
}

const LOCATION_OPTIONS: ReadonlyArray<{ value: RequestLocationType; label: string; icon: LucideIcon }> = [
  { value: 'home', label: 'At Home', icon: Home },
  { value: 'gym', label: 'At Gym', icon: Dumbbell },
  { value: 'outdoor', label: 'Outdoor', icon: Trees },
];

const Required = () => (
  <span className="text-destructive" aria-hidden="true">
    *
  </span>
);

interface RequestFormFieldsProps {
  values: RequestFormValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLocationTypeChange: (value: RequestLocationType) => void;
}

/** Shared fields of the training-request form (create + edit). */
export function RequestFormFields({ values, onChange, onLocationTypeChange }: RequestFormFieldsProps) {
  const price = parseFloat(values.desired_price);
  const priceHint = values.desired_price && !isNaN(price) ? `${formatVND(price)} per hour` : 'Per hour, in VND';

  return (
    <>
      <ScreenSection title="What you need" variant="panel">
        <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
          <Field>
            <FieldLabel htmlFor="category">
              Category <Required />
            </FieldLabel>
            <NativeSelect id="category" name="category" value={values.category} onChange={onChange} required aria-required>
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="level">
              Your level <Required />
            </FieldLabel>
            <NativeSelect id="level" name="level" value={values.level} onChange={onChange} required aria-required>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel id="location_type-label">
              Preferred location <Required />
            </FieldLabel>
            <div role="radiogroup" aria-labelledby="location_type-label" className="grid grid-cols-3 gap-2 md:gap-3">
              {LOCATION_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isSelected = values.location_type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onLocationTypeChange(value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/5'
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </FieldGroup>
      </ScreenSection>

      <ScreenSection title="When and where" variant="panel">
        <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
          <Field>
            <FieldLabel htmlFor="district">
              District <Required />
            </FieldLabel>
            <NativeSelect id="district" name="district" value={values.district} onChange={onChange} required aria-required>
              <option value="">Select a district</option>
              {HCMC_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="preferred_time">
              Preferred time <Required />
            </FieldLabel>
            <Input
              id="preferred_time"
              type="text"
              name="preferred_time"
              value={values.preferred_time}
              onChange={onChange}
              required
              aria-describedby="preferred_time-hint"
              placeholder="e.g., Morning 7-9 AM, Evening 6-8 PM, Flexible"
            />
            <FieldDescription id="preferred_time-hint">Any format, e.g. weekday evenings</FieldDescription>
          </Field>
        </FieldGroup>
      </ScreenSection>

      <ScreenSection title="Budget and details" variant="panel">
        <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
          <Field>
            <FieldLabel htmlFor="desired_price">
              Desired price <Required />
            </FieldLabel>
            <Input
              id="desired_price"
              type="number"
              inputMode="numeric"
              name="desired_price"
              value={values.desired_price}
              onChange={onChange}
              required
              min="0"
              step="1000"
              aria-describedby="desired_price-hint"
              placeholder="e.g., 200000"
            />
            <FieldDescription id="desired_price-hint">{priceHint}</FieldDescription>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="description">
              Description <Required />
            </FieldLabel>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={onChange}
              required
              rows={6}
              aria-describedby="description-hint"
              placeholder="Describe what kind of training you're looking for, your goals, preferred schedule, etc."
              className="resize-none"
            />
            <FieldDescription id="description-hint">{`${values.description.length} characters`}</FieldDescription>
          </Field>
        </FieldGroup>
      </ScreenSection>
    </>
  );
}

const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    district: '',
    description: '',
    desired_price: '',
    level: 'Beginner' as RequestLevel,
    preferred_time: '',
    location_type: '' as 'home' | 'gym' | 'outdoor' | '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a request',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!formData.category || !formData.district || !formData.description || !formData.desired_price || !formData.preferred_time || !formData.location_type) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(formData.desired_price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('requests')
        .insert({
          student_id: user.id,
          category: formData.category,
          district: formData.district,
          description: formData.description.trim(),
          desired_price: price,
          level: formData.level,
          preferred_time: formData.preferred_time,
          location_type: formData.location_type,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your training request has been created successfully!',
      });

      navigate('/requests');
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader
        title="Create Training Request"
        description="Tell trainers what you're looking for and they'll send you offers."
        onBack={() => navigate(-1)}
        width="form"
        breadcrumbs={[{ label: 'Requests', href: '/requests' }, { label: 'Create' }]}
      />
      <ScreenBody width="form">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8">
          <RequestFormFields
            values={formData}
            onChange={handleChange}
            onLocationTypeChange={(value) => setFormData(prev => ({ ...prev, location_type: value }))}
          />

          <ScreenStickyBar width="form">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} disabled={loading}>
              Cancel
            </Button>
            <ParticleButton
              type="submit"
              size="lg"
              disabled={loading}
              status={loading ? 'pending' : 'idle'}
              pendingLabel="Creating..."
            >
              Create Request
            </ParticleButton>
          </ScreenStickyBar>
        </form>
      </ScreenBody>
    </AppScreen>
  );
};

export default CreateRequestPage;
