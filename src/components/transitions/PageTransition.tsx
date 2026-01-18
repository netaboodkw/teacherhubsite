import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit' | 'idle'>('idle');
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      // Start exit animation
      setTransitionStage('exit');
      
      const exitTimer = setTimeout(() => {
        // Update children and start enter animation
        setDisplayChildren(children);
        setTransitionStage('enter');
        previousPathRef.current = location.pathname;
        
        const enterTimer = setTimeout(() => {
          setTransitionStage('idle');
        }, 350);
        
        return () => clearTimeout(enterTimer);
      }, 200);
      
      return () => clearTimeout(exitTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  return (
    <div
      className={cn(
        'page-transition w-full min-h-full',
        transitionStage === 'enter' && 'animate-ios-slide-in',
        transitionStage === 'exit' && 'animate-ios-slide-out',
        className
      )}
    >
      {displayChildren}
    </div>
  );
};

// Simple wrapper for pages that just need fade transition
export const FadeTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
