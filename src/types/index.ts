export interface Rule {
  id: string;
  content: string;
  source: string;
  priority: number;
  category?: string;
  embedding?: number[];
}

export interface Task {
  id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  reminderTime?: Date;
  reminderSent?: boolean;
  appliedRules: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'json' | 'csv' | 'txt';
  content: string;
  uploadedAt: Date;
  rules: Rule[];
}

export interface RAGResponse {
  response: string;
  relevantRules: Rule[];
  confidence: number;
}

export interface VectorSearchResult {
  rule: Rule;
  similarity: number;
}