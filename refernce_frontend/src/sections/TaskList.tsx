import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task, TaskStatus } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  analyzing: 'bg-blue-100 text-blue-800 border-blue-200',
  planning: 'bg-blue-100 text-blue-800 border-blue-200',
  executing: 'bg-green-100 text-green-800 border-green-200',
  waiting: 'bg-amber-100 text-amber-800 border-amber-200',
  retrying: 'bg-amber-100 text-amber-800 border-amber-200',
  interrupted: 'bg-red-100 text-red-800 border-red-200',
  validating: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200'
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:8000/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`http://localhost:8000/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchTasks} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500">No tasks yet</p>
            <p className="text-sm text-slate-400 mt-1">Create a new task to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Tasks ({tasks.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchTasks}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`${statusColors[task.status]} capitalize`}>
                        {task.status}
                      </Badge>
                      {task.outcome?.domain && (
                        <Badge variant="outline" className="capitalize">
                          {task.outcome.domain}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-900 font-medium truncate">
                      {task.outcome?.original_goal || task.context?.goal || 'Unknown goal'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>ID: {task.task_id.substring(0, 8)}...</span>
                      <span>Created: {new Date(task.created_at).toLocaleString()}</span>
                      {task.plan.length > 0 && (
                        <span>
                          Steps: {task.plan.filter(s => s.status === 'completed').length}/{task.plan.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.task_id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
