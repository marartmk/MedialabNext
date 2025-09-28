// services/warehouseService.ts
const API_URL = import.meta.env.VITE_API_URL;

export interface WarehouseItem {
  id: number;
  itemId: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  supplier: string;
  supplierName?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  totalValue: number;
  location?: string;
  notes?: string;
  stockStatus: "available" | "low" | "out";
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  categoryInfo?: CategoryInfo;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface WarehouseSupplier {
  id: number;
  supplierId: string;
  name: string;
  contact?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WarehouseStats {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  totalCategories: number;
  totalSuppliers: number;
}

export interface WarehouseSearchParams {
  searchQuery?: string;
  category?: string;
  supplier?: string;
  stockStatus?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  multitenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface WarehouseItemsResponse {
  items: WarehouseItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  stats: WarehouseStats;
}

export interface CreateWarehouseItem {
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  supplier: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  location?: string;
  notes?: string;
  multitenantId: string;
}

export interface UpdateWarehouseItem {
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  supplier: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  location?: string;
  notes?: string;
}

export interface UpdateQuantity {
  quantity: number;
  notes?: string;
  action: "add" | "remove" | "set";
}

export interface CreateWarehouseCategory {
  categoryId: string;
  name: string;
  icon?: string;
  color?: string;
  multitenantId: string;
}

export interface CreateWarehouseSupplier {
  supplierId: string;
  name: string;
  contact?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  multitenantId: string;
}

class WarehouseService {
  private baseUrl = `${API_URL}/api/warehouse`;
  private multitenantId: string | null = null;

  constructor() {
    // Recupera il multitenantId dal sessionStorage - usa IdCompany come nelle altre pagine
    this.multitenantId =
      sessionStorage.getItem("IdCompany") ||
      sessionStorage.getItem("multitenantId");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as any).message || `HTTP error! status: ${response.status}`
        );
      }

      // Nota: gli endpoint del tuo BE restituivano JSON anche su PUT/DELETE.
      // Manteniamo la semantica originale: qui ci aspettiamo sempre JSON.
      return (await response.json()) as T;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // =================== ARTICOLI ===================

  async searchItems(
    params: WarehouseSearchParams = {}
  ): Promise<WarehouseItemsResponse> {
    const searchParams = {
      ...params,
      multitenantId: params.multitenantId || this.multitenantId,
    };

    return this.request<WarehouseItemsResponse>("/search", {
      method: "POST",
      body: JSON.stringify(searchParams),
    });
  }

  async getItemById(id: number): Promise<WarehouseItem> {
    return this.request<WarehouseItem>(`/${id}`);
  }

  async getItemByGuid(itemId: string): Promise<WarehouseItem> {
    return this.request<WarehouseItem>(`/item/${itemId}`);
  }

  async getItemByCode(code: string): Promise<WarehouseItem> {
    return this.request<WarehouseItem>(`/code/${code}`);
  }

  async createItem(item: CreateWarehouseItem): Promise<any> {
    const itemData = {
      ...item,
      multitenantId: item.multitenantId || this.multitenantId,
    };

    return this.request("", {
      // Cambiato da '/create' a ''
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateItem(id: number, item: UpdateWarehouseItem): Promise<void> {
    await this.request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  }

  async deleteItem(id: number): Promise<void> {
    await this.request(`/${id}`, {
      method: "DELETE",
    });
  }

  async updateQuantity(id: number, update: UpdateQuantity): Promise<void> {
    await this.request(`/${id}/quantity`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  // =================== STATISTICHE ===================

  async getStats(multitenantId?: string): Promise<WarehouseStats> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<WarehouseStats>(`/stats${query}`);
  }

  async getLowStockItems(multitenantId?: string): Promise<WarehouseItem[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<WarehouseItem[]>(`/low-stock${query}`);
  }

  async getItemsLight(
    multitenantId?: string,
    category?: string
  ): Promise<WarehouseItem[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }
    if (category) {
      params.append("category", category);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<WarehouseItem[]>(`/light${query}`);
  }

  async quickSearch(
    query: string,
    multitenantId?: string
  ): Promise<WarehouseItem[]> {
    const params = new URLSearchParams();
    params.append("query", query);
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    return this.request<WarehouseItem[]>(`/search-quick?${params.toString()}`);
  }

  // =================== CATEGORIE ===================

  async getCategories(multitenantId?: string): Promise<CategoryInfo[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<CategoryInfo[]>(`/categories${query}`);
  }

  async createCategory(
    category: CreateWarehouseCategory
  ): Promise<CategoryInfo> {
    const categoryData = {
      ...category,
      multitenantId: category.multitenantId || this.multitenantId,
    };

    return this.request<CategoryInfo>("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  // =================== FORNITORI ===================

  async getSuppliers(multitenantId?: string): Promise<WarehouseSupplier[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<WarehouseSupplier[]>(`/suppliers${query}`);
  }

  async createSupplier(
    supplier: CreateWarehouseSupplier
  ): Promise<WarehouseSupplier> {
    const supplierData = {
      ...supplier,
      multitenantId: supplier.multitenantId || this.multitenantId,
    };

    return this.request<WarehouseSupplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  }

  // =================== EXPORT ===================

  async exportToCsv(multitenantId?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `${this.baseUrl}/export/csv${query}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // =================== UTILITÀ ===================

  downloadCsvFile(blob: Blob, filename?: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename || `magazzino_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  setMultitenantId(id: string) {
    this.multitenantId = id;
    sessionStorage.setItem("multitenantId", id);
  }

  getMultitenantId(): string | null {
    return this.multitenantId;
  }
}

// Singleton instance
const warehouseService = new WarehouseService();
export default warehouseService;

/* ======================================================================
   === HELPERS LEGGERI PER LA MODIFICA RIPARAZIONI =======================
   ====================================================================== */

// Tipo minimale per la ricerca/aggancio ricambi nella scheda lavorazione
export type PartSearchItem = {
  id: number;       // warehouse item id (chiave numerica)
  itemId: string;   // guid articolo
  code: string;
  name: string;
  brand: string;
  model: string;
  unitPrice: number;
  quantity: number; // giacenza attuale
};

// Ricerca ricambi con quickSearch (più snella) oppure, se serve, sostituisci con searchItems
export async function searchPartsQuick(term: string): Promise<PartSearchItem[]> {
  if (!term || term.trim().length < 2) return [];
  const rows = await warehouseService.quickSearch(term.trim());
  return rows.map((w) => ({
    id: w.id,
    itemId: w.itemId,
    code: w.code,
    name: w.name,
    brand: w.brand,
    model: w.model,
    unitPrice: w.unitPrice,
    quantity: w.quantity,
  }));
}

// Scarico a magazzino i pezzi usati: riuso updateQuantity con action "remove"
export async function consumeWarehouseLines(
  lines: { id: number; qty: number }[]
): Promise<void> {
  for (const ln of lines) {
    await warehouseService.updateQuantity(ln.id, {
      quantity: ln.qty,
      action: "remove",
      notes: "Consumo per scheda lavorazione",
    });
  }
}

