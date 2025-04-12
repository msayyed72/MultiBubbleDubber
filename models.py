from datetime import datetime
from app import db
import uuid


def generate_job_id():
    """Generate a unique job ID"""
    return str(uuid.uuid4())


class VideoJob(db.Model):
    """Model for video processing jobs"""
    id = db.Column(db.String(36), primary_key=True, default=generate_job_id)
    original_filename = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed, cancelled
    progress = db.Column(db.Integer, default=0)
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Processing details
    target_language = db.Column(db.String(10), nullable=True)
    video_path = db.Column(db.String(255), nullable=True)
    audio_path = db.Column(db.String(255), nullable=True)
    output_path = db.Column(db.String(255), nullable=True)
    transcript = db.Column(db.Text, nullable=True)
    translation = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        """Convert job to dictionary"""
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'status': self.status,
            'progress': self.progress,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'target_language': self.target_language,
            'has_output': bool(self.output_path),
            'transcript': self.transcript,
            'translation': self.translation
        }


class ProcessingStage(db.Model):
    """Model for tracking individual processing stages"""
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(36), db.ForeignKey('video_job.id'), nullable=False)
    stage_name = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    progress = db.Column(db.Integer, default=0)
    message = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Define relationship with VideoJob
    job = db.relationship('VideoJob', backref=db.backref('stages', lazy=True))
    
    def to_dict(self):
        """Convert stage to dictionary"""
        return {
            'id': self.id,
            'job_id': self.job_id,
            'stage_name': self.stage_name,
            'status': self.status,
            'progress': self.progress,
            'message': self.message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }