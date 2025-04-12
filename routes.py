import os
import uuid
import time
import json
import logging
import threading
from flask import render_template, request, redirect, url_for, jsonify, send_from_directory, session, flash
from werkzeug.utils import secure_filename
from app import app
from utils import transcribe_video, translate_text, generate_speech, merge_audio_video, clean_temp_files

# Dict to track job status
processing_jobs = {}

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html', languages=app.config['SUPPORTED_LANGUAGES'])

@app.route('/upload', methods=['POST'])
def upload_video():
    """Handle video upload and start processing"""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({'error': 'No video file selected'}), 400

    if not allowed_file(video_file.filename):
        return jsonify({'error': 'Invalid file format. Please upload a video file.'}), 400

    target_lang = request.form.get('language', 'en')
    if target_lang not in app.config['SUPPORTED_LANGUAGES']:
        return jsonify({'error': 'Unsupported target language'}), 400

    # Generate unique ID for this job
    job_id = str(uuid.uuid4())
    
    # Create unique filename to avoid collisions
    filename = f"{job_id}_{secure_filename(video_file.filename)}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Save uploaded file
    video_file.save(filepath)
    
    # Initialize job status
    processing_jobs[job_id] = {
        'status': 'processing',
        'progress': 0,
        'message': 'Starting processing...',
        'original_filename': video_file.filename,
        'input_path': filepath,
        'output_path': None,
        'target_language': target_lang
    }
    
    # Start processing in background thread
    thread = threading.Thread(target=process_video, args=(job_id, filepath, target_lang))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'job_id': job_id,
        'status': 'processing',
        'message': 'Video processing started'
    })

@app.route('/status/<job_id>')
def job_status(job_id):
    """Get the status of a processing job"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify(processing_jobs[job_id])

@app.route('/download/<job_id>')
def download_video(job_id):
    """Download the processed video"""
    if job_id not in processing_jobs:
        flash('Job not found', 'error')
        return redirect(url_for('index'))
    
    job = processing_jobs[job_id]
    if job['status'] != 'completed':
        flash('Video processing not yet complete', 'error')
        return redirect(url_for('index'))
    
    # Get the filename from the output path
    output_filename = os.path.basename(job['output_path'])
    
    # Send the file from the processed folder
    return send_from_directory(
        app.config['PROCESSED_FOLDER'],
        output_filename,
        as_attachment=True,
        download_name=f"dubbed_{job['original_filename']}"
    )

@app.route('/cancel/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """Cancel a processing job"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = processing_jobs[job_id]
    job['status'] = 'cancelled'
    job['message'] = 'Job cancelled by user'
    
    # Clean up temporary files
    clean_temp_files(job_id)
    
    return jsonify({'status': 'cancelled'})

def allowed_file(filename):
    """Check if file has an allowed extension"""
    ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def update_job_progress(job_id, progress, message, status='processing'):
    """Update the progress of a job"""
    if job_id in processing_jobs:
        processing_jobs[job_id].update({
            'progress': progress,
            'message': message,
            'status': status
        })
        logging.debug(f"Job {job_id}: {status} - {progress}% - {message}")

def process_video(job_id, video_path, target_lang):
    """Process the uploaded video (run in a separate thread)"""
    job = processing_jobs[job_id]
    
    try:
        # Step 1: Transcribe the video
        update_job_progress(job_id, 10, "Transcribing audio...")
        transcription = transcribe_video(video_path)
        if not transcription:
            raise Exception("Failed to transcribe video audio")
        
        # Step 2: Translate the transcription
        update_job_progress(job_id, 30, "Translating text...")
        translated_text = translate_text(transcription, target_lang)
        if not translated_text:
            raise Exception("Failed to translate text")
        
        # Step 3: Generate speech from translated text
        update_job_progress(job_id, 50, "Generating speech audio...")
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_speech.mp3")
        speech_generated = generate_speech(translated_text, target_lang, audio_path)
        if not speech_generated:
            raise Exception("Failed to generate speech audio")
        
        # Step 4: Merge the new audio with the original video
        update_job_progress(job_id, 70, "Merging audio with video...")
        output_filename = f"dubbed_{job_id}.mp4"
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)
        merge_successful = merge_audio_video(video_path, audio_path, output_path)
        if not merge_successful:
            raise Exception("Failed to merge audio with video")
        
        # Update job status to completed
        processing_jobs[job_id].update({
            'status': 'completed',
            'progress': 100,
            'message': 'Video processing completed',
            'output_path': output_path
        })
        
    except Exception as e:
        logging.error(f"Error processing video: {str(e)}")
        processing_jobs[job_id].update({
            'status': 'failed',
            'message': f"Error: {str(e)}"
        })
        
        # Clean up temporary files
        clean_temp_files(job_id)
