import { Rule, VectorSearchResult } from '../types';

export class VectorStore {
  private rules: Rule[] = [];
  private embeddings: Map<string, number[]> = new Map();

  async addRules(rules: Rule[]): Promise<void> {
    for (const rule of rules) {
      const embedding = await this.generateEmbedding(rule.content);
      rule.embedding = embedding;
      this.embeddings.set(rule.id, embedding);
      this.rules.push(rule);
    }
  }

  async searchSimilar(query: string, limit: number = 5): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const similarities: VectorSearchResult[] = [];

    for (const rule of this.rules) {
      if (rule.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, rule.embedding);
        similarities.push({ rule, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  getAllRules(): Rule[] {
    return [...this.rules];
  }

  clearRules(): void {
    this.rules = [];
    this.embeddings.clear();
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation using TF-IDF-like approach
    // In production, use OpenAI embeddings API or similar
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const vocabulary = this.getVocabulary();
    const embedding = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word) % 100;
      embedding[hash] += 1 / Math.sqrt(words.length);
    });
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getVocabulary(): string[] {
    return [
      'meeting', 'appointment', 'schedule', 'time', 'deadline', 'urgent', 'important',
      'task', 'work', 'project', 'priority', 'gym', 'health', 'exercise', 'late',
      'early', 'cancel', 'reschedule', 'complete', 'finish', 'start', 'begin'
    ];
  }
}