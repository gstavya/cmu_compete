from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
import json
import sys
import time
from werkzeug.utils import secure_filename
from ballTracker import process_video_file
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'temp_uploads')
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'temp_outputs')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Ball tracking API is running',
        'version': '1.0.0'
    })

@app.route('/track-video', methods=['POST'])
def track_video():
    """Process video file for ball tracking"""
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No video file provided'
            }), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No video file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Generate unique filenames
        unique_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        input_filename = f"{unique_id}_{original_filename}"
        output_filename = f"{unique_id}_tracked.avi"
        
        input_path = os.path.join(UPLOAD_FOLDER, input_filename)
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        # Save uploaded file
        file.save(input_path)
        logger.info(f"Saved uploaded file to: {input_path}")
        
        # Process video
        logger.info(f"Starting ball tracking for: {input_filename}")
        success, results = process_video_file(input_path, output_path)
        
        if not success:
            # Clean up input file
            if os.path.exists(input_path):
                os.remove(input_path)
            return jsonify({
                'success': False,
                'error': 'Failed to process video'
            }), 500
        
        # Clean up input file
        if os.path.exists(input_path):
            os.remove(input_path)
        
        # Prepare response
        response_data = {
            'success': True,
            'tracking_id': unique_id,
            'results': results
        }
        
        # If output video was created, include download URL
        if os.path.exists(output_path):
            response_data['output_video_url'] = f'/download-tracked-video/{unique_id}'
        
        logger.info(f"Ball tracking completed successfully for: {unique_id}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/download-tracked-video/<tracking_id>', methods=['GET'])
def download_tracked_video(tracking_id):
    """Download the tracked video"""
    try:
        output_filename = f"{tracking_id}_tracked.avi"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        
        if not os.path.exists(output_path):
            return jsonify({
                'success': False,
                'error': 'Tracked video not found'
            }), 404
        
        return send_file(output_path, as_attachment=True, download_name=f"tracked_{tracking_id}.avi")
        
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Download error: {str(e)}'
        }), 500

@app.route('/tracking-results/<tracking_id>', methods=['GET'])
def get_tracking_results(tracking_id):
    """Get tracking results for a specific tracking ID"""
    try:
        # This would typically be stored in a database
        # For now, we'll return a placeholder
        return jsonify({
            'success': True,
            'tracking_id': tracking_id,
            'message': 'Results endpoint - implement database storage for persistence'
        })
        
    except Exception as e:
        logger.error(f"Error getting results: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error retrieving results: {str(e)}'
        }), 500

@app.route('/cleanup/<tracking_id>', methods=['DELETE'])
def cleanup_files(tracking_id):
    """Clean up temporary files for a tracking session"""
    try:
        output_filename = f"{tracking_id}_tracked.avi"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        if os.path.exists(output_path):
            os.remove(output_path)
            logger.info(f"Cleaned up file: {output_path}")
        
        return jsonify({
            'success': True,
            'message': 'Files cleaned up successfully'
        })
        
    except Exception as e:
        logger.error(f"Error cleaning up files: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Cleanup error: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File too large. Please upload a smaller video file.'
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Clean up old temporary files on startup
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            try:
                if os.path.isfile(file_path):
                    # Remove files older than 1 hour
                    if os.path.getctime(file_path) < (time.time() - 3600):
                        os.remove(file_path)
                        logger.info(f"Cleaned up old file: {file_path}")
            except Exception as e:
                logger.warning(f"Could not clean up file {file_path}: {str(e)}")
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)
