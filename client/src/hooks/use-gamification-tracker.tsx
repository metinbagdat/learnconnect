import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AchievementUnlockModal } from "@/components/gamification/achievement-unlock-modal";
import { achievements } from "@shared/schema";
type Achievement = typeof achievements.$inferSelect;
import { apiRequest } from "@/lib/queryClient";

interface GamificationContextType {
  showXpGain: (amount: number) => void;
  checkAndUnlockAchievements: (userId: number) => void;
  celebrateLevelUp: (newLevel: number) => void;
  triggerAchievementUnlock: (achievement: any) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unlockedAchievement, setUnlockedAchievement] = useState<any | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<number>(0);

  // XP gain notification
  const showXpGain = useCallback((amount: number) => {
    toast({
      title: `+${amount} XP Earned!`,
      description: "Great progress! Keep learning to unlock more rewards.",
      duration: 3000,
    });
  }, [toast]);

  // Level up celebration
  const celebrateLevelUp = useCallback((newLevel: number) => {
    toast({
      title: `🎉 Level Up! Level ${newLevel}`,
      description: "Congratulations! You've reached a new level!",
      duration: 5000,
    });
  }, [toast]);

  // Achievement unlock trigger
  const triggerAchievementUnlock = useCallback((achievement: Achievement) => {
    setUnlockedAchievement(achievement);
    setShowAchievementModal(true);
    
    // Play achievement sound (if available)
    try {
      const audio = new Audio('/achievement-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail if audio not available
    }
  }, []);

  // Check for new achievements with debouncing to prevent infinite loops
  const achievementCheckMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/user/check-achievements", { userId });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.newAchievements && data.newAchievements.length > 0) {
        // Show first achievement immediately, queue others
        const [firstAchievement, ...remainingAchievements] = data.newAchievements;
        triggerAchievementUnlock(firstAchievement);
        
        // Queue remaining achievements with delay
        remainingAchievements.forEach((achievement: any, index: number) => {
          setTimeout(() => {
            triggerAchievementUnlock(achievement);
          }, (index + 1) * 3000);
        });
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/level"] });
      
      lastCheckTimeRef.current = Date.now();
    },
  });

  const checkAndUnlockAchievements = useCallback((userId: number) => {
    // Prevent rapid-fire calls (debounce to 2 second minimum between checks)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 2000) {
      return;
    }
    
    // Clear any pending timeouts
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Queue the mutation check
    checkTimeoutRef.current = setTimeout(() => {
      achievementCheckMutation.mutate(userId);
    }, 100);
  }, [achievementCheckMutation]);

  const handleAchievementModalClose = () => {
    setShowAchievementModal(false);
    setUnlockedAchievement(null);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        showXpGain,
        checkAndUnlockAchievements,
        celebrateLevelUp,
        triggerAchievementUnlock,
      }}
    >
      {children}
      
      <AchievementUnlockModal
        achievement={unlockedAchievement}
        isOpen={showAchievementModal}
        onClose={handleAchievementModalClose}
      />
    </GamificationContext.Provider>
  );
}

export function useGamificationTracker() {
  const context = useContext(GamificationContext);
  
  // Return safe defaults if hook is used outside provider
  if (!context) {
    return {
      showXpGain: () => {},
      checkAndUnlockAchievements: () => {},
      celebrateLevelUp: () => {},
      triggerAchievementUnlock: () => {},
    };
  }
  
  return context;
}