import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, Flag, Calendar, User, AlertTriangle, X, Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { Button } from '../src/components/ui/button';
import { useToast } from '../src/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  class: {
    id: string;
    name: string;
    class_type: string;
  };
  booking_id: string;
}

const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          booking_id,
          client_id,
          profiles!reviews_client_id_fkey (
            id,
            username,
            avatar_url
          ),
          bookings!reviews_booking_id_fkey (
            class_id,
            classes (
              id,
              name,
              class_type
            )
          )
        `)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedReviews: Review[] = data.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          booking_id: r.booking_id,
          client: {
            id: r.profiles?.id || r.client_id,
            username: r.profiles?.username || 'Anonymous',
            avatar_url: r.profiles?.avatar_url
          },
          class: {
            id: r.bookings?.classes?.id || '',
            name: r.bookings?.classes?.name || 'Unknown Class',
            class_type: r.bookings?.classes?.class_type || ''
          }
        }));
        setReviews(formattedReviews);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [user?.id]);

  const handleOpenDispute = (review: Review) => {
    setSelectedReview(review);
    setDisputeReason('');
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!selectedReview || !disputeReason.trim() || !user?.id) return;

    setSubmittingDispute(true);
    
    // Create a notification for admin about the dispute
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id, // Will be visible to the trainer
        type: 'review_dispute',
        reference_id: selectedReview.id,
        message: `Review dispute submitted for review from ${selectedReview.client.username}. Reason: ${disputeReason.substring(0, 100)}...`
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit dispute. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Dispute Submitted',
        description: 'Your dispute has been submitted for review by our team.'
      });
      setDisputeModalOpen(false);
      setSelectedReview(null);
      setDisputeReason('');
    }
    
    setSubmittingDispute(false);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card shadow-sm border-b border-border sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">My Reviews</h1>
        <div className="w-9"></div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 py-4">
        <div className="bg-card rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{averageRating}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(parseFloat(averageRating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Reviews Yet</h3>
            <p className="text-sm text-muted-foreground">
              Reviews from your clients will appear here
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-xl p-4 shadow-sm">
              {/* Client Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {review.client.avatar_url ? (
                      <img 
                        src={review.client.avatar_url} 
                        alt={review.client.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{review.client.username}</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenDispute(review)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Dispute this review"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {/* Class Info */}
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                  {review.class.name}
                </span>
                <span>•</span>
                <span>{review.class.class_type}</span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-foreground mb-2">{review.comment}</p>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{new Date(review.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Dispute Review
              </h3>
              <button 
                onClick={() => setDisputeModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Review Preview */}
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-foreground">{selectedReview.client.username}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= selectedReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {selectedReview.comment && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedReview.comment}</p>
                )}
              </div>

              {/* Dispute Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason for Dispute
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you believe this review is unfair or inaccurate..."
                  className="w-full h-32 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>Disputes are reviewed by our team. False disputes may affect your account standing.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitDispute}
                  disabled={!disputeReason.trim() || submittingDispute}
                  className="flex-1 gap-2"
                >
                  {submittingDispute ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
