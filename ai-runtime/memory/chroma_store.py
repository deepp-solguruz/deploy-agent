"""ChromaDB shared memory — stores code patterns for cross-agent context."""

import os
import chromadb
from chromadb.config import Settings


CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")


def get_chroma_client():
    """Get a persistent ChromaDB client."""
    return chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(anonymized_telemetry=False),
    )


def get_collection(name: str = "swarm_memory"):
    """Get or create a collection for agent memory."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=name,
        metadata={"description": "Shared memory for AI developer swarm"},
    )


def store_context(task_id: str, agent: str, content: str, metadata: dict = None):
    """Store agent output as a memory entry."""
    collection = get_collection()
    collection.add(
        documents=[content],
        ids=[f"{task_id}-{agent}"],
        metadatas=[{"task_id": task_id, "agent": agent, **(metadata or {})}],
    )


def query_context(query: str, n_results: int = 5) -> list[str]:
    """Query shared memory for relevant context."""
    collection = get_collection()
    if collection.count() == 0:
        return []
    results = collection.query(query_texts=[query], n_results=n_results)
    return results["documents"][0] if results["documents"] else []
