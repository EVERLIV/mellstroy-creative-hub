import { useEffect, useState } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import type { Tables } from '@/src/integrations/supabase/types';

export type TrainerDocument = Pick<Tables<'trainer_documents'>, 'id' | 'trainer_id' | 'title' | 'document_type'>;

const MAX_DOCUMENTS_PER_TRAINER = 3;
const EMPTY: ReadonlyMap<string, TrainerDocument[]> = new Map();

/** Groups documents by trainer, keeping the newest N per trainer (input is newest-first). */
export const groupDocumentsByTrainer = (
  docs: readonly TrainerDocument[],
  limit = MAX_DOCUMENTS_PER_TRAINER
): ReadonlyMap<string, TrainerDocument[]> => {
  // Local accumulator; the function stays pure and never touches its input.
  const grouped = new Map<string, TrainerDocument[]>();
  for (const doc of docs) {
    const current = grouped.get(doc.trainer_id) ?? [];
    if (current.length < limit) grouped.set(doc.trainer_id, [...current, doc]);
  }
  return grouped;
};

/**
 * Loads verified certificates/awards for a whole list of trainers in ONE query.
 * Replaces the previous per-card fetch (N+1 requests per grid render).
 */
export const useVerifiedDocuments = (trainerIds: readonly string[]) => {
  const [docsByTrainer, setDocsByTrainer] = useState<ReadonlyMap<string, TrainerDocument[]>>(EMPTY);
  const idsKey = [...trainerIds].sort().join(',');

  useEffect(() => {
    if (!idsKey) {
      setDocsByTrainer(EMPTY);
      return;
    }

    let isCancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('trainer_documents')
        .select('id, trainer_id, title, document_type')
        .in('trainer_id', idsKey.split(','))
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (isCancelled) return;
      if (error) {
        // Non-critical decoration: keep cards usable, but don't hide the failure.
        console.error('Failed to load verified trainer documents:', error.message);
        setDocsByTrainer(EMPTY);
        return;
      }
      setDocsByTrainer(groupDocumentsByTrainer(data ?? []));
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [idsKey]);

  return docsByTrainer;
};
