import { Card } from '@/components/ui/card';
import { AIInsight, FinancialHealthScore } from '@/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getFinancialCoaching } from '@/lib/openai';

interface AIInsightsProps {
  insights: AIInsight[];
  healthScore: FinancialHealthScore;
}

export default function AIInsights({ insights, healthScore }: AIInsightsProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await getFinancialCoaching(question);
      setAnswer(response);
    } catch (error) {
      console.error('Error getting financial coaching:', error);
      setAnswer('Sorry, I encountered an error while processing your question. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI Financial Coach</h3>
        <span className="material-icons text-primary-500">psychology</span>
      </div>
      
      {/* Financial Health Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-neutral-500">Financial Health Score</p>
          <p className="text-sm font-semibold">{healthScore.score}/{healthScore.maxScore}</p>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5">
          <div 
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${(healthScore.score / healthScore.maxScore) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* AI Recommendation Cards */}
      {insights.map((insight) => (
        <div key={insight.id} className={`${insight.color} p-4 rounded-lg mb-4`}>
          <div className="flex items-start">
            <span className="material-icons mr-2">{insight.icon}</span>
            <div>
              <h4 className="font-medium mb-1">{insight.title}</h4>
              <p className="text-sm text-neutral-700">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* AI Chat Button */}
      <Button 
        variant="outline"
        className="w-full flex items-center justify-center border-primary-500 text-primary-500 hover:bg-primary-50 transition-colors mt-2"
        onClick={() => setChatOpen(true)}
      >
        <span className="material-icons text-sm mr-2">chat</span>
        Ask Financial Coach
      </Button>
      
      {/* AI Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Financial Coach</DialogTitle>
            <DialogDescription>
              Ask me anything about your financial situation, budgeting, or investment advice.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-end gap-2">
              <Input
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
              >
                {isLoading ? 'Thinking...' : 'Ask'}
              </Button>
            </div>
            
            {answer && (
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">{answer}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setChatOpen(false);
                setQuestion('');
                setAnswer('');
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
