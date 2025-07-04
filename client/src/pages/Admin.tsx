import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  rating: number | null;
  createdAt: string;
  user?: {
    username: string;
    email: string;
  };
}

export default function Admin() {
  const { data: feedback, isLoading, error } = useQuery<FeedbackItem[]>({
    queryKey: ['/api/feedback'],
    retry: false,
  });

  // Handle admin access denied
  if (error && error.message.includes('403')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You don't have permission to access the admin panel. Only administrators can view user feedback.
            </p>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Return to Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      case 'complaint': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
            <p className="text-gray-600">Review and manage user feedback</p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Failed to load feedback. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
          <p className="text-gray-600">Review and manage user feedback</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                  <p className="text-2xl font-bold text-gray-900">{feedback?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedback && feedback.length > 0 
                      ? (feedback
                          .filter(f => f.rating)
                          .reduce((acc, f) => acc + (f.rating || 0), 0) / 
                        feedback.filter(f => f.rating).length).toFixed(1)
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedback ? new Set(feedback.map(f => f.userId)).size : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedback ? 
                      feedback.filter(f => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(f.createdAt) > weekAgo;
                      }).length : 0
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback && feedback.length > 0 ? (
            feedback
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <Badge className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>User ID: {item.userId}</span>
                        <span>{format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                    {item.rating && (
                      <div className="mt-2">
                        {getRatingStars(item.rating)}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{item.message}</p>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
                <p className="text-gray-500">
                  When users submit feedback, it will appear here for review.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}