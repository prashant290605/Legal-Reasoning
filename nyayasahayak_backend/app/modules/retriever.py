import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
import logging
from pathlib import Path
from .embeddings import EmbeddingModel
from .utils import chunk_text

logger = logging.getLogger(__name__)


class VectorRetriever:
    def __init__(
        self, 
        persist_directory: str = "vectorstore",
        collection_name: str = "legal_cases",
        embedding_model: EmbeddingModel = None
    ):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(exist_ok=True)
        
        self.collection_name = collection_name
        self.embedding_model = embedding_model or EmbeddingModel()
        
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.collection = None
    
    def create_collection(self):
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            logger.info(f"Loaded existing collection: {self.collection_name}")
        except Exception:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Legal cases vector database"}
            )
            logger.info(f"Created new collection: {self.collection_name}")
    
    def index_cases(self, cases: List[Dict[str, Any]], chunk_size: int = 1024):
        if self.collection is None:
            self.create_collection()
        
        logger.info(f"Indexing {len(cases)} cases...")
        
        documents = []
        metadatas = []
        ids = []
        
        for case in cases:
            case_id = case['id']
            text = case['text']
            
            chunks = chunk_text(text, chunk_size=chunk_size)
            
            for chunk_idx, chunk in enumerate(chunks):
                doc_id = f"case_{case_id}_chunk_{chunk_idx}"
                
                documents.append(chunk)
                metadatas.append({
                    'case_id': str(case_id),
                    'title': case['title'],
                    'citation': case['citation'],
                    'court': case['court'],
                    'judge': case['judge'],
                    'decision_date': case['decision_date'],
                    'year': case['year'],
                    'chunk_index': str(chunk_idx)
                })
                ids.append(doc_id)
        
        logger.info(f"Created {len(documents)} chunks from {len(cases)} cases")
        
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i+batch_size]
            batch_metas = metadatas[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            
            embeddings = self.embedding_model.embed_texts(batch_docs)
            
            self.collection.add(
                documents=batch_docs,
                embeddings=embeddings,
                metadatas=batch_metas,
                ids=batch_ids
            )
            
            logger.info(f"Indexed batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
        
        logger.info("Indexing complete!")
    
    def retrieve(
        self, 
        query: str, 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            self.create_collection()
        
        query_embedding = self.embedding_model.embed_text(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        retrieved_docs = []
        
        if results['documents'] and len(results['documents']) > 0:
            for i in range(len(results['documents'][0])):
                doc = {
                    'text': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else None
                }
                retrieved_docs.append(doc)
        
        return retrieved_docs
    
    def get_collection_count(self) -> int:
        if self.collection is None:
            self.create_collection()
        return self.collection.count()
    
    def collection_exists(self) -> bool:
        try:
            self.client.get_collection(name=self.collection_name)
            return True
        except Exception:
            return False
