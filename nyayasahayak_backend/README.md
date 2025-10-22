# NyayaSahayak Backend - Advanced Legal AI Assistant

A production-quality backend system for NyayaSahayak, an intelligent Indian legal AI assistant powered by agentic reasoning, RAG (Retrieval-Augmented Generation), and LangGraph workflows.

## Features

- **Agentic Reasoning**: Multi-node LangGraph workflow for sophisticated legal analysis
- **RAG Pipeline**: Vector-based retrieval with ChromaDB for accurate case law search
- **Semantic Search**: Sentence-transformer embeddings for contextual understanding
- **Modular Architecture**: Clean separation of concerns for maintainability
- **FastAPI Backend**: High-performance async API with automatic documentation
- **Expandable Design**: Ready for future enhancements and fine-tuning

## Architecture

The backend is organized into distinct layers:

### 1. Data Layer (`app/modules/data_loader.py`)
- Loads and preprocesses the merged_cases.parquet dataset
- Handles missing values and data validation
- Provides structured access to case metadata

### 2. Embedding Layer (`app/modules/embeddings.py`)
- Uses sentence-transformers for text embeddings
- Default model: `all-MiniLM-L6-v2` (fast and efficient)
- Batch processing support for large datasets

### 3. Vector Database Layer (`app/modules/retriever.py`)
- ChromaDB for persistent vector storage
- Automatic text chunking (1024 tokens with 128 token overlap)
- Efficient similarity search with metadata filtering

### 4. RAG Layer (`app/modules/rag_agent.py`)
- Retrieves relevant cases based on query
- Formats context for LLM consumption
- Generates comprehensive legal responses

### 5. Agentic Workflow Layer (`app/modules/langgraph_workflow.py`)
- **Query Analysis Node**: Extracts legal issues and keywords
- **Retrieval Node**: Fetches relevant judgments from vector DB
- **Summarizer Node**: Summarizes key arguments from cases
- **Legal Analyst Node**: Synthesizes final legal analysis

### 6. API Layer (`app/main.py`)
- RESTful endpoints for frontend integration
- Health checks and system status monitoring
- CORS enabled for cross-origin requests

## Project Structure

```
nyayasahayak_backend/
├── app/
│   ├── main.py                    # FastAPI application & endpoints
│   └── modules/
│       ├── data_loader.py         # Data ingestion & preprocessing
│       ├── embeddings.py          # Embedding model wrapper
│       ├── retriever.py           # Vector database & retrieval
│       ├── rag_agent.py           # RAG pipeline
│       ├── langgraph_workflow.py  # Agentic reasoning workflow
│       └── utils.py               # Utility functions
├── data/
│   └── merged_cases.parquet       # Legal cases dataset
├── vectorstore/                   # ChromaDB persistent storage
├── pyproject.toml                 # Poetry dependencies
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## Installation & Setup

### Prerequisites

- Python 3.12+
- Poetry (for dependency management)
- 4GB+ RAM (for embedding model and vector database)

### Step 1: Install Dependencies

```bash
cd nyayasahayak_backend
poetry install
```

This will install all required packages including:
- FastAPI & Uvicorn
- ChromaDB
- LangChain & LangGraph
- Sentence Transformers
- Pandas & PyArrow
- OpenAI client (for OpenRouter)

### Step 2: Configure OpenRouter API Key

1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

3. Edit `.env` and add your API key:

```
OPENROUTER_API_KEY=your_actual_api_key_here
```

**Note**: The system will work without an API key for indexing and retrieval, but LLM-based query processing requires the key.

### Step 3: Run the Backend

Start the development server:

```bash
poetry run fastapi dev app/main.py
```

The server will start at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## Usage

### Initial Setup: Index the Legal Cases

Before processing queries, you must index the legal cases dataset:

```bash
curl -X POST http://localhost:8000/api/v1/index
```

This process:
1. Loads all cases from `data/merged_cases.parquet`
2. Chunks the text into manageable segments
3. Generates embeddings for each chunk
4. Stores vectors in ChromaDB

**Note**: Indexing may take 10-30 minutes depending on dataset size and hardware. This only needs to be done once.

### Check System Status

```bash
curl http://localhost:8000/status
```

Response:
```json
{
  "system_ready": true,
  "indexed_cases": 15234,
  "api_key_configured": true,
  "message": "System ready"
}
```

### Process Legal Queries

#### Using Agentic Workflow (Recommended)

```bash
curl -X POST http://localhost:8000/api/v1/legal-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain how the Supreme Court interpreted Article 21 in Puttaswamy",
    "use_agentic": true
  }'
