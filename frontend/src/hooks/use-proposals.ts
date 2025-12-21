"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Job } from "@/types/job";
import { generateProposal } from "@/lib/api";

const DRAFTS_STORAGE_KEY = "proposal-generator-drafts";
const GENERATED_PROPOSALS_STORAGE_KEY = "proposal-generator-generated-proposals";

// 生成された提案文の型
interface GeneratedProposal {
  jobId: string;
  jobTitle: string;
  proposal: string;
  characterCount: number;
  qualityScore: number;
  generatedAt: string;
}

export function useProposals(allJobs: Job[]) {
  const router = useRouter();
  const [proposalLoadingIds, setProposalLoadingIds] = useState<Set<string>>(new Set());

  // 提案文生成ハンドラー
  const handleGenerateProposal = useCallback(async (jobId: string) => {
    if (proposalLoadingIds.has(jobId)) return;

    setProposalLoadingIds((prev) => new Set(prev).add(jobId));

    try {
      const result = await generateProposal(jobId);
      if (result.success && result.proposal) {
        // 対象の案件情報を取得
        const job = allJobs.find((j) => j.job_id === jobId);

        // 生成された提案文を保存
        const generatedProposal: GeneratedProposal = {
          jobId,
          jobTitle: job?.title || "不明",
          proposal: result.proposal.text,
          characterCount: result.proposal.character_count,
          qualityScore: result.metadata?.quality_score || 0,
          generatedAt: new Date().toISOString(),
        };

        // 既存の提案文リストを取得
        const existingJson = localStorage.getItem(GENERATED_PROPOSALS_STORAGE_KEY);
        const existingProposals: GeneratedProposal[] = existingJson
          ? JSON.parse(existingJson)
          : [];

        // 同じjob_idの既存提案を削除して新しいものを追加
        const updatedProposals = existingProposals.filter((p) => p.jobId !== jobId);
        updatedProposals.unshift(generatedProposal);

        // ローカルストレージに保存
        localStorage.setItem(
          GENERATED_PROPOSALS_STORAGE_KEY,
          JSON.stringify(updatedProposals)
        );

        // 下書きページに遷移
        router.push(`/drafts?generated=${jobId}`);
      } else {
        console.error("提案文生成失敗:", result.error);
        alert(`提案文の生成に失敗しました: ${result.error?.message || "不明なエラー"}`);
      }
    } catch (err) {
      console.error("提案文生成エラー:", err);
      alert("提案文の生成中にエラーが発生しました");
    } finally {
      setProposalLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }, [proposalLoadingIds, allJobs, router]);

  // 選択された案件を下書きに追加
  const addToDrafts = useCallback((jobs: Job[], selectedJobIds: string[]) => {
    const selectedJobs = jobs.filter((job) => {
      const jobId = job.job_id ? String(job.job_id) : "";
      return jobId && selectedJobIds.includes(jobId);
    });

    if (selectedJobs.length === 0) return;

    // 既存の下書きを取得
    const existingDraftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const existingDrafts: Job[] = existingDraftsJson
      ? JSON.parse(existingDraftsJson)
      : [];

    // 重複を避けて新しい案件を追加
    const existingIds = new Set(existingDrafts.map((j) => j.job_id));
    const newDrafts = selectedJobs.filter((j) => !existingIds.has(j.job_id));
    const allDrafts = [...existingDrafts, ...newDrafts];

    // ローカルストレージに保存
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(allDrafts));

    // 下書きページに遷移
    router.push("/drafts");
  }, [router]);

  return {
    proposalLoadingIds,
    handleGenerateProposal,
    addToDrafts,
  };
}
