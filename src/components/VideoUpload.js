import React, { useState } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ballTrackingService from '../services/ballTrackingService';
import TrackingResults from './TrackingResults';

const VideoUpload = ({ currentAndrewID, user }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(null);
  const [trackingResults, setTrackingResults] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [trackingId, setTrackingId] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      alert('Please select a valid video file');
    }
  };

  // Test Firebase Storage connection
  const testStorageConnection = async () => {
    try {
      console.log('Testing Firebase Storage connection...');
      const testRef = ref(storage, 'test/test.txt');
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      await uploadBytesResumable(testRef, testBlob);
      console.log('Firebase Storage connection successful');
      return true;
    } catch (error) {
      console.error('Firebase Storage connection failed:', error);
      return false;
    }
  };

  // Test Firestore connection
  const testFirestoreConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'test',
        timestamp: serverTimestamp()
      });
      console.log('Firestore connection successful, test doc ID:', testDoc.id);
      return true;
    } catch (error) {
      console.error('Firestore connection failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Check authentication first
    if (!user) {
      alert('You must be logged in to upload videos');
      return;
    }
    
    if (!videoFile || !title.trim()) {
      alert('Please select a video file and enter a title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Debug: Log authentication status
      console.log('User authenticated:', !!user);
      console.log('User UID:', user?.uid);
      console.log('Current Andrew ID:', currentAndrewID);
      
      // Test both connections first
      const storageWorking = await testStorageConnection();
      if (!storageWorking) {
        alert('Firebase Storage is not accessible. Please check your configuration.');
        setUploading(false);
        return;
      }

      const firestoreWorking = await testFirestoreConnection();
      if (!firestoreWorking) {
        alert('Firestore is not accessible. Please check your Firestore rules.');
        setUploading(false);
        return;
      }
      
      // Create a unique filename with sanitized name
      const timestamp = Date.now();
      const sanitizedName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${currentAndrewID}_${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, `videos/${fileName}`);
      
      console.log('Uploading to path:', `videos/${fileName}`);

      // Create upload task with resumable upload
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress function
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          // Error function
          console.error('Upload error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          let errorMessage = 'Upload failed. ';
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'You do not have permission to upload files. Please check your authentication.';
          } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.';
          } else if (error.code === 'storage/unknown') {
            errorMessage += 'An unknown error occurred. Please try again.';
          } else {
            errorMessage += error.message;
          }
          
          alert(errorMessage);
          setUploading(false);
        },
        async () => {
          // Complete function
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Video uploaded successfully, download URL:', downloadURL);

            // Process ball tracking if enabled
            let trackingData = null;
            if (trackingEnabled) {
              try {
                setTrackingProgress({ stage: 'starting', progress: 0, message: 'Starting ball tracking...' });
                
                const trackingResult = await ballTrackingService.trackVideo(
                  videoFile,
                  (progress) => setTrackingProgress(progress)
                );

                if (trackingResult.success) {
                  trackingData = trackingResult.results;
                  setTrackingResults(trackingResult.results);
                  setTrackingId(trackingResult.trackingId);
                  console.log('Ball tracking completed successfully');
                } else {
                  setTrackingError(trackingResult.error);
                  console.error('Ball tracking failed:', trackingResult.error);
                }
              } catch (trackingError) {
                setTrackingError(trackingError.message);
                console.error('Ball tracking error:', trackingError);
              }
            }

            // Save video metadata to Firestore
            console.log('Saving metadata to Firestore...');
            const videoMetadata = {
              title: title.trim(),
              description: description.trim(),
              uploader: currentAndrewID,
              videoURL: downloadURL,
              fileName: fileName,
              uploadDate: serverTimestamp(),
              likes: 0,
              views: 0,
              trackingEnabled: trackingEnabled,
              trackingData: trackingData ? {
                trackingId: trackingId,
                detectionRate: trackingData.detection_rate,
                totalDetections: trackingData.detection_count,
                interpolatedFrames: trackingData.interpolated_count,
                trajectoryLength: trackingData.trajectory.length,
                videoInfo: trackingData.video_info
              } : null
            };

            const docRef = await addDoc(collection(db, 'videos'), videoMetadata);
            console.log('Metadata saved successfully with ID:', docRef.id);

            // Reset form
            setVideoFile(null);
            setTitle('');
            setDescription('');
            setUploadProgress(0);
            setTrackingEnabled(false);
            setTrackingProgress(null);
            setTrackingResults(null);
            setTrackingError(null);
            setTrackingId(null);
            
            const successMessage = trackingEnabled 
              ? 'Video uploaded, ball tracking completed, and saved successfully!'
              : 'Video uploaded and saved successfully!';
            alert(successMessage);
          } catch (error) {
            console.error('Error saving video metadata:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            let errorMessage = 'Video uploaded but failed to save metadata. ';
            if (error.code === 'permission-denied') {
              errorMessage += 'Permission denied. Please check Firestore rules.';
            } else if (error.code === 'unavailable') {
              errorMessage += 'Firestore is unavailable. Please try again.';
            } else {
              errorMessage += `Error: ${error.message}`;
            }
            
            alert(errorMessage);
          } finally {
            setUploading(false);
          }
        }
      );

    } catch (error) {
      console.error('Error starting upload:', error);
      alert('Error starting upload. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="cmu-card">
      <h2 style={{ color: '#b91c1c', marginBottom: '20px', fontSize: '24px' }}>Upload Match Video</h2>
      
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Video File:
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            disabled={uploading}
          />
          {videoFile && (
            <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Title: *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            disabled={uploading}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Description:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your match or any highlights"
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
            disabled={uploading}
          />
        </div>

        <div style={{ 
          padding: '15px', 
          border: '2px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            fontWeight: 'bold', 
            color: '#333',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={trackingEnabled}
              onChange={(e) => setTrackingEnabled(e.target.checked)}
              disabled={uploading}
              style={{ transform: 'scale(1.2)' }}
            />
            Enable Ball Tracking Analysis
          </label>
          <p style={{ 
            marginTop: '8px', 
            fontSize: '13px', 
            color: '#6b7280',
            marginBottom: '0'
          }}>
            Analyze the video to track ping pong ball movement and generate trajectory data
          </p>
        </div>

        {uploading && (
          <div>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '4px', 
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '20px',
                backgroundColor: '#b91c1c',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
              Uploading... {uploadProgress}%
            </p>
            
            {trackingProgress && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${trackingProgress.progress}%`,
                    height: '16px',
                    backgroundColor: '#059669',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ textAlign: 'center', color: '#374151', fontSize: '13px', margin: '0' }}>
                  {trackingProgress.message} {trackingProgress.progress}%
                </p>
              </div>
            )}
            
            {trackingError && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca',
                borderRadius: '6px' 
              }}>
                <p style={{ color: '#dc2626', fontSize: '13px', margin: '0' }}>
                  ⚠️ Tracking Error: {trackingError}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={uploading || !videoFile || !title.trim()}
            style={{
              backgroundColor: uploading ? '#ccc' : '#b91c1c',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#991b1b';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
          
          <button
            type="button"
            onClick={testStorageConnection}
            disabled={uploading}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#4b5563';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#6b7280';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            Test Storage
          </button>
          
          <button
            type="button"
            onClick={testFirestoreConnection}
            disabled={uploading}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#047857';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            Test Firestore
          </button>
          
          <button
            type="button"
            onClick={async () => {
              const healthCheck = await ballTrackingService.checkHealth();
              if (healthCheck.success) {
                alert('✅ Ball tracking service is running!');
              } else {
                alert(`❌ Ball tracking service is not available: ${healthCheck.message}`);
              }
            }}
            disabled={uploading}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#6d28d9';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              if (!uploading) {
                e.target.style.backgroundColor = '#7c3aed';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            Test Ball Tracking
          </button>
        </div>
      </form>

      {/* Display tracking results if available */}
      {trackingResults && (
        <div style={{ marginTop: '20px' }}>
          <TrackingResults 
            trackingData={trackingResults}
            trackingId={trackingId}
            onDownloadVideo={async (id) => {
              try {
                const result = await ballTrackingService.downloadTrackedVideo(id);
                if (!result.success) {
                  alert(`Download failed: ${result.error}`);
                }
              } catch (error) {
                alert(`Download error: ${error.message}`);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
