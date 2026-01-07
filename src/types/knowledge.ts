export type KnowledgeCategory = 'Account' | 'Technical' | 'Billing' | 'Security' | 'General';
export type KnowledgeAccessLevel = 'public' | 'internal' | 'restricted' | 'confidential';
export type KnowledgeStatus = 'draft' | 'published';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  relevanceScore: number;
  createdDate: string;
  lastUpdated: string;
  viewCount: number;
  accessLevel: KnowledgeAccessLevel;
  status: KnowledgeStatus;
}
