/**
 * IndexedDB helper for offline POS
 * Caches products and queues orders for sync
 */

const DB_NAME = "gkp_pos";
const DB_VERSION = 1;

export interface PosOrderItem {
  product_id: string | null;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  mrp: number;
  is_wholesale: boolean;
}

export interface PosOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: PosOrderItem[];
  total_amount: number;
  mrp_total: number;
  savings: number;
  packing_charges: number;
  delivery_charges: number;
  payment_method: "cash" | "upi" | "card";
  billing_mode: "retail" | "wholesale";
  synced: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("wholesale_products")) {
        db.createObjectStore("wholesale_products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pos_orders")) {
        const store = db.createObjectStore("pos_orders", { keyPath: "id" });
        store.createIndex("synced", "synced", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheProducts(products: any[], storeName: "products" | "wholesale_products") {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();
  products.forEach((p) => store.put(p));
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedProducts(storeName: "products" | "wholesale_products"): Promise<any[]> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePosOrder(order: PosOrder) {
  const db = await openDb();
  const tx = db.transaction("pos_orders", "readwrite");
  tx.objectStore("pos_orders").put(order);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUnsyncedOrders(): Promise<PosOrder[]> {
  const db = await openDb();
  const tx = db.transaction("pos_orders", "readonly");
  const store = tx.objectStore("pos_orders");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as PosOrder[]).filter(o => !o.synced));
    req.onerror = () => reject(req.error);
  });
}

export async function markOrderSynced(orderId: string) {
  const db = await openDb();
  const tx = db.transaction("pos_orders", "readwrite");
  const store = tx.objectStore("pos_orders");
  return new Promise<void>((resolve, reject) => {
    const getReq = store.get(orderId);
    getReq.onsuccess = () => {
      const order = getReq.result;
      if (order) {
        order.synced = true;
        store.put(order);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPosOrders(): Promise<PosOrder[]> {
  const db = await openDb();
  const tx = db.transaction("pos_orders", "readonly");
  return new Promise((resolve, reject) => {
    const req = tx.objectStore("pos_orders").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
