const API_URL = import.meta.env.VITE_API_URL;

export interface AccessoryInventoryItem {
  id: number;
  accessoryId: string;
  code: string;
  accessoryType:
    | "power-cables"
    | "audio"
    | "protection"
    | "auto-mobility"
    | "stands"
    | "wearables-extra"
    | "other-services";
  brand: string;
  model: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  accessoryCondition: "new" | "used" | "refurbished";
  isCourtesyAccessory: boolean;
  accessoryStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  supplierName?: string;
  quantityInStock: number;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AccessoryInventoryStats {
  totalAccessories: number;
  availableAccessories: number;
  loanedAccessories: number;
  soldAccessories: number;
  courtesyAccessories: number;
  lowStockAccessories: number;
  outOfStockAccessories: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  potentialProfit: number;
  newAccessories: number;
  usedAccessories: number;
  refurbishedAccessories: number;
}

export interface AccessoryInventorySupplier {
  id: number;
  supplierId: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  accessoryCount: number;
}

export interface AccessoryInventorySearchParams {
  searchQuery?: string;
  accessoryType?: string;
  brand?: string;
  accessoryCondition?: string;
  accessoryStatus?: string;
  supplierId?: string;
  isCourtesyAccessory?: boolean;
  minPurchasePrice?: number;
  maxPurchasePrice?: number;
  minSellingPrice?: number;
  maxSellingPrice?: number;
  multitenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface AccessoryInventoryPagedResponse {
  items: AccessoryInventoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  stats: AccessoryInventoryStats;
}

export interface CreateAccessoryInventoryDto {
  code: string;
  accessoryType:
    | "power-cables"
    | "audio"
    | "protection"
    | "auto-mobility"
    | "stands"
    | "wearables-extra"
    | "other-services";
  brand: string;
  model: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  accessoryCondition: "new" | "used" | "refurbished";
  isCourtesyAccessory: boolean;
  accessoryStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  quantityInStock: number;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  location?: string;
  notes?: string;
  multitenantId: string;
}

export interface UpdateAccessoryInventoryDto {
  code: string;
  accessoryType:
    | "power-cables"
    | "audio"
    | "protection"
    | "auto-mobility"
    | "stands"
    | "wearables-extra"
    | "other-services";
  brand: string;
  model: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  accessoryCondition: "new" | "used" | "refurbished";
  isCourtesyAccessory: boolean;
  accessoryStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  quantityInStock: number;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  location?: string;
  notes?: string;
}

export interface ChangeAccessoryStatusDto {
  newStatus: "available" | "loaned" | "sold" | "unavailable";
  notes?: string;
}

export interface AccessoryInventoryMovement {
  id: number;
  movementId: string;
  movementType: string;
  fromStatus?: string;
  toStatus?: string;
  customerId?: string;
  customerName?: string;
  reference?: string;
  notes?: string;
  movementDate: string;
  createdBy?: string;
}

export interface CreateAccessoryInventorySupplierDto {
  supplierId: string;
  name: string;
  contact?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  multitenantId: string;
}

class AccessoryInventoryService {
  private baseUrl = `${API_URL}/api/AccessoryInventory`;
  private multitenantId: string | null = null;

  constructor() {
    this.multitenantId =
      sessionStorage.getItem("IdCompany") ||
      sessionStorage.getItem("multitenantId");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: HeadersInit = {
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

    console.log("API Request:", url, JSON.stringify(config, null, 2));

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ||
            `HTTP error! status: ${response.status}`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      return {} as T;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // =================== ACCESSORI ===================

  async searchItems(
    params: AccessoryInventorySearchParams = {},
  ): Promise<AccessoryInventoryPagedResponse> {
    const searchParams = {
      ...params,
      multitenantId: params.multitenantId || this.multitenantId,
    };

    return this.request<AccessoryInventoryPagedResponse>("/search", {
      method: "POST",
      body: JSON.stringify(searchParams),
    });
  }

  async getItemById(id: number): Promise<AccessoryInventoryItem> {
    return this.request<AccessoryInventoryItem>(`/${id}`);
  }

  async getItemByAccessoryId(
    accessoryId: string,
  ): Promise<AccessoryInventoryItem> {
    return this.request<AccessoryInventoryItem>(`/accessory/${accessoryId}`);
  }

  async getItemByCode(code: string): Promise<AccessoryInventoryItem> {
    return this.request<AccessoryInventoryItem>(`/code/${code}`);
  }

  async createItem(item: CreateAccessoryInventoryDto): Promise<unknown> {
    const itemData = {
      ...item,
      multitenantId: item.multitenantId || this.multitenantId,
    };

    return this.request("", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateItem(
    id: number,
    item: UpdateAccessoryInventoryDto,
  ): Promise<void> {
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

  // =================== STATISTICHE ===================

  async getStats(multitenantId?: string): Promise<AccessoryInventoryStats> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<AccessoryInventoryStats>(`/stats${query}`);
  }

  async getCourtesyAvailable(
    multitenantId?: string,
  ): Promise<AccessoryInventoryItem[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<AccessoryInventoryItem[]>(
      `/courtesy-available${query}`,
    );
  }

  // =================== STATO E MOVIMENTI ===================

  async changeStatus(
    id: number,
    statusData: ChangeAccessoryStatusDto,
  ): Promise<void> {
    await this.request(`/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
  }

  async getMovements(id: number): Promise<AccessoryInventoryMovement[]> {
    return this.request<AccessoryInventoryMovement[]>(`/${id}/movements`);
  }

  // =================== FORNITORI ===================

  async getSuppliers(
    multitenantId?: string,
  ): Promise<AccessoryInventorySupplier[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<AccessoryInventorySupplier[]>(`/suppliers${query}`);
  }

  async createSupplier(
    supplier: CreateAccessoryInventorySupplierDto,
  ): Promise<AccessoryInventorySupplier> {
    const supplierData = {
      ...supplier,
      multitenantId: supplier.multitenantId || this.multitenantId,
    };

    return this.request<AccessoryInventorySupplier>("/suppliers", {
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

  // =================== UTILITA ===================

  downloadCsvFile(blob: Blob, filename?: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename ||
      `magazzino_accessori_${new Date().toISOString().split("T")[0]}.csv`;
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

const accessoryInventoryService = new AccessoryInventoryService();
export default accessoryInventoryService;
