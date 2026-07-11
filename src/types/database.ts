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
};

export type ArticleRead = {
  user_id: string;
  article_id: string;
  read_at: string;
};

export type Profile = {
  id: string;
  nickname: string | null;
  created_at: string;
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
        Insert: Omit<QuizAnswer, "id"> & { id?: string };
        Update: Partial<QuizAnswer>;
      } & NoRelationships;
      article_reads: {
        Row: ArticleRead;
        Insert: Omit<ArticleRead, "read_at"> & { read_at?: string };
        Update: Partial<ArticleRead>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
