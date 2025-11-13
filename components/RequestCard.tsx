import React from 'react';
import { MapPin, DollarSign, User, MessageCircle, Clock, Home, Building2, Trees } from 'lucide-react';
import { TrainingRequest } from '../types';
import { formatDistanceToNow } from 'date-fns';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount).replace(/\s/g, '');
};

interface RequestCardProps {
  request: TrainingRequest;
  userRole: 'student' | 'trainer';
  currentUserId: string;
  onRespond?: (request: TrainingRequest) => void;
  onViewResponses?: (request: TrainingRequest) => void;
  onClick?: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  userRole,
  currentUserId,
  onRespond,
  onViewResponses,
  onClick
}) => {
  const isOwner = request.student_id === currentUserId;
  const canRespond = userRole === 'trainer' && !isOwner && request.status === 'open';
  const hasResponses = (request.responses_count || 0) > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'accepted':
        return 'bg-[#FF6B35] text-white';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLocationIcon = (locationType?: string) => {
    switch (locationType) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-[#FF6B35]" />;
      case 'gym':
        return <Building2 className="w-3.5 h-3.5 text-[#FF6B35]" />;
      case 'outdoor':
        return <Trees className="w-3.5 h-3.5 text-[#FF6B35]" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />;
    }
  };

  const getLocationLabel = (locationType?: string) => {
    switch (locationType) {
      case 'home':
        return 'At Home';
      case 'gym':
        return 'At Gym';
      case 'outdoor':
        return 'Outdoor';
      default:
        return 'Not specified';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg p-3 mb-3 shadow-sm hover:bg-gray-100 transition-colors cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              {request.category}
            </span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Your request</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-900 mb-3 line-clamp-3 leading-relaxed">
        {request.description}
      </p>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-gray-600">{request.district}</span>
        </div>
        {request.preferred_time && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="text-gray-600">{request.preferred_time}</span>
          </div>
        )}
        {request.location_type && (
          <div className="flex items-center gap-1.5 text-xs">
            {getLocationIcon(request.location_type)}
            <span className="text-gray-600">{getLocationLabel(request.location_type)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-gray-600">Desired: {formatVND(request.desired_price)}/hour</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-600 font-semibold">Level:</span>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
            {request.level}
          </span>
        </div>
      </div>

      {/* Responses count */}
      {hasResponses && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-xs font-semibold text-gray-900">
              {request.responses_count} {request.responses_count === 1 ? 'response' : 'responses'}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canRespond && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRespond?.(request);
            }}
            className="flex-1 bg-[#FF6B35] text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-orange-600 active:scale-95 shadow-sm transition-all duration-200"
          >
            Respond
          </button>
        )}
        {isOwner && hasResponses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewResponses?.(request);
            }}
            className="flex-1 bg-white border border-gray-200 text-gray-900 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200"
          >
            View Responses
          </button>
        )}
      </div>
    </div>
  );
};

export default RequestCard;

