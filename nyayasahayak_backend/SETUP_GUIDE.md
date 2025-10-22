# NyayaSahayak Backend - Quick Setup Guide

## Quick Start (3 Steps)

### 1. Install Dependencies
```bash
cd nyayasahayak_backend
poetry install
```

### 2. Add OpenRouter API Key
```bash
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

### 3. Start the Server
```bash
poetry run fastapi dev app/main.py
```

Server will be available at: http://localhost:8000

## First Time Setup

After starting the server, you need to index the legal cases dataset:

```bash
curl -X POST http://localhost:8000/api/v1/index
```

**Note**: This will take 10-30 minutes depending on your hardware. It only needs to be done once.

## Testing the Backend

Run the test script:
```bash
poetry run python test_api.py
```

Or test manually:
```bash
# Check health
curl http://localhost:8000/health

# Check status
curl http://localhost:8000/status

# Get suggestions
curl "http://localhost:8000/api/v1/suggestions?query=article"

# Process a query (after indexing)
curl -X POST http://localhost:8000/api/v1/legal-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain Article 21", "use_agentic": true}'
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Frontend Integration

The backend is ready to connect with your existing frontend. Update the frontend's API base URL to:
```
http://localhost:8000
```

The backend already has CORS enabled for all origins.

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | System status |
| `/api/v1/index` | POST | Index cases (run once) |
| `/api/v1/legal-query` | POST | Process legal query |
| `/api/v1/suggestions` | GET | Get query suggestions |
| `/api/v1/case/{id}` | GET | Get case details |

## Troubleshooting

**Problem**: "System not ready" error  
**Solution**: Run the indexing endpoint first

**Problem**: "OpenRouter API key not configured"  
**Solution**: Add your API key to `.env` file

**Problem**: Slow responses  
**Solution**: Use `"use_agentic": false` for faster responses

For more details, see the main README.md file.
