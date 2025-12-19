"""CLIエントリーポイント"""

import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel

from src import __version__
from src.models.errors import ErrorCode, ProposalGenError
from src.utils.logger import setup_logging
from src.utils.validators import validate_url

app = typer.Typer(
    name="proposal-gen",
    help="クラウドソーシング案件向け提案文自動生成CLIツール",
    add_completion=False,
)
config_app = typer.Typer(help="設定管理")
auth_app = typer.Typer(help="認証管理")
app.add_typer(config_app, name="config")
app.add_typer(auth_app, name="auth")

console = Console()
error_console = Console(stderr=True)


@app.command()
def generate(
    url: str = typer.Argument(..., help="案件URL（ランサーズ or クラウドワークス）"),
    output: Optional[Path] = typer.Option(
        None, "--output", "-o", help="出力先ファイルパス"
    ),
    copy: bool = typer.Option(False, "--copy", "-c", help="クリップボードにコピー"),
    profile: str = typer.Option("default", "--profile", "-p", help="使用するプロフィール名"),
    no_github: bool = typer.Option(False, "--no-github", help="GitHub情報を取得しない"),
    dry_run: bool = typer.Option(False, "--dry-run", help="実際に生成せずプロンプトを表示"),
    json_output: bool = typer.Option(False, "--json", help="JSON形式で出力"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="詳細ログを表示"),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="最小限の出力のみ"),
) -> None:
    """提案文を生成"""
    import asyncio
    from src.config.loader import ConfigLoader
    from src.scrapers import get_scraper

    setup_logging(verbose=verbose, quiet=quiet)

    # URL検証
    if not validate_url(url):
        error_console.print(
            "[red]Error:[/red] 無効なURLです。ランサーズまたはクラウドワークスの案件URLを指定してください。"
        )
        error_console.print(f"例: proposal-gen https://www.lancers.jp/work/detail/12345")
        raise typer.Exit(ErrorCode.INVALID_ARGUMENT)

    # 設定読み込み
    try:
        loader = ConfigLoader()
        config = loader.load()
    except ProposalGenError as e:
        error_console.print(f"[red]Error:[/red] {e.message}")
        raise typer.Exit(e.code)

    # スクレイパー取得
    scraper = get_scraper(url, config.scraping)
    if not scraper:
        error_console.print(f"[red]Error:[/red] この URL に対応するスクレイパーがありません: {url}")
        raise typer.Exit(ErrorCode.SCRAPING_ERROR)

    # ログイン確認
    if not scraper.is_logged_in():
        error_console.print(f"[yellow]Warning:[/yellow] {scraper.SERVICE.value} にログインしていません。")
        error_console.print(f"ログインするには: proposal-gen auth login {scraper.SERVICE.value}")

    # スクレイピング実行
    console.print(f"\n[cyan]案件情報を取得中...[/cyan]")
    try:
        job_info = asyncio.run(scraper.scrape(url))
    except Exception as e:
        error_console.print(f"[red]Error:[/red] スクレイピングに失敗しました: {e}")
        raise typer.Exit(ErrorCode.SCRAPING_ERROR)

    # 案件情報を保存（JSON & CSV）
    from src.utils.storage import JobStorage
    storage = JobStorage()
    json_path, csv_path = storage.save(job_info)

    # JSON出力モード
    if json_output:
        import json
        console.print(json.dumps(job_info.to_dict(), ensure_ascii=False, indent=2))
        return

    # 取得情報を表示
    console.print()
    console.print(Panel(
        f"[bold]{job_info.title}[/bold]\n\n"
        f"[dim]カテゴリ:[/dim] {job_info.category.value}\n"
        f"[dim]報酬:[/dim] {job_info.budget_display}\n"
        f"[dim]締切:[/dim] {job_info.deadline or '未設定'}\n"
        f"[dim]クライアント:[/dim] {job_info.client.name if job_info.client else '不明'}\n"
        f"[dim]スキル:[/dim] {', '.join(job_info.required_skills) if job_info.required_skills else 'なし'}",
        title="案件情報",
        border_style="green",
    ))

    # 保存先を表示
    console.print(f"\n[dim]保存先:[/dim]")
    console.print(f"  JSON: {json_path}")
    console.print(f"  CSV:  {csv_path}")

    # プロファイルとカテゴリテンプレートを取得
    try:
        profile_config = config.get_profile(profile)
        category_template = config.get_category_template(job_info.category)
    except ProposalGenError as e:
        error_console.print(f"[red]Error:[/red] {e.message}")
        raise typer.Exit(e.code)

    if dry_run:
        console.print("\n[cyan]Dry-run mode: プロンプトを構築するところまで実行[/cyan]")
        console.print(f"\n[yellow]Profile:[/yellow] {profile}")
        console.print(f"[yellow]GitHub:[/yellow] {'disabled' if no_github else 'enabled'}")
        return

    # GitHub 情報を取得（オプション）
    import os
    from src.github.client import GitHubClient
    from src.generator.proposal import ProposalGenerator

    github_data = None
    if not no_github and config.github_username:
        console.print(f"\n[cyan]GitHub情報を取得中...[/cyan]")
        try:
            github_client = GitHubClient(
                username=config.github_username,
                token=os.getenv("GITHUB_TOKEN"),
            )
            github_data = asyncio.run(
                github_client.get_data(skills=job_info.required_skills)
            )
            console.print(f"[green]✓[/green] GitHub情報を取得しました（{len(github_data.repos)}リポジトリ）")
        except Exception as e:
            console.print(f"[yellow]Warning:[/yellow] GitHub情報の取得に失敗: {e}")

    # Gemini API キーを確認
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        error_console.print("[red]Error:[/red] GEMINI_API_KEY 環境変数が設定されていません")
        error_console.print("設定方法: export GEMINI_API_KEY=your_api_key")
        raise typer.Exit(ErrorCode.CONFIG_ERROR)

    # 提案文を生成
    console.print(f"\n[cyan]提案文を生成中...[/cyan]")
    try:
        generator = ProposalGenerator(api_key=api_key, config=config.gemini)
        result = asyncio.run(
            generator.generate(
                job_info=job_info,
                github_data=github_data,
                profile=profile_config,
                category_template=category_template,
            )
        )
    except ProposalGenError as e:
        error_console.print(f"[red]Error:[/red] {e.message}")
        raise typer.Exit(e.code)
    except Exception as e:
        error_console.print(f"[red]Error:[/red] 提案文の生成に失敗しました: {e}")
        raise typer.Exit(ErrorCode.API_ERROR)

    # 結果を表示
    console.print()
    console.print(Panel(
        result.proposal,
        title="生成された提案文",
        border_style="green",
    ))

    # メタデータを表示
    console.print(f"\n[dim]文字数:[/dim] {result.metadata.character_count}文字")
    console.print(f"[dim]生成時間:[/dim] {result.metadata.generation_time:.2f}秒")
    console.print(f"[dim]モデル:[/dim] {result.metadata.model}")
    if result.metadata.matched_skills:
        console.print(f"[dim]含まれたスキル:[/dim] {', '.join(result.metadata.matched_skills)}")
    if result.metadata.used_repos:
        console.print(f"[dim]参照リポジトリ:[/dim] {', '.join(result.metadata.used_repos)}")

    # ファイル出力
    if output:
        output.write_text(result.proposal, encoding="utf-8")
        console.print(f"\n[green]✓[/green] ファイルに保存しました: {output}")

    # クリップボードにコピー
    if copy:
        try:
            import subprocess
            process = subprocess.Popen(
                ["pbcopy"],
                stdin=subprocess.PIPE,
                env={**os.environ, "LANG": "en_US.UTF-8"},
            )
            process.communicate(result.proposal.encode("utf-8"))
            console.print(f"\n[green]✓[/green] クリップボードにコピーしました")
        except Exception as e:
            console.print(f"[yellow]Warning:[/yellow] クリップボードへのコピーに失敗: {e}")


