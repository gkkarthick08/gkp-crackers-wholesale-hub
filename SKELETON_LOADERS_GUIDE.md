# Skeleton Loader Components Guide

Skeleton loaders provide a better user experience by showing content placeholders while data is being fetched, instead of just blank screens or spinners.

## Available Skeleton Components

All skeleton loaders are in `src/components/SkeletonLoader.tsx`

### 1. Product Skeletons

#### ProductCardSkeleton
Single product card skeleton (image, title, price, button).

```typescript
import { ProductCardSkeleton } from "@/components/SkeletonLoader";

// Show single skeleton
<ProductCardSkeleton />
```

#### ProductGridSkeleton
Grid of product card skeletons (default: 10 items).

```typescript
import { ProductGridSkeleton } from "@/components/SkeletonLoader";

// Show grid of skeletons
{isLoading ? (
  <ProductGridSkeleton count={10} />
) : (
  // actual products
)}
```

**Used in**: `src/pages/Products.tsx`

---

### 2. Order Skeletons

#### OrderCardSkeleton
Single order/estimate card skeleton.

```typescript
import { OrderCardSkeleton } from "@/components/SkeletonLoader";

<OrderCardSkeleton />
```

#### OrderListSkeleton
List of order card skeletons (default: 5 items).

```typescript
import { OrderListSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <OrderListSkeleton count={5} />
) : (
  <div className="space-y-4">
    {orders.map(order => (...))}
  </div>
)}
```

**Used in**: `src/pages/Orders.tsx`

#### OrderDetailsSkeleton
Skeleton for expanded order details (address, items, totals).

```typescript
import { OrderDetailsSkeleton } from "@/components/SkeletonLoader";

{!order.items ? (
  <OrderDetailsSkeleton />
) : (
  // order details content
)}
```

**Used in**: `src/pages/Orders.tsx` (inside expanded orders)

---

### 3. Table Skeletons

#### TableRowSkeleton
Single table row skeleton.

```typescript
import { TableRowSkeleton } from "@/components/SkeletonLoader";

<TableRowSkeleton columns={6} />
```

#### TableSkeleton
Complete table skeleton with header and rows.

```typescript
import { TableSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <TableSkeleton rows={5} columns={6} />
) : (
  <table>
    {/* table content */}
  </table>
)}
```

**Usage**: Admin pages, data tables, reports

---

### 4. Generic Skeletons

#### ListItemSkeleton
Generic list item with avatar, title, subtitle, action button.

```typescript
import { ListItemSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
) : (
  // list content
)}
```

#### FormFieldSkeleton
Form input field skeleton (label + input).

```typescript
import { FormFieldSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <FormFieldSkeleton />
) : (
  <div>
    <label>Field</label>
    <input />
  </div>
)}
```

#### CardHeaderSkeleton
Card header skeleton (title + description).

```typescript
import { CardHeaderSkeleton } from "@/components/SkeletonLoader";

<Card>
  {isLoading ? (
    <CardHeaderSkeleton />
  ) : (
    <CardHeader>...</CardHeader>
  )}
</Card>
```

#### PageHeaderSkeleton
Page title and description skeleton.

```typescript
import { PageHeaderSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <PageHeaderSkeleton />
) : (
  <div>
    <h1>Title</h1>
    <p>Description</p>
  </div>
)}
```

#### SearchFilterSkeleton
Search bar and filter dropdown skeleton.

```typescript
import { SearchFilterSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <SearchFilterSkeleton />
) : (
  // search and filter UI
)}
```

#### DashboardStatsSkeleton
Dashboard stat cards skeleton.

```typescript
import { DashboardStatsSkeleton } from "@/components/SkeletonLoader";

{isLoading ? (
  <DashboardStatsSkeleton count={4} />
) : (
  // stat cards content
)}
```

---

## Real-World Examples

### Example 1: Products Page

**File**: `src/pages/Products.tsx`

```typescript
import { ProductGridSkeleton } from "@/components/SkeletonLoader";

export default function Products() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.from("products").select();
        setProducts(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h1>Products</h1>

      {/* Show skeleton while loading */}
      {isLoading ? (
        <ProductGridSkeleton count={10} />
      ) : products.length === 0 ? (
        <div>No products found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Orders Page

**File**: `src/pages/Orders.tsx`

```typescript
import { OrderListSkeleton, OrderDetailsSkeleton } from "@/components/SkeletonLoader";

export default function Orders() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from("orders").select();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderItems = async (orderId) => {
    // Fetch items for specific order
    const { data } = await supabase
      .from("order_items")
      .select()
      .eq("order_id", orderId);

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, items: data } : o
      )
    );
  };

  return (
    <div>
      <h1>My Orders</h1>

      {/* Show skeleton list while loading all orders */}
      {isLoading ? (
        <OrderListSkeleton count={5} />
      ) : orders.length === 0 ? (
        <div>No orders yet</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader onClick={() => {
                setExpandedOrder(order.id);
                if (!order.items) {
                  fetchOrderItems(order.id);
                }
              }}>
                {/* Order summary */}
              </CardHeader>

              {/* Show skeleton when items are loading */}
              {expandedOrder === order.id && (
                <CardContent>
                  {!order.items ? (
                    <OrderDetailsSkeleton />
                  ) : (
                    <div>
                      {/* Order details */}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Admin Data Table

**File**: `src/pages/Admin.tsx`

```typescript
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function AdminUsers() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from("profiles").select();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>User Management</h1>

      {/* Show table skeleton while loading */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.user_type}</td>
                  <td>{user.is_verified ? "Verified" : "Pending"}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

1. **Use the right skeleton**: Match skeleton type to content being loaded
2. **Show skeleton count**: Use `count` prop to match expected content
3. **Consistent timing**: Keep loading states brief for better UX
4. **Fallback UI**: Always have empty state UI for when no data exists
5. **Error handling**: Show error state after skeleton if fetch fails
6. **Animations**: Skeletons use `animate-pulse` for visual feedback

### Example: Full Loading States

```typescript
export default function DataPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("items")
        .select();

      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state - show skeleton
  if (isLoading) {
    return <ProductGridSkeleton count={10} />;
  }

  // Error state - show error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading data: {error}
          <Button onClick={fetchData} className="mt-2">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state - show empty message
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p>No data found</p>
        <Button onClick={fetchData}>Refresh</Button>
      </div>
    );
  }

  // Success state - show content
  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

---

## Styling

All skeletons use:
- `animate-pulse` animation class
- `bg-muted` background color
- `rounded-md` (customizable) radius

You can customize by passing className:

```typescript
<Skeleton className="h-12 w-full rounded-lg bg-gradient-to-r from-muted to-muted/50" />
```

---

## Performance Notes

- Skeletons are lightweight (pure CSS animation, no JS)
- Each skeleton takes ~50-150 bytes uncompressed
- Use appropriate count props (don't show 1000 skeletons!)
- Skeletons render instantly without data fetching delay
