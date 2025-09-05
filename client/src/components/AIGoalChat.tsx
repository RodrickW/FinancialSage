import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { MoneyMindLogo } from '@/components/Logo';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIGoalChatProps {
  user: any;
}

export default function AIGoalChat({ user }: AIGoalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm Money Mind, your financial goal assistant. I can help you create new savings goals or track your progress. Just tell me what you want to save for, and I'll help you set it up! 🎯",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // AI Goal Creation Mutation
  const aiGoalMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/goals/ai-create', { message });
      return await response.json();
    },
    onSuccess: (data) => {
      // Refresh goals list
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-tracker'] });
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);

      if (data.goalCreated) {
        toast({
          title: "Goal Created! 🎉",
          description: "Your new savings goal has been set up successfully."
        });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "I apologize, but I'm having trouble processing that request right now. Please try again or create your goal manually using the 'Add New Goal' button.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive"
      });
    }
  });

  // AI Goal Deletion Mutation
  const aiDeleteMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/goals/ai-delete', { message });
      return await response.json();
    },
    onSuccess: (data) => {
      // Refresh goals lists
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/debt-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-tracker'] });
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);

      if (data.goalDeleted) {
        toast({
          title: "Goal Deleted",
          description: `Your ${data.deletedGoal?.type} goal "${data.deletedGoal?.name}" has been removed.`,
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "I couldn't delete that goal right now. Please try using the delete button on the Goals page.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive"
      });
    }
  });

  // AI Progress Update Mutation
  const aiProgressMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/goals/ai-progress', { message });
      return await response.json();
    },
    onSuccess: (data) => {
      // Refresh goals list
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-tracker'] });
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);

      if (data.progressUpdated) {
        toast({
          title: "Progress Updated! 💪",
          description: "Your savings goal progress has been updated."
        });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "I couldn't update your progress right now. Please try again or use the manual 'Add Money' option on your goal cards.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const message = inputMessage;
    setInputMessage('');
    setIsProcessing(true);

    // Determine the type of request
    const progressKeywords = ['saved', 'added', 'deposited', 'put in', 'progress', 'update'];
    const deleteKeywords = ['delete', 'remove', 'cancel', 'stop', 'get rid of'];
    
    const isProgressUpdate = progressKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    const isDeletion = deleteKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (isDeletion) {
      aiDeleteMutation.mutate(message);
    } else if (isProgressUpdate) {
      aiProgressMutation.mutate(message);
    } else {
      aiGoalMutation.mutate(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <div className="mr-4">
          <MoneyMindLogo className="w-12 h-12 rounded-full" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Money Mind Goal Assistant
          </h3>
          <p className="text-sm text-neutral-600">Create goals and track progress with AI</p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="bg-white rounded-lg border border-blue-100 mb-4 max-h-64 overflow-y-auto">
        <div className="p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-gray-500' 
                  : ''
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <MoneyMindLogo className="w-8 h-8 rounded-full" />
                )}
              </div>
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-3 rounded-lg max-w-xs ${
                    message.type === 'user'
                      ? 'bg-gray-500 text-white'
                      : 'bg-blue-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8">
                <MoneyMindLogo className="w-8 h-8 rounded-full" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-blue-100 text-gray-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex space-x-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell me about your savings goal or progress..."
          className="flex-1"
          disabled={isProcessing}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isProcessing}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Example prompts */}
      <div className="mt-3 text-xs text-gray-600">
        <p className="mb-1"><strong>Try saying:</strong></p>
        <p>• "I want to save $5000 for a vacation by next summer"</p>
        <p>• "I saved $200 more for my emergency fund"</p>
        <p>• "Delete my credit card debt goal"</p>
        <p>• "Help me create a goal for a new car"</p>
      </div>
    </Card>
  );
}