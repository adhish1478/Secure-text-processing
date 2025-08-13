# Django Assessment

## Overview

A sophisticated Django-based web application featuring advanced text processing, robust authentication, real-time search capabilities, and automated daily reporting. Built with modern web technologies and best practices for scalability and security.

## Key Features

### Robust Authentication System
- JWT-based authentication with access and refresh tokens
- HttpOnly cookie storage for refresh tokens (XSS protection)
- Token blacklisting on logout for security
- Automatic token refresh with queue management
- Custom user model with UUID primary keys
- Frontend token management with automatic retry logic

### Advanced Text Processing
- Real-time paragraph processing with word position tracking
- Asynchronous task processing using Celery
- Intelligent word search with match counts and positions
- Daily email reports with writing statistics

### Smart Search Algorithm
- Position-based word matching with character-level precision
- Match count ranking for relevance sorting
- Pagination support with configurable page sizes
- Real-time search with debounced input

### Background Task Management
- Celery worker processes for async operations
- Scheduled tasks with crontab configuration
- Retry logic with exponential backoff
- Error handling and logging

## Architecture & Data Structures

### Text Processing

The text processing uses efficient algorithms for word extraction and position tracking:

1. **Regular Expression Tokenization**
   - Uses regex pattern matching to identify word boundaries
   - Handles Unicode characters and apostrophes correctly
   - Linear time complexity - processes text in a single pass
   - More efficient than string splitting for complex word boundaries

2. **Position Tracking**
   - Stores character positions for each word occurrence
   - Enables precise highlighting in search results
   - Uses list comprehension for memory efficiency
   - Faster than manual position calculation

3. **Word Aggregation with DefaultDict**
   - Automatically initializes word counters and position lists
   - Avoids repeated dictionary key checks
   - More efficient than manual dictionary management
   - Reduces code complexity while improving performance

4. **JSON Field Optimization**
   - Converts data structures for database storage
   - Enables efficient querying of word statistics
   - Reduces database storage overhead

### Search Algorithm

The search implementation prioritizes speed and relevance:

1. **Match Detection**
   - Linear search through user paragraphs with early termination
   - Filters results by match count before processing
   - More efficient than full-text search for simple word matching
   - Reduces memory usage by processing only relevant paragraphs

2. **Relevance Sorting**
   - Sorts results by match frequency for better user experience
   - Uses Python's optimized Timsort algorithm
   - Provides consistent ranking across searches

3. **Position Mapping**
   - Creates efficient lookup tables for highlighting
   - Enables real-time word highlighting in frontend
   - Reduces repeated database queries

## Celery Implementation

### Task Configuration

The async processing uses Celery's robust task system:

1. **Async Paragraph Processing**
   - Automatic retry on failures with exponential backoff
   - Prevents data loss during processing errors
   - Handles large text inputs without blocking the web server
   - Provides task status tracking for monitoring

2. **Scheduled Daily Reports**
   - Runs automatically at configured times
   - Aggregates user statistics efficiently
   - Sends personalized email reports
   - Handles multiple users without performance degradation

### Celery Configuration

The system uses Redis as both message broker and result backend:
- Reliable message queuing for task distribution
- Persistent task results for monitoring
- JSON serialization for cross-language compatibility
- Configurable worker processes for horizontal scaling

## Authentication System

### Backend Security Features

1. **JWT Token Management**
   - Short-lived access tokens (15 minutes) for security
   - Long-lived refresh tokens (7 days) stored in HttpOnly cookies
   - Automatic token rotation prevents token reuse
   - Blacklisting prevents compromised token usage

2. **HttpOnly Cookie Implementation**
   - Protects refresh tokens from XSS attacks
   - SameSite attribute prevents CSRF attacks
   - Automatic cookie expiration and cleanup
   - Secure flag for HTTPS environments

3. **Token Blacklisting**
   - Prevents token reuse after logout
   - Database-backed blacklist for persistence
   - Automatic cleanup of expired tokens
   - Maintains security even with token leaks

4. **Custom Token Refresh**
   - Cookie-based refresh instead of request body
   - Reduces token exposure in network traffic
   - Seamless user experience with automatic refresh
   - Prevents token theft through network monitoring

### Frontend Authentication

