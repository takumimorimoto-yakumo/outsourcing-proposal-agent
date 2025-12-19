# マルチエージェント提案文生成システム 要件定義

**最終更新**: 2025-12-19
**バージョン**: 1.0

---

## 1. 概要

複数のAIエージェントが連携して高品質な提案文を自動生成するシステム。

### 1.1. システム構成

```
┌──────────────────────────────────────────────────────────────────┐
│                          Boss AI                                  │
│  オーケストレーター：各AIの実行管理・結果の受け渡し・再実行判断    │
└──────────────────────────────────────────────────────────────────┘
        │                    │                    │
        │ ①実行指示          │ ②結果+指示         │ ③結果+指示
        ▼                    ▼                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ 案件理解AI    │ ───▶ │ 文面作成AI    │ ───▶ │ チェックAI    │
│              │      │              │      │              │
│ 案件の深い   │      │ 提案文の     │      │ 品質検証     │
│ 理解と情報収集│      │ 生成         │      │ 最終判定     │
└──────────────┘      └──────────────┘      └──────────────┘
```

### 1.2. 使用技術

| 項目 | 値 |
|------|-----|
| LLM | Google Gemini |
| 実行方式 | 直列処理（シーケンシャル） |
| リトライ | Boss AIによる再実行制御 |

---

## 2. エージェント定義

### 2.1. Boss AI（オーケストレーター）

**役割**: 全体の実行管理と結果の受け渡し

**責務**:
- 各エージェントへのタスク指示
- エージェント間のデータ受け渡し
- チェックAIの結果に基づく再実行判断
- 最終結果の統合と出力

**入力**:
- 案件情報（Job）
- ユーザープロフィール（UserProfile）

**出力**:
- 最終提案文
- 生成メタデータ（処理時間、リトライ回数等）

**再実行ロジック**:
```
if チェックAI.result == NG:
    if 問題箇所 == "案件理解":
        案件理解AIを再実行
    elif 問題箇所 == "提案文":
        文面作成AIを再実行

    最大リトライ回数を超えたら人間にエスカレーション
```

---

### 2.2. 案件理解AI（Job Understanding Agent）

**役割**: 案件の深い理解と必要情報の収集

**責務**:
- 案件要件の抽出・整理
- クライアントの真の目的の推測
- 必要に応じた外部情報収集（企業サイト、SNS等）
- 重要キーワードの特定

**入力**:
```typescript
interface JobUnderstandingInput {
  job: Job;                    // 案件情報
  client_url?: string;         // クライアントのURL（あれば）
}
```

**出力**:
```typescript
interface JobUnderstandingOutput {
  // 案件要件
  requirements: {
    main_task: string;           // 主要タスク
    deliverables: string[];      // 成果物
    technical_requirements: string[];  // 技術要件
    constraints: string[];       // 制約条件
  };

  // クライアント情報
  client_analysis: {
    business_type: string;       // 事業種別
    estimated_purpose: string;   // 推定される目的
    pain_points: string[];       // 課題・悩み
  };

  // 重要ポイント
  key_points: {
    keywords: string[];          // 重要キーワード
    emphasis_points: string[];   // 強調すべき点
    risk_factors: string[];      // リスク要因
  };

  // 外部調査結果（実施した場合）
  external_research?: {
    sources: string[];           // 調査したURL
    findings: string[];          // 発見事項
  };
}
```

**処理フロー**:
1. 案件タイトル・説明文の解析
2. 要件の構造化
3. クライアント情報があれば外部調査
4. 重要ポイントの抽出
5. 結果の統合

---

### 2.3. 文面作成AI（Proposal Writing Agent）

**役割**: 案件理解に基づく提案文の生成

**責務**:
- 案件理解結果とプロフィールの統合
- 簡潔だが人間味のある提案文の作成
- 適切な構成と長さの調整

