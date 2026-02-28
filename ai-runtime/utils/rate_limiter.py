"""Rate-limit-aware LLM wrapper with exponential backoff retry."""

import os
import time
import logging
from langchain_anthropic import ChatAnthropic

logger = logging.getLogger("rate_limiter")

# Cooldown between agent runs (seconds) — prevents hitting per-minute limits
AGENT_COOLDOWN = int(os.getenv("AGENT_COOLDOWN_SECS", "65"))

# Max characters to pass between agents for summaries
MAX_SUMMARY_CHARS = int(os.getenv("MAX_SUMMARY_CHARS", "1500"))


def get_llm(temperature: float = 0.1) -> ChatAnthropic:
    """Return a ChatAnthropic instance with built-in retry config."""
    return ChatAnthropic(
        model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        temperature=temperature,
        max_retries=5,                # SDK-level retry on 429/500/503
        timeout=120,
    )


def trim_summary(text: str, max_chars: int | None = None) -> str:
    """Trim a summary to stay under token limits."""
    limit = max_chars or MAX_SUMMARY_CHARS
    if len(text) <= limit:
        return text
    return text[:limit] + "\n... [trimmed to save tokens]"


def wait_for_rate_limit():
    """Sleep to respect the per-minute token rate limit."""
    logger.info(f"Rate limit cooldown: waiting {AGENT_COOLDOWN}s before next agent...")
    time.sleep(AGENT_COOLDOWN)


def run_with_retry(fn, *args, max_retries: int = 3, **kwargs):
    """Run a function with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            err_str = str(e).lower()
            if "rate_limit" in err_str or "429" in err_str:
                wait_time = 60 * (attempt + 1)  # 60s, 120s, 180s
                logger.warning(f"Rate limited (attempt {attempt+1}/{max_retries}). Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise  # Non-rate-limit error, don't retry
    # Final attempt — let it raise if it fails
    return fn(*args, **kwargs)
