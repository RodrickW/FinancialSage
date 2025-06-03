import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Financial Overview Skeleton
export function FinancialOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 stagger-item">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2 shimmer" />
              <Skeleton className="h-8 w-20 shimmer" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full shimmer" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-6 w-16 rounded-full shimmer" />
            <Skeleton className="h-4 w-20 ml-2 shimmer" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Transactions List Skeleton
export function TransactionsSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-md border border-gray-200 fade-in">
      <div className="p-6 border-b border-gray-200">
        <Skeleton className="h-6 w-40 shimmer" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 stagger-item">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full shimmer" />
              <div>
                <Skeleton className="h-4 w-32 mb-1 shimmer" />
                <Skeleton className="h-3 w-20 shimmer" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16 mb-1 shimmer" />
              <Skeleton className="h-3 w-12 shimmer" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Credit Score Skeleton
export function CreditScoreSkeleton() {
  return (
    <Card className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// AI Insights Skeleton
export function AIInsightsSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-100">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Budget Progress Skeleton
export function BudgetProgressSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between mt-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// General Loading Spinner
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-black rounded-full animate-spin`} />
    </div>
  );
}