# Ball Tracking Setup Guide

This guide will help you set up the enhanced ping pong ball tracking system for CMU Compete.

## Overview

The ball tracking system uses computer vision to analyze ping pong videos and track ball movement. It includes:

- **Multiple detection methods**: White ball detection, motion detection, and blob detection
- **Intelligent fusion**: Combines results from different detection methods for better accuracy
- **Position interpolation**: Predicts ball position when detection fails
- **Real-time processing**: Processes videos with progress updates
- **Results analysis**: Provides detailed statistics and recommendations

## Prerequisites

- Python 3.7 or higher
- Node.js and npm (for the React frontend)
- OpenCV-compatible system (most modern systems)

## Setup Instructions

### 1. Install Python Dependencies

The ball tracking service requires several Python packages. Run the following commands:

```bash
# Navigate to the project directory
cd /Users/stavyagaonkar/cmucompete3/cmu-compete

# Create a virtual environment (recommended)
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Start the Ball Tracking Service

Use the provided startup script:

```bash
# Make the script executable (if not already done)
chmod +x start-tracking-service.sh

# Start the service
./start-tracking-service.sh
```

Or start manually:

```bash
# Activate virtual environment
source venv/bin/activate

# Start the Flask API service
python src/services/tracking_api.py
```

The service will start on `http://localhost:5001`.

### 3. Start the React Frontend

In a new terminal window:

```bash
# Navigate to the project directory
cd /Users/stavyagaonkar/cmucompete3/cmu-compete

# Install Node.js dependencies (if not already done)
npm install

# Start the React development server
npm start
```

The frontend will start on `http://localhost:3000`.

## Usage

### Uploading Videos with Ball Tracking

1. Open the CMU Compete application in your browser
2. Navigate to the video upload section
3. Select a video file (supports MP4, AVI, MOV, MKV, WebM)
4. Check "Enable Ball Tracking Analysis"
5. Click "Upload Video"

The system will:

- Upload the video to Firebase Storage
- Process it with the ball tracking algorithm
- Save tracking results to Firestore
- Display progress and results

### Testing the Service

Use the "Test Ball Tracking" button in the upload interface to verify the service is running.

## API Endpoints

The ball tracking service provides the following endpoints:

- `GET /health` - Health check
- `POST /track-video` - Process video for ball tracking
- `GET /download-tracked-video/{tracking_id}` - Download processed video
- `GET /tracking-results/{tracking_id}` - Get tracking results
- `DELETE /cleanup/{tracking_id}` - Clean up temporary files

## Tracking Results

The system provides detailed tracking data including:

- **Detection Rate**: Percentage of frames where the ball was detected
- **Trajectory**: Complete path of ball movement
- **Method Statistics**: Which detection methods were most effective
- **Confidence Scores**: Quality assessment of each detection
- **Video Analysis**: Frame-by-frame tracking data

## Troubleshooting

### Common Issues

1. **"Ball tracking service is not available"**

   - Ensure the Python service is running on port 5001
   - Check that all dependencies are installed
   - Verify the virtual environment is activated

2. **"OpenCV import error"**

   - Reinstall OpenCV: `pip uninstall opencv-python && pip install opencv-python`
   - On some systems, try: `pip install opencv-contrib-python`

3. **"Permission denied" errors**

   - Ensure the startup script is executable: `chmod +x start-tracking-service.sh`
   - Check file permissions for temp_uploads and temp_outputs directories

4. **Low detection rates**
   - Ensure good lighting in the video
   - Check that the ball is visible and not too blurry
   - Try different video formats or resolutions

### Performance Optimization

- For large videos, consider reducing resolution or frame rate
- The system automatically cleans up temporary files
- Processing time depends on video length and complexity

## File Structure

```
src/
├── services/
│   ├── ballTracker.py          # Main tracking algorithm
│   ├── tracking_api.py         # Flask API service
│   └── ballTrackingService.js  # React service client
├── components/
│   └── VideoUpload.js          # Updated upload component
├── temp_uploads/               # Temporary upload directory
├── temp_outputs/               # Temporary output directory
├── requirements.txt            # Python dependencies
└── start-tracking-service.sh   # Startup script
```

## Advanced Configuration

### Customizing Detection Parameters

You can modify detection parameters in `src/services/ballTracker.py`:

- Ball size range (min/max area)
- Detection thresholds
- Interpolation settings
- Method weights

### Adding New Detection Methods

The system is designed to be extensible. You can add new detection methods by:

1. Creating a new detection function
2. Adding it to the `track_ball()` method
3. Including it in the `combine_detections()` function

## Support

For issues or questions about the ball tracking system:

1. Check the console logs for error messages
2. Verify all services are running correctly
3. Test with a simple, well-lit ping pong video first
4. Check the troubleshooting section above

## Technical Details

### Detection Methods

1. **White Ball Detection**: Uses HSV color space and brightness thresholds
2. **Motion Detection**: Tracks frame-to-frame differences
3. **Blob Detection**: Uses OpenCV's blob detector with circularity filters

### Fusion Algorithm

The system combines results using:

- Confidence-weighted averaging
- Distance-based clustering
- Method reliability scoring

### Interpolation

When detection fails, the system:

- Uses velocity-based prediction
- Applies spatial constraints
- Maintains trajectory continuity
