import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProductCardSkeleton
 * Skeleton loader for product grid cards
 */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Image skeleton */}
      <Skeleton className="aspect-square rounded-xl" />

      {/* Product name skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>

      {/* Price skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-3 w-1/4 rounded" />
      </div>

      {/* Button skeleton */}
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  );
}

/**
 * ProductGridSkeleton
 * Multiple product card skeletons for grid layout
 */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * OrderCardSkeleton
 * Skeleton loader for order/estimate cards
 */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 sm:p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1">
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-24 rounded ml-auto" />
          <Skeleton className="h-3 w-16 rounded ml-auto" />
        </div>
      </div>

      {/* Status badge skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

/**
 * OrderListSkeleton
 * Multiple order card skeletons
 */
export function OrderListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * OrderDetailsSkeleton
 * Skeleton for expanded order details
 */
export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-4 p-4 border-t">
      {/* Address section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
      </div>

      {/* Items section */}
      <div className="border rounded-lg overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals section */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
    </div>
  );
}

/**
 * TableRowSkeleton
 * Skeleton for table rows (admin tables, data tables)
 */
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

/**
 * TableSkeleton
 * Skeleton for entire data table
 */
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b">
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4 p-4 border-b last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ListItemSkeleton
 * Generic list item skeleton
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border">
      <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  );
}

/**
 * FormFieldSkeleton
 * Skeleton for form inputs
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20 rounded" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * CardHeaderSkeleton
 * Skeleton for card header
 */
export function CardHeaderSkeleton() {
  return (
    <div className="space-y-3 p-4 border-b">
      <Skeleton className="h-6 w-1/3 rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
    </div>
  );
}

/**
 * PageHeaderSkeleton
 * Skeleton for page header section
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3 mb-8">
      <Skeleton className="h-8 w-1/3 rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
    </div>
  );
}

/**
 * SearchFilterSkeleton
 * Skeleton for search and filter bar
 */
export function SearchFilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Skeleton className="h-11 flex-1 rounded-lg" />
      <Skeleton className="h-11 w-full sm:w-48 rounded-lg" />
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 * Skeleton for stat cards
 */
export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-8 w-1/2 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}
