import React from 'react';
import { cn } from '../../core/utils/cn';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surfaceHighlight', className)}
      {...props}
    />
  );
}

// Pre-configured structural skeletons
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-6 shadow-sm', className)}>
      <Skeleton className="h-5 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('w-full border border-border rounded-md overflow-hidden', className)}>
      <div className="bg-surfaceHighlight/50 p-4 border-b border-border flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border/50 flex justify-between items-center bg-surface">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, TableSkeleton };
