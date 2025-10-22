import os
from typing import List, Dict, Any
import logging
from openai import OpenAI
from .retriever import VectorRetriever

logger = logging.getLogger(__name__)


class RAGAgent:
    def __init__(
        self, 
        retriever: VectorRetriever,
        api_key: str = None,
        base_url: str = "https://openrouter.ai/api/v1",
        model: str = "openai/gpt-4o-mini"
    ):
        self.retriever = retriever
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.base_url = base_url
        self.model = model
        
        if self.api_key:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        else:
            self.client = None
            logger.warning("No OpenRouter API key provided. LLM functionality will be limited.")
    
    def retrieve_context(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        logger.info(f"Retrieving context for query: {query}")
        results = self.retriever.retrieve(query, top_k=top_k)
        return results
    
    def format_context(self, retrieved_docs: List[Dict[str, Any]]) -> str:
        context_parts = []
        
        for i, doc in enumerate(retrieved_docs, 1):
            metadata = doc['metadata']
            text = doc['text']
            
            context_part = f"""
[Case {i}]
Title: {metadata.get('title', 'N/A')}
Citation: {metadata.get('citation', 'N/A')}
Court: {metadata.get('court', 'N/A')}
Judge: {metadata.get('judge', 'N/A')}
Decision Date: {metadata.get('decision_date', 'N/A')}

Relevant Text:
{text}

---
"""
            context_parts.append(context_part)
        
        return "\n".join(context_parts)
    
    def generate_response(
        self, 
        query: str, 
        context: str,
        system_prompt: str = None
    ) -> str:
        if not self.client:
            return "OpenRouter API key not configured. Please add your API key to use LLM features."
        
        if system_prompt is None:
            system_prompt = """You are an expert Indian legal AI assistant named NyayaSahayak. 
Your role is to provide accurate, well-reasoned legal analysis based on Indian case law and statutes.

When answering:
1. Base your response on the provided case law context
2. Cite specific cases and their citations
3. Explain legal principles clearly
4. Identify relevant legal doctrines and precedents
5. Provide balanced analysis considering multiple perspectives
6. Use proper legal terminology

Always maintain professional tone and acknowledge limitations when information is insufficient."""
        
        user_prompt = f"""Based on the following Indian legal cases and context, please answer the query.

CONTEXT:
{context}

QUERY: {query}

Please provide a comprehensive legal analysis."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"
    
    def process_query(
        self, 
        query: str, 
        top_k: int = 5
    ) -> Dict[str, Any]:
        retrieved_docs = self.retrieve_context(query, top_k=top_k)
        
        context = self.format_context(retrieved_docs)
        
        answer = self.generate_response(query, context)
        
        related_cases = []
        seen_cases = set()
        
        for doc in retrieved_docs:
            case_id = doc['metadata'].get('case_id')
            if case_id not in seen_cases:
                seen_cases.add(case_id)
                related_cases.append({
                    'title': doc['metadata'].get('title'),
                    'citation': doc['metadata'].get('citation'),
                    'court': doc['metadata'].get('court'),
                    'decision_date': doc['metadata'].get('decision_date')
                })
        
        return {
            'query': query,
            'answer': answer,
            'related_cases': related_cases,
            'context': context
        }
