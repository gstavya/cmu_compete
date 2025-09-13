// Ball tracking service for communicating with the Python tracking API
const TRACKING_API_URL = 'http://localhost:5001';

class BallTrackingService {
  constructor() {
    this.apiUrl = TRACKING_API_URL;
  }

  /**
   * Check if the tracking API is available
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Health check failed:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Ball tracking service is not available. Please ensure the Python tracking service is running.'
      };
    }
  }

  /**
   * Process a video file for ball tracking
   * @param {File} videoFile - The video file to process
   * @param {Function} progressCallback - Optional callback for progress updates
   */
  async trackVideo(videoFile, progressCallback = null) {
    try {
      // Check API health first
      const healthCheck = await this.checkHealth();
      if (!healthCheck.success) {
        throw new Error(healthCheck.message);
      }

      // Create form data
      const formData = new FormData();
      formData.append('video', videoFile);

      // Show progress
      if (progressCallback) {
        progressCallback({ stage: 'uploading', progress: 0, message: 'Uploading video...' });
      }

      // Send request to tracking API
      const response = await fetch(`${this.apiUrl}/track-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (progressCallback) {
        progressCallback({ stage: 'processing', progress: 50, message: 'Processing video...' });
      }

      const result = await response.json();

      if (progressCallback) {
        progressCallback({ stage: 'complete', progress: 100, message: 'Tracking complete!' });
      }

      return {
        success: true,
        trackingId: result.tracking_id,
        results: result.results,
        outputVideoUrl: result.output_video_url
      };

    } catch (error) {
      console.error('Video tracking failed:', error);
      if (progressCallback) {
        progressCallback({ 
          stage: 'error', 
          progress: 0, 
          message: `Error: ${error.message}` 
        });
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download the tracked video
   * @param {string} trackingId - The tracking ID
   */
  async downloadTrackedVideo(trackingId) {
    try {
      const response = await fetch(`${this.apiUrl}/download-tracked-video/${trackingId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tracked_${trackingId}.avi`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get tracking results for a specific tracking ID
   * @param {string} trackingId - The tracking ID
   */
  async getTrackingResults(trackingId) {
    try {
      const response = await fetch(`${this.apiUrl}/tracking-results/${trackingId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Failed to get tracking results:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up temporary files for a tracking session
   * @param {string} trackingId - The tracking ID
   */
  async cleanupFiles(trackingId) {
    try {
      const response = await fetch(`${this.apiUrl}/cleanup/${trackingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze tracking results and extract key statistics
   * @param {Object} results - The tracking results from the API
   */
  analyzeTrackingResults(results) {
    if (!results || !results.tracking_data) {
      return {
        success: false,
        error: 'No tracking data available'
      };
    }

    const trackingData = results.tracking_data;
    const detectedFrames = trackingData.filter(frame => frame.detected);
    
    // Calculate statistics
    const stats = {
      totalFrames: results.total_frames,
      detectedFrames: results.detection_count,
      interpolatedFrames: results.interpolated_count,
      detectionRate: results.detection_rate,
      videoDuration: results.video_info.duration,
      videoFPS: results.video_info.fps,
      videoResolution: `${results.video_info.width}x${results.video_info.height}`,
      
      // Trajectory analysis
      trajectoryLength: results.trajectory.length,
      hasTrajectory: results.trajectory.length > 0,
      
      // Method usage statistics
      methodStats: this.calculateMethodStats(trackingData),
      
      // Confidence analysis
      confidenceStats: this.calculateConfidenceStats(trackingData)
    };

    return {
      success: true,
      stats
    };
  }

  /**
   * Calculate method usage statistics
   */
  calculateMethodStats(trackingData) {
    const methodCounts = {};
    
    trackingData.forEach(frame => {
      if (frame.methods) {
        frame.methods.forEach(method => {
          methodCounts[method] = (methodCounts[method] || 0) + 1;
        });
      }
    });

    return methodCounts;
  }

  /**
   * Calculate confidence statistics
   */
  calculateConfidenceStats(trackingData) {
    const confidences = trackingData
      .filter(frame => frame.detected && frame.confidence)
      .map(frame => frame.confidence);

    if (confidences.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0
      };
    }

    return {
      average: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      min: Math.min(...confidences),
      max: Math.max(...confidences),
      count: confidences.length
    };
  }

  /**
   * Generate a summary report of the tracking results
   * @param {Object} results - The tracking results
   */
  generateTrackingReport(results) {
    const analysis = this.analyzeTrackingResults(results);
    
    if (!analysis.success) {
      return analysis;
    }

    const stats = analysis.stats;
    
    const report = {
      summary: {
        success: true,
        videoInfo: {
          duration: `${stats.videoDuration.toFixed(2)}s`,
          fps: stats.videoFPS,
          resolution: stats.videoResolution
        },
        trackingQuality: {
          detectionRate: `${stats.detectionRate.toFixed(1)}%`,
          totalDetections: stats.detectedFrames,
          interpolatedFrames: stats.interpolatedFrames,
          trajectoryLength: stats.trajectoryLength
        },
        methodBreakdown: stats.methodStats,
        confidence: {
          average: stats.confidenceStats.average.toFixed(2),
          range: `${stats.confidenceStats.min.toFixed(2)} - ${stats.confidenceStats.max.toFixed(2)}`
        }
      },
      
      recommendations: this.generateRecommendations(stats)
    };

    return report;
  }

  /**
   * Generate recommendations based on tracking quality
   */
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.detectionRate < 50) {
      recommendations.push({
        type: 'warning',
        message: 'Low detection rate. Consider improving lighting or video quality.'
      });
    } else if (stats.detectionRate > 80) {
      recommendations.push({
        type: 'success',
        message: 'Excellent detection rate! Video quality is good for tracking.'
      });
    }

    if (stats.interpolatedFrames > stats.detectedFrames * 0.3) {
      recommendations.push({
        type: 'warning',
        message: 'High number of interpolated frames. Ball may be moving too fast or partially occluded.'
      });
    }

    if (stats.confidenceStats.average < 1.0) {
      recommendations.push({
        type: 'info',
        message: 'Average confidence is low. Consider using better lighting or a more stable camera position.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Tracking results look good! No specific recommendations at this time.'
      });
    }

    return recommendations;
  }
}

// Create and export a singleton instance
const ballTrackingService = new BallTrackingService();
export default ballTrackingService;
