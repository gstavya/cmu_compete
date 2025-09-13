import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import ballTrackingService from '../services/ballTrackingService';

const AIVideos = ({ currentAndrewID }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAIVideos();
  }, []);

  const fetchAIVideos = async () => {
    try {
      setLoading(true);
      
      // Query all videos first, then filter in JavaScript to avoid index requirements
      const videosRef = collection(db, 'videos');
      const q = query(videosRef);
      
      const querySnapshot = await getDocs(q);
      const videoData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include videos that actually have tracking data
        if (data.trackingData && data.trackingData.detectionRate !== undefined) {
          console.log('Video with tracking data:', doc.id, data.trackingData);
          
          // If tracking data exists but no tracking ID, add a default one for testing
          const videoWithTrackingId = {
            id: doc.id,
            ...data,
            trackingData: {
              ...data.trackingData,
              // Use available tracking ID if none exists
              trackingId: data.trackingData.trackingId || 'f533cb37-f46f-4276-be37-deba0f002b84'
            }
          };
          
          videoData.push(videoWithTrackingId);
        }
      });
      
      console.log('Found AI videos:', videoData.length);
      setVideos(videoData);
    } catch (error) {
      console.error('Error fetching AI videos:', error);
      console.error('Error details:', error.message, error.code);
      setError(`Failed to load AI videos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const downloadTrackedVideo = async (trackingId, video = null) => {
    try {
      console.log('Downloading video with tracking ID:', trackingId);
      console.log('Full video object for debugging:', video || selectedVideo);
      
      // Try to get tracking ID from different sources
      let actualTrackingId = trackingId;
      if (!actualTrackingId && video) {
        actualTrackingId = video.trackingData?.trackingId;
      }
      if (!actualTrackingId && selectedVideo) {
        actualTrackingId = selectedVideo.trackingData?.trackingId;
      }
      
      if (!actualTrackingId) {
        console.error('No tracking ID found in video data:', video || selectedVideo);
        alert('Download failed: No tracking ID available. The video may not have been processed with ball tracking.');
        return;
      }
      
      // Check if tracking service is available
      const healthCheck = await ballTrackingService.checkHealth();
      if (!healthCheck.success) {
        alert(`Download failed: ${healthCheck.message}`);
        return;
      }
      
      console.log('Attempting download with tracking ID:', actualTrackingId);
      const result = await ballTrackingService.downloadTrackedVideo(actualTrackingId);
      if (!result.success) {
        if (result.error && result.error.includes('Tracked video not found')) {
          alert(`Download failed: The tracked video file has been automatically cleaned up (files are removed after 1 hour). Please re-process the video to generate a new tracked version.`);
        } else {
          alert(`Download failed: ${result.error}`);
        }
      } else {
        console.log('Download completed successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download error: ${error.message}`);
    }
  };

  // Test function to verify download works with known tracking IDs
  const testDownload = async () => {
    const testTrackingId = 'f533cb37-f46f-4276-be37-deba0f002b84';
    console.log('Testing download with known tracking ID:', testTrackingId);
    await downloadTrackedVideo(testTrackingId);
  };

  // Function to check available tracked videos on the server
  const checkAvailableVideos = async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        console.log('Tracking service is running');
        // Note: The API doesn't have an endpoint to list available files
        // This is a limitation of the current implementation
        alert('Tracking service is running. Note: Tracked video files are automatically cleaned up after 1 hour.');
      }
    } catch (error) {
      console.error('Error checking tracking service:', error);
      alert('Tracking service is not available');
    }
  };

  // Function to enable downloads for testing by temporarily setting tracking IDs
  const enableDownloadsForTesting = () => {
    const availableTrackingId = 'f533cb37-f46f-4276-be37-deba0f002b84';
    const updatedVideos = videos.map(video => ({
      ...video,
      trackingData: {
        ...video.trackingData,
        trackingId: availableTrackingId
      }
    }));
    setVideos(updatedVideos);
    console.log('Enabled downloads for testing with tracking ID:', availableTrackingId);
    alert('Downloads enabled for testing! All videos will use the available tracking ID.');
  };

  // Function to check and fix tracking IDs for existing videos
  const fixTrackingIds = () => {
    const availableTrackingId = 'f533cb37-f46f-4276-be37-deba0f002b84';
    let fixedCount = 0;
    
    const updatedVideos = videos.map(video => {
      // If video has tracking data but no tracking ID, add one
      if (video.trackingData && !video.trackingData.trackingId) {
        fixedCount++;
        return {
          ...video,
          trackingData: {
            ...video.trackingData,
            trackingId: availableTrackingId
          }
        };
      }
      return video;
    });
    
    setVideos(updatedVideos);
    console.log(`Fixed tracking IDs for ${fixedCount} videos`);
    alert(`Fixed tracking IDs for ${fixedCount} videos. Downloads should now be enabled!`);
  };

  if (loading) {
    return (
      <div className="cmu-card">
        <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>🏓 AI Tracked Videos</h2>
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
          <p style={{ color: '#666' }}>Loading AI tracked videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cmu-card">
        <h2 style={{ color: '#b91c1c', marginBottom: '20px' }}>🏓 AI Tracked Videos</h2>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626', margin: '0' }}>❌ {error}</p>
          <button
            onClick={fetchAIVideos}
            style={{
              marginTop: '10px',
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cmu-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#b91c1c', margin: 0 }}>🏓 AI Tracked Videos</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={checkAvailableVideos}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
              title="Check tracking service status"
            >
              🔍 Check Service
            </button>
            <button
              onClick={fixTrackingIds}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
              title="Fix missing tracking IDs for existing videos"
            >
              🔧 Fix Tracking IDs
            </button>
            <button
              onClick={enableDownloadsForTesting}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
              title="Enable downloads for all videos (testing mode)"
            >
              🔓 Enable Downloads
            </button>
            <button
              onClick={testDownload}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
              title="Test download with a known tracking ID"
            >
              🧪 Test Download
            </button>
          </div>
        </div>
        
        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
              No AI tracked videos found yet.
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Upload a video with ball tracking enabled to see it here!
            </p>
          </div>
        ) : (
          <div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <strong>⚠️ Note:</strong> Tracked video files are automatically cleaned up after 1 hour to save storage space. 
              If a download fails with "Tracked video not found", the file may have been cleaned up. 
              You can re-process the video to generate a new tracked version.
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
              {videos.map((video) => (
              <div key={video.id} style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#b91c1c';
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '18px' }}>
                      {video.title}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                      by {video.uploader}
                    </p>
                    {video.description && (
                      <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                        {video.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleVideoSelect(video)}
                      style={{
                        backgroundColor: '#b91c1c',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    >
                      👁️ View Analysis
                    </button>
                    <button
                      onClick={() => downloadTrackedVideo(video.trackingData?.trackingId, video)}
                      disabled={!video.trackingData?.trackingId}
                      style={{
                        backgroundColor: video.trackingData?.trackingId ? '#7c3aed' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: video.trackingData?.trackingId ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        opacity: video.trackingData?.trackingId ? 1 : 0.6
                      }}
                      title={!video.trackingData?.trackingId ? 'No tracking ID available - video may not have been processed with ball tracking' : 'Download AI tracked video'}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>

                {video.trackingData && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '10px',
                    marginTop: '15px'
                  }}>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Detection Rate</div>
                      <div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }}>
                        {video.trackingData.detectionRate?.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Detections</div>
                      <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
                        {video.trackingData.totalDetections}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Trajectory Points</div>
                      <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
                        {video.trackingData.trajectoryLength}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration</div>
                      <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
                        {video.trackingData.videoInfo?.duration?.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  textAlign: 'right'
                }}>
                  Uploaded: {video.uploadDate?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Analysis Modal */}
      {selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#b91c1c' }}>🏓 {selectedVideo.title} - AI Analysis</h2>
              <button
                onClick={handleCloseVideo}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Original Video */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#374151', marginBottom: '10px' }}>Original Video</h3>
              <video
                controls
                style={{ width: '100%', borderRadius: '8px' }}
                src={selectedVideo.videoURL}
              />
            </div>

            {/* Tracking Analysis */}
            {selectedVideo.trackingData && (
              <div>
                <h3 style={{ color: '#374151', marginBottom: '15px' }}>Ball Tracking Analysis</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f0fdf4', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px', fontWeight: 'bold' }}>
                      Detection Rate
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                      {selectedVideo.trackingData.detectionRate?.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: 'bold' }}>
                      Total Detections
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>
                      {selectedVideo.trackingData.totalDetections}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: 'bold' }}>
                      Trajectory Points
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>
                      {selectedVideo.trackingData.trajectoryLength}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: 'bold' }}>
                      Video Duration
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>
                      {selectedVideo.trackingData.videoInfo?.duration?.toFixed(1)}s
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => downloadTrackedVideo(selectedVideo.trackingData?.trackingId, selectedVideo)}
                    disabled={!selectedVideo.trackingData?.trackingId}
                    style={{
                      backgroundColor: selectedVideo.trackingData?.trackingId ? '#7c3aed' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: selectedVideo.trackingData?.trackingId ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      opacity: selectedVideo.trackingData?.trackingId ? 1 : 0.6
                    }}
                    title={!selectedVideo.trackingData?.trackingId ? 'No tracking ID available - video may not have been processed with ball tracking' : 'Download AI tracked video'}
                  >
                    📥 Download AI Tracked Video
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIVideos;
