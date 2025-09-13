import React from 'react';
import ballTrackingService from '../services/ballTrackingService';

const TrackingResults = ({ trackingData, onDownloadVideo, trackingId }) => {
  if (!trackingData) {
    return (
      <div className="cmu-card">
        <h3 style={{ color: '#b91c1c', marginBottom: '15px' }}>Ball Tracking Results</h3>
        <p style={{ color: '#666', fontStyle: 'italic' }}>No tracking data available</p>
      </div>
    );
  }

  // Generate analysis report
  const report = ballTrackingService.generateTrackingReport(trackingData);
  
  if (!report.success) {
    return (
      <div className="cmu-card">
        <h3 style={{ color: '#b91c1c', marginBottom: '15px' }}>Ball Tracking Results</h3>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '6px' 
        }}>
          <p style={{ color: '#dc2626', margin: '0' }}>
            ⚠️ Error analyzing tracking data: {report.error}
          </p>
        </div>
      </div>
    );
  }

  const { summary, recommendations } = report;

  return (
    <div className="cmu-card">
      <h3 style={{ color: '#b91c1c', marginBottom: '20px' }}>🏓 Ball Tracking Analysis</h3>
      
      {/* Video Information */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>Video Information</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.videoInfo.duration}</div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>FPS</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.videoInfo.fps}</div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Resolution</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.videoInfo.resolution}</div>
          </div>
        </div>
      </div>

      {/* Tracking Quality */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>Tracking Quality</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: summary.trackingQuality.detectionRate.includes('8') || summary.trackingQuality.detectionRate.includes('9') 
              ? '#f0fdf4' : summary.trackingQuality.detectionRate.includes('6') || summary.trackingQuality.detectionRate.includes('7')
              ? '#fefce8' : '#fef2f2',
            border: `1px solid ${summary.trackingQuality.detectionRate.includes('8') || summary.trackingQuality.detectionRate.includes('9') 
              ? '#bbf7d0' : summary.trackingQuality.detectionRate.includes('6') || summary.trackingQuality.detectionRate.includes('7')
              ? '#fde68a' : '#fecaca'}`,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Detection Rate</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: summary.trackingQuality.detectionRate.includes('8') || summary.trackingQuality.detectionRate.includes('9') 
                ? '#166534' : summary.trackingQuality.detectionRate.includes('6') || summary.trackingQuality.detectionRate.includes('7')
                ? '#a16207' : '#dc2626'
            }}>
              {summary.trackingQuality.detectionRate}
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Detections</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.trackingQuality.totalDetections}</div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Interpolated</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.trackingQuality.interpolatedFrames}</div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Trajectory Points</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.trackingQuality.trajectoryLength}</div>
          </div>
        </div>
      </div>

      {/* Method Breakdown */}
      {Object.keys(summary.methodBreakdown).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#374151', marginBottom: '10px' }}>Detection Methods Used</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginBottom: '15px'
          }}>
            {Object.entries(summary.methodBreakdown).map(([method, count]) => (
              <div key={method} style={{ 
                padding: '6px 12px', 
                backgroundColor: '#e0e7ff', 
                color: '#3730a3',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {method}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Analysis */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>Confidence Analysis</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '10px'
        }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Average</div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>{summary.confidence.average}</div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Range</div>
            <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '11px' }}>{summary.confidence.range}</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>Recommendations</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recommendations.map((rec, index) => (
            <div key={index} style={{ 
              padding: '10px', 
              backgroundColor: rec.type === 'success' ? '#f0fdf4' : 
                              rec.type === 'warning' ? '#fefce8' : '#eff6ff',
              border: `1px solid ${rec.type === 'success' ? '#bbf7d0' : 
                              rec.type === 'warning' ? '#fde68a' : '#bfdbfe'}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                fontSize: '16px',
                color: rec.type === 'success' ? '#16a34a' : 
                       rec.type === 'warning' ? '#ca8a04' : '#2563eb'
              }}>
                {rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span style={{ 
                fontSize: '13px',
                color: rec.type === 'success' ? '#166534' : 
                       rec.type === 'warning' ? '#a16207' : '#1e40af'
              }}>
                {rec.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Download Button */}
      {onDownloadVideo && trackingId && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onDownloadVideo(trackingId)}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#6d28d9';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#7c3aed';
              e.target.style.transform = 'scale(1)';
            }}
          >
            📥 Download Tracked Video
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackingResults;
