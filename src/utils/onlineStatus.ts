/**
 * Utility functions for tracking and displaying online status
 */

/**
 * Update last_seen timestamp for a user
 */
export const updateLastSeen = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.warn('updateLastSeen: userId is missing');
    return false;
  }

  try {
    const { supabase } = await import('../integrations/supabase/client');
    const timestamp = new Date().toISOString();
    
<<<<<<< HEAD
    const { data, error } = await supabase
      .from('profiles')
      .update({ last_seen: timestamp })
      .eq('id', userId)
      .select('last_seen')
      .single();
=======
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: timestamp } as any)
      .eq('id', userId);
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
    
    if (error) {
      console.error('Error updating last_seen:', error);
      return false;
    }

<<<<<<< HEAD
    if (data) {
      return true;
    }

    return false;
=======
    return true;
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
  } catch (error) {
    console.error('Error updating last_seen:', error);
    return false;
  }
};

/**
 * Calculate time ago string from timestamp
 */
export const getTimeAgo = (timestamp: string | null | undefined): string | null => {
  if (!timestamp || timestamp === 'undefined' || timestamp === 'null') return null;

  try {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // If seen within last 5 minutes, consider online
    if (diffMins < 5) {
      return 'online';
    }

    if (diffMins < 60) {
      return `seen ${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return null;
  }
};

/**
 * Check if user is online (seen within last 5 minutes)
 */
export const isOnline = (timestamp: string | null | undefined): boolean => {
  if (!timestamp || timestamp === 'undefined' || timestamp === 'null') return false;

  try {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5;
  } catch (error) {
    return false;
  }
};

