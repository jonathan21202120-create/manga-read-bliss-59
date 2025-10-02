import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  mangaCoverUrl: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  isCompleted: boolean;
  lastReadAt: string;
  progressPercentage: number;
}

export const useReadingProgress = () => {
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProgress = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase.rpc('get_user_reading_progress', {
        p_user_id: user.id
      });

      if (error) throw error;

      const transformedProgress: ReadingProgress[] = data?.map((item: any) => ({
        mangaId: item.manga_id,
        mangaTitle: item.manga_title,
        mangaCoverUrl: item.manga_cover_url,
        chapterId: item.chapter_id,
        chapterNumber: item.chapter_number,
        chapterTitle: item.chapter_title,
        currentPage: item.current_page,
        totalPages: item.total_pages,
        isCompleted: item.is_completed,
        lastReadAt: item.last_read_at,
        progressPercentage: item.progress_percentage,
      })) || [];

      setProgress(transformedProgress);
    } catch (error: any) {
      console.error('Error fetching reading progress (loading from localStorage):', error);
      
      // Fallback: Try to load from localStorage
      try {
        const localProgressData: ReadingProgress[] = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
          if (key.startsWith(`reading_progress_${user.id}_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              // Convert localStorage format to ReadingProgress format
              localProgressData.push({
                mangaId: parsed.manga_id,
                mangaTitle: 'Carregando...', // Will be updated when online
                mangaCoverUrl: '',
                chapterId: parsed.chapter_id,
                chapterNumber: 0,
                chapterTitle: 'Carregando...',
                currentPage: parsed.current_page,
                totalPages: 0,
                isCompleted: parsed.is_completed,
                lastReadAt: parsed.last_read_at,
                progressPercentage: 0,
              });
            }
          }
        });
        
        setProgress(localProgressData);
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const updateProgress = useCallback(async (
    mangaId: string,
    chapterId: string,
    currentPage: number = 1,
    isCompleted: boolean = false
  ) => {
    if (!user) return;

    const progressData = {
      user_id: user.id,
      manga_id: mangaId,
      chapter_id: chapterId,
      current_page: currentPage,
      is_completed: isCompleted,
      last_read_at: new Date().toISOString()
    };

    try {
      // Try to save to Supabase first
      const { error } = await supabase
        .from('reading_progress')
        .upsert(progressData, {
          onConflict: 'user_id,manga_id'
        });

      if (error) throw error;

      // Save to localStorage as backup
      const localKey = `reading_progress_${user.id}_${mangaId}`;
      localStorage.setItem(localKey, JSON.stringify(progressData));

      // Refresh progress data
      await fetchProgress();
    } catch (error: any) {
      console.error('Error updating reading progress (saving to localStorage):', error);
      
      // Fallback: Save only to localStorage if Supabase fails
      try {
        const localKey = `reading_progress_${user.id}_${mangaId}`;
        localStorage.setItem(localKey, JSON.stringify(progressData));
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
      }
    }
  }, [user, fetchProgress, toast]);

  const getLastReadChapter = (mangaId: string): ReadingProgress | null => {
    return progress.find(p => p.mangaId === mangaId) || null;
  };

  const getProgressPercentage = (mangaId: string): number => {
    const mangaProgress = progress.filter(p => p.mangaId === mangaId);
    if (mangaProgress.length === 0) return 0;

    const completed = mangaProgress.filter(p => p.isCompleted).length;
    return Math.round((completed / mangaProgress.length) * 100);
  };

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  return {
    progress,
    isLoading,
    updateProgress,
    fetchProgress,
    getLastReadChapter,
    getProgressPercentage,
  };
};