```

#### Using Simple RAG

```bash
curl -X POST http://localhost:8000/api/v1/legal-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the ratio decidendi in Maneka Gandhi case?",
    "use_agentic": false
  }'
```

Response format:
```json
{
  "query": "...",
  "answer": "Comprehensive legal analysis...",
  "related_cases": [
    {
      "title": "K.S. Puttaswamy v. Union of India",
      "citation": "2017 10 SCC 1",
      "court": "Supreme Court of India",
      "decision_date": "2017-08-24"
    }
  ],
  "legal_issues": ["Right to Privacy", "Article 21"],
  "reasoning_steps": [
    "Analyzing query for legal issues and keywords",
    "Retrieving relevant legal cases from database",
    "Summarizing key arguments from retrieved cases",
    "Synthesizing legal analysis and generating final answer"
  ],
  "processing_info": {
    "cases_retrieved": 7,
    "cases_analyzed": 5
  }
}
```

### Get Query Suggestions

```bash
curl "http://localhost:8000/api/v1/suggestions?query=article"
```

### Retrieve Specific Case

```bash
curl http://localhost:8000/api/v1/case/42
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/status` | System status and readiness |
| POST | `/api/v1/index` | Index legal cases (run once) |
| POST | `/api/v1/legal-query` | Process legal query |
| GET | `/api/v1/suggestions` | Get query suggestions |
| GET | `/api/v1/case/{id}` | Get specific case details |

## Sample Test Queries

Test the system with these queries:

1. **Constitutional Law**:
   ```
   Compare the reasoning in Kesavananda Bharati and Minerva Mills on the Basic Structure Doctrine
   ```

2. **Fundamental Rights**:
   ```
   Explain how the Supreme Court interpreted Article 21 in Puttaswamy
   ```

3. **Criminal Law**:
   ```
   List cases where sedition laws under IPC Section 124A were challenged
   ```

4. **Freedom of Speech**:
   ```
   Summarize how freedom of speech evolved under Article 19(1)(a)
   ```

5. **Legal Principles**:
   ```
   Identify the ratio decidendi in Maneka Gandhi vs Union of India
   ```

## Performance Optimization

### For Faster Queries (10-15 seconds target)

1. **Use CPU-optimized embedding model**: The default `all-MiniLM-L6-v2` is already optimized for CPU
2. **Adjust chunk size**: Modify `chunk_size` in retriever for faster indexing
3. **Reduce top_k**: Retrieve fewer cases (3-5 instead of 7) for faster processing
4. **Use simple RAG**: Set `use_agentic: false` for faster responses

### For Better Quality

1. **Use larger embedding model**: Switch to `all-mpnet-base-v2` in `embeddings.py`
2. **Increase top_k**: Retrieve more cases for comprehensive analysis
3. **Use agentic workflow**: Set `use_agentic: true` for multi-step reasoning

## Development

### Running Tests

```bash
poetry run pytest tests/
```

### Code Quality

```bash
poetry run black app/
poetry run isort app/
poetry run flake8 app/
```

### Adding New Dependencies

```bash
poetry add package-name
```

## Frontend Integration

The backend is designed to work seamlessly with the existing NyayaSahayak frontend. The frontend should:

1. Check system status on load: `GET /status`
2. Send queries to: `POST /api/v1/legal-query`
3. Get suggestions: `GET /api/v1/suggestions?query={partial_query}`

CORS is already configured to allow all origins for development.

## Troubleshooting

### Issue: "System not ready" error
**Solution**: Run the indexing endpoint first: `POST /api/v1/index`

### Issue: "OpenRouter API key not configured"
**Solution**: Add your API key to the `.env` file

### Issue: Slow query processing
**Solution**: 
- Ensure indexing is complete
- Reduce `top_k` parameter
- Use simple RAG instead of agentic workflow

### Issue: Out of memory during indexing
**Solution**: 
- Reduce batch size in `retriever.py`
- Process dataset in smaller chunks
- Increase system RAM

## Future Enhancements

- [ ] Feedback mechanism for reinforcement learning
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Citation graph analysis
- [ ] Judge-specific analysis
- [ ] Temporal analysis of legal evolution
- [ ] Fine-tuning on legal domain
- [ ] Advanced filtering (by court, year, judge)
- [ ] Export functionality (PDF reports)

## License

This project is part of the NyayaSahayak legal AI assistant system.

## Support

For issues or questions, please refer to the project documentation or contact the development team.
