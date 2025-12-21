"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  User,
  Save,
  Loader2,
  X,
  Plus,
  Link,
  Briefcase,
  Target,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import {
  saveProfile,
  autoCompleteProfile,
  ProfileSuggestions,
} from "@/lib/api";
import {
  UserProfile,
  SKILL_SUGGESTIONS,
  SPECIALTY_SUGGESTIONS,
} from "@/types/profile";
import { CATEGORY_LABELS } from "@/types/job";

interface ProfileTabProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function ProfileTab({ profile, setProfile, setMessage }: ProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [suggestions, setSuggestions] = useState<ProfileSuggestions | null>(null);

  // タグ入力状態
  const [newSkill, setNewSkill] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [skillPopoverOpen, setSkillPopoverOpen] = useState(false);
  const [specialtyPopoverOpen, setSpecialtyPopoverOpen] = useState(false);

  // プロフィール保存
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      await saveProfile(profile);
      setMessage({ type: "success", text: "プロフィールを保存しました" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // AIでプロフィールを自動補完
  const handleAutoComplete = async () => {
    try {
      setIsAutoCompleting(true);
      setMessage(null);
      setSuggestions(null);
      const result = await autoCompleteProfile();
      setSuggestions(result.suggestions);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "自動補完に失敗しました",
      });
    } finally {
      setIsAutoCompleting(false);
    }
  };

  // 提案を適用
  const applySuggestions = () => {
    if (!suggestions) return;
    setProfile((prev) => ({
      ...prev,
      skills: [...new Set([...prev.skills, ...suggestions.skills])],
      specialties: [...new Set([...prev.specialties, ...suggestions.specialties])],
      preferred_categories: suggestions.preferred_categories,
      skills_detail: suggestions.skills_detail || prev.skills_detail,
      preferred_categories_detail: suggestions.preferred_categories_detail || prev.preferred_categories_detail,
    }));
    setSuggestions(null);
    setMessage({ type: "success", text: "AIの提案を適用しました。保存ボタンを押して確定してください。" });
  };

  // タグ追加・削除
  const addSkill = useCallback(() => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  }, [newSkill, profile.skills, setProfile]);

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addSpecialty = useCallback(() => {
    if (newSpecialty.trim() && !profile.specialties.includes(newSpecialty.trim())) {
      setProfile((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty("");
    }
  }, [newSpecialty, profile.specialties, setProfile]);

  const removeSpecialty = (specialty: string) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }));
  };

  const addPortfolioUrl = useCallback(() => {
    if (newPortfolioUrl.trim() && !profile.portfolio_urls.includes(newPortfolioUrl.trim())) {
      setProfile((prev) => ({
        ...prev,
        portfolio_urls: [...prev.portfolio_urls, newPortfolioUrl.trim()],
      }));
      setNewPortfolioUrl("");
    }
  }, [newPortfolioUrl, profile.portfolio_urls, setProfile]);

  const removePortfolioUrl = (url: string) => {
    setProfile((prev) => ({
      ...prev,
      portfolio_urls: prev.portfolio_urls.filter((u) => u !== url),
    }));
  };

  const toggleCategory = (category: string) => {
    setProfile((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter((c) => c !== category)
        : [...prev.preferred_categories, category],
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* プロフィール内サブタブ */}
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 w-fit">
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" />
              基本情報
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Briefcase className="h-4 w-4" />
              スキル
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Target className="h-4 w-4" />
              希望条件
            </TabsTrigger>
          </TabsList>

          {/* 基本情報タブ */}
          <TabsContent value="basic" className="flex-1 overflow-auto mt-4 pr-2">
            <div className="space-y-6 max-w-2xl">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="自己紹介を入力..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoComplete}
                    disabled={isAutoCompleting || !profile.bio || profile.bio.length < 20}
                    className="mt-2"
                  >
                    {isAutoCompleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isAutoCompleting ? "分析中..." : "AIで自動補完"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    自己紹介文からスキルや得意分野をAIが自動抽出します
                  </p>
                </div>
              </div>

              {/* AI提案表示 */}
              {suggestions && (
                <SuggestionsCard
                  suggestions={suggestions}
                  onApply={applySuggestions}
                  onDismiss={() => setSuggestions(null)}
                />
              )}

              <Separator />

              {/* リンク */}
              <LinksSection
                profile={profile}
                setProfile={setProfile}
                newPortfolioUrl={newPortfolioUrl}
                setNewPortfolioUrl={setNewPortfolioUrl}
                addPortfolioUrl={addPortfolioUrl}
                removePortfolioUrl={removePortfolioUrl}
              />
            </div>
          </TabsContent>

          {/* スキルタブ */}
          <TabsContent value="skills" className="flex-1 overflow-auto mt-4 pr-2">
            <div className="space-y-6 max-w-2xl">
              {/* スキル */}
              <SkillsSection
                skills={profile.skills}
                newSkill={newSkill}
                setNewSkill={setNewSkill}
                addSkill={addSkill}
                removeSkill={removeSkill}
                popoverOpen={skillPopoverOpen}
                setPopoverOpen={setSkillPopoverOpen}
                setProfile={setProfile}
              />

              <Separator />

              {/* 得意分野 */}
              <SpecialtiesSection
                specialties={profile.specialties}
                newSpecialty={newSpecialty}
                setNewSpecialty={setNewSpecialty}
                addSpecialty={addSpecialty}
                removeSpecialty={removeSpecialty}
                popoverOpen={specialtyPopoverOpen}
                setPopoverOpen={setSpecialtyPopoverOpen}
                setProfile={setProfile}
              />

              <Separator />

              {/* スキル詳細 */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">スキル・経験の詳細</h3>
                <p className="text-sm text-muted-foreground">
                  上記で選択したスキルや得意分野について、具体的な経験や実績を自由に記述してください。
                </p>
                <textarea
                  value={profile.skills_detail}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, skills_detail: e.target.value }))
                  }
                  placeholder="例：Pythonでのスクレイピング経験3年、React/Next.jsでのフロントエンド開発経験2年..."
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </TabsContent>

          {/* 希望条件タブ */}
          <TabsContent value="preferences" className="flex-1 overflow-auto mt-4 pr-2">
            <div className="space-y-6 max-w-2xl">
              {/* 希望カテゴリ */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">応募したいカテゴリ</h3>
                <p className="text-sm text-muted-foreground">
                  応募したい案件のカテゴリを選択してください。該当カテゴリの案件が優先表示されます。
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <Badge
                      key={value}
                      variant={
                        profile.preferred_categories.includes(value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer py-1 px-3"
                      onClick={() => toggleCategory(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* カテゴリ詳細 */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">カテゴリ詳細</h3>
                <p className="text-sm text-muted-foreground">
                  上記で選択したカテゴリについて、具体的にどのような案件を探しているか自由に記述してください。
                </p>
                <textarea
                  value={profile.preferred_categories_detail}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, preferred_categories_detail: e.target.value }))
                  }
                  placeholder="例：Webスクレイピングや自動化の案件を中心に探しています。特にPythonを使った継続案件に興味があります..."
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 保存ボタン */}
      <div className="shrink-0 pt-6">
        <Button onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          プロフィールを保存
        </Button>
      </div>
    </div>
  );
}

