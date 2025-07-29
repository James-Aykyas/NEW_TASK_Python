import React from 'react';
import { RAGResponse } from '../types';
import { Brain, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ResponseDisplayProps {
  response: RAGResponse | null;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  if (!response) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return CheckCircle;
    if (confidence >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  const ConfidenceIcon = getConfidenceIcon(response.confidence);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">AI Agent Response</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(response.confidence)}`}>
                <ConfidenceIcon className="w-4 h-4 mr-1" />
                {response.confidence.toFixed(0)}% confidence
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed">{response.response}</p>
            </div>
          </div>
        </div>
      </div>

      {response.relevantRules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-base font-medium text-blue-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Applied Rules ({response.relevantRules.length})
          </h4>
          <div className="space-y-3">
            {response.relevantRules.map((rule, index) => (
              <div key={rule.id} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Rule {index + 1}
                  </span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Priority: {rule.priority}/10
                  </span>
                </div>
                <p className="text-sm text-blue-800">{rule.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};