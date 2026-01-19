import { useSwipeBack } from '@/hooks/useSwipeBack';

export function SwipeBackOverlay() {
  const { isSwipingBack, swipeProgress } = useSwipeBack();

  if (!isSwipingBack) return null;

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none transition-opacity duration-100"
        style={{ opacity: swipeProgress * 0.5 }}
      />
      
      {/* Left edge indicator */}
      <div 
        className="fixed top-0 bottom-0 right-0 z-[9999] w-1 pointer-events-none"
        style={{
          background: `linear-gradient(to left, transparent, hsl(var(--primary) / ${swipeProgress * 0.3}))`,
          width: `${swipeProgress * 20}px`,
        }}
      />
      
      {/* Back arrow indicator */}
      <div 
        className="fixed top-1/2 right-2 z-[9999] -translate-y-1/2 pointer-events-none transition-all duration-100"
        style={{
          opacity: swipeProgress,
          transform: `translateY(-50%) translateX(${(1 - swipeProgress) * 20}px)`,
        }}
      >
        <div 
          className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center"
          style={{
            transform: `scale(${0.5 + swipeProgress * 0.5})`,
          }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M9 18l6-12" />
            <path d="M9 6l6 12" />
          </svg>
        </div>
      </div>

      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none">
        <div 
          className="h-full bg-primary transition-all duration-100"
          style={{ 
            width: `${swipeProgress * 100}%`,
            opacity: swipeProgress > 0.3 ? 1 : 0,
          }}
        />
      </div>
    </>
  );
}
