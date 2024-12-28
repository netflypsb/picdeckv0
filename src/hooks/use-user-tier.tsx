import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/database';

export type UserTier = {
  tier: UserRole;
  start_date: string;
  end_date: string | null;
  stripe_subscription_id: string | null;
  stripe_status: 'active' | 'cancelled' | 'past_due' | 'incomplete' | null;
};

export function useUserTier() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUserId, setIsLoadingUserId] = useState(true);

  // Fetch the authenticated user's ID
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingUserId(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useUserTier - Full session object:', session);
      setUserId(session?.user?.id ?? null);
      setIsLoadingUserId(false);
    };
    checkAuth();
  }, []);

  // Fetch the user's tier data from the database
  const { data: tierData, isLoading: isLoadingTier, error, refetch } = useQuery({
    queryKey: ['userTier', userId],
    queryFn: async () => {
      if (!userId) return null;

      console.log('useUserTier - Fetching tier data for user:', userId);
      const { data, error } = await supabase
        .from('user_tiers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('useUserTier - Error fetching tier:', error);
        throw error;
      }

      console.log('useUserTier - Fetched tier data:', data);
      return data as UserTier;
    },
    enabled: !!userId,
  });

  const isLoading = isLoadingUserId || isLoadingTier;

  // Determine the effective tier
  const effectiveTier = tierData?.tier ?? (isLoading ? 'loading' : 'free');
  console.log('useUserTier - Effective tier:', effectiveTier);

  const assignTier = async (tier: UserRole, duration?: number) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('manage-tier', {
        body: { action: 'assign', userId, tier, duration },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully assigned ${tier} tier`,
      });

      refetch(); // Refresh tier data
    } catch (error) {
      console.error('Error assigning tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign tier',
        variant: 'destructive',
      });
    }
  };

  return {
    tier: effectiveTier,
    tierData,
    isLoading,
    error,
    assignTier,
    refetch,
  };
}
