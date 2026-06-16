import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("QDRANT_URL", "http://qdrant.test")
os.environ.setdefault("QDRANT_API_KEY", "test-qdrant-key")
os.environ.setdefault("QDRANT_COLLECTION", "test_history_chunks")
os.environ.setdefault("LLM_API_KEY", "test-google-key")
