"""エラーモデル"""

from enum import IntEnum
from typing import Optional


class ErrorCode(IntEnum):
    """エラーコード"""

    SUCCESS = 0
    GENERAL_ERROR = 1
    INVALID_ARGUMENT = 2
    CONFIG_ERROR = 3
    NETWORK_ERROR = 4
    SCRAPING_ERROR = 5
    API_ERROR = 6
    AUTH_ERROR = 7
    INTERRUPTED = 130


class ProposalGenError(Exception):
    """アプリケーション基底例外"""

    code: ErrorCode = ErrorCode.GENERAL_ERROR

    def __init__(self, message: str, details: Optional[dict] = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class InvalidURLError(ProposalGenError):
    """無効なURLエラー"""

    code = ErrorCode.INVALID_ARGUMENT


class ConfigError(ProposalGenError):
    """設定ファイルエラー"""

    code = ErrorCode.CONFIG_ERROR


class NetworkError(ProposalGenError):
    """ネットワークエラー"""

    code = ErrorCode.NETWORK_ERROR


class ScrapingError(ProposalGenError):
    """スクレイピングエラー"""

    code = ErrorCode.SCRAPING_ERROR


class PageNotFoundError(ScrapingError):
    """ページが見つからない"""

    pass


class ElementNotFoundError(ScrapingError):
    """要素が見つからない"""

    pass


class LoginRequiredError(ScrapingError):
    """ログインが必要"""

    pass


class AccessDeniedError(ScrapingError):
    """アクセス拒否"""

    pass


class GitHubAPIError(ProposalGenError):
    """GitHub APIエラー"""

    code = ErrorCode.API_ERROR


class GeminiAPIError(ProposalGenError):
    """Gemini APIエラー"""

    code = ErrorCode.API_ERROR


class AuthenticationError(ProposalGenError):
    """認証エラー"""

    code = ErrorCode.AUTH_ERROR
