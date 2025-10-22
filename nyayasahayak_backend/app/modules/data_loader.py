import pandas as pd
import logging
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class DataLoader:
    def __init__(self, data_path: str = "data/merged_cases.parquet"):
        self.data_path = Path(data_path)
        self.df = None
        
    def load_data(self) -> pd.DataFrame:
        try:
            logger.info(f"Loading data from {self.data_path}")
            self.df = pd.read_parquet(self.data_path)
            logger.info(f"Loaded {len(self.df)} cases")
            return self.df
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def preprocess_data(self) -> pd.DataFrame:
        if self.df is None:
            self.load_data()
        
        logger.info("Preprocessing data...")
        
        self.df = self.df.dropna(subset=['text'])
        
        required_columns = ['title', 'citation', 'decision_date', 'judge', 'court', 'year', 'text']
        for col in required_columns:
            if col not in self.df.columns:
                self.df[col] = None
        
        self.df = self.df.fillna({
            'title': 'Untitled Case',
            'citation': 'No Citation',
            'decision_date': 'Unknown',
            'judge': 'Unknown',
            'court': 'Unknown',
            'year': 'Unknown'
        })
        
        logger.info(f"Preprocessed {len(self.df)} cases")
        return self.df
    
    def get_case_by_id(self, case_id: int) -> Dict[str, Any]:
        if self.df is None:
            self.preprocess_data()
        
        if case_id < 0 or case_id >= len(self.df):
            raise ValueError(f"Invalid case ID: {case_id}")
        
        case = self.df.iloc[case_id]
        return {
            'id': case_id,
            'title': case['title'],
            'citation': case['citation'],
            'decision_date': case['decision_date'],
            'judge': case['judge'],
            'court': case['court'],
            'year': case['year'],
            'text': case['text']
        }
    
    def get_all_cases(self) -> List[Dict[str, Any]]:
        if self.df is None:
            self.preprocess_data()
        
        cases = []
        for idx, row in self.df.iterrows():
            cases.append({
                'id': idx,
                'title': row['title'],
                'citation': row['citation'],
                'decision_date': row['decision_date'],
                'judge': row['judge'],
                'court': row['court'],
                'year': row['year'],
                'text': row['text']
            })
        return cases
