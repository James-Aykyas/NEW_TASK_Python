import React, { useState, useCallback } from 'react';
import { Brain, FileText, MessageSquare, CheckSquare, Activity, Bell, TrendingUp } from 'lucide-react';
import { RulesList } from './components/RulesList';
import { TaskInput } from './components/TaskInput';
import { ResponseDisplay } from './components/ResponseDisplay';
import { TaskList } from './components/TaskList';
import { ApiClient } from './services/apiClient';
import { Rule, Task, RAGResponse } from './types';

function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentResponse, setCurrentResponse] = useState<RAGResponse | null>(null);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'chat' | 'tasks'>('dashboard');
  const [isConnected, setIsConnected] = useState(false);

  const apiClient = ApiClient.getInstance();

  // Load sample rules on component mount
  React.useEffect(() => {
    loadInitialData();
    setupWebSocket();
  }, []);

  const loadInitialData = async () => {
    try {
      const [rulesResponse, tasksResponse] = await Promise.all([
        apiClient.getRules(),
        apiClient.getTasks()
      ]);
      setRules(rulesResponse.rules || []);
      setTasks(tasksResponse.tasks || []);
      setIsConnected(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setIsConnected(false);
    }
  };

  const setupWebSocket = () => {
    apiClient.connectWebSocket((data) => {
      if (data.type === 'rules_updated') {
        loadInitialData(); // Reload all data when rules are updated
      } else if (data.type === 'tasks_updated') {
        setTasks(prev => [...prev, ...data.data.new_tasks]);
      } else if (data.type === 'task_updated') {
        setTasks(prev => prev.map(task => 
          task.id === data.data.id ? data.data : task
        ));
      }
    });
  };

  const handleUserInput = useCallback(async (input: string) => {
    if (rules.length === 0) {
      setCurrentResponse({
        response: "Please upload a document with rules first before submitting tasks.",
        relevantRules: [],
        confidence: 0
      });
      return;
    }

    setIsProcessingInput(true);
    try {
      const response = await apiClient.processInput(input);
      setCurrentResponse({
        response: response.response,
        relevantRules: response.relevant_rules || [],
        confidence: response.confidence || 0
      });
      
      // Switch to chat tab to show response
      setActiveTab('chat');
    } catch (error) {
      console.error('Error processing input:', error);
      setCurrentResponse({
        response: "An error occurred while processing your request. Please try again.",
        relevantRules: [],
        confidence: 0
      });
    } finally {
      setIsProcessingInput(false);
    }
  }, [rules, apiClient]);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    try {
      apiClient.updateTask(taskId, {
        status: updates.status,
        priority: updates.priority
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [apiClient]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'rules', label: 'Rules', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare }
  ] as const;

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total, completed, high, pending };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  TaskMaster AI
                </h1>
                <p className="text-sm text-gray-600">Intelligent Task Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{rules.length}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="h-4 w-4" />
                    <span>{tasks.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Tasks', value: getTaskStats().total, icon: CheckSquare, color: 'blue' },
                { label: 'Completed', value: getTaskStats().completed, icon: TrendingUp, color: 'green' },
                { label: 'High Priority', value: getTaskStats().high, icon: Bell, color: 'red' },
                { label: 'Active Rules', value: rules.length, icon: FileText, color: 'purple' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                        <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className="p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors duration-200"
                >
                  <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Add New Task</h3>
                  <p className="text-sm text-gray-600">Describe your task and get AI recommendations</p>
                </button>
                <button
                  onClick={() => setActiveTab('rules')}
                  className="p-4 text-left bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors duration-200"
                >
                  <FileText className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-medium text-gray-900">View Rules</h3>
                  <p className="text-sm text-gray-600">Review your loaded business rules</p>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="p-4 text-left bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-colors duration-200"
                >
                  <CheckSquare className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Manage Tasks</h3>
                  <p className="text-sm text-gray-600">Update task status and priorities</p>
                </button>
              </div>
            </div>

            {/* File Monitoring Status */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <div className="flex items-start space-x-3">
                <Activity className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">File Monitoring Active</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      The system is monitoring your VS Code root directory for new rule files. 
                      Simply add PDF, JSON, CSV, or TXT files containing rules, and they'll be automatically processed.
                    </p>
                    <div className="text-xs text-amber-700 space-y-1">
                      <div>✓ Supported formats: PDF, JSON, CSV, TXT</div>
                      <div>✓ Real-time processing and rule extraction</div>
                      <div>✓ Automatic priority and category assignment</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'rules' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Loaded Rules</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      These are the rules extracted from your documents. The AI will use these to make decisions and set task priorities.
                    </p>
                  </div>
                  <RulesList rules={rules} />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Task Assistant</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Describe your situation and get rule-based recommendations with automatic reminders from the AI agent.
                    </p>
                  </div>
                  <TaskInput onSubmit={handleUserInput} isProcessing={isProcessingInput} />
                  <ResponseDisplay response={currentResponse} />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Generated Tasks</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Tasks generated from your inputs, prioritized according to your uploaded rules with automatic reminders.
                    </p>
                  </div>
                  <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Rules</span>
                  <span className="text-sm font-medium text-gray-900">{rules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="text-sm font-medium text-gray-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-green-600">
                    {getTaskStats().completed}
                  </span>
                </div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-base font-medium text-blue-900 mb-3">Getting Started</h3>
                <ol className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">1</span>
                    <span>Add rule files to your VS Code root directory</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">2</span>
                    <span>Review the extracted rules in the Rules tab</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">3</span>
                    <span>Chat with the AI to get intelligent task recommendations</span>
                  </li>
                </ol>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;