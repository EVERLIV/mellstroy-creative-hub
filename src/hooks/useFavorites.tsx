import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteTrainerIds, setFavoriteTrainerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavoriteTrainerIds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Note: If you have a favorites table, fetch from there
      // For now, using localStorage as fallback
      const stored = localStorage.getItem(`favorites_${user.id}`);
      if (stored) {
        setFavoriteTrainerIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleFavorite = useCallback(async (trainerId: string) => {
    if (!user?.id) return;

    setFavoriteTrainerIds(prev => {
      const newFavorites = prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId];
      
      // Save to localStorage (replace with database call when favorites table exists)
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
      
      return newFavorites;
    });
  }, [user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return { favoriteTrainerIds, toggleFavorite, loading };
};

