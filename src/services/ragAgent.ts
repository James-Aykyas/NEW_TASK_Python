import { Rule, Task, RAGResponse } from '../types';
import { VectorStore } from './vectorStore';
import { ReminderService } from './reminderService';

export class RAGAgent {
  private vectorStore: VectorStore;
  private reminderService: ReminderService;
  private systemPrompt: string; 

  constructor(vectorStore: VectorStore, reminderService: ReminderService) {
    this.vectorStore = vectorStore;
    this.reminderService = reminderService;
    this.systemPrompt = `You are a strict task management agent. You must ONLY follow the rules provided to you. 
    Do not use any external knowledge or reasoning beyond what is explicitly stated in the rules.
    
    Your responses should:
    1. Apply only the relevant rules provided
    2. Be concise and actionable
    3. Include specific task recommendations
    4. Prioritize tasks based on the rules
    5. Never add information not contained in the rules`;
  }

  async processUserInput(input: string): Promise<RAGResponse> {
    // Retrieve relevant rules
    const relevantRules = await this.vectorStore.searchSimilar(input, 3);
    
    if (relevantRules.length === 0) {
      return {
        response: "I don't have any relevant rules for this input. Please add rules that cover this scenario.",
        relevantRules: [],
        confidence: 0
      };
    }

    // Generate response based on rules
    const response = await this.generateResponse(input, relevantRules.map(r => r.rule));
    
    return {
      response,
      relevantRules: relevantRules.map(r => r.rule),
      confidence: this.calculateConfidence(relevantRules)
    };
  }

