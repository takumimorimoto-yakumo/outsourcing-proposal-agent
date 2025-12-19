"""ロギング"""

import logging
import os
import sys
from typing import Optional


def get_logger(name: str) -> logging.Logger:
    """ロガーを取得"""
    return logging.getLogger(f"proposal_gen.{name}")


def setup_logging(verbose: bool = False, quiet: bool = False) -> None:
    """ロギングをセットアップ"""
    # 環境変数からログレベルを取得
    env_level = os.getenv("PROPOSAL_GEN_LOG_LEVEL", "").upper()

    if quiet:
        level = logging.ERROR
    elif verbose:
        level = logging.DEBUG
    elif env_level in ("DEBUG", "INFO", "WARNING", "ERROR"):
        level = getattr(logging, env_level)
    else:
        level = logging.INFO

    # ルートロガーの設定
    root_logger = logging.getLogger("proposal_gen")
    root_logger.setLevel(level)

    # ハンドラが未設定の場合のみ追加
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setLevel(level)

        formatter = logging.Formatter(
            fmt="[%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