@config_app.command("show")
def config_show(
    json_output: bool = typer.Option(False, "--json", help="JSON形式で出力"),
    path_only: bool = typer.Option(False, "--path", help="設定ファイルのパスのみ表示"),
) -> None:
    """現在の設定を表示"""
    from src.config.loader import ConfigLoader

    try:
        loader = ConfigLoader()

        if path_only:
            console.print(str(loader.config_path))
            return

        console.print(f"[cyan]設定ファイル:[/cyan] {loader.config_path}")
        console.print()

        config = loader.load()
        console.print("[GitHub]")
        console.print(f"  username: {config.github_username}")
        console.print()
        console.print("[Gemini]")
        console.print(f"  model: {config.gemini.model}")
        console.print(f"  temperature: {config.gemini.temperature}")
        console.print()
        console.print("[Scraping]")
        console.print(f"  headless: {config.scraping.headless}")
        console.print(f"  human_like: {'enabled' if config.scraping.human_like.enabled else 'disabled'}")
        console.print()
        console.print("[Profile]")
        console.print(f"  current: {config.default_profile}")
        console.print(f"  available: {', '.join(config.profiles.keys())}")

    except ProposalGenError as e:
        error_console.print(f"[red]Error:[/red] {e.message}")
        raise typer.Exit(e.code)