  async generateTaskRecommendations(input: string): Promise<Task[]> {
    const ragResponse = await this.processUserInput(input);
    const tasks: Task[] = [];

    // Extract actionable items from the response
    const actionItems = this.extractActionItems(ragResponse.response, input);
    
    actionItems.forEach((item, index) => {
      tasks.push({
        id: crypto.randomUUID(),
        content: item.content,
        priority: item.priority,
        status: 'pending',
        dueDate: item.dueDate,
        appliedRules: ragResponse.relevantRules.map(r => r.id),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Schedule reminders for new tasks
    tasks.forEach(task => {
      if (task.dueDate) {
        const reminderTime = ReminderService.calculateReminderTime(task, task.priority);
        task.reminderTime = reminderTime;
        this.reminderService.scheduleReminder(task, reminderTime);
      }
    });

    return tasks;
  }

  private async generateResponse(input: string, rules: Rule[]): Promise<string> {
    // Simulate LLM response based on rules
    // In production, this would call an actual LLM API
    
    const ruleTexts = rules.map(r => r.content).join('\n');
    
    // Simple rule-based logic simulation
    if (this.containsTimeConflict(input, rules)) {
      return this.handleTimeConflict(input, rules);
    }
    
    if (this.containsPriorityConflict(input, rules)) {
      return this.handlePriorityConflict(input, rules);
    }
    
    return this.generateBasicResponse(input, rules);
  }

  private containsTimeConflict(input: string, rules: Rule[]): boolean {
    const hasTimeReference = /\d+:\d+|\d+\s*(am|pm)|tomorrow|today|yesterday/i.test(input);
    const hasConflictRule = rules.some(rule => 
      /conflict|overlap|same time|schedule/i.test(rule.content)
    );
    return hasTimeReference && hasConflictRule;
  }

  private containsPriorityConflict(input: string, rules: Rule[]): boolean {
    const hasPriorityKeywords = /urgent|important|priority|deadline/i.test(input);
    const hasPriorityRules = rules.some(rule => 
      /priority|urgent|important|skip|cancel/i.test(rule.content)
    );
    return hasPriorityKeywords && hasPriorityRules;
  }

  private handleTimeConflict(input: string, rules: Rule[]): string {
    const conflictRules = rules.filter(rule => 
      /conflict|overlap|schedule|time/i.test(rule.content)
    );
    
    return `Based on your rules: ${conflictRules.map(r => r.content).join('; ')}. 
    I recommend checking for schedule conflicts and rescheduling if necessary.`;
  }

  private handlePriorityConflict(input: string, rules: Rule[]): string {
    const priorityRules = rules.filter(rule => 
      /priority|urgent|important|skip|cancel/i.test(rule.content)
    );
    
    const highestPriorityRule = priorityRules.reduce((highest, current) => 
      current.priority > highest.priority ? current : highest
    );
    
    return `According to your highest priority rule: "${highestPriorityRule.content}". 
    This should take precedence over other activities.`;
  }

  private generateBasicResponse(input: string, rules: Rule[]): string {
    const mostRelevantRule = rules[0];
    return `Based on the rule: "${mostRelevantRule.content}", here's what I recommend: 
    Follow this guideline for your situation.`;
  }

  private extractActionItems(response: string, input: string): Array<{
    content: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
  }> {
    const items = [];
    const now = new Date();
    
    // Check for time urgency indicators in input
    const isUrgentTime = this.isUrgentTimeframe(input);
    const suggestedDueDate = this.extractDueDate(input);
    
    // Extract specific actions from response
    if (/reschedule|change time/i.test(response)) {
      items.push({
        content: `Reschedule conflicting appointment`,
        priority: isUrgentTime ? 'high' : 'medium' as const,
        dueDate: suggestedDueDate || new Date(now.getTime() + (2 * 60 * 60 * 1000))
      });
    }
    
    if (/cancel|skip/i.test(response)) {
      items.push({
        content: `Cancel lower priority activity`,
        priority: isUrgentTime ? 'high' : 'medium' as const,
        dueDate: suggestedDueDate || new Date(now.getTime() + (1 * 60 * 60 * 1000))
      });
    }
    
    if (/check|verify/i.test(response)) {
      items.push({
        content: `Verify schedule and requirements`,
        priority: isUrgentTime ? 'high' : 'medium' as const,
        dueDate: suggestedDueDate || new Date(now.getTime() + (4 * 60 * 60 * 1000))
      });
    }

    // Override priorities based on urgency keywords
    if (/urgent|emergency|asap|critical|immediately/i.test(input)) {
      items.forEach(item => {
        item.priority = 'high';
        item.dueDate = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes
      });
    }

    // Set high priority for tasks due within 24 hours
    if (isUrgentTime || /today|tonight|this evening|in \d+ hours?|within.*hour/i.test(input)) {
      items.forEach(item => {
        item.priority = 'high';
        if (!item.dueDate) {
          item.dueDate = suggestedDueDate || new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 hours
        }
      });
    }
    
    // Default action based on input
    if (items.length === 0) {
      const defaultPriority:any = this.calculateDefaultPriority(input, suggestedDueDate);
      items.push({
        content: `Handle: ${input}`,
        priority: defaultPriority,
        dueDate: suggestedDueDate || new Date(now.getTime() + (24 * 60 * 60 * 1000))
      });
    }
    
    return items;
  }

  private isUrgentTimeframe(input: string): boolean {
    const urgentPatterns = [
      /today|tonight|this evening/i,
      /in \d+ hours?/i,
      /within.*hour/i,
      /by \d+:\d+/i,
      /before \d+/i,
      /urgent|asap|immediately|critical/i,
      /due.*today/i,
      /deadline.*today/i
    ];
    
    return urgentPatterns.some(pattern => pattern.test(input));
  }

  private extractDueDate(input: string): Date | undefined {
    const now = new Date();
    
    // Today patterns
    if (/today|tonight|this evening/i.test(input)) {
      const endOfDay = new Date(now);
      endOfDay.setHours(18, 0, 0, 0); // 6 PM today
      return endOfDay;
    }
    
    // Tomorrow patterns
    if (/tomorrow|next day/i.test(input)) {
      return new Date(now.getTime() + (24 * 60 * 60 * 1000));
    }
    
    // Specific time patterns (e.g., "at 10am", "by 2pm")
    const timeMatch = input.match(/(?:at|by|before)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3].toLowerCase();
      
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, set for tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      return targetTime;
    }
    
    // Hours from now (e.g., "in 2 hours")
    const hoursMatch = input.match(/in\s*(\d+)\s*hours?/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      return new Date(now.getTime() + (hours * 60 * 60 * 1000));
    }
    
    return undefined;
  }

  private calculateDefaultPriority(input: string, dueDate?: Date): 'high' | 'medium' | 'low' {
    const now = new Date();
    
    // If due date is within 24 hours, set as high priority
    if (dueDate && (dueDate.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000)) {
      return 'high';
    }
    
    // Check for priority keywords
    if (/urgent|critical|important|asap|emergency/i.test(input)) {
      return 'high';
    }
    
    if (/meeting|appointment|deadline|client/i.test(input)) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateConfidence(results: Array<{ similarity: number }>): number {
    if (results.length === 0) return 0;
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    return Math.min(avgSimilarity * 100, 100);
  }

  getPriorityFromRules(rules: Rule[]): 'high' | 'medium' | 'low' {
    if (rules.length === 0) return 'medium';
    
    const maxPriority = Math.max(...rules.map(r => r.priority));
    
    if (maxPriority >= 8) return 'high';
    if (maxPriority >= 4) return 'medium';
    return 'low';
  }
}