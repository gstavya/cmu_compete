import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const Feed = ({ currentAndrewID }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('uploadDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(videoData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVideoClick = (videoRef) => {
    if (videoRef) {
      if (videoRef.paused) {
        videoRef.play();
      } else {
        videoRef.pause();
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

  return (
    <div className="cmu-card">
      <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>📺 Video Feed</h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px 0'
      }}>
        {videos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onLike={handleLike}
            onView={handleView}
            onVideoClick={handleVideoClick}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Video Card Component
const VideoCard = ({ video, onLike, onView, onVideoClick }) => {
  const videoRef = React.useRef(null);

  const handleVideoInteraction = () => {
    onVideoClick(videoRef.current);
    onView(video.id);
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }}>
      {/* Video Player */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
          muted
          loop
          playsInline
          onClick={handleVideoInteraction}
          onMouseEnter={() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.play().catch(console.error);
            }
          }}
          onMouseLeave={() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.pause();
            }
          }}
        >
          <source src={video.videoURL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video Info */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          lineHeight: '1.4'
        }}>
          {video.title}
        </h3>
        
        <p style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px',
          color: '#666'
        }}>
          by {video.uploader}
        </p>
        
        {video.description && (
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px',
            color: '#777',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {video.description}
          </p>
        )}

        {/* Stats and Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
            <span>👀 {video.views || 0}</span>
            <span>❤️ {video.likes || 0}</span>
            {video.trackingData && (
              <span style={{ color: '#059669', fontWeight: 'bold' }}>
                🤖 {video.trackingData.detectionRate?.toFixed(1)}%
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(video.id);
            }}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ef4444';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ❤️ Like
          </button>
        </div>

        <div style={{ 
          fontSize: '12px', 
          color: '#999', 
          marginTop: '8px' 
        }}>
          📅 {video.uploadDate?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
        </div>
      </div>
    </div>
  );
};

export default Feed;