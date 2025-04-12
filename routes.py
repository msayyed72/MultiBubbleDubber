import os
import time
import threading
import uuid
from datetime import datetime
from functools import wraps
from flask import render_template, request, jsonify, url_for, send_from_directory, abort
from werkzeug.utils import secure_filename

from app import app, db
from models import VideoJob, ProcessingStage
from utils import transcribe_video, translate_text, generate_speech, merge_audio_video, clean_temp_files

# Cache control decorator
def nocache(view):
    @wraps(view)
    def no_cache(*args, **kwargs):
        response = view(*args, **kwargs)
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response
    return no_cache

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/')
def index():
    """Render the main application page"""
    languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh-CN': 'Chinese (Simplified)'
    }
    return render_template('index.html', languages=languages)

@app.route('/api/upload', methods=['POST'])
def upload_video():
    """Handle video upload and start processing"""
    # Check if the post request has the file part
    if 'video' not in request.files:
        return jsonify({'error': 'No video part'}), 400
    
    file = request.files['video']
    target_lang = request.form.get('language', 'en')
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Create a new job
            job = VideoJob(
                original_filename=secure_filename(file.filename),
                target_language=target_lang,
                status='pending'
            )
            db.session.add(job)
            
            # Create processing stages
            stages = [
                ProcessingStage(job_id=job.id, stage_name='extracting', message='Extracting audio from video'),
                ProcessingStage(job_id=job.id, stage_name='transcribing', message='Transcribing audio to text'),
                ProcessingStage(job_id=job.id, stage_name='translating', message='Translating text'),
                ProcessingStage(job_id=job.id, stage_name='generating', message='Generating speech from translation'),
                ProcessingStage(job_id=job.id, stage_name='merging', message='Merging audio with video')
            ]
            db.session.add_all(stages)
            db.session.commit()
            
            # Save the uploaded file
            video_filename = f"{job.id}_{secure_filename(file.filename)}"
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
            file.save(video_path)
            
            # Update job with video path
            job.video_path = video_path
            job.status = 'processing'
            job.progress = 0
            job.message = 'Processing started'
            db.session.commit()
            
            # Start processing in a separate thread
            threading.Thread(
                target=process_video,
                args=(job.id, video_path, target_lang)
            ).start()
            
            return jsonify({
                'job_id': job.id,
                'status': job.status,
                'message': job.message
            }), 202
            
        except Exception as e:
            app.logger.error(f"Error uploading video: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/status/<job_id>', methods=['GET'])
def job_status(job_id):
    """Get the status of a processing job"""
    job = VideoJob.query.get_or_404(job_id)
    stages = ProcessingStage.query.filter_by(job_id=job_id).all()
    
    return jsonify({
        'job': job.to_dict(),
        'stages': [stage.to_dict() for stage in stages]
    })

@app.route('/download/<job_id>', methods=['GET'])
@nocache
def download_video(job_id):
    """Download the processed video"""
    job = VideoJob.query.get_or_404(job_id)
    
    if job.status != 'completed' or not job.output_path:
        abort(404)
    
    directory = os.path.dirname(job.output_path)
    filename = os.path.basename(job.output_path)
    
    # If the filename is empty or the directory doesn't match our processed folder, abort
    if not filename or directory != app.config['PROCESSED_FOLDER']:
        abort(404)
    
    # Create a more descriptive filename for the download
    download_name = f"dubbed_{job.original_filename}"
    
    return send_from_directory(
        directory, 
        filename,
        as_attachment=True,
        download_name=download_name
    )

@app.route('/api/cancel/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """Cancel a processing job"""
    job = VideoJob.query.get_or_404(job_id)
    
    if job.status in ['completed', 'failed', 'cancelled']:
        return jsonify({'message': f'Job already {job.status}'}), 400
    
    # Mark the job as cancelled
    job.status = 'cancelled'
    job.message = 'Processing cancelled by user'
    db.session.commit()
    
    # Clean up any temporary files
    clean_temp_files(job_id)
    
    return jsonify({'message': 'Job cancelled successfully'})

# Processing functions
def update_job_progress(job_id, progress, message, status='processing'):
    """Update the progress of a job"""
    try:
        job = VideoJob.query.get(job_id)
        if not job:
            app.logger.error(f"Job {job_id} not found")
            return
        
        # Don't update if job was cancelled
        if job.status == 'cancelled':
            return
        
        job.progress = progress
        job.message = message
        job.status = status
        job.updated_at = datetime.utcnow()
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Error updating job progress: {str(e)}")

def update_stage_status(job_id, stage_name, status, progress=0, message=None):
    """Update the status of a processing stage"""
    try:
        stage = ProcessingStage.query.filter_by(job_id=job_id, stage_name=stage_name).first()
        if not stage:
            app.logger.error(f"Stage {stage_name} for job {job_id} not found")
            return
        
        stage.status = status
        stage.progress = progress
        
        if message:
            stage.message = message
        
        if status == 'processing' and not stage.started_at:
            stage.started_at = datetime.utcnow()
        elif status in ['completed', 'failed']:
            stage.completed_at = datetime.utcnow()
        
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Error updating stage status: {str(e)}")

def process_video(job_id, video_path, target_lang):
    """Process the uploaded video (run in a separate thread)"""
    try:
        app.logger.info(f"Starting video processing for job {job_id}")
        
        # Step 1: Extract audio and transcribe video
        update_stage_status(job_id, 'extracting', 'processing')
        update_job_progress(job_id, 10, "Extracting audio from video...")
        
        # Simulate processing time (would be done by transcribe_video)
        time.sleep(1)
        
        update_stage_status(job_id, 'extracting', 'completed', 100)
        update_stage_status(job_id, 'transcribing', 'processing')
        update_job_progress(job_id, 20, "Transcribing audio to text...")
        
        # Transcribe video audio to text
        transcript = transcribe_video(video_path)
        if not transcript:
            raise Exception("Failed to transcribe video")
        
        # Update job with transcript
        job = VideoJob.query.get(job_id)
        job.transcript = transcript
        db.session.commit()
        
        update_stage_status(job_id, 'transcribing', 'completed', 100)
        update_stage_status(job_id, 'translating', 'processing')
        update_job_progress(job_id, 40, "Translating transcript...")
        
        # Step 2: Translate the transcript
        translated_text = translate_text(transcript, target_lang)
        if not translated_text:
            raise Exception("Failed to translate text")
        
        # Update job with translation
        job = VideoJob.query.get(job_id)
        job.translation = translated_text
        db.session.commit()
        
        update_stage_status(job_id, 'translating', 'completed', 100)
        update_stage_status(job_id, 'generating', 'processing')
        update_job_progress(job_id, 60, "Generating speech from translation...")
        
        # Step 3: Generate speech from translated text
        audio_filename = f"{job_id}_audio.mp3"
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)
        success = generate_speech(translated_text, target_lang, audio_path)
        if not success:
            raise Exception("Failed to generate speech")
        
        # Update job with audio path
        job = VideoJob.query.get(job_id)
        job.audio_path = audio_path
        db.session.commit()
        
        update_stage_status(job_id, 'generating', 'completed', 100)
        update_stage_status(job_id, 'merging', 'processing')
        update_job_progress(job_id, 80, "Merging audio with video...")
        
        # Step 4: Merge audio with video
        output_filename = f"{job_id}_output.mp4"
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)
        success = merge_audio_video(video_path, audio_path, output_path)
        if not success:
            raise Exception("Failed to merge audio with video")
        
        # Update job with output path
        job = VideoJob.query.get(job_id)
        job.output_path = output_path
        db.session.commit()
        
        update_stage_status(job_id, 'merging', 'completed', 100)
        update_job_progress(
            job_id, 
            100, 
            "Processing completed successfully", 
            status='completed'
        )
        
        app.logger.info(f"Video processing completed for job {job_id}")
        
    except Exception as e:
        app.logger.error(f"Error processing video: {str(e)}")
        
        # Mark all active stages as failed
        for stage in ProcessingStage.query.filter_by(job_id=job_id, status='processing').all():
            update_stage_status(job_id, stage.stage_name, 'failed', message=str(e))
        
        # Mark job as failed
        update_job_progress(
            job_id, 
            0, 
            f"Processing failed: {str(e)}", 
            status='failed'
        )