1. **Queue Management**
   - Prevents multiple simultaneous refresh requests
   - Batches token refresh operations for efficiency
   - Maintains request order during token updates
   - Reduces server load during high traffic

2. **Automatic Retry Logic**
   - Detects expired tokens automatically
   - Refreshes tokens transparently to users
   - Retries failed requests with new tokens
   - Handles network errors gracefully

3. **Debounced Search**
   - Reduces API calls during user typing
   - Improves search responsiveness
   - Optimizes server resource usage
   - Provides smooth user experience

## Setup Instructions

### Prerequisites
- Docker & Docker Compose (recommended)
- Python 3.11+ (manual setup)
- PostgreSQL
- Redis

### Docker Setup (Recommended)

**Step 1: Clone and Navigate**
```bash
git clone <repository-url>
cd "Assessment- backend"
```

**Step 2: Environment Configuration**
Create .env file in backend/:
```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
POSTGRES_DB=project_db
POSTGRES_USER=project_user
POSTGRES_PASSWORD=project_pass
DB_HOST=db
DB_PORT=5432

# Celery Configuration
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Email Configuration (Optional)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Step 3: Build and Start Services**
```bash
# Build all services
docker-compose up --build

# Start services
docker compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

**Step 4: Access the Application**
- Admin Panel: http://localhost:8000/admin/
- Swagger UI: http://localhost:8000/api/swagger/
- ReDoc: http://localhost:8000/api/redoc/

### Manual Setup

**Step 1: Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**Step 2: Install Dependencies**
```bash
pip install -r requirements.txt
```

**Step 3: Database Setup**
```bash
# PostgreSQL setup (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb project_db
sudo -u postgres createuser project_user

# Redis setup
sudo apt-get install redis-server
```

**Step 4: Environment and Migrations**
```bash
# Create .env file (see Docker setup above)
python manage.py migrate
python manage.py createsuperuser
```

**Step 5: Start Services**
```bash
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A project worker --loglevel=info

# Terminal 3: Celery beat (scheduler)
celery -A project beat --loglevel=info --schedule=celerybeat/celerybeat-schedule.db
```

## API Documentation

### Swagger UI Setup

The project uses drf-spectacular for automatic API documentation:

**Access Points**
- Swagger UI: /api/swagger/ - Interactive API explorer
- ReDoc: /api/redoc/ - Alternative documentation view
- OpenAPI Schema: /api/schema/ - Raw JSON schema

**Features**
- Automatic schema generation based on serializers and views
- Interactive testing of API endpoints directly
- JWT token integration for authenticated requests
- Auto-generated request/response examples from models

**Customization**
The API documentation can be customized in settings.py with SPECTACULAR_SETTINGS for branding and functionality.

## API Endpoints

### Authentication (/api/auth/)
- POST /register/ - User registration
- POST /login/ - User login (returns access token)
- POST /logout/ - User logout (blacklists refresh token)
- GET /me/ - Get current user info
- POST /token/refresh/ - Refresh access token (cookie-based)

### Paragraphs (/api/paragraphs/)
- POST /paragraphs/ - Submit new paragraph(s) (async processing)
- GET /paragraphs/ - List user's paragraphs
- GET /paragraphs/search/?word=<term>&page=<num> - Search paragraphs

### Admin Panel
- GET /admin/ - Django admin interface

## Performance Optimizations

### Database
- Indexed UUIDs for fast user lookups
- JSONField for efficient word count storage
- Selective queries with user-scoped paragraph filtering

### Caching
- Redis for Celery broker and result backend
- HttpOnly cookies for secure token storage

### Frontend
- Debounced search with 500ms delay reduces API calls
- Token queue prevents multiple refresh requests
- Polling enables real-time paragraph updates

## Security Features

### Authentication
- JWT tokens for stateless authentication
- HttpOnly cookies for XSS protection of refresh tokens
- Token blacklisting prevents token reuse
- Automatic rotation of refresh tokens

### Data Protection
- User isolation with paragraph scoping
- Server-side input validation
- SQL injection protection through Django ORM

## Deployment Considerations

### Production Checklist
- Set DEBUG=False
- Use strong SECRET_KEY
- Configure ALLOWED_HOSTS
- Enable HTTPS (secure=True in cookies)
- Set up proper email backend
- Configure Redis persistence
- Set up monitoring and logging


