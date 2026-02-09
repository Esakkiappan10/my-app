import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/useApi';
import type { Task } from '@/types';

interface TaskInputProps {
  onTaskCreated: (taskId: string, task: Task) => void;
}

export function TaskInput({ onTaskCreated }: TaskInputProps) {
  const [goal, setGoal] = useState('');
  const [userId, setUserId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [contextJson, setContextJson] = useState('{}');
  const [contextError, setContextError] = useState<string | null>(null);

  const api = useApi();

  const handleSubmit = async () => {
    if (!goal.trim()) return;

    // Validate context JSON
    let context = {};
    try {
      context = JSON.parse(contextJson);
      setContextError(null);
    } catch (e) {
      setContextError('Invalid JSON in context field');
      return;
    }

    try {
      const response = await api.createTask({
        user_id: userId,
        goal: goal.trim(),
        context
      });

      // Fetch initial task state
      const task = await api.getTaskStatus(response.task_id);
      onTaskCreated(response.task_id, task);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const exampleGoals = [
    'Book me a flight to Tokyo next week under $800',
    'Schedule my annual physical checkup for next week',
    'Get approval for $50K vendor payment from stakeholders',
    'Renew my driver\'s license before March 1st',
    'Find and summarize 10 recent papers on AI safety'
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">What do you need done?</CardTitle>
        <CardDescription>
          Describe your goal and the autonomous agent will execute it end-to-end.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Input */}
        <div className="space-y-2">
          <Label htmlFor="goal">Your Goal</Label>
          <Textarea
            id="goal"
            placeholder="Example: Book me a flight to Tokyo next week under $800"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Example Goals */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-500">Examples:</Label>
          <div className="flex flex-wrap gap-2">
            {exampleGoals.map((example, index) => (
              <button
                key={index}
                onClick={() => setGoal(example)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {example.length > 40 ? example.substring(0, 40) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user_123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Context (JSON)</Label>
              <Input
                id="context"
                value={contextJson}
                onChange={(e) => setContextJson(e.target.value)}
                placeholder='{"key": "value"}'
                className={contextError ? 'border-red-500' : ''}
              />
              {contextError && (
                <p className="text-sm text-red-500">{contextError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!goal.trim() || api.isLoading}
          className="w-full h-12 text-lg"
        >
          {api.isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting...
            </>
          ) : (
            'Start Autonomous Task'
          )}
        </Button>

        {api.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{api.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
