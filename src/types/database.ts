export type ArticleCategory = "economy_affairs" | "ai";

export type ArticleConcept = {
  term: string;
  explanation: string;
};

export type Article = {
  id: string;
  published_date: string;
  category: ArticleCategory;
  title: string;
  headline: string | null;
  source: string;
  source_url: string;
  keywords: string[];
  summary: string;
  insight: string;
  prediction: string;
  concepts: ArticleConcept[];
  created_at: string;
};

export type DailyDigest = {
  date: string;
  overview_text: string;
  article_ids: string[];
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  date: string;
  question_text: string;
  correct_answer: boolean;
  explanation: string;
  related_article_id: string | null;
  created_at: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  date: string;
  score: number;
  total: number;
  correct_rate: number;
  created_at: string;
};

export type QuizAnswer = {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: boolean;
  is_correct: boolean;
  resolved_at: string | null;
};

export type ArticleRead = {
  user_id: string;
  article_id: string;
  read_at: string;
};

export type Profile = {
  id: string;
  nickname: string | null;
  interest: string | null;
  share_rank: boolean;
  is_admin: boolean;
  created_at: string;
};

export type UserInsight = {
  user_id: string;
  date: string;
  interest: string;
  insight_text: string;
  created_at: string;
};

export type Bookmark = {
  user_id: string;
  article_id: string;
  created_at: string;
};

export type BatchRunStatus = "running" | "success" | "failed";

export type BatchRun = {
  id: string;
  date: string;
  status: BatchRunStatus;
  articles_count: number | null;
  quiz_count: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export type LeaderboardRow = {
  nickname: string;
  avg_correct_rate: number;
  attempt_count: number;
};

type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      } & NoRelationships;
      articles: {
        Row: Article;
        Insert: Omit<Article, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Article>;
      } & NoRelationships;
      daily_digest: {
        Row: DailyDigest;
        Insert: Omit<DailyDigest, "created_at"> & { created_at?: string };
        Update: Partial<DailyDigest>;
      } & NoRelationships;
      quiz_questions: {
        Row: QuizQuestion;
        Insert: Omit<QuizQuestion, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<QuizQuestion>;
      } & NoRelationships;
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<QuizAttempt>;
      } & NoRelationships;
      quiz_answers: {
        Row: QuizAnswer;
        Insert: Omit<QuizAnswer, "id" | "resolved_at"> & { id?: string; resolved_at?: string | null };
        Update: Partial<QuizAnswer>;
      } & NoRelationships;
      article_reads: {
        Row: ArticleRead;
        Insert: Omit<ArticleRead, "read_at"> & { read_at?: string };
        Update: Partial<ArticleRead>;
      } & NoRelationships;
      user_insights: {
        Row: UserInsight;
        Insert: Omit<UserInsight, "created_at"> & { created_at?: string };
        Update: Partial<UserInsight>;
      } & NoRelationships;
      bookmarks: {
        Row: Bookmark;
        Insert: Omit<Bookmark, "created_at"> & { created_at?: string };
        Update: Partial<Bookmark>;
      } & NoRelationships;
      batch_runs: {
        Row: BatchRun;
        Insert: Omit<BatchRun, "id" | "started_at" | "articles_count" | "quiz_count" | "error_message" | "finished_at"> & {
          id?: string;
          started_at?: string;
          articles_count?: number | null;
          quiz_count?: number | null;
          error_message?: string | null;
          finished_at?: string | null;
        };
        Update: Partial<BatchRun>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      get_weekly_leaderboard: {
        Args: Record<string, never>;
        Returns: LeaderboardRow[];
      };
    };
  };
}
