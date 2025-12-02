/**
 * Loading skeleton components for platform admin
 */

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-16 bg-slate-200 rounded mb-1" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  );
}

export function ActionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-3">
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </td>
      <td className="py-3">
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </td>
      <td className="py-3">
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </td>
      <td className="py-3">
        <div className="h-6 w-16 bg-slate-200 rounded-full" />
      </td>
      <td className="py-3">
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </td>
    </tr>
  );
}

export function TenantDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded" />
      <div className="h-4 w-32 bg-slate-200 rounded" />
      <div className="h-4 w-48 bg-slate-200 rounded" />
      
      <div className="space-y-3 pt-4">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      
      {/* Action cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCardSkeleton />
        <ActionCardSkeleton />
        <ActionCardSkeleton />
        <ActionCardSkeleton />
      </div>
    </div>
  );
}
