import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface InterruptionDialogProps {
  reason: string;
  data: any;
  onRespond: (response: Record<string, any>) => void;
}

export function InterruptionDialog({ reason, data, onRespond }: InterruptionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Required Dialog
  if (reason === 'payment_required') {
    const [selectedMethod, setSelectedMethod] = useState<string>(data?.payment_methods?.[0] || 'card_ending_4242');
    const [approved, setApproved] = useState<boolean | null>(null);

    const handleSubmit = async () => {
      if (approved === null) return;
      setIsSubmitting(true);
      await onRespond({
        approved,
        payment_method: approved ? selectedMethod : null
      });
      setIsSubmitting(false);
    };

    return (
      <Card className="border-amber-300 shadow-lg bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-amber-900">Payment Required</CardTitle>
              <CardDescription className="text-amber-700">
                The agent needs your approval to proceed with payment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Amount:</span>
              <span className="text-2xl font-bold text-slate-900">${data?.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Description:</span>
              <span className="text-slate-900">{data?.description}</span>
            </div>
          </div>

          {approved !== false && (
            <div className="space-y-3">
              <Label className="text-amber-900">Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {data?.payment_methods?.map((method: string) => (
                  <div key={method} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-amber-200">
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method} className="flex-1 cursor-pointer">
                      {method === 'card_ending_4242' && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>Visa ending in 4242</span>
                        </div>
                      )}
                      {method === 'card_ending_8888' && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>Mastercard ending in 8888</span>
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setApproved(false)}
              disabled={isSubmitting}
            >
              Decline
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={() => setApproved(true)}
              disabled={isSubmitting}
            >
              Review Payment
            </Button>
          </div>

          {approved !== null && (
            <div className="pt-4 border-t border-amber-200">
              <Button
                className="w-full"
                variant={approved ? 'default' : 'destructive'}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : approved ? 'Confirm Payment' : 'Cancel Task'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Approval Needed Dialog
  if (reason === 'approval_needed') {
    const [decision, setDecision] = useState<boolean | null>(null);
    const [comment, setComment] = useState('');

    const handleSubmit = async () => {
      if (decision === null) return;
      setIsSubmitting(true);
      await onRespond({
        approved: decision,
        comment: comment || undefined
      });
      setIsSubmitting(false);
    };

    return (
      <Card className="border-blue-300 shadow-lg bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-blue-900">Approval Needed</CardTitle>
              <CardDescription className="text-blue-700">
                Your approval is required to proceed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-slate-900 font-medium">{data?.message}</p>
            {data?.approver && (
              <p className="text-slate-600 mt-2">From: {data.approver}</p>
            )}
            {data?.details && (
              <p className="text-slate-600 mt-2">{data.details}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-blue-900">Your Decision</Label>
            <div className="flex gap-3">
              <Button
                variant={decision === true ? 'default' : 'outline'}
                className={`flex-1 ${decision === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => setDecision(true)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </Button>
              <Button
                variant={decision === false ? 'default' : 'outline'}
                className={`flex-1 ${decision === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={() => setDecision(false)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-blue-900">Comment (optional)</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
            />
          </div>

          {decision !== null && (
            <Button
              className="w-full"
              variant={decision ? 'default' : 'destructive'}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : decision ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Clarification Needed Dialog
  if (reason === 'clarification_needed') {
    const [answer, setAnswer] = useState('');

    const handleSubmit = async () => {
      if (!answer.trim()) return;
      setIsSubmitting(true);
      await onRespond({ answer: answer.trim() });
      setIsSubmitting(false);
    };

    return (
      <Card className="border-purple-300 shadow-lg bg-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-purple-900">Clarification Needed</CardTitle>
              <CardDescription className="text-purple-700">
                The agent needs more information to proceed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <p className="text-slate-900 font-medium">{data?.question}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer" className="text-purple-900">Your Answer</Label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && answer.trim()) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Generic Interruption Dialog
  return (
    <Card className="border-slate-300 shadow-lg">
      <CardHeader>
        <CardTitle>Action Required</CardTitle>
        <CardDescription>{reason}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={() => onRespond({ acknowledged: true })}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}
