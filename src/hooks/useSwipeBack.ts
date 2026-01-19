import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeState {
  isSwipingBack: boolean;
  swipeProgress: number;
}

export function useSwipeBack(enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwipingBack: false,
    swipeProgress: 0,
  });
  
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);

  const edgeThreshold = 30; // Must start within 30px from left edge
  const swipeThreshold = 100; // Must swipe 100px to trigger back
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

  // Pages where swipe back should be disabled
  const disabledRoutes = ['/', '/welcome', '/auth/teacher', '/auth/admin', '/auth/department-head'];
  const isDisabled = !enabled || disabledRoutes.includes(location.pathname);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isDisabled) return;
    
    const touch = e.touches[0];
    // RTL: check right edge (which is the "back" edge in RTL)
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const isNearEdge = isRTL 
      ? touch.clientX > screenWidth - edgeThreshold
      : touch.clientX < edgeThreshold;
    
    if (isNearEdge) {
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setTouchCurrent(touch.clientX);
    }
  }, [isDisabled, screenWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart || isDisabled) return;
    
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Cancel if vertical scroll
    if (deltaY > 50) {
      setTouchStart(null);
      setSwipeState({ isSwipingBack: false, swipeProgress: 0 });
      return;
    }
    
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const deltaX = isRTL 
      ? touchStart.x - touch.clientX
      : touch.clientX - touchStart.x;
    
    if (deltaX > 0) {
      const progress = Math.min(deltaX / swipeThreshold, 1);
      setTouchCurrent(touch.clientX);
      setSwipeState({
        isSwipingBack: true,
        swipeProgress: progress,
      });
      
      // Prevent scroll while swiping
      if (progress > 0.1) {
        e.preventDefault();
      }
    }
  }, [touchStart, isDisabled]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || isDisabled) {
      setTouchStart(null);
      return;
    }
    
    if (swipeState.swipeProgress >= 0.5) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      navigate(-1);
    }
    
    setTouchStart(null);
    setSwipeState({ isSwipingBack: false, swipeProgress: 0 });
  }, [touchStart, swipeState.swipeProgress, navigate, isDisabled]);

  useEffect(() => {
    if (isDisabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isDisabled]);

  return swipeState;
}
