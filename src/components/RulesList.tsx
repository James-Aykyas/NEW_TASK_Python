import React from 'react';
import { Rule } from '../types';
import { FileText, Star, Tag } from 'lucide-react';

interface RulesListProps {
  rules: Rule[];
  onRuleSelect?: (rule: Rule) => void;
}

export const RulesList: React.FC<RulesListProps> = ({ rules, onRuleSelect }) => {
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 5) return 'text-amber-600 bg-amber-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No rules loaded</h3>
        <p className="mt-1 text-sm text-gray-500">Upload a document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Loaded Rules ({rules.length})
        </h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => onRuleSelect?.(rule)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(rule.priority)}`}>
                  <Star className="w-3 h-3 mr-1" />
                  {getPriorityLabel(rule.priority)}
                </span>
                {rule.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                    <Tag className="w-3 h-3 mr-1" />
                    {rule.category}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {rule.source}
              </span>
            </div>
            
            <p className="text-sm text-gray-800 leading-relaxed">
              {rule.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};