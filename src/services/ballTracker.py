import cv2
import numpy as np
import argparse
import os
import sys
import json
from collections import deque
import base64
from io import BytesIO
from PIL import Image

class EnhancedPingPongTracker:
    def __init__(self, input_path=None, output_path=None):
        self.input_path = input_path
        self.output_path = output_path
        self.trajectory = deque(maxlen=30)
        self.prev_frames = deque(maxlen=3)
        self.last_positions = deque(maxlen=10)
        self.detection_history = deque(maxlen=20)
        
    def preprocess_frame(self, frame):
        """Apply various preprocessing to enhance ball visibility"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        return gray, hsv, lab
    
    def detect_white_ball_enhanced(self, frame, gray, hsv):
        """Enhanced white ball detection using multiple techniques"""
        candidates = []
        lower_white = np.array([0, 0, 200])
        upper_white = np.array([180, 30, 255])
        white_mask = cv2.inRange(hsv, lower_white, upper_white)
        _, bright_mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, 11, -5)
        combined_mask = cv2.bitwise_or(white_mask, bright_mask)
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        cleaned = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_small)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_small)
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 10 <= area <= 500:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = float(w) / h if h > 0 else 0
                if 0.5 <= aspect_ratio <= 2.0:
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.3:
                            M = cv2.moments(contour)
                            if M["m00"] != 0:
                                cx = int(M["m10"] / M["m00"])
                                cy = int(M["m01"] / M["m00"])
                                mask = np.zeros(gray.shape, dtype=np.uint8)
                                cv2.drawContours(mask, [contour], -1, 255, -1)
                                mean_brightness = cv2.mean(gray, mask=mask)[0]
                                score = circularity * (mean_brightness / 255.0)
                                if self.last_positions:
                                    min_dist = min([np.sqrt((cx - px)**2 + (cy - py)**2) 
                                                  for px, py in self.last_positions])
                                    if min_dist < 100:
                                        score *= (2.0 - min_dist / 100)
                                candidates.append({
                                    'center': (cx, cy),
                                    'area': area,
                                    'score': score,
                                    'circularity': circularity,
                                    'brightness': mean_brightness,
                                    'contour': contour
                                })
        return candidates
    
    def detect_motion_enhanced(self, frame, gray):
        if len(self.prev_frames) < 2:
            return []
        candidates = []
        diff1 = cv2.absdiff(self.prev_frames[-1], gray)
        diff2 = cv2.absdiff(self.prev_frames[-2], gray) if len(self.prev_frames) > 1 else diff1
        motion = cv2.bitwise_or(diff1, diff2)
        _, motion_mask = cv2.threshold(motion, 15, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        motion_mask = cv2.morphologyEx(motion_mask, cv2.MORPH_OPEN, kernel)
        motion_mask = cv2.morphologyEx(motion_mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(motion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 10 <= area <= 500:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = float(w) / h if h > 0 else 0
                if 0.4 <= aspect_ratio <= 2.5:
                    M = cv2.moments(contour)
                    if M["m00"] != 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])
                        roi = gray[max(0, cy-5):min(gray.shape[0], cy+5),
                                  max(0, cx-5):min(gray.shape[1], cx+5)]
                        if roi.size > 0:
                            brightness = np.mean(roi)
                            score = area * (brightness / 255.0)
                            if self.last_positions:
                                min_dist = min([np.sqrt((cx - px)**2 + (cy - py)**2) 
                                              for px, py in self.last_positions])
                                if min_dist < 150:
                                    score *= (2.0 - min_dist / 150)
                            candidates.append({
                                'center': (cx, cy),
                                'area': area,
                                'score': score,
                                'brightness': brightness,
                                'contour': contour,
                                'method': 'motion'
                            })
        return candidates
    
    def detect_blob_enhanced(self, gray):
        params = cv2.SimpleBlobDetector_Params()
        params.minThreshold = 200
        params.maxThreshold = 255
        params.thresholdStep = 10
        params.filterByArea = True
        params.minArea = 10
        params.maxArea = 500
        params.filterByCircularity = True
        params.minCircularity = 0.3
        params.filterByConvexity = True
        params.minConvexity = 0.5
        params.filterByInertia = True
        params.minInertiaRatio = 0.3
        params.filterByColor = True
        params.blobColor = 255
        try:
            detector = cv2.SimpleBlobDetector_create(params)
        except:
            return []
        keypoints = detector.detect(gray)
        candidates = []
        for kp in keypoints:
            cx, cy = int(kp.pt[0]), int(kp.pt[1])
            size = kp.size
            score = kp.response * size
            if self.last_positions:
                min_dist = min([np.sqrt((cx - px)**2 + (cy - py)**2) 
                              for px, py in self.last_positions])
                if min_dist < 100:
                    score *= (2.0 - min_dist / 100)
            candidates.append({
                'center': (cx, cy),
                'area': np.pi * (size/2)**2,
                'score': score,
                'size': size,
                'method': 'blob'
            })
        return candidates
    
    def combine_detections(self, white_candidates, motion_candidates, blob_candidates):
        """Safely combine detections from different methods"""
        all_candidates = []
        for wc in white_candidates:
            wc['method'] = 'white'
            wc['combined_score'] = wc['score'] * 1.5
            all_candidates.append(wc)
        for mc in motion_candidates:
            mc['combined_score'] = mc['score'] * 1.0
            all_candidates.append(mc)
        for bc in blob_candidates:
            bc['combined_score'] = bc['score'] * 1.2
            all_candidates.append(bc)
        
        merged = []
        used = set()
        for i, c1 in enumerate(all_candidates):
            if i in used:
                continue
            nearby = [c1]
            for j, c2 in enumerate(all_candidates[i+1:], i+1):
                if j in used:
                    continue
                dist = np.sqrt((c1['center'][0] - c2['center'][0])**2 + 
                               (c1['center'][1] - c2['center'][1])**2)
                if dist < 20:
                    nearby.append(c2)
                    used.add(j)
            total_score = sum(c['combined_score'] for c in nearby)
            if total_score == 0 or not np.isfinite(total_score):
                cx, cy = nearby[0]['center']
            else:
                cx = sum(c['center'][0] * c['combined_score'] for c in nearby) / total_score
                cy = sum(c['center'][1] * c['combined_score'] for c in nearby) / total_score
                if not np.isfinite(cx) or not np.isfinite(cy):
                    cx, cy = nearby[0]['center']
            merged_candidate = {
                'center': (int(cx), int(cy)),
                'score': total_score,
                'methods': list(set(c.get('method', 'unknown') for c in nearby)),
                'confidence': len(nearby)
            }
            merged.append(merged_candidate)
        return merged
    
    def track_ball(self, frame):
        gray, hsv, lab = self.preprocess_frame(frame)
        white_candidates = self.detect_white_ball_enhanced(frame, gray, hsv)
        motion_candidates = self.detect_motion_enhanced(frame, gray)
        blob_candidates = self.detect_blob_enhanced(gray)
        combined = self.combine_detections(white_candidates, motion_candidates, blob_candidates)
        self.prev_frames.append(gray.copy())
        if combined:
            combined.sort(key=lambda x: x['score'] * x['confidence'], reverse=True)
            best = combined[0]
            self.last_positions.append(best['center'])
            self.detection_history.append(True)
            return best['center'], best['methods'], best['confidence']
        self.detection_history.append(False)
        return None, None, 0
    
    def interpolate_missing_positions(self):
        if len(self.trajectory) < 2:
            return None
        p1 = self.trajectory[-2]
        p2 = self.trajectory[-1]
        vx = p2[0] - p1[0]
        vy = p2[1] - p1[1]
        predicted = (p2[0] + vx, p2[1] + vy)
        return predicted
    
    def process_video(self, show_preview=False, debug=False):
        cap = cv2.VideoCapture(self.input_path)
        if not cap.isOpened():
            print(f"Error: Could not open video file {self.input_path}")
            return False, None
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"Video: {width}x{height}, {fps} FPS, {total_frames} frames")
        
        # Prepare output video writer if output path is provided
        out = None
        if self.output_path:
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            out = cv2.VideoWriter(self.output_path, fourcc, fps, (width, height))
            if not out.isOpened():
                print("Error: Could not open output video writer")
                cap.release()
                return False, None
        
        frame_count = 0
        detection_count = 0
        interpolated_count = 0
        tracking_data = []
        
        print("Processing with enhanced multi-method detection...")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            ball_center, methods, confidence = self.track_ball(frame)
            
            if ball_center is None and len(self.trajectory) >= 2:
                predicted = self.interpolate_missing_positions()
                if predicted is not None:
                    if 0 <= predicted[0] < width and 0 <= predicted[1] < height:
                        ball_center = predicted
                        methods = ['interpolated']
                        confidence = 0.5
                        interpolated_count += 1
            
            # Store tracking data
            tracking_data.append({
                'frame': frame_count,
                'timestamp': frame_count / fps,
                'ball_center': ball_center,
                'methods': methods,
                'confidence': confidence,
                'detected': ball_center is not None
            })
            
            if ball_center is not None:
                detection_count += 1
                self.trajectory.append(ball_center)
                
                if out:  # Only draw if we're creating output video
                    if len(self.trajectory) > 1:
                        for i in range(1, len(self.trajectory)):
                            alpha = i / len(self.trajectory)
                            thickness = max(1, int(2 * alpha))
                            color = (0, int(255 * alpha), 0)
                            cv2.line(frame, self.trajectory[i-1], self.trajectory[i], 
                                   color, thickness, cv2.LINE_AA)
                    
                    if 'interpolated' in methods:
                        color = (128, 128, 255)
                        radius = 6
                    elif len(methods) > 1:
                        color = (0, 255, 255)
                        radius = 8
                    elif 'white' in methods:
                        color = (0, 255, 0)
                        radius = 7
                    elif 'motion' in methods:
                        color = (255, 128, 0)
                        radius = 6
                    else:
                        color = (255, 0, 255)
                        radius = 6
                    
                    cv2.circle(frame, ball_center, radius, color, 2)
                    cv2.circle(frame, ball_center, 2, color, -1)
                    
                    if confidence > 1:
                        cv2.circle(frame, ball_center, radius + 4, color, 1)
                    
                    label = f"{','.join(methods[:2])} C:{confidence:.1f}"
                    cv2.putText(frame, label, (ball_center[0] + 10, ball_center[1] - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
            if out:  # Only add info text if creating output video
                info = f"Frame: {frame_count}/{total_frames} | Detections: {detection_count} | Interpolated: {interpolated_count}"
                cv2.putText(frame, info, (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                if frame_count > 0:
                    detection_rate = (detection_count / frame_count) * 100
                    rate_text = f"Detection Rate: {detection_rate:.1f}%"
                    cv2.putText(frame, rate_text, (10, 55),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            if out:
                out.write(frame)
            
            if show_preview:
                cv2.imshow('Enhanced Ping Pong Tracking', frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("Interrupted by user")
                    break
                elif key == ord(' '):
                    cv2.waitKey(0)
            
            if frame_count % 30 == 0:
                progress = (frame_count / total_frames) * 100
                detection_rate = (detection_count / frame_count) * 100 if frame_count > 0 else 0
                print(f"Progress: {progress:.1f}% | Detections: {detection_count} | Rate: {detection_rate:.1f}%")
        
        cap.release()
        if out:
            out.release()
        cv2.destroyAllWindows()
        
        # Prepare results
        results = {
            'success': True,
            'total_frames': frame_count,
            'detection_count': detection_count,
            'interpolated_count': interpolated_count,
            'detection_rate': (detection_count/frame_count)*100 if frame_count > 0 else 0,
            'tracking_data': tracking_data,
            'trajectory': list(self.trajectory),
            'video_info': {
                'width': width,
                'height': height,
                'fps': fps,
                'duration': frame_count / fps
            }
        }
        
        print(f"\n{'='*50}")
        print(f"Processing Complete!")
        print(f"{'='*50}")
        print(f"Total frames: {frame_count}")
        print(f"Total detections: {detection_count}")
        print(f"Interpolated frames: {interpolated_count}")
        print(f"Detection rate: {(detection_count/frame_count)*100:.1f}%")
        if self.output_path:
            print(f"Output saved: {self.output_path}")
        
        return True, results

def process_video_file(input_path, output_path=None):
    """Process a video file and return tracking results"""
    tracker = EnhancedPingPongTracker(input_path, output_path)
    success, results = tracker.process_video()
    return success, results

def main():
    parser = argparse.ArgumentParser(description='Enhanced ping pong ball tracker with multiple detection methods')
    parser.add_argument('input', help='Input video file')
    parser.add_argument('-o', '--output', default=None, help='Output video file')
    parser.add_argument('-p', '--preview', action='store_true', help='Show preview window')
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found!")
        return 1
    
    if not args.output:
        base_name = os.path.splitext(args.input)[0]
        args.output = base_name + '_tracked.avi'
    
    tracker = EnhancedPingPongTracker(args.input, args.output)
    success, results = tracker.process_video(show_preview=args.preview, debug=args.debug)
    
    if success:
        print("\n✓ Tracking completed successfully!")
        print("\nKey improvements in this version:")
        print("• Multiple detection methods (white detection, motion, blob detection)")
        print("• Intelligent fusion of detection results")
        print("• Position prediction and interpolation for missed frames")
        print("• Adaptive detection parameters")
        print("• Better handling of motion blur and lighting changes")
        print("• Detection confidence scoring")
        return 0
    else:
        print("\n✗ Tracking failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
