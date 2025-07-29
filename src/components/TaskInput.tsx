import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (input: string) => void;
  isProcessing: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const exampleInputs = [
    "I have a meeting tomorrow at 10am",
    "Urgent deadline for project due today",
    "Want to go to gym but have work calls",
    "Double booked for appointments at 2pm"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-input" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your situation or task
          </label>
          <div className="relative">
            <textarea
              id="task-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., I have a meeting tomorrow at 10am and need to reschedule my gym session..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Example inputs:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exampleInputs.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              className="text-left p-3 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              disabled={isProcessing}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};