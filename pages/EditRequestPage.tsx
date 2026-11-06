import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { RequestLevel, TrainingRequest } from '../types';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenHeader, ScreenBody, ScreenStickyBar } from '../src/components/layout/screen';
import { PageLoader } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import ParticleButton from '../src/components/kokonutui/particle-button';
import { RequestFormFields } from './CreateRequestPage';

const EditRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<TrainingRequest | null>(location.state?.request || null);
  
  const [formData, setFormData] = useState({
    category: '',
    district: '',
    description: '',
    desired_price: '',
    level: 'Beginner' as RequestLevel,
    preferred_time: '',
    location_type: '' as 'home' | 'gym' | 'outdoor' | '',
  });

  useEffect(() => {
    if (request) {
      setFormData({
        category: request.category,
        district: request.district,
        description: request.description,
        desired_price: request.desired_price.toString(),
        level: request.level,
        preferred_time: request.preferred_time || '',
        location_type: request.location_type || '',
      });
    } else {
      // If no request in state, try to load from URL
      const pathParts = location.pathname.split('/');
      const requestId = pathParts[pathParts.length - 2];
      if (requestId && requestId !== 'edit') {
        loadRequest(requestId);
      } else {
        navigate('/bookings');
      }
    }
  }, [location.pathname]);

  const loadRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setRequest({
        id: data.id,
        student_id: data.student_id,
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

      setFormData({
        category: data.category,
        district: data.district,
        description: data.description,
        desired_price: data.desired_price.toString(),
        level: data.level,
        preferred_time: data.preferred_time || '',
        location_type: data.location_type || '',
      });
    } catch (error) {
      console.error('Error loading request:', error);
      toast({
        title: 'Error',
        description: 'Failed to load request',
        variant: 'destructive',
      });
      navigate('/bookings');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        description: 'You must be logged in to edit a request',
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

      const { error } = await supabase
        .from('requests')
        .update({
          category: formData.category,
          district: formData.district,
          description: formData.description.trim(),
          desired_price: price,
          level: formData.level,
          preferred_time: formData.preferred_time,
          location_type: formData.location_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)
        .eq('student_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your training request has been updated successfully!',
      });

      navigate('/bookings', { state: { activeTab: 'requests' } });
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update request. Please try again.',
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

  return (
    <AppScreen>
      <ScreenHeader
        title="Edit Request"
        description="Update your request. Trainers will see the changes right away."
        onBack={() => navigate(-1)}
        width="form"
        breadcrumbs={[{ label: 'Bookings', href: '/bookings' }, { label: 'Edit request' }]}
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
              pendingLabel="Updating..."
              icon={<Send />}
            >
              Update Request
            </ParticleButton>
          </ScreenStickyBar>
        </form>
      </ScreenBody>
    </AppScreen>
  );
};

export default EditRequestPage;