**入力**:
```typescript
interface ProposalWritingInput {
  job_understanding: JobUnderstandingOutput;  // 案件理解結果
  user_profile: UserProfile;                   // ユーザープロフィール
  job: Job;                                    // 元の案件情報
}
```

**出力**:
```typescript
interface ProposalWritingOutput {
  proposal: string;              // 提案文本文
  structure: {
    greeting: string;            // 挨拶
    understanding: string;       // 案件理解の表明
    approach: string;            // アプローチ提案
    experience: string;          // 関連経験
    closing: string;             // 締め
  };
  character_count: number;       // 文字数
}
```

**提案文の構成**:
```
1. 挨拶（簡潔に）
2. 案件への理解を示す（クライアントの目的を理解していることを伝える）
3. 提案するアプローチ（具体的にどう進めるか）
4. 関連する経験・スキル（プロフィールから適切に選択）
5. 締めの言葉
```

**文体ガイドライン**:
- 簡潔だが機械的すぎない
- 専門用語は必要最小限
- クライアントの立場に立った表現
- 具体性を持たせる

---

### 2.4. チェックAI（Quality Check Agent）

**役割**: 生成された提案文の品質検証

**責務**:
- 案件理解の妥当性確認
- 提案文の品質評価
- 問題点の特定と修正指示

**入力**:
```typescript
interface QualityCheckInput {
  job: Job;                                    // 元の案件情報
  job_understanding: JobUnderstandingOutput;   // 案件理解結果
  proposal: ProposalWritingOutput;             // 提案文
  user_profile: UserProfile;                   // ユーザープロフィール
}
```

**出力**:
```typescript
interface QualityCheckOutput {
  passed: boolean;               // 合格判定
  overall_score: number;         // 総合スコア (0-100)

  // 各項目の評価
  evaluation: {
    understanding_accuracy: {
      score: number;             // スコア (0-100)
      issues: string[];          // 問題点
    };
    proposal_quality: {
      score: number;
      issues: string[];
    };
    profile_relevance: {
      score: number;
      issues: string[];
    };
    tone_appropriateness: {
      score: number;
      issues: string[];
    };
  };

  // 修正指示（不合格時）
  revision_instructions?: {
    target: "understanding" | "proposal";  // 修正対象
    instructions: string[];                 // 具体的な修正指示
  };
}
```

**合格基準**:
| 項目 | 最低スコア |
|------|-----------|
| 案件理解の正確性 | 70 |
| 提案文の品質 | 70 |
| プロフィールとの関連性 | 60 |
| トーンの適切さ | 70 |
| **総合スコア** | **70** |

---

### 2.5. スコアリングAI（Job Scoring Agent）

**役割**: 案件の優先度と適合度のスコアリング

**責務**:
- 案件とユーザースキルの適合度評価
- 競争率・予算・納期の総合評価
- 優先度スコアの算出

**入力**:
```typescript
interface JobScoringInput {
  job: Job;                      // 案件情報
  user_profile: UserProfile;     // ユーザープロフィール
}
```

**出力**:
```typescript
interface JobScoringOutput {
  // 総合スコア
  overall_score: number;         // 0-100

  // 個別スコア
  scores: {
    skill_match: number;         // スキル適合度 (0-100)
    budget_attractiveness: number;  // 予算魅力度 (0-100)
    competition_level: number;   // 競争率（低いほど良い） (0-100)
    deadline_feasibility: number;  // 納期実現可能性 (0-100)
    client_reliability: number;  // クライアント信頼度 (0-100)
  };

  // 推奨理由
  recommendation: {
    strengths: string[];         // 応募すべき理由
    concerns: string[];          // 注意点
    priority: "high" | "medium" | "low";  // 優先度
  };
}
```

