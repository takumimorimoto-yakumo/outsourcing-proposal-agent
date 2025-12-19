"""Base agent class for multi-agent system."""

import os
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional

# google.generativeaiをインポート時の互換性問題を回避
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

import google.generativeai as genai


@dataclass
class AgentResult:
    """エージェントの実行結果"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    raw_response: Optional[str] = None


# グローバルでモデルを初期化（一度だけ）
_gemini_configured = False
_api_key = None


def _configure_gemini():
    """Gemini APIを設定（一度だけ実行）"""
    global _gemini_configured, _api_key

    if _gemini_configured:
        return

    _api_key = os.environ.get("GEMINI_API_KEY")
    if not _api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=_api_key)
    _gemini_configured = True


class BaseAgent(ABC):
    """エージェント基底クラス"""

    def __init__(
        self,
        model_name: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ):
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Gemini APIの設定
        _configure_gemini()

        # モデルを作成
        self.model = genai.GenerativeModel(model_name)

    @property
    @abstractmethod
    def name(self) -> str:
        """エージェント名"""
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """システムプロンプト"""
        pass

    @abstractmethod
    async def execute(self, input_data: Any) -> AgentResult:
        """エージェントを実行"""
        pass

    async def _generate(self, prompt: str) -> str:
        """Gemini APIを呼び出してテキストを生成"""
        generation_config = genai.GenerationConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
        )

        response = await self.model.generate_content_async(
            prompt,
            generation_config=generation_config,
        )

        return response.text

    def _build_prompt(self, user_content: str) -> str:
        """システムプロンプトとユーザーコンテンツを結合"""
        return f"""{self.system_prompt}

---

{user_content}"""

    def _parse_json_response(self, response: str) -> dict:
        """レスポンスからJSONを抽出してパース"""
        # コードブロックから抽出を試みる
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.find("```", start)
            if end != -1:
                json_str = response[start:end].strip()
                return json.loads(json_str)

        if "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                json_str = response[start:end].strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        # 直接パースを試みる
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # { から } までを抽出
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            json_str = response[start:end]
            return json.loads(json_str)

        raise ValueError(f"Failed to parse JSON from response: {response[:200]}...")
