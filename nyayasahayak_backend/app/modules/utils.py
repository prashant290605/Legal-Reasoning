import re
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 1024, overlap: int = 128) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence.split())
        
        if current_length + sentence_length > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            
            overlap_words = []
            overlap_length = 0
            for s in reversed(current_chunk):
                s_length = len(s.split())
                if overlap_length + s_length <= overlap:
                    overlap_words.insert(0, s)
                    overlap_length += s_length
                else:
                    break
            
            current_chunk = overlap_words
            current_length = overlap_length
        
        current_chunk.append(sentence)
        current_length += sentence_length
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks


def extract_legal_keywords(text: str) -> List[str]:
    legal_terms = [
        'article', 'section', 'act', 'constitution', 'supreme court', 
        'high court', 'judgment', 'petition', 'appellant', 'respondent',
        'ratio decidendi', 'obiter dicta', 'precedent', 'doctrine',
        'fundamental rights', 'directive principles', 'writ', 'habeas corpus',
        'mandamus', 'certiorari', 'prohibition', 'quo warranto'
    ]
    
    text_lower = text.lower()
    found_keywords = []
    
    for term in legal_terms:
        if term in text_lower:
            found_keywords.append(term)
    
    return found_keywords


def format_case_metadata(case: Dict[str, Any]) -> str:
    return f"""
Title: {case.get('title', 'N/A')}
Citation: {case.get('citation', 'N/A')}
Court: {case.get('court', 'N/A')}
Judge: {case.get('judge', 'N/A')}
Decision Date: {case.get('decision_date', 'N/A')}
Year: {case.get('year', 'N/A')}
""".strip()


def extract_case_summary(text: str, max_length: int = 500) -> str:
    words = text.split()
    if len(words) <= max_length:
        return text
    return ' '.join(words[:max_length]) + '...'
