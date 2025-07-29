import { Rule, Document } from '../types';

export class DocumentProcessor {
  static async processFile(file: File): Promise<Document> {
    const content = await this.extractContent(file);
    const rules = await this.extractRules(content, file.type);
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: this.getDocumentType(file.type),
      content,
      uploadedAt: new Date(),
      rules
    };
  }

  private static async extractContent(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return this.extractPDFContent(file);
    } else if (file.type === 'application/json') {
      return this.extractJSONContent(file);
    } else if (file.type === 'text/csv') {
      return this.extractCSVContent(file);
    } else {
      return this.extractTextContent(file);
    }
  }

  private static async extractPDFContent(file: File): Promise<string> {
    // Simulated PDF extraction - in production, use pdf-lib or similar
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder();
    return decoder.decode(arrayBuffer).replace(/[^\x20-\x7E\n]/g, '');
  }

  private static async extractJSONContent(file: File): Promise<string> {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        return json.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
      }
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return text;
    }
  }

  private static async extractCSVContent(file: File): Promise<string> {
    const text = await file.text();
    return text.split('\n')
      .map(line => line.split(',').join(' | '))
      .join('\n');
  }

  private static async extractTextContent(file: File): Promise<string> {
    return await file.text();
  }

  private static async extractRules(content: string, fileType: string): Promise<Rule[]> {
    const lines = content.split('\n').filter(line => line.trim());
    const rules: Rule[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (this.isRule(line)) {
        rules.push({
          id: crypto.randomUUID(),
          content: line,
          source: fileType,
          priority: this.extractPriority(line),
          category: this.extractCategory(line)
        });
      }
    }
    
    return rules;
  }

  private static isRule(line: string): boolean {
    const rulePatterns = [
      /^if\s+/i,
      /^when\s+/i,
      /^rule\s*\d*\s*:/i,
      /^always\s+/i,
      /^never\s+/i,
      /^\d+\.\s+/,
      /^-\s+/,
      /priority|urgent|important|deadline/i
    ];
    
    return rulePatterns.some(pattern => pattern.test(line)) || line.length > 20;
  }

  private static extractPriority(rule: string): number {
    if (/urgent|critical|high priority/i.test(rule)) return 10;
    if (/important|medium priority/i.test(rule)) return 5;
    if (/low priority|optional/i.test(rule)) return 1;
    return 3;
  }

  private static extractCategory(rule: string): string | undefined {
    if (/meeting|appointment|schedule/i.test(rule)) return 'scheduling';
    if (/deadline|due date|time/i.test(rule)) return 'time-management';
    if (/health|gym|exercise/i.test(rule)) return 'health';
    if (/work|project|task/i.test(rule)) return 'work';
    return undefined;
  }

  private static getDocumentType(mimeType: string): 'pdf' | 'json' | 'csv' | 'txt' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/json') return 'json';
    if (mimeType === 'text/csv') return 'csv';
    return 'txt';
  }
}