// AI提案カード
function SuggestionsCard({
  suggestions,
  onApply,
  onDismiss,
}: {
  suggestions: ProfileSuggestions;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          AIが提案するプロフィール情報
        </h4>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 text-sm">
        {suggestions.skills.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1">スキル:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {suggestions.specialties.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1">得意分野:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.specialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {suggestions.preferred_categories.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1">希望カテゴリ:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.preferred_categories.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {CATEGORY_LABELS[c] || c}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {suggestions.skills_detail && (
          <div>
            <p className="text-muted-foreground mb-1">スキル詳細:</p>
            <p className="text-xs bg-white dark:bg-gray-800 p-2 rounded">{suggestions.skills_detail}</p>
          </div>
        )}
        {suggestions.preferred_categories_detail && (
          <div>
            <p className="text-muted-foreground mb-1">希望カテゴリ詳細:</p>
            <p className="text-xs bg-white dark:bg-gray-800 p-2 rounded">{suggestions.preferred_categories_detail}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onApply}>
          <Check className="h-4 w-4 mr-1" />
          この内容を適用
        </Button>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}

// リンクセクション
function LinksSection({
  profile,
  setProfile,
  newPortfolioUrl,
  setNewPortfolioUrl,
  addPortfolioUrl,
  removePortfolioUrl,
}: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  newPortfolioUrl: string;
  setNewPortfolioUrl: (url: string) => void;
  addPortfolioUrl: () => void;
  removePortfolioUrl: (url: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm flex items-center gap-2">
        <Link className="h-4 w-4" />
        リンク
      </h3>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Webサイト</Label>
          <Input
            id="website"
            type="url"
            value={profile.website_url}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, website_url: e.target.value }))
            }
            placeholder="https://example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            type="url"
            value={profile.github_url}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, github_url: e.target.value }))
            }
            placeholder="https://github.com/username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter">X (Twitter)</Label>
          <Input
            id="twitter"
            type="url"
            value={profile.twitter_url}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, twitter_url: e.target.value }))
            }
            placeholder="https://x.com/username"
          />
        </div>
        <div className="space-y-2">
          <Label>ポートフォリオURL</Label>
          <div className="space-y-2">
            {profile.portfolio_urls.map((url) => (
              <div key={url} className="flex items-center gap-2">
                <Input value={url} readOnly className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePortfolioUrl(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newPortfolioUrl}
                onChange={(e) => setNewPortfolioUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === "Enter" && addPortfolioUrl()}
              />
              <Button variant="outline" size="icon" onClick={addPortfolioUrl}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// スキルセクション
function SkillsSection({
  skills,
  newSkill,
  setNewSkill,
  addSkill,
  removeSkill,
  popoverOpen,
  setPopoverOpen,
  setProfile,
}: {
  skills: string[];
  newSkill: string;
  setNewSkill: (skill: string) => void;
  addSkill: () => void;
  removeSkill: (skill: string) => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">技術スキル</h3>
      <p className="text-sm text-muted-foreground">
        あなたが持っている技術スキルを登録してください。案件とのマッチング精度が向上します。
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="gap-1 py-1 px-3">
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="スキルを追加..."
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
          className="flex-1"
        />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1">
              候補から選択
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-3" align="end">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                クリックして追加
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-2 text-xs"
                    onClick={() => {
                      setProfile((prev) => ({
                        ...prev,
                        skills: [...prev.skills, s],
                      }));
                    }}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={addSkill}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 得意分野セクション
function SpecialtiesSection({
  specialties,
  newSpecialty,
  setNewSpecialty,
  addSpecialty,
  removeSpecialty,
  popoverOpen,
  setPopoverOpen,
  setProfile,
}: {
  specialties: string[];
  newSpecialty: string;
  setNewSpecialty: (specialty: string) => void;
  addSpecialty: () => void;
  removeSpecialty: (specialty: string) => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">得意分野</h3>
      <p className="text-sm text-muted-foreground">
        あなたの得意な分野や専門領域を登録してください。
      </p>
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty) => (
          <Badge key={specialty} variant="secondary" className="gap-1 py-1 px-3">
            {specialty}
            <button
              onClick={() => removeSpecialty(specialty)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newSpecialty}
          onChange={(e) => setNewSpecialty(e.target.value)}
          placeholder="得意分野を追加..."
          onKeyDown={(e) => e.key === "Enter" && addSpecialty()}
          className="flex-1"
        />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1">
              候補から選択
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-3" align="end">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                クリックして追加
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
                {SPECIALTY_SUGGESTIONS.filter((s) => !specialties.includes(s)).map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-2 text-xs"
                    onClick={() => {
                      setProfile((prev) => ({
                        ...prev,
                        specialties: [...prev.specialties, s],
                      }));
                    }}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={addSpecialty}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
