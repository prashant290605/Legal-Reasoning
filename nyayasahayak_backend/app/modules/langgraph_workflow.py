import os
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
import logging
from openai import OpenAI
from .retriever import VectorRetriever

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    query: str
    legal_issues: List[str]
    keywords: List[str]
    retrieved_cases: List[Dict[str, Any]]
    case_summaries: List[str]
    legal_analysis: str
    final_answer: str
    related_cases: List[Dict[str, Any]]
    reasoning_steps: List[str]


class LegalAgentWorkflow:
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
            logger.warning("No OpenRouter API key provided")
        
        self.workflow = self._build_workflow()
    
    def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
        if not self.client:
            return "API key not configured"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM call error: {e}")
            return f"Error: {str(e)}"
    
    def query_analysis_node(self, state: AgentState) -> AgentState:
        logger.info("Node: Query Analysis")
        
        query = state['query']
        state['reasoning_steps'].append("Analyzing query for legal issues and keywords")
        
        system_prompt = """You are a legal query analyzer. Extract the main legal issues and keywords from the user's query.
Return your response in this format:
LEGAL ISSUES:
- [issue 1]
- [issue 2]

KEYWORDS:
- [keyword 1]
- [keyword 2]"""
        
        user_prompt = f"Analyze this legal query: {query}"
        
        response = self._call_llm(system_prompt, user_prompt, max_tokens=500)
        
        legal_issues = []
        keywords = []
        
        lines = response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if 'LEGAL ISSUES:' in line:
                current_section = 'issues'
            elif 'KEYWORDS:' in line:
                current_section = 'keywords'
            elif line.startswith('-'):
                item = line[1:].strip()
                if current_section == 'issues':
                    legal_issues.append(item)
                elif current_section == 'keywords':
                    keywords.append(item)
        
        state['legal_issues'] = legal_issues if legal_issues else [query]
        state['keywords'] = keywords if keywords else [query]
        
        return state
    
    def retrieval_node(self, state: AgentState) -> AgentState:
        logger.info("Node: Retrieval")
        
        state['reasoning_steps'].append("Retrieving relevant legal cases from database")
        
        query = state['query']
        keywords_str = " ".join(state['keywords'])
        search_query = f"{query} {keywords_str}"
        
        retrieved_docs = self.retriever.retrieve(search_query, top_k=7)
        
        state['retrieved_cases'] = retrieved_docs
        
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
        
        state['related_cases'] = related_cases
        
        return state
    
    def summarizer_node(self, state: AgentState) -> AgentState:
        logger.info("Node: Summarizer")
        
        state['reasoning_steps'].append("Summarizing key arguments from retrieved cases")
        
        retrieved_cases = state['retrieved_cases']
        
        summaries = []
        
        for i, doc in enumerate(retrieved_cases[:5], 1):
            metadata = doc['metadata']
            text = doc['text']
            
            system_prompt = """You are a legal case summarizer. Extract the key legal arguments, 
holdings, and reasoning from the provided case text. Be concise but comprehensive."""
            
            user_prompt = f"""Case: {metadata.get('title')}
Citation: {metadata.get('citation')}

Text:
{text[:2000]}

Provide a brief summary of the key legal points."""
            
            summary = self._call_llm(system_prompt, user_prompt, max_tokens=300)
            
            summaries.append(f"[{metadata.get('title')}]: {summary}")
        
        state['case_summaries'] = summaries
        
        return state
    
    def legal_analyst_node(self, state: AgentState) -> AgentState:
        logger.info("Node: Legal Analyst")
        
        state['reasoning_steps'].append("Synthesizing legal analysis and generating final answer")
        
        query = state['query']
        legal_issues = state['legal_issues']
        case_summaries = state['case_summaries']
        related_cases = state['related_cases']
        
        context = "\n\n".join(case_summaries)
        
        cases_list = "\n".join([
            f"- {case['title']} ({case['citation']})" 
            for case in related_cases[:5]
        ])
        
        system_prompt = """You are NyayaSahayak, an expert Indian legal AI assistant. 
Provide comprehensive legal analysis based on the retrieved cases.

Your response should:
1. Address the legal query directly
2. Reference specific cases and their holdings
3. Explain relevant legal principles and doctrines
4. Provide balanced analysis
5. Use proper legal terminology
6. Acknowledge any limitations

Format your response clearly with proper structure."""
        
        user_prompt = f"""Query: {query}

Legal Issues Identified:
{chr(10).join(f"- {issue}" for issue in legal_issues)}

Related Cases:
{cases_list}

Case Summaries and Analysis:
{context}

Provide a comprehensive legal analysis addressing the query."""
        
        analysis = self._call_llm(system_prompt, user_prompt, max_tokens=2000)
        
        state['legal_analysis'] = analysis
        state['final_answer'] = analysis
        
        return state
    
    def _build_workflow(self) -> StateGraph:
        workflow = StateGraph(AgentState)
        
        workflow.add_node("query_analysis", self.query_analysis_node)
        workflow.add_node("retrieval", self.retrieval_node)
        workflow.add_node("summarizer", self.summarizer_node)
        workflow.add_node("legal_analyst", self.legal_analyst_node)
        
        workflow.set_entry_point("query_analysis")
        
        workflow.add_edge("query_analysis", "retrieval")
        workflow.add_edge("retrieval", "summarizer")
        workflow.add_edge("summarizer", "legal_analyst")
        workflow.add_edge("legal_analyst", END)
        
        return workflow.compile()
    
    def process_query(self, query: str) -> Dict[str, Any]:
        logger.info(f"Processing query with LangGraph: {query}")
        
        initial_state: AgentState = {
            'query': query,
            'legal_issues': [],
            'keywords': [],
            'retrieved_cases': [],
            'case_summaries': [],
            'legal_analysis': '',
            'final_answer': '',
            'related_cases': [],
            'reasoning_steps': []
        }
        
        try:
            final_state = self.workflow.invoke(initial_state)
            
            return {
                'query': query,
                'answer': final_state['final_answer'],
                'related_cases': final_state['related_cases'],
                'legal_issues': final_state['legal_issues'],
                'reasoning_steps': final_state['reasoning_steps'],
                'processing_info': {
                    'cases_retrieved': len(final_state['retrieved_cases']),
                    'cases_analyzed': len(final_state['case_summaries'])
                }
            }
        
        except Exception as e:
            logger.error(f"Workflow error: {e}")
            return {
                'query': query,
                'answer': f"Error processing query: {str(e)}",
                'related_cases': [],
                'legal_issues': [],
                'reasoning_steps': [],
                'processing_info': {}
            }