@config_app.command("init")
def config_init(
    force: bool = typer.Option(False, "--force", help="既存ファイルを上書き"),
    local: bool = typer.Option(True, "--local/--global", help="ローカル(./config)に作成"),
) -> None:
    """設定ファイルを初期化"""
    config_dir = Path("./config") if local else Path.home() / ".proposal-gen"

    if config_dir.exists() and not force:
        error_console.print(
            f"[yellow]Warning:[/yellow] {config_dir} already exists. Use --force to overwrite."
        )
        raise typer.Exit(ErrorCode.GENERAL_ERROR)

    config_dir.mkdir(parents=True, exist_ok=True)

    # サンプルファイルをコピー
    settings_example = Path(__file__).parent.parent / "config" / "settings.yaml.example"
    profile_example = Path(__file__).parent.parent / "config" / "profile.yaml.example"

    if settings_example.exists():
        (config_dir / "settings.yaml").write_text(settings_example.read_text())
    if profile_example.exists():
        (config_dir / "profile.yaml").write_text(profile_example.read_text())

    console.print(f"[green]設定ファイルを作成しました:[/green] {config_dir}")
    console.print("\n次のステップ:")
    console.print(f"  1. {config_dir}/settings.yaml を編集してGitHubユーザー名を設定")
    console.print(f"  2. {config_dir}/profile.yaml を編集して自己紹介文を設定")
    console.print("  3. GEMINI_API_KEY 環境変数を設定")


@config_app.command("validate")
def config_validate() -> None:
    """設定ファイルを検証"""
    import os
    from src.config.loader import ConfigLoader

    errors = []
    warnings = []

    try:
        loader = ConfigLoader()

        # settings.yaml の検証
        try:
            config = loader.load()
            console.print("[green]✓[/green] settings.yaml: 有効")

            # Gemini設定のバリデーション
            gemini_errors = config.gemini.validate()
            if gemini_errors:
                for err in gemini_errors:
                    errors.append(f"settings.yaml: {err}")

        except ProposalGenError as e:
            errors.append(f"settings.yaml: {e.message}")

        # profile.yaml の検証
        try:
            loader._load_yaml("profile.yaml")
            console.print("[green]✓[/green] profile.yaml: 有効")
        except ProposalGenError as e:
            errors.append(f"profile.yaml: {e.message}")

        # API キーの確認
        if os.getenv("GEMINI_API_KEY"):
            console.print("[green]✓[/green] GEMINI_API_KEY: 設定済み")
        else:
            errors.append("GEMINI_API_KEY: 未設定")

        # GitHub トークンの確認
        if os.getenv("GITHUB_TOKEN"):
            console.print("[green]✓[/green] GITHUB_TOKEN: 設定済み")
        else:
            warnings.append("GITHUB_TOKEN: 未設定（オプション）")

    except ProposalGenError as e:
        errors.append(str(e.message))

    # 結果表示
    if warnings:
        console.print()
        for warning in warnings:
            console.print(f"[yellow]![/yellow] {warning}")

    if errors:
        console.print()
        for error in errors:
            console.print(f"[red]✗[/red] {error}")
        console.print("\n[red]設定を修正してください。[/red]")
        raise typer.Exit(ErrorCode.CONFIG_ERROR)

    console.print("\n[green]すべての設定が有効です。[/green]")


