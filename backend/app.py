from flask import Flask
from flask_cors import CORS
from api.routes import api
from config import Config

def create_app(config_class=Config):
    """Create and configure the Flask application.
    
    Args:
        config_class: Configuration class
        
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    @app.route('/')
    def index():
        return {
            'status': 'ok',
            'message': 'YouTube Transcript Downloader API is running'
        }
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
