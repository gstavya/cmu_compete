import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const Feed = ({ currentAndrewID }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('uploadDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Videos loaded:', videoData.length, videoData);
      setVideos(videoData);
      setLoading(false);
      setCurrentVideoIndex(0);
    });

    return () => unsubscribe();
  }, []);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('State changed - currentVideoIndex:', currentVideoIndex, 'videos.length:', videos.length, 'isTransitioning:', isTransitioning);
  }, [currentVideoIndex, videos.length, isTransitioning]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Navigation functions - defined first to avoid circular dependency
  const goToNextVideo = useCallback(() => {
    console.log('goToNextVideo called, current:', currentVideoIndex, 'total:', videos.length, 'isTransitioning:', isTransitioning);
    if (videos.length === 0) {
      console.log('No videos available');
      return;
    }
    if (isTransitioning) {
      console.log('Already transitioning, ignoring request');
      return;
    }
    if (currentVideoIndex < videos.length - 1) {
      console.log('Moving to next video from', currentVideoIndex, 'to', currentVideoIndex + 1);
      setIsTransitioning(true);
      setCurrentVideoIndex(prev => {
        console.log('Setting video index from', prev, 'to', prev + 1);
        return prev + 1;
      });
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      // Reset transition state after animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Transition complete, resetting isTransitioning');
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, 350); // Slightly longer than CSS transition
    } else {
      console.log('Already at last video');
    }
  }, [currentVideoIndex, videos.length, isTransitioning]);

  const goToPreviousVideo = useCallback(() => {
    console.log('goToPreviousVideo called, current:', currentVideoIndex, 'isTransitioning:', isTransitioning);
    if (videos.length === 0) {
      console.log('No videos available');
      return;
    }
    if (isTransitioning) {
      console.log('Already transitioning, ignoring request');
      return;
    }
    if (currentVideoIndex > 0) {
      console.log('Moving to previous video from', currentVideoIndex, 'to', currentVideoIndex - 1);
      setIsTransitioning(true);
      setCurrentVideoIndex(prev => {
        console.log('Setting video index from', prev, 'to', prev - 1);
        return prev - 1;
      });
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      // Reset transition state after animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Transition complete, resetting isTransitioning');
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, 350); // Slightly longer than CSS transition
    } else {
      console.log('Already at first video');
    }
  }, [currentVideoIndex, isTransitioning]);

  // Handle wheel scroll for video navigation
  const handleWheel = useCallback((e) => {
    console.log('Wheel event triggered:', e.deltaY, 'videos.length:', videos.length, 'isTransitioning:', isTransitioning);
    
    if (videos.length === 0) {
      console.log('No videos available for navigation');
      return;
    }
    
    if (isTransitioning) {
      console.log('Currently transitioning, ignoring wheel event');
      return;
    }

    const delta = e.deltaY;
    const scrollThreshold = 10; // Minimum scroll amount to trigger navigation
    
    console.log('Wheel scroll detected:', delta, 'Current index:', currentVideoIndex, 'Is transitioning:', isTransitioning);
    
    // Check if scroll amount is significant enough
    if (Math.abs(delta) < scrollThreshold) {
      console.log('Scroll delta too small:', delta);
      return;
    }
    
    // Only prevent default if we're actually going to navigate
    if ((delta > 0 && currentVideoIndex < videos.length - 1) || 
        (delta < 0 && currentVideoIndex > 0)) {
      console.log('Preventing default and navigating');
      e.preventDefault();
      e.stopPropagation();
      
      if (delta > 0 && currentVideoIndex < videos.length - 1) {
        // Scroll down - next video
        console.log('Going to next video via wheel');
        goToNextVideo();
      } else if (delta < 0 && currentVideoIndex > 0) {
        // Scroll up - previous video
        console.log('Going to previous video via wheel');
        goToPreviousVideo();
      }
    } else {
      console.log('No navigation possible - at boundary or no videos');
    }
  }, [currentVideoIndex, videos.length, goToNextVideo, goToPreviousVideo, isTransitioning]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (videos.length === 0 || isTransitioning) return;

      switch (e.key) {
        case 'ArrowDown':
        case ' ': // Spacebar
          e.preventDefault();
          if (currentVideoIndex < videos.length - 1) {
            goToNextVideo();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentVideoIndex > 0) {
            goToPreviousVideo();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length, goToNextVideo, goToPreviousVideo, isTransitioning]);

  // Add global scroll event listener as fallback
  useEffect(() => {
    const handleGlobalScroll = (e) => {
      // Only handle if the feed container is in view
      if (containerRef.current && containerRef.current.getBoundingClientRect().top < window.innerHeight) {
        const delta = e.deltaY;
        const scrollThreshold = 10;
        
        if (Math.abs(delta) < scrollThreshold || isTransitioning) return;
        
        if ((delta > 0 && currentVideoIndex < videos.length - 1) || 
            (delta < 0 && currentVideoIndex > 0)) {
          e.preventDefault();
          e.stopPropagation();
          
          if (delta > 0 && currentVideoIndex < videos.length - 1) {
            goToNextVideo();
          } else if (delta < 0 && currentVideoIndex > 0) {
            goToPreviousVideo();
          }
        }
      }
    };

    // Add passive: false to allow preventDefault
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalScroll);
  }, [currentVideoIndex, videos.length, goToNextVideo, goToPreviousVideo, isTransitioning]);

  // Handle touch/swipe gestures
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && currentVideoIndex < videos.length - 1) {
      goToNextVideo();
    }
    if (isDownSwipe && currentVideoIndex > 0) {
      goToPreviousVideo();
    }
  };

  // Auto-play current video and pause others
  useEffect(() => {
    videoRefs.current.forEach((videoRef, index) => {
      if (videoRef) {
        if (index === currentVideoIndex) {
          videoRef.play().catch(console.error);
        } else {
          videoRef.pause();
        }
      }
    });
  }, [currentVideoIndex]);

  const handleVideoClick = () => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
    }
  };

  const handleLike = async (videoId) => {
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleView = async (videoId) => {
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  // Update view count when video starts playing
  useEffect(() => {
    if (videos[currentVideoIndex]) {
      handleView(videos[currentVideoIndex].id);
    }
  }, [currentVideoIndex]);

  if (loading) {
    return (
      <div className="cmu-card">
        <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>📺 Video Feed</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #b91c1c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="cmu-card">
        <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>📺 Video Feed</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666', fontSize: '16px' }}>No videos uploaded yet.</p>
          <p style={{ color: '#999', fontSize: '14px' }}>Be the first to upload a video!</p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="cmu-card">
      <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>📺 Video Feed</h2>
      
      {/* Debug Info */}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        Current: {currentVideoIndex + 1} of {videos.length} | Videos loaded: {videos.length} | Transitioning: {isTransitioning ? 'Yes' : 'No'} | Transform: translateY(-{currentVideoIndex * 100}%)
      </div>
      
      {/* Test Navigation Buttons */}
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => {
            console.log('Previous button clicked');
            goToPreviousVideo();
          }}
          disabled={currentVideoIndex === 0}
          style={{
            padding: '5px 10px',
            backgroundColor: currentVideoIndex === 0 ? '#ccc' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentVideoIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ↑ Previous
        </button>
        <button 
          onClick={() => {
            console.log('Next button clicked');
            goToNextVideo();
          }}
          disabled={currentVideoIndex === videos.length - 1}
          style={{
            padding: '5px 10px',
            backgroundColor: currentVideoIndex === videos.length - 1 ? '#ccc' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentVideoIndex === videos.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ↓ Next
        </button>
        <button 
          onClick={() => {
            console.log('Force next clicked');
            setCurrentVideoIndex(prev => {
              console.log('Force setting index from', prev, 'to', Math.min(prev + 1, videos.length - 1));
              return Math.min(prev + 1, videos.length - 1);
            });
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔧 Force Next
        </button>
        <button 
          onClick={() => {
            console.log('Reset to first video');
            setCurrentVideoIndex(0);
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Reset
        </button>
      </div>
      
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          height: '80vh',
          overflow: 'hidden',
          backgroundColor: '#000',
          borderRadius: '12px',
          cursor: 'pointer'
        }}
        onWheel={handleWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleVideoClick}
      >
        {/* Video Container with Smooth Transitions */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `translateY(-${currentVideoIndex * 100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '2px solid red' // Debug border to see container
        }}>
          {videos.map((video, index) => (
            <div
              key={video.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: `translateY(${index * 100}%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                background: `linear-gradient(135deg, ${index === currentVideoIndex ? '#10b981' : '#667eea'} 0%, ${index === currentVideoIndex ? '#059669' : '#764ba2'} 100%)`,
                border: `2px solid ${index === currentVideoIndex ? 'yellow' : 'transparent'}` // Debug border for current video
              }}
            >
              {/* Video Player */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}>
                <video
                  ref={el => videoRefs.current[index] = el}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                  muted={false}
                  loop
                  playsInline
                  onLoadedData={() => {
                    if (index === currentVideoIndex) {
                      videoRefs.current[index]?.play().catch(console.error);
                    }
                  }}
                >
                  <source src={video.videoURL} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Overlay Content */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
              }}>
                {/* Top Section - Video Info */}
                <div>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '24px',
                    fontWeight: 'bold',
                    maxWidth: '70%'
                  }}>
                    {video.title}
                  </h3>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px',
                    opacity: 0.9
                  }}>
                    by {video.uploader}
                  </p>
                  {video.description && (
                    <p style={{ 
                      margin: '0', 
                      fontSize: '16px',
                      opacity: 0.8,
                      maxWidth: '70%'
                    }}>
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Bottom Section - Stats and Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  {/* Left Side - Stats */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {video.trackingData && (
                      <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.9)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        🤖 AI Tracked ({video.trackingData.detectionRate?.toFixed(1)}%)
                      </div>
                    )}
                    <div style={{ fontSize: '16px', opacity: 0.9 }}>
                      👀 {video.views || 0} views • ❤️ {video.likes || 0} likes
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      📅 {video.uploadDate?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                    </div>
                  </div>

                  {/* Right Side - Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(video.id);
                    }}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.backgroundColor = 'rgba(239, 68, 68, 1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                    }}
                  >
                    ❤️ Like
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Indicators */}
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {videos.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: index === currentVideoIndex ? '40px' : '8px',
                borderRadius: '4px',
                backgroundColor: index === currentVideoIndex ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (index !== currentVideoIndex && !isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentVideoIndex(index);
                  setTimeout(() => {
                    setIsTransitioning(false);
                  }, 300);
                }
              }}
            />
          ))}
        </div>

        {/* Scroll Instructions */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          color: 'white',
          fontSize: '14px',
          opacity: isTransitioning ? 0.3 : 0.8,
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '12px 20px',
          borderRadius: '25px',
          border: '1px solid rgba(255,255,255,0.2)',
          transition: 'opacity 0.3s ease'
        }}>
          {isTransitioning ? 'Transitioning...' : `Scroll ↓ or swipe to navigate • ${currentVideoIndex + 1} of ${videos.length}`}
        </div>

        {/* Transition Overlay */}
        {isTransitioning && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: 4,
            pointerEvents: 'none'
          }} />
        )}
      </div>
    </div>
  );
};

export default Feed;