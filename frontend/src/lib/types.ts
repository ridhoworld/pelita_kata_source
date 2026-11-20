export interface MediaItem {
  id: number;
  file_url: string;
  file_type?: string;
  width: number;
  height: number;
  variants?: Record<string, string> | null;
  caption?: string | null;
  credit_source: string;
  alt_text: string;
  created_at?: string;
  uploader?: { id: number; name: string };
}

export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  articles_count?: number;
  parent?: { id?: number; name: string; slug?: string } | null;
  children?: Category[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  articles_count?: number;
}

export interface AuthorSummary {
  id: number;
  name: string;
  username: string;
  bio?: string | null;
  role?: string;
  articles_count?: number;
  avatar?: { file_url: string; alt_text: string } | null;
}

export interface ArticleCorrection {
  id: number;
  type: "correction" | "update";
  note: string;
  created_at: string;
  created_by?: string | null;
  creator?: { id: number; name: string };
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  article_type: "news" | "opinion" | "feature" | "in_depth";
  status: "draft" | "in_review" | "scheduled" | "published" | "archived";
  is_breaking: boolean;
  is_featured: boolean;
  reading_time: number;
  views_count: number;
  published_at: string | null;
  updated_at?: string | null;
  review_note?: string | null;
  category: Category | null;
  author: AuthorSummary | null;
  editor?: { id: number; name: string; username: string } | null;
  featured_image?: MediaItem | null;
  featuredImage?: MediaItem | null;
  tags?: Tag[];
}

export interface ArticleDetail extends ArticleSummary {
  content_html: string;
  content_json?: Record<string, unknown> | null;
  is_preview?: boolean;
  seo?: {
    meta_title?: string | null;
    meta_description?: string | null;
    canonical_url?: string | null;
    og_image_url?: string | null;
  };
  corrections?: ArticleCorrection[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CmsUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  articles_count?: number;
  role: {
    id: number;
    name: "admin" | "editor" | "journalist" | "contributor";
    permissions?: string[];
  };
  avatar?: { id: number; file_url: string; alt_text: string } | null;
}

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content_html: string;
  is_published?: boolean;
  updated_at?: string;
}

export interface SiteSettings {
  site_name?: string;
  site_tagline?: string;
  contact_email?: string;
  meta_description?: string;
  social_links?: { x?: string; instagram?: string; youtube?: string };
}