# ============================================
# 認証コマンド
# ============================================


@auth_app.command("login")
def auth_login(
    service: str = typer.Argument(
        ..., help="サービス名（lancers / crowdworks）"
    ),
    timeout: int = typer.Option(300, "--timeout", "-t", help="ログイン待機タイムアウト（秒）"),
) -> None:
    """サービスにログインしてセッションを保存"""
    import asyncio
    from src.auth.session import SessionManager
    from src.models.job import Service as ServiceEnum

    # サービス名の正規化
    service_lower = service.lower()
    service_map = {
        "lancers": ServiceEnum.LANCERS,
        "crowdworks": ServiceEnum.CROWDWORKS,
        "cw": ServiceEnum.CROWDWORKS,
    }

    if service_lower not in service_map:
        error_console.print(f"[red]Error:[/red] 無効なサービス名: {service}")
        error_console.print("有効なサービス: lancers, crowdworks (cw)")
        raise typer.Exit(ErrorCode.INVALID_ARGUMENT)

    target_service = service_map[service_lower]
    session_manager = SessionManager()

    # 既存セッションの確認
    if session_manager.has_session(target_service):
        console.print(f"[yellow]既存のセッションがあります: {target_service.value}[/yellow]")
        if not typer.confirm("上書きしますか？"):
            raise typer.Exit()

    # ログイン実行
    success = asyncio.run(session_manager.login(target_service, timeout=timeout))

    if success:
        raise typer.Exit(ErrorCode.SUCCESS)
    else:
        raise typer.Exit(ErrorCode.GENERAL_ERROR)


@auth_app.command("logout")
def auth_logout(
    service: str = typer.Argument(
        ..., help="サービス名（lancers / crowdworks / all）"
    ),
) -> None:
    """保存済みセッションを削除"""
    import asyncio
    from src.auth.session import SessionManager
    from src.models.job import Service as ServiceEnum

    session_manager = SessionManager()
    service_lower = service.lower()

    if service_lower == "all":
        # 全サービスからログアウト
        for svc in ServiceEnum:
            asyncio.run(session_manager.logout(svc))
    else:
        service_map = {
            "lancers": ServiceEnum.LANCERS,
            "crowdworks": ServiceEnum.CROWDWORKS,
            "cw": ServiceEnum.CROWDWORKS,
        }
        if service_lower not in service_map:
            error_console.print(f"[red]Error:[/red] 無効なサービス名: {service}")
            raise typer.Exit(ErrorCode.INVALID_ARGUMENT)

        asyncio.run(session_manager.logout(service_map[service_lower]))


@auth_app.command("status")
def auth_status() -> None:
    """保存済みセッションの状態を表示"""
    import asyncio
    from src.auth.session import SessionManager
    from src.models.job import Service as ServiceEnum

    session_manager = SessionManager()
    sessions = session_manager.list_sessions()

    console.print("\n[bold]セッション状態:[/bold]\n")

    for service, has_session in sessions.items():
        if has_session:
            # セッションの有効性を確認
            is_valid = asyncio.run(session_manager.verify_session(service))
            if is_valid:
                status = "[green]✓ ログイン済み[/green]"
            else:
                status = "[yellow]⚠ セッション期限切れ[/yellow]"
        else:
            status = "[dim]未ログイン[/dim]"

        console.print(f"  {service.value}: {status}")

    console.print()


@app.command("version")
def version() -> None:
    """バージョン情報を表示"""
    import platform
    try:
        from playwright._impl._driver import compute_driver_executable
        playwright_version = "installed"
    except ImportError:
        playwright_version = "not installed"

    console.print(f"proposal-gen v{__version__}")
    console.print(f"Python {platform.python_version()}")
    console.print(f"Playwright: {playwright_version}")


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version: bool = typer.Option(False, "--version", "-V", help="バージョンを表示"),
) -> None:
    """提案文自動作成システム CLI"""
    if version:
        import platform
        console.print(f"proposal-gen v{__version__}")
        raise typer.Exit()

    if ctx.invoked_subcommand is None:
        console.print(ctx.get_help())


if __name__ == "__main__":
    app()
