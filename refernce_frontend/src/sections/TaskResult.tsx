import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskResultProps {
  result: any;
  onReset: () => void;
}

export function TaskResult({ result, onReset }: TaskResultProps) {
  if (!result) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Task Completed!</h3>
              <p className="text-green-700">The agent has successfully completed your task.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isTravel = result?.domain === 'travel';
  const isHealthcare = result?.domain === 'healthcare';
  const isBusiness = result?.domain === 'business';

  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-green-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-green-900">Task Completed!</CardTitle>
              <CardDescription className="text-green-700">
                The agent has successfully completed your task
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">Success</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Goal */}
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Goal</h4>
          <p className="text-slate-900">{result.goal}</p>
        </div>

        {/* Travel Results */}
        {isTravel && result.confirmation_number && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Booking Confirmation</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Confirmation #:</span>
                <span className="font-mono font-medium text-blue-900">{result.confirmation_number}</span>
              </div>
              {result.flight_details && (
                <>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Flight:</span>
                    <span className="text-blue-900">{result.flight_details.flight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Route:</span>
                    <span className="text-blue-900">{result.flight_details.route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Date:</span>
                    <span className="text-blue-900">{result.flight_details.date}</span>
                  </div>
                </>
              )}
              {result.amount_paid && (
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-blue-700">Amount Paid:</span>
                  <span className="font-medium text-blue-900">${result.amount_paid}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Healthcare Results */}
        {isHealthcare && result.appointment_id && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-900 mb-3">Appointment Confirmed</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">Appointment ID:</span>
                <span className="font-mono font-medium text-green-900">{result.appointment_id}</span>
              </div>
              {result.appointment_details && (
                <>
                  <div className="flex justify-between">
                    <span className="text-green-700">Date:</span>
                    <span className="text-green-900">{result.appointment_details.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Time:</span>
                    <span className="text-green-900">{result.appointment_details.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Provider:</span>
                    <span className="text-green-900">{result.appointment_details.provider}</span>
                  </div>
                  {result.appointment_details.location && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Location:</span>
                      <span className="text-green-900">{result.appointment_details.location}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Business Results */}
        {isBusiness && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-900 mb-3">Approval Complete</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-purple-700">Status:</span>
                <span className="font-medium text-purple-900">
                  {result.approvals_obtained ? 'All Approvals Obtained' : 'Pending'}
                </span>
              </div>
              {result.final_action && (
                <div className="flex justify-between">
                  <span className="text-purple-700">Final Action:</span>
                  <span className="text-purple-900 capitalize">{result.final_action}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Stats */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Execution Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Steps Completed:</span>
              <p className="font-medium text-slate-900">
                {result.completed_steps} of {result.total_steps}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Completed At:</span>
              <p className="font-medium text-slate-900">
                {result.completed_at ? new Date(result.completed_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <Button onClick={onReset} className="w-full" variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Start New Task
        </Button>
      </CardContent>
    </Card>
  );
}
