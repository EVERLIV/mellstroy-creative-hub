import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, MapPin, Home, Building2, Trees, Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest } from '../types';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit, ScreenStickyBar } from '../src/components/layout/screen';
import { PageLoader } from '../src/components/layout/states';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../src/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';
import ParticleButton from '../src/components/kokonutui/particle-button';
import { Input } from '../src/components/ui/input';
import { Textarea } from '../src/components/ui/textarea';
import { Badge } from '../src/components/ui/badge';
import { Button } from '../src/components/ui/button';
import { formatVND } from '../src/lib/format';

const LOCATION_META = {
  home: { label: 'At Home', icon: Home },
  gym: { label: 'At Gym', icon: Building2 },
  outdoor: { label: 'Outdoor', icon: Trees },
} as const;

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm first:pt-0 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

const RespondToRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<TrainingRequest | null>(
    location.state?.request || null
  );
  const [requestId, setRequestId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    message: '',
    proposed_price: '',
  });

  useEffect(() => {
    // Extract request ID from URL if not in state
    const pathParts = location.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    if (id && id !== 'respond') {
      setRequestId(id);
      loadRequest(id);
    }
  }, [location.pathname]);

  const loadRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)`)
        .eq('id', id)
        .single();

      if (error) throw error;

      setRequest({
        id: data.id,
        student_id: data.student_id,
        student_name: data.student?.username,
        student_avatar: data.student?.avatar_url,
        category: data.category,
        district: data.district,
        description: data.description,
        desired_price: parseFloat(data.desired_price),
        level: data.level,
        preferred_time: data.preferred_time,
        location_type: data.location_type,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      // Set default proposed price to desired price
      setFormData(prev => ({
        ...prev,
        proposed_price: data.desired_price.toString()
      }));
    } catch (error) {
      console.error('Error loading request:', error);
      toast({
        title: 'Error',
        description: 'Failed to load request',
        variant: 'destructive',
      });
      navigate('/requests');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !request) {
      toast({
        title: 'Error',
        description: 'You must be logged in to respond',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!formData.message.trim() || !formData.proposed_price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(formData.proposed_price);
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

      // Check if trainer already responded
      const { data: existingResponse } = await supabase
        .from('trainer_responses')
        .select('id')
        .eq('request_id', request.id)
        .eq('trainer_id', user.id)
        .single();

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('trainer_responses')
          .update({
            message: formData.message.trim(),
            proposed_price: price,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Your response has been updated!',
        });
      } else {
        // Create new response
        const { error } = await supabase
          .from('trainer_responses')
          .insert({
            request_id: request.id,
            trainer_id: user.id,
            message: formData.message.trim(),
            proposed_price: price,
            status: 'pending'
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Your response has been sent!',
        });
      }

      navigate('/requests');
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request) {
    return (
      <AppScreen>
        <PageLoader title="Loading request..." />
      </AppScreen>
    );
  }

  const proposedPrice = parseFloat(formData.proposed_price);
  const location_ = request.location_type ? LOCATION_META[request.location_type as keyof typeof LOCATION_META] : undefined;

  const requestDetails = (className?: string) => (
    <Card className={className}>
      <CardHeader className="gap-3 pb-3">
        <CardTitle className="text-base">Request details</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full border-transparent bg-primary/10 font-medium text-primary hover:bg-primary/15">
            {request.category}
          </Badge>
          <Badge variant="outline">{request.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{request.description}</p>
        <dl className="flex flex-col">
          <DetailItem label="District">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              {request.district}
            </span>
          </DetailItem>
          {request.preferred_time && (
            <DetailItem label="Preferred time">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" aria-hidden="true" />
                {request.preferred_time}
              </span>
            </DetailItem>
          )}
          {location_ && (
            <DetailItem label="Location">
              <span className="inline-flex items-center gap-1.5">
                <location_.icon className="size-3.5 text-primary" aria-hidden="true" />
                {location_.label}
              </span>
            </DetailItem>
          )}
          <DetailItem label="Desired price">{formatVND(request.desired_price)}/hour</DetailItem>
        </dl>
      </CardContent>
    </Card>
  );

  const main = (
    <>
      {requestDetails('lg:hidden')}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <ScreenSection title="Your offer" description="Send the student your offer and a short introduction." variant="panel">
          <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
            <Field>
              <FieldLabel htmlFor="proposed_price">
                Proposed price <span className="text-destructive" aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="proposed_price"
                type="number"
                inputMode="numeric"
                name="proposed_price"
                value={formData.proposed_price}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                aria-describedby="proposed_price-hint"
              />
              <FieldDescription id="proposed_price-hint">
                {formData.proposed_price && !isNaN(proposedPrice)
                  ? `${formatVND(proposedPrice)} per hour`
                  : 'Per hour, in VND'}
              </FieldDescription>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="message">
                Your message <span className="text-destructive" aria-hidden="true">*</span>
              </FieldLabel>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                aria-describedby="message-hint"
                placeholder="Introduce yourself, explain your experience, and why you're a good fit for this request..."
                className="resize-none"
              />
              <FieldDescription id="message-hint">{`${formData.message.length} characters`}</FieldDescription>
            </Field>
          </FieldGroup>
        </ScreenSection>

        <ScreenStickyBar width="detail" className="md:px-0">
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} disabled={loading}>
            Cancel
          </Button>
          <ParticleButton
            type="submit"
            size="lg"
            disabled={loading}
            status={loading ? 'pending' : 'idle'}
            pendingLabel="Sending..."
            icon={<Send />}
          >
            Send Response
          </ParticleButton>
        </ScreenStickyBar>
      </form>
    </>
  );

  return (
    <AppScreen>
      <ScreenHeader
        title="Respond to Request"
        description="Send the student your offer and a short introduction."
        onBack={() => navigate(-1)}
        width="detail"
      />
      <ScreenBody width="detail">
        <ScreenSplit main={main} aside={requestDetails('hidden lg:block lg:sticky lg:top-24')} />
      </ScreenBody>
    </AppScreen>
  );
};

export default RespondToRequestPage;
