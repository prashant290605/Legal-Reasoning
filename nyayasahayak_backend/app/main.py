from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import os
from dotenv import load_dotenv

from .modules.data_loader import DataLoader
from .modules.embeddings import EmbeddingModel
from .modules.retriever import VectorRetriever
from .modules.rag_agent import RAGAgent
from .modules.langgraph_workflow import LegalAgentWorkflow

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NyayaSahayak Legal AI Backend",
    description="Advanced Legal AI Assistant with Agentic Reasoning and RAG",
    version="1.0.0"
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


data_loader = None
embedding_model = None
retriever = None
rag_agent = None
legal_workflow = None
system_initialized = False


class QueryRequest(BaseModel):
    query: str
    use_agentic: bool = True


class QueryResponse(BaseModel):
    query: str
    answer: str
    related_cases: List[Dict[str, Any]]
    legal_issues: Optional[List[str]] = None
    reasoning_steps: Optional[List[str]] = None
    processing_info: Optional[Dict[str, Any]] = None


class SuggestionResponse(BaseModel):
    suggestions: List[str]


@app.on_event("startup")
async def startup_event():
    global data_loader, embedding_model, retriever, rag_agent, legal_workflow, system_initialized
    
    logger.info("Initializing NyayaSahayak backend...")
    
    try:
        data_loader = DataLoader()
        embedding_model = EmbeddingModel()
        retriever = VectorRetriever(embedding_model=embedding_model)
        
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        rag_agent = RAGAgent(retriever=retriever, api_key=api_key)
        legal_workflow = LegalAgentWorkflow(retriever=retriever, api_key=api_key)
        
        if not retriever.collection_exists() or retriever.get_collection_count() == 0:
            logger.info("Vector database not found or empty. Indexing will be required.")
            logger.info("Call POST /api/v1/index to index the legal cases.")
        else:
            logger.info(f"Vector database loaded with {retriever.get_collection_count()} chunks")
            system_initialized = True
        
        logger.info("Backend initialization complete!")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "NyayaSahayak Legal AI Backend",
        "version": "1.0.0"
    }


@app.get("/status")
async def status():
    global system_initialized, retriever
    
    indexed_count = 0
    if retriever:
        try:
            indexed_count = retriever.get_collection_count()
        except Exception:
            pass
    
    return {
        "system_ready": system_initialized,
        "indexed_cases": indexed_count,
        "api_key_configured": bool(os.getenv("OPENROUTER_API_KEY")),
        "message": "System ready" if system_initialized else "System needs indexing. Call POST /api/v1/index"
    }


@app.post("/api/v1/index")
async def index_cases():
    global data_loader, retriever, system_initialized
    
    if not data_loader or not retriever:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        logger.info("Starting indexing process...")
        
        cases = data_loader.get_all_cases()
        
        logger.info(f"Loaded {len(cases)} cases from dataset")
        
        retriever.index_cases(cases, chunk_size=1024)
        
        system_initialized = True
        
        return {
            "status": "success",
            "message": f"Indexed {len(cases)} cases successfully",
            "total_chunks": retriever.get_collection_count()
        }
    
    except Exception as e:
        logger.error(f"Error indexing cases: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/legal-query", response_model=QueryResponse)
async def process_legal_query(request: QueryRequest):
    global legal_workflow, rag_agent, system_initialized
    
    if not system_initialized:
        raise HTTPException(
            status_code=503, 
            detail="System not ready. Please index the cases first by calling POST /api/v1/index"
        )
    
    if not os.getenv("OPENROUTER_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable."
        )
    
    try:
        if request.use_agentic and legal_workflow:
            logger.info("Processing query with agentic workflow")
            result = legal_workflow.process_query(request.query)
        else:
            logger.info("Processing query with simple RAG")
            result = rag_agent.process_query(request.query)
        
        return QueryResponse(**result)
    
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/suggestions", response_model=SuggestionResponse)
async def get_suggestions(query: str):
    suggestions = [
        "Compare the reasoning in Kesavananda Bharati and Minerva Mills on the Basic Structure Doctrine",
        "Explain how the Supreme Court interpreted Article 21 in Puttaswamy",
        "List cases where sedition laws under IPC Section 124A were challenged",
        "Summarize how freedom of speech evolved under Article 19(1)(a)",
        "Identify the ratio decidendi in Maneka Gandhi vs Union of India"
    ]
    
    if query and len(query) > 3:
        filtered = [s for s in suggestions if query.lower() in s.lower()]
        if filtered:
            return SuggestionResponse(suggestions=filtered[:3])
    
    return SuggestionResponse(suggestions=suggestions[:3])


@app.get("/api/v1/case/{case_id}")
async def get_case(case_id: int):
    global data_loader
    
    if not data_loader:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        case = data_loader.get_case_by_id(case_id)
        return case
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving case: {e}")
        raise HTTPException(status_code=500, detail=str(e))
