import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader, Star, User, CheckCircle, XCircle, Clock, MapPin, Home, Building2, Trees } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest, TrainerResponse } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../src/hooks/use-toast';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

const RequestResponsesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<TrainingRequest | null>(
    location.state?.request || null
  );
  const [responses, setResponses] = useState<TrainerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    // Extract request ID from URL if not in state
    const pathParts = location.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    if (id && id !== 'responses') {
      setRequestId(id);
      if (!request) {
        loadRequest(id);
      }
      loadResponses(id);
    } else if (request) {
      loadResponses(request.id);
    }
  }, [location.pathname, request]);

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
    } catch (error) {
      console.error('Error loading request:', error);
      navigate('/requests');
    }
  };

  const loadResponses = async (id: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('trainer_responses')
        .select(`
          *,
          trainer:profiles!trainer_responses_trainer_id_fkey(
            username,
            avatar_url,
            rating,
            reviews_count
          )
        `)
        .eq('request_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedResponses: TrainerResponse[] = (data || []).map((resp: any) => ({
        id: resp.id,
        request_id: resp.request_id,
        trainer_id: resp.trainer_id,
        trainer_name: resp.trainer?.username,
        trainer_avatar: resp.trainer?.avatar_url,
        trainer_rating: resp.trainer?.rating || 0,
        trainer_reviews: resp.trainer?.reviews_count || 0,
        message: resp.message,
        proposed_price: parseFloat(resp.proposed_price),
        status: resp.status,
        created_at: resp.created_at,
        updated_at: resp.updated_at,
      }));

      setResponses(transformedResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    if (!user || !request) return;

    try {
      // Update response status to accepted
      const { error: responseError } = await supabase
        .from('trainer_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      if (responseError) throw responseError;

      // Reject all other responses
      const { error: rejectError } = await supabase
        .from('trainer_responses')
        .update({ status: 'rejected' })
        .eq('request_id', request.id)
        .neq('id', responseId);

      if (rejectError) throw rejectError;

      // Update request status to accepted
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      toast({
        title: 'Success',
        description: 'Response accepted! You can now contact the trainer.',
      });

      // Reload responses
      loadResponses(request.id);
      if (requestId) {
        loadRequest(requestId);
      }
    } catch (error: any) {
      console.error('Error accepting response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept response',
        variant: 'destructive',
      });
    }
  };

  if (!request) {
    return (
      <div className="bg-white h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 text-gray-800 animate-spin" />
      </div>
    );
  }

  const isOwner = request.student_id === user?.id;

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
        <h1 className="text-base font-bold text-gray-900">Responses</h1>
        <div className="w-9"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gray-50 pb-safe-nav">
          {/* Request Summary */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="mb-2">
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {request.category}
              </span>
            </div>
            <p className="text-xs text-gray-900 mb-2">{request.description}</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#FF6B35]" />
                <span>{request.district}</span>
              </div>
              {request.preferred_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#FF6B35]" />
                  <span>{request.preferred_time}</span>
                </div>
              )}
              {request.location_type && (
                <div className="flex items-center gap-1.5">
                  {request.location_type === 'home' && <Home className="w-3 h-3 text-[#FF6B35]" />}
                  {request.location_type === 'gym' && <Building2 className="w-3 h-3 text-[#FF6B35]" />}
                  {request.location_type === 'outdoor' && <Trees className="w-3 h-3 text-[#FF6B35]" />}
                  <span>
                    {request.location_type === 'home' ? 'At Home' : request.location_type === 'gym' ? 'At Gym' : 'Outdoor'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span>Desired: {formatVND(request.desired_price)}/hour</span>
              </div>
            </div>
          </div>

          {/* Responses */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-gray-800 animate-spin" />
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-gray-900">No responses yet</p>
              <p className="text-xs text-gray-600 mt-2">
                Trainers will see your request and can respond
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className={`bg-white rounded-lg p-3 shadow-sm ${
                    response.status === 'accepted' ? 'border-2 border-green-500' : ''
                  }`}
                >
                  {/* Trainer Info */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {response.trainer_avatar ? (
                        <img 
                          src={response.trainer_avatar} 
                          alt={response.trainer_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {response.trainer_name || 'Unknown Trainer'}
                        </span>
                        {response.status === 'accepted' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {response.status === 'rejected' && (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {response.trainer_rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span>{response.trainer_rating.toFixed(1)}</span>
                          <span>({response.trainer_reviews} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-gray-900 mb-2 leading-relaxed">
                    {response.message}
                  </p>

                  {/* Price */}
                  <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">Proposed Price:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatVND(response.proposed_price)}/hour
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-gray-500 mb-2">
                    {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                  </div>

                  {/* Actions */}
                  {isOwner && request.status === 'open' && response.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptResponse(response.id)}
                        className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-green-700 active:scale-95 shadow-sm transition-all duration-200"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestResponsesPage;

