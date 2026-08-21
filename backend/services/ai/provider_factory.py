import logging
from typing import Dict, List, Optional, Any
from backend.utils.config import settings
from backend.models.chat import AIProviderInfo
from backend.services.ai.base import BaseAIProvider
from backend.services.ai.openai_provider import OpenAIProvider
from backend.services.ai.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

class AIProviderFactory:
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self):
        self._providers["openai"] = OpenAIProvider()
        self._providers["ollama"] = OllamaProvider()

    def get_provider(self, provider_id: Optional[str] = None) -> BaseAIProvider:
        """
        Retrieves the requested AI provider.
        If provider_id is None or unknown, defaults to DEFAULT_AI_PROVIDER (or available one).
        """
        target_id = (provider_id or settings.DEFAULT_AI_PROVIDER).lower().strip()

        if target_id in self._providers:
            provider = self._providers[target_id]
            # If requested provider is available, return it
            if provider.is_available():
                return provider

            # If unavailable, try other available provider before returning
            for alt_id, alt_provider in self._providers.items():
                if alt_id != target_id and alt_provider.is_available():
                    logger.info(f"Provider '{target_id}' unavailable; dynamically routing to '{alt_id}'.")
                    return alt_provider

            return provider

        # Fallback to default or first registered
        default_id = settings.DEFAULT_AI_PROVIDER if settings.DEFAULT_AI_PROVIDER in self._providers else "openai"
        return self._providers.get(default_id, list(self._providers.values())[0])

    def list_providers(self) -> List[AIProviderInfo]:
        """Returns provider catalog with live availability status for the frontend."""
        result: List[AIProviderInfo] = []
        for pid, provider in self._providers.items():
            is_avail = provider.is_available()
            result.append(
                AIProviderInfo(
                    id=provider.id,
                    name=provider.name,
                    model=provider.model_name,
                    available=is_avail,
                    description=provider.description,
                    is_default=(pid == settings.DEFAULT_AI_PROVIDER)
                )
            )
        return result

    def get_provider_health(self) -> Dict[str, Any]:
        """Returns health breakdown for all AI services."""
        ollama_p = self._providers.get("ollama")
        openai_p = self._providers.get("openai")

        return {
            "openai_configured": bool(settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("sk-placeholder")),
            "openai_available": openai_p.is_available() if openai_p else False,
            "ollama_enabled": settings.OLLAMA_ENABLED,
            "ollama_host": settings.OLLAMA_HOST,
            "ollama_available": ollama_p.is_available() if ollama_p else False,
            "ollama_model": settings.OLLAMA_MODEL
        }

provider_factory = AIProviderFactory()
