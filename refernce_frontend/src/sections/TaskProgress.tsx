import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task, TaskStatus } from '@/types';

interface TaskProgressProps {
  task: Task;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: '⏳' },
  analyzing: { label: 'Analyzing', color: 'bg-blue-500', icon: '🧠' },
  planning: { label: 'Planning', color: 'bg-blue-500', icon: '📋' },
  executing: { label: 'Executing', color: 'bg-green-500', icon: '⚙️' },
  waiting: { label: 'Waiting', color: 'bg-amber-500', icon: '⏸️' },
  retrying: { label: 'Retrying', color: 'bg-amber-500', icon: '🔄' },
  interrupted: { label: 'Needs Input', color: 'bg-red-500', icon: '👤' },
  validating: { label: 'Validating', color: 'bg-green-500', icon: '✓' },
  completed: { label: 'Completed', color: 'bg-green-600', icon: '✅' },
  failed: { label: 'Failed', color: 'bg-red-600', icon: '❌' }
};

export function TaskProgress({ task }: TaskProgressProps) {
  const config = statusConfig[task.status];
  const completedSteps = task.plan.filter(s => s.status === 'completed').length;
  const totalSteps = task.plan.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <p className="text-sm text-slate-500">
                  {task.outcome?.domain && (
                    <span className="capitalize">{task.outcome.domain}</span>
                  )}
                </p>
              </div>
            </div>
            <Badge 
              variant={task.status === 'completed' ? 'default' : 'secondary'}
              className={`${config.color} text-white`}
            >
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium">{completedSteps} of {totalSteps} steps</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Current Action */}
          {task.status === 'executing' && task.plan[task.current_step_index] && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Current:</span>{' '}
                {task.plan[task.current_step_index].description}
              </p>
            </div>
          )}

          {/* Goal */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Goal:</p>
            <p className="text-slate-900">{task.outcome?.original_goal || task.context?.goal}</p>
          </div>
        </CardContent>
      </Card>

      {/* Steps List */}
      {task.plan.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Execution Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {task.plan.map((step, index) => {
                  const isCompleted = step.status === 'completed';
                  const isFailed = step.status === 'failed';
                  const isCurrent = index === task.current_step_index && task.status === 'executing';
                  const isPending = step.status === 'pending';

                  return (
                    <div
                      key={step.id}
                      className={`
                        p-4 rounded-lg border transition-all
                        ${isCompleted ? 'bg-green-50 border-green-200' : ''}
                        ${isFailed ? 'bg-red-50 border-red-200' : ''}
                        ${isCurrent ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''}
                        ${isPending ? 'bg-slate-50 border-slate-200' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="mt-0.5">
                          {isCompleted && (
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isFailed && (
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {isCurrent && (
                            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                          {isPending && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">Step {index + 1}</span>
                            {step.retry_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Retry {step.retry_count}
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${isCompleted ? 'text-green-800' : isFailed ? 'text-red-800' : 'text-slate-700'}`}>
                            {step.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Action: {step.action_type}
                          </p>
                          {step.error && (
                            <p className="text-xs text-red-600 mt-2">
                              Error: {step.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Success Criteria */}
      {task.outcome?.success_criteria && task.outcome.success_criteria.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Success Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {task.outcome.success_criteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {criterion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
