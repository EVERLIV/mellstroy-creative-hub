import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader, Clock, MapPin, Home, Building2, Trees } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest } from '../types';
import { useToast } from '../src/hooks/use-toast';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

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
          student:profiles!requests_student_id_fkey(username, avatar_url)
        `)
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
      <div className="bg-white h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 text-gray-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 flex-shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Respond to Request</h1>
        <div className="w-9"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gray-50 pb-safe-nav">
          {/* Request Details */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="mb-2">
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {request.category}
              </span>
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-2">Request Details</h2>
            <p className="text-xs text-gray-600 mb-3">{request.description}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span className="text-gray-600 font-semibold">District:</span>
                <span className="text-gray-900">{request.district}</span>
              </div>
              {request.preferred_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="text-gray-600 font-semibold">Preferred Time:</span>
                  <span className="text-gray-900">{request.preferred_time}</span>
                </div>
              )}
              {request.location_type && (
                <div className="flex items-center gap-1.5">
                  {request.location_type === 'home' && <Home className="w-3.5 h-3.5 text-[#FF6B35]" />}
                  {request.location_type === 'gym' && <Building2 className="w-3.5 h-3.5 text-[#FF6B35]" />}
                  {request.location_type === 'outdoor' && <Trees className="w-3.5 h-3.5 text-[#FF6B35]" />}
                  <span className="text-gray-600 font-semibold">Location:</span>
                  <span className="text-gray-900">
                    {request.location_type === 'home' ? 'At Home' : request.location_type === 'gym' ? 'At Gym' : 'Outdoor'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-semibold">Level:</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                  {request.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-semibold">Desired Price:</span>
                <span className="text-gray-900">{formatVND(request.desired_price)}/hour</span>
              </div>
            </div>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="proposed_price" className="block text-sm font-bold text-gray-900 mb-2">
                Your Proposed Price (VND per hour) *
              </label>
              <input
                type="number"
                id="proposed_price"
                name="proposed_price"
                value={formData.proposed_price}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.proposed_price && !isNaN(parseFloat(formData.proposed_price)) && (
                <div className="mt-1 text-xs text-gray-600">
                  {formatVND(parseFloat(formData.proposed_price))} per hour
                </div>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold text-gray-900 mb-2">
                Your Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Introduce yourself, explain your experience, and why you're a good fit for this request..."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.message.length} characters
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Response'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RespondToRequestPage;

