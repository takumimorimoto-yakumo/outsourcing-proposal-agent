"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Job } from "@/types/job";
import { scoreJobWithAI, getAllCachedScores, AIJobScore } from "@/lib/api";

export function useAIScoring(allJobs: Job[]) {
  const [aiScores, setAiScores] = useState<Map<string, AIJobScore>>(new Map());
  const [aiScoreLoadingIds, setAiScoreLoadingIds] = useState<Set<string>>(new Set());
  const [isBatchScoring, setIsBatchScoring] = useState(false);
  const [scoredJobIds, setScoredJobIds] = useState<Set<string>>(new Set());

  const isAutoScoringRef = useRef(false);
  const scoredJobIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedFromApiRef = useRef(false);

  // 初期化: APIからAIスコアを復元
  useEffect(() => {
    if (hasLoadedFromApiRef.current) return;
    hasLoadedFromApiRef.current = true;

    const loadScores = async () => {
      try {
        const result = await getAllCachedScores();
        if (result.success && result.scores) {
          const aiScoresMap = new Map<string, AIJobScore>(Object.entries(result.scores));
          setAiScores(aiScoresMap);
          const scoredIds = new Set(Object.keys(result.scores));
          setScoredJobIds(scoredIds);
          scoredJobIdsRef.current = scoredIds;
        }
      } catch (e) {
        console.error("Failed to load AI scores from API:", e);
      }
    };

    loadScores();
  }, []);

  // 単一の案件をスコアリング
  const handleAIScore = useCallback(async (jobId: string) => {
    if (aiScoreLoadingIds.has(jobId)) return;

    setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

    try {
      const result = await scoreJobWithAI(jobId);
      if (result.success && result.score) {
        setAiScores((prev) => {
          const newMap = new Map(prev);
          newMap.set(jobId, result.score!);
          return newMap;
        });
        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
        setScoredJobIds((prev) => new Set(prev).add(jobId));
      } else {
        console.error("AI スコアリング失敗:", result.error);
        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
        setScoredJobIds((prev) => new Set(prev).add(jobId));
      }
    } catch (err) {
      console.error("AI スコアリングエラー:", err);
      scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
      setScoredJobIds((prev) => new Set(prev).add(jobId));
    } finally {
      setAiScoreLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }, [aiScoreLoadingIds]);

  // バッチAI評価
  const handleBatchAIScore = useCallback(async (selectedJobIds: string[]) => {
    if (isBatchScoring) return;

    // 対象となる案件を決定
    let targetJobs: Job[];
    if (selectedJobIds.length > 0) {
      targetJobs = allJobs.filter((job) => {
        const jobId = job.job_id ? String(job.job_id) : "";
        return jobId && selectedJobIds.includes(jobId);
      });
    } else {
      // 未評価のものを対象
      targetJobs = allJobs.filter((job) => {
        const jobId = job.job_id ? String(job.job_id).trim() : "";
        return jobId !== "" && !aiScores.has(jobId);
      });
    }

    if (targetJobs.length === 0) {
      alert("評価対象の案件がありません");
      return;
    }

    setIsBatchScoring(true);
    let successCount = 0;
    let errorCount = 0;

    for (const job of targetJobs) {
      const jobId = job.job_id ? String(job.job_id).trim() : "";
      if (!jobId) continue;

      // 既にスコア済みならスキップ
      if (scoredJobIdsRef.current.has(jobId)) continue;

      // スコア済みとして記録
      scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);

      try {
        setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

        const result = await scoreJobWithAI(jobId);

        if (result.success && result.score) {
          setAiScores((prev) => {
            const newMap = new Map(prev);
            newMap.set(jobId, result.score!);
            return newMap;
          });
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`[BatchAIScore] ${jobId} エラー:`, err);
        errorCount++;
      } finally {
        setScoredJobIds((prev) => new Set(prev).add(jobId));
        setAiScoreLoadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }

      // Rate limit対策: 3秒待機
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setIsBatchScoring(false);
    console.log(`[BatchAIScore] 完了: 成功${successCount}件, 失敗${errorCount}件`);
  }, [allJobs, aiScores, isBatchScoring]);

  // 新しい案件に対してAIスコアリングを自動実行
  useEffect(() => {
    if (isAutoScoringRef.current) return;
    if (allJobs.length === 0) return;

    // スコア未取得の案件を抽出
    const unscoredJobs = allJobs.filter((job) => {
      const jobId = job.job_id ? String(job.job_id).trim() : "";
      return jobId !== "" && !scoredJobIdsRef.current.has(jobId);
    });

    if (unscoredJobs.length === 0) return;

    console.log(`[AutoAIScore] ${unscoredJobs.length}件の新規案件をAI評価中...`);
    isAutoScoringRef.current = true;

    const scoreAllJobs = async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const job of unscoredJobs) {
        const jobId = job.job_id ? String(job.job_id).trim() : "";
        if (!jobId) continue;

        if (scoredJobIdsRef.current.has(jobId)) continue;

        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);

        try {
          setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

          const result = await scoreJobWithAI(jobId);

          if (result.success && result.score) {
            setAiScores((prev) => {
              const newMap = new Map(prev);
              newMap.set(jobId, result.score!);
              return newMap;
            });
            console.log(`[AutoAIScore] ${jobId} 完了 (スコア: ${result.score.overall_score})`);
            successCount++;
          } else {
            console.log(`[AutoAIScore] ${jobId} 失敗: ${result.error}`);
            errorCount++;
          }
        } catch (err) {
          console.error(`[AutoAIScore] ${jobId} のスコアリング失敗:`, err instanceof Error ? err.message : err);
          errorCount++;
        } finally {
          setScoredJobIds((prev) => new Set(prev).add(jobId));
          setAiScoreLoadingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
        }

        // Rate limit対策: 3秒待機
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      console.log(`[AutoAIScore] 完了: 成功${successCount}件, 失敗${errorCount}件`);
      isAutoScoringRef.current = false;
    };

    scoreAllJobs();
  }, [allJobs]);

  return {
    aiScores,
    aiScoreLoadingIds,
    isBatchScoring,
    handleAIScore,
    handleBatchAIScore,
  };
}
