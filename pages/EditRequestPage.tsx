import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader, Clock, MapPin, Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { CATEGORIES } from '../constants';
import { HCMC_DISTRICTS } from '../constants';
import { RequestLevel, TrainingRequest } from '../types';
import { useToast } from '../src/hooks/use-toast';

const LEVELS: RequestLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate'];

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

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
      <div className="bg-gray-50 h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Edit Request</h1>
          <div className="w-9"></div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 pb-safe-nav">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-bold text-gray-900 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label htmlFor="district" className="block text-sm font-bold text-gray-900 mb-2">
                District *
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
              >
                <option value="">Select a district</option>
                {HCMC_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-bold text-gray-900 mb-2">
                Your Level *
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Time */}
            <div>
              <label htmlFor="preferred_time" className="block text-sm font-bold text-gray-900 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-[#FF6B35]" />
                Preferred Time *
              </label>
              <input
                type="text"
                id="preferred_time"
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleChange}
                required
                placeholder="e.g., Morning 7-9 AM, Evening 6-8 PM, Flexible"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
              />
            </div>

            {/* Location Type */}
            <div>
              <label htmlFor="location_type" className="block text-sm font-bold text-gray-900 mb-2">
                <MapPin className="w-4 h-4 inline mr-1 text-[#FF6B35]" />
                Preferred Location *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'home', label: 'At Home', icon: '🏠' },
                  { value: 'gym', label: 'At Gym', icon: '🏋️' },
                  { value: 'outdoor', label: 'Outdoor', icon: '🌳' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, location_type: option.value as 'home' | 'gym' | 'outdoor' }))}
                    className={`px-3 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-semibold ${
                      formData.location_type === option.value
                        ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF6B35]/50 hover:bg-orange-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Desired Price */}
            <div>
              <label htmlFor="desired_price" className="block text-sm font-bold text-gray-900 mb-2">
                Desired Price (VND per hour) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="desired_price"
                  name="desired_price"
                  value={formData.desired_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  placeholder="e.g., 200000"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                />
                {formData.desired_price && !isNaN(parseFloat(formData.desired_price)) && (
                  <div className="mt-1 text-xs text-gray-600">
                    {formatVND(parseFloat(formData.desired_price))} per hour
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Describe what kind of training you're looking for, your goals, preferred schedule, etc."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] resize-none"
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.description.length} characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF6B35] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 text-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Update Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRequestPage;