**スコアリング基準**:
| 項目 | 重み | 評価基準 |
|------|------|----------|
| スキル適合度 | 30% | プロフィールスキルとの一致度 |
| 予算魅力度 | 20% | 市場相場との比較 |
| 競争率 | 20% | 提案数/募集人数 |
| 納期実現可能性 | 15% | 残り日数と作業量 |
| クライアント信頼度 | 15% | 評価・発注履歴 |

---

## 3. データフロー

```
[案件情報] + [プロフィール]
        │
        ▼
┌───────────────┐
│   Boss AI     │
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌─────────────────────┐
│ 案件理解AI    │ ──▶ │ JobUnderstandingOutput│
└───────────────┘     └──────────┬──────────┘
                                 │
                                 ▼
                      ┌───────────────┐     ┌─────────────────────┐
                      │ 文面作成AI    │ ──▶ │ ProposalWritingOutput│
                      └───────────────┘     └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌───────────────┐
                                            │ チェックAI    │
                                            └───────┬───────┘
                                                    │
                                         ┌──────────┴──────────┐
                                         ▼                     ▼
                                      [PASS]                [FAIL]
                                         │                     │
                                         ▼                     ▼
                                    最終提案文            Boss AIへ
                                                        （再実行判断）
```

---

## 4. API設計

### 4.1. エンドポイント

```
POST /api/proposals/generate
```

### 4.2. リクエスト

```typescript
interface GenerateProposalRequest {
  job_id: string;              // 案件ID
  options?: {
    max_retries?: number;      // 最大リトライ回数（デフォルト: 3）
    external_research?: boolean; // 外部調査を行うか（デフォルト: true）
  };
}
```

### 4.3. レスポンス

```typescript
interface GenerateProposalResponse {
  success: boolean;
  proposal?: {
    text: string;              // 提案文本文
    character_count: number;   // 文字数
  };
  metadata: {
    job_understanding: JobUnderstandingOutput;
    quality_score: number;
    retry_count: number;
    processing_time_ms: number;
    agents_used: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 5. 実装ファイル構成

```
backend/src/
├── agents/
│   ├── __init__.py
│   ├── base.py              # エージェント基底クラス
│   ├── models.py            # エージェント用データモデル
│   ├── boss.py              # Boss AI
│   ├── job_understanding.py # 案件理解AI
│   ├── job_scoring.py       # スコアリングAI
│   ├── proposal_writing.py  # 文面作成AI
│   └── quality_check.py     # チェックAI
├── models/
│   └── agent_models.py      # エージェント用データモデル
└── api/
    └── server.py            # APIエンドポイント追加
```

---

## 6. エラーハンドリング

### 6.1. リトライ戦略

| 状況 | アクション |
|------|-----------|
| 案件理解の問題 | 案件理解AIを再実行 |
| 提案文の問題 | 文面作成AIを再実行 |
| 3回連続失敗 | 人間にエスカレーション |
| API エラー | 指数バックオフでリトライ |

### 6.2. エラーコード

| コード | 説明 |
|--------|------|
| `UNDERSTANDING_FAILED` | 案件理解に失敗 |
| `PROPOSAL_FAILED` | 提案文生成に失敗 |
| `QUALITY_CHECK_FAILED` | 品質チェックに失敗 |
| `MAX_RETRIES_EXCEEDED` | 最大リトライ回数超過 |
| `API_ERROR` | 外部API（Gemini）エラー |

---

## 7. 設定

### 7.1. 環境変数

```bash
GEMINI_API_KEY=your-api-key
```

### 7.2. 設定ファイル

```yaml
# config/agents.yaml
agents:
  gemini:
    model: "gemini-1.5-flash"
    temperature: 0.7
    max_tokens: 4096

  boss:
    max_retries: 3

  job_understanding:
    enable_external_research: true
    research_timeout: 30  # seconds

  quality_check:
    min_overall_score: 70
    min_category_score: 60
```

---

## 関連ドキュメント

- [プロンプト設計](./prompts.md)
- [データモデル](../common/specs/data-models.md)
- [API仕様](../api/specs.md)
