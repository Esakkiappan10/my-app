import { useState, useCallback, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { TaskInput } from '@/sections/TaskInput';
import { TaskProgress } from '@/sections/TaskProgress';
import { InterruptionDialog } from '@/sections/InterruptionDialog';
import { TaskResult } from '@/sections/TaskResult';
import { TaskList } from '@/sections/TaskList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Task, TaskStatus, WebSocketMessage } from '@/types';

function App() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('new');

  const api = useApi();

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'status_change' && message.status) {
      setCurrentTask(prev => prev ? { ...prev, status: message.status as TaskStatus } : null);
    } else if (message.type === 'step_complete') {
      setCurrentTask(prev => {
        if (!prev) return null;
        const newPlan = [...prev.plan];
        if (message.step !== undefined && message.step < newPlan.length) {
          newPlan[message.step] = {
            ...newPlan[message.step],
            status: 'completed'
          };
        }
        return { ...prev, plan: newPlan };
      });
    } else if (message.type === 'interrupted') {
      setCurrentTask(prev => prev ? {
        ...prev,
        status: 'interrupted',
        interrupt_reason: message.reason,
        interrupt_data: message.data
      } : null);
    } else if (message.type === 'completed') {
      setCurrentTask(prev => prev ? { ...prev, status: 'completed' } : null);
      // Fetch full result
      if (taskId) {
        api.getTaskResult(taskId).then(result => {
          setCurrentTask(prev => prev ? { ...prev, context: { ...prev.context, final_result: result } } : null);
        });
      }
    } else if (message.type === 'failed') {
      setCurrentTask(prev => prev ? { ...prev, status: 'failed' } : null);
    } else if (message.type === 'status' && message.data) {
      setCurrentTask(message.data as Task);
    }
  }, [api, taskId]);

  const { isConnected } = useWebSocket(taskId, {
    onMessage: handleWebSocketMessage
  });

  const handleTaskCreated = useCallback((newTaskId: string, task: Task) => {
    setTaskId(newTaskId);
    setCurrentTask(task);
    setActiveTab('progress');
  }, []);

  const handleInterruptionResponse = useCallback(async (response: Record<string, any>) => {
    if (!taskId) return;

    try {
      await api.respondToInterruption(taskId, { response });
      // Task will resume automatically
    } catch (error) {
      console.error('Failed to respond:', error);
    }
  }, [api, taskId]);

  const handleReset = useCallback(() => {
    setTaskId(null);
    setCurrentTask(null);
    setActiveTab('new');
  }, []);

  // Poll for status updates when not connected via WebSocket
  useEffect(() => {
    if (!taskId || isConnected) return;

    const interval = setInterval(async () => {
      try {
        const task = await api.getTaskStatus(taskId);
        setCurrentTask(task);
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId, isConnected, api]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Autonomous Agent</h1>
              <p className="text-sm text-slate-500">Outcome-driven task execution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-sm text-slate-600">
              {isConnected ? 'Connected' : 'Polling'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">New Task</TabsTrigger>
            <TabsTrigger value="progress" disabled={!currentTask}>Progress</TabsTrigger>
            <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            <TaskInput onTaskCreated={handleTaskCreated} />
            
            {/* Quick Demo Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Demos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const result = await api.createDemoTask('flight');
                    const task = await api.getTaskStatus(result.task_id);
                    handleTaskCreated(result.task_id, task);
                  }}
                  disabled={api.isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-2"
                >
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="text-sm">Book Flight</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={async () => {
                    const result = await api.createDemoTask('appointment');
                    const task = await api.getTaskStatus(result.task_id);
                    handleTaskCreated(result.task_id, task);
                  }}
                  disabled={api.isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-2"
                >
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Schedule Appt</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={async () => {
                    const result = await api.createDemoTask('approval');
                    const task = await api.getTaskStatus(result.task_id);
                    handleTaskCreated(result.task_id, task);
                  }}
                  disabled={api.isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-2"
                >
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Get Approval</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            {currentTask && (
              <div className="space-y-6">
                <TaskProgress task={currentTask} />
                
                {currentTask.status === 'interrupted' && currentTask.interrupt_reason && (
                  <InterruptionDialog
                    reason={currentTask.interrupt_reason}
                    data={currentTask.interrupt_data}
                    onRespond={handleInterruptionResponse}
                  />
                )}
                
                {currentTask.status === 'completed' && (
                  <TaskResult
                    result={currentTask.context?.final_result}
                    onReset={handleReset}
                  />
                )}
                
                {(currentTask.status === 'failed' || currentTask.status === 'completed') && (
                  <div className="flex justify-center">
                    <Button onClick={handleReset} variant="outline">
                      Start New Task
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
