# AIVO Learning Backend v5.0

**Python FastAPI Backend** for AIVO Learning - AI-Powered Personalized Learning Platform

## 🚀 Overview

High-performance backend system powering AIVO Learning's Virtual Brain AI, content adaptation, speech analysis, and real-time learning features.

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

## 🏗️ Architecture

```
backend/
├── app/                    # Main application code
├── api/                    # API routes and endpoints
│   ├── routes/            # REST API routes
│   ├── websockets/        # WebSocket handlers
│   ├── middleware/        # Custom middleware
│   └── dependencies/      # Dependency injection
├── agents/                 # AI Agent implementations
│   ├── virtual_brain/     # Virtual Brain agent
│   ├── tutor/            # AI Tutor agent
│   ├── content/          # Content adaptation agent
│   ├── assessment/       # Assessment agent
│   └── speech/           # Speech analysis agent
├── ml/                     # Machine Learning models
│   ├── models/           # ML model implementations
│   ├── pipelines/        # Training/inference pipelines
│   ├── features/         # Feature engineering
│   └── adaptation/       # Adaptive learning algorithms
├── core/                   # Core functionality
│   ├── auth/             # Authentication
│   ├── config/           # Configuration management
│   ├── security/         # Security utilities
│   └── exceptions/       # Custom exceptions
├── db/                     # Database layer
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── repositories/     # Data access layer
│   └── migrations/       # Alembic migrations
├── services/               # External services
│   ├── email/            # Email service
│   ├── storage/          # File storage (S3)
│   ├── cache/            # Redis caching
│   └── queue/            # Celery task queue
└── tests/                  # Test suites
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── e2e/              # End-to-end tests
```

## 🔧 Installation

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/artpromedia/aivo-v5.git
cd aivo-v5/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database**
```bash
# Run migrations
alembic upgrade head

# Seed initial data (optional)
python scripts/seed_data.py
```

6. **Run the server**
```bash
uvicorn main:app --reload --port 8000
```

Server will be available at `http://localhost:8000`

### Docker Deployment

1. **Build and start services**
```bash
docker-compose up -d
```

2. **View logs**
```bash
docker-compose logs -f backend
```

3. **Stop services**
```bash
docker-compose down
```

## 📡 API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔑 Key Features

### Virtual Brain AI
- Personalized learning agent for each student
- Adaptive difficulty adjustment
- Learning style recognition
- Multi-modal content delivery

### Speech Analysis
- Real-time articulation assessment
- Phoneme accuracy scoring
- Speech pattern recognition
- Progress tracking

### Content Adaptation
- Dynamic difficulty scaling
- Learning path optimization
- Multi-sensory content generation
- Accessibility adaptations

### Real-time Features
- WebSocket connections for live sessions
- Collaborative learning
- Instant feedback
- Progress synchronization

## 🧪 Testing

Run tests with pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test suite
pytest tests/unit
pytest tests/integration

# Run with verbose output
pytest -v
```

## 🔐 Security

- JWT-based authentication
- OAuth 2.0 integration (Google, GitHub)
- Rate limiting
- CORS protection
- Input validation with Pydantic
- SQL injection prevention
- XSS protection

## 📊 Monitoring

- **Prometheus metrics**: http://localhost:8000/metrics
- **Health check**: http://localhost:8000/health
- **Sentry error tracking**
- **Structured logging with structlog**

## 🔄 Task Queue (Celery)

Monitor background tasks:
- **Flower dashboard**: http://localhost:5555

Common tasks:
- Email sending
- ML model training
- Report generation
- Data export

## 🗄️ Database

### Run Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Database Schema

Manages:
- User accounts and profiles
- Learning progress
- Agent states
- Content library
- Assessment results
- Speech analysis data

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=false` in `.env`
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure production database
- [ ] Set up Redis for caching
- [ ] Configure S3 for file storage
- [ ] Set up monitoring (Sentry)
- [ ] Enable SSL/TLS
- [ ] Configure rate limiting
- [ ] Set up backups
- [ ] Configure CDN for static assets

### Environment Variables

See `.env.example` for all required variables. Key configurations:

```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key

# Optional but recommended
SENTRY_DSN=your-sentry-dsn
AWS_ACCESS_KEY_ID=your-aws-key
SENDGRID_API_KEY=your-sendgrid-key
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

### Code Quality

```bash
# Format code
black .
isort .

# Lint
flake8
pylint app/

# Type checking
mypy app/

# Security scan
bandit -r app/
```

## 📝 API Rate Limits

Default rate limits:
- **Anonymous**: 60 requests/minute
- **Authenticated**: 300 requests/minute
- **Premium**: 1000 requests/minute

## 🔗 Related Documentation

- [Frontend Documentation](../apps/web/README.md)
- [Mobile App Documentation](../mobile/README.md)
- [Deployment Guide](../docs/deployment.md)
- [API Reference](./docs/api-reference.md)

## 📄 License

Proprietary - AIVO Learning © 2025

## 👥 Support

- **Email**: dev@aivolearning.com
- **Issues**: [GitHub Issues](https://github.com/artpromedia/aivo-v5/issues)
- **Documentation**: [docs.aivolearning.com](https://docs.aivolearning.com)

---

**Built with ❤️ by the AIVO Learning Team**

Last Updated: November 23, 2025 | Version: 5.0.0
