import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MoneyMindLogo } from '@/components/Logo';

export default function FloatingCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{role: 'user' | 'assistant'; content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Hide intro message after 8 seconds
  useEffect(() => {
    if (showIntroMessage) {
      const timer = setTimeout(() => {
        setShowIntroMessage(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [showIntroMessage]);

  // Sample suggested questions
  const suggestedQuestions = [
    "How can I improve my credit score?",
    "How much should I save for retirement?",
    "What's a good emergency fund amount?",
    "Should I pay off debt or invest?"
  ];

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to conversation
    const userMessage = { role: 'user' as const, content: message };
    setConversation(prev => [...prev, userMessage]);
    
    // Clear input field
    setMessage('');
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        // Simulate AI response
        let aiResponse;
        
        if (message.toLowerCase().includes('credit score')) {
          aiResponse = "To improve your credit score: 1) Pay bills on time 2) Reduce credit card balances 3) Don't close old accounts 4) Limit new credit applications 5) Check your credit report for errors.";
        } else if (message.toLowerCase().includes('retirement')) {
          aiResponse = "A good rule of thumb is to save 15% of your income for retirement. The earlier you start, the better, due to compound interest. Consider maximizing employer matches in your 401(k) first.";
        } else if (message.toLowerCase().includes('emergency fund')) {
          aiResponse = "A good emergency fund typically covers 3-6 months of essential expenses. If your income is variable or you have dependents, consider aiming for the higher end of that range.";
        } else if (message.toLowerCase().includes('debt') && message.toLowerCase().includes('invest')) {
          aiResponse = "Generally, pay off high-interest debt (like credit cards) first, then build an emergency fund, then invest while paying down lower-interest debt. Always capture any employer 401(k) match regardless.";
        } else {
          aiResponse = "Based on your financial profile, I'd recommend focusing on building your emergency fund first, then tackling high-interest debt, and finally increasing your retirement contributions. Would you like more specific advice on any of these areas?";
        }
        
        setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle clicking a suggested question
  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  // Hide the floating coach on interview page to prevent button conflicts
  if (location === '/coach/interview') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-8" data-tour="ai-coach">
      {/* Chat Icon Button with tooltip */}
      {!isOpen && (
        <div className="relative group">
          <button 
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs rounded py-1 px-2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Ask Money Mind Coach
            </div>
            <MoneyMindLogo className="h-14 w-14 rounded-full" />
          </button>
          
          {/* First-time intro notification */}
          {showIntroMessage && (
            <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-white text-black text-sm shadow-lg rounded-lg py-3 px-4 w-72 border border-green-100">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIntroMessage(false);
                }}
                className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
              <div className="flex items-start">
                <MoneyMindLogo className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 mb-1">Money Mind Coach Available</p>
                  <p className="text-xs text-neutral-600 mb-2">Your AI financial advisor is here to answer any questions about budgeting, investing, or financial planning.</p>
                  <p className="text-xs text-green-600 font-medium">Click the button to get started!</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-green-100"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 md:w-96 shadow-lg max-h-[500px] flex flex-col">
          <CardHeader className="p-3 flex flex-row items-center justify-between bg-app-gradient text-white rounded-t-lg">
            <CardTitle className="text-base flex items-center">
              <div className="bg-white rounded-full h-6 w-6 p-1 mr-2 flex items-center justify-center">
                <MoneyMindLogo className="w-4 h-4" />
              </div>
              Money Mind Coach
            </CardTitle>
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-green-600/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto p-3 max-h-80 bg-white">
            {/* Welcome message if no conversation */}
            {conversation.length === 0 && (
              <div className="text-center p-4">
                <h3 className="font-medium text-neutral-800">How can Money Mind help you today?</h3>
                <p className="text-sm text-neutral-500 mt-1 mb-4">Ask me anything about your finances!</p>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {suggestedQuestions.map((q, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      className="text-left justify-start text-sm h-auto py-2"
                      onClick={() => handleSuggestedQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Conversation messages */}
            {conversation.map((msg, i) => (
              <div 
                key={i} 
                className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block rounded-lg p-3 max-w-[85%] ${
                    msg.role === 'user' 
                      ? 'bg-green-100 text-green-900' 
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block rounded-lg p-3 bg-neutral-100 text-neutral-900">
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Money Mind is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <CardFooter className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex w-full gap-2">
              <textarea
                placeholder="Ask Money Mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 p-2 h-10 min-h-[40px] max-h-20 border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className="h-10 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}