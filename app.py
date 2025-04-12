import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create SQLAlchemy base class
class Base(DeclarativeBase):
    pass

# Initialize SQLAlchemy
db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)

# Configure app
app.secret_key = os.environ.get("SESSION_SECRET", "videodubber_secret_key")

# Configure database
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    # Fallback to SQLite if no database URL is provided
    database_url = "sqlite:///videodubber.db"
    app.logger.warning("No DATABASE_URL found, using SQLite database")

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PROCESSED_FOLDER'] = 'processed'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max upload size
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'}

# Configure error logging
if not app.debug:
    import logging
    from logging.handlers import RotatingFileHandler
    
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    file_handler = RotatingFileHandler('logs/videodubber.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('VideoDubber startup')

# Initialize the database with the app
db.init_app(app)

# Ensure upload and processed directories exist
for folder in [app.config['UPLOAD_FOLDER'], app.config['PROCESSED_FOLDER']]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Create database tables within app context
with app.app_context():
    # Import models here to avoid circular imports
    import models  # noqa: F401
    
    # Create tables
    db.create_all()