// services/deviceInventoryService.ts
const API_URL = import.meta.env.VITE_API_URL;

// Types
export interface DeviceInventoryItem {
  id: number;
  deviceId: string;
  code: string;
  deviceType: "smartphone" | "tablet";
  brand: string;
  model: string;
  imei: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  deviceCondition: "new" | "used" | "refurbished";
  isCourtesyDevice: boolean;
  deviceStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  supplierName?: string;
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

export interface DeviceInventoryStats {
  totalDevices: number;
  availableDevices: number;
  loanedDevices: number;
  soldDevices: number;
  courtesyDevices: number;
  smartphones: number;
  tablets: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  potentialProfit: number;
  newDevices: number;
  usedDevices: number;
  refurbishedDevices: number;
}

export interface DeviceInventorySupplier {
  id: number;
  supplierId: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  deviceCount: number;
}

export interface DeviceInventorySearchParams {
  searchQuery?: string;
  deviceType?: string;
  brand?: string;
  deviceCondition?: string;
  deviceStatus?: string;
  supplierId?: string;
  isCourtesyDevice?: boolean;
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

export interface DeviceInventoryPagedResponse {
  items: DeviceInventoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  stats: DeviceInventoryStats;
}

export interface CreateDeviceInventoryDto {
  code: string;
  deviceType: "smartphone" | "tablet";
  brand: string;
  model: string;
  imei: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  deviceCondition: "new" | "used" | "refurbished";
  isCourtesyDevice: boolean;
  deviceStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  location?: string;
  notes?: string;
  multitenantId: string;
}

export interface UpdateDeviceInventoryDto {
  code: string;
  deviceType: "smartphone" | "tablet";
  brand: string;
  model: string;
  imei: string;
  esn?: string;
  serialNumber?: string;
  color: string;
  deviceCondition: "new" | "used" | "refurbished";
  isCourtesyDevice: boolean;
  deviceStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  location?: string;
  notes?: string;
}

export interface ChangeDeviceStatusDto {
  newStatus: "available" | "loaned" | "sold" | "unavailable";
  notes?: string;
}

export interface LoanDeviceDto {
  customerId: string;
  reference?: string;
  notes?: string;
  expectedReturnDate?: string;
}

export interface ReturnDeviceDto {
  returnStatus: "available" | "unavailable";
  notes?: string;
  condition?: string;
}

export interface DeviceInventoryMovement {
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

export interface CreateDeviceInventorySupplierDto {
  supplierId: string;
  name: string;
  contact?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  multitenantId: string;
}

class DeviceInventoryService {
  private baseUrl = `${API_URL}/api/DeviceInventory`;
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

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ||
            `HTTP error! status: ${response.status}`
        );
      }

      // Per alcuni endpoint che non ritornano JSON (es: DELETE)
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

  // =================== APPARATI ===================

  // POST /api/DeviceInventory/search
  async searchItems(
    params: DeviceInventorySearchParams = {}
  ): Promise<DeviceInventoryPagedResponse> {
    const searchParams = {
      ...params,
      multitenantId: params.multitenantId || this.multitenantId,
    };

    return this.request<DeviceInventoryPagedResponse>("/search", {
      method: "POST",
      body: JSON.stringify(searchParams),
    });
  }

  // GET /api/DeviceInventory/{id}
  async getItemById(id: number): Promise<DeviceInventoryItem> {
    return this.request<DeviceInventoryItem>(`/${id}`);
  }

  // GET /api/DeviceInventory/device/{deviceId}
  async getItemByDeviceId(deviceId: string): Promise<DeviceInventoryItem> {
    return this.request<DeviceInventoryItem>(`/device/${deviceId}`);
  }

  // GET /api/DeviceInventory/code/{code}
  async getItemByCode(code: string): Promise<DeviceInventoryItem> {
    return this.request<DeviceInventoryItem>(`/code/${code}`);
  }

  // GET /api/DeviceInventory/imei/{imei}
  async getItemByImei(imei: string): Promise<DeviceInventoryItem> {
    return this.request<DeviceInventoryItem>(`/imei/${imei}`);
  }

  // POST /api/DeviceInventory
  async createItem(item: CreateDeviceInventoryDto): Promise<unknown> {
    const itemData = {
      ...item,
      multitenantId: item.multitenantId || this.multitenantId,
    };

    return this.request("", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  // PUT /api/DeviceInventory/{id}
  async updateItem(id: number, item: UpdateDeviceInventoryDto): Promise<void> {
    await this.request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  }

  // DELETE /api/DeviceInventory/{id}
  async deleteItem(id: number): Promise<void> {
    await this.request(`/${id}`, {
      method: "DELETE",
    });
  }

  // =================== STATISTICHE ===================

  // GET /api/DeviceInventory/stats
  async getStats(multitenantId?: string): Promise<DeviceInventoryStats> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<DeviceInventoryStats>(`/stats${query}`);
  }

  // GET /api/DeviceInventory/courtesy-available
  async getCourtesyAvailable(
    multitenantId?: string
  ): Promise<DeviceInventoryItem[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<DeviceInventoryItem[]>(`/courtesy-available${query}`);
  }

  // =================== STATO E MOVIMENTI ===================

  // PUT /api/DeviceInventory/{id}/status
  async changeStatus(
    id: number,
    statusData: ChangeDeviceStatusDto
  ): Promise<void> {
    await this.request(`/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
  }

  // POST /api/DeviceInventory/{id}/loan
  async loanDevice(id: number, loanData: LoanDeviceDto): Promise<void> {
    await this.request(`/${id}/loan`, {
      method: "POST",
      body: JSON.stringify(loanData),
    });
  }

  // POST /api/DeviceInventory/{id}/return
  async returnDevice(id: number, returnData: ReturnDeviceDto): Promise<void> {
    await this.request(`/${id}/return`, {
      method: "POST",
      body: JSON.stringify(returnData),
    });
  }

  // GET /api/DeviceInventory/{id}/movements
  async getMovements(id: number): Promise<DeviceInventoryMovement[]> {
    return this.request<DeviceInventoryMovement[]>(`/${id}/movements`);
  }

  // =================== FORNITORI ===================

  // GET /api/DeviceInventory/suppliers
  async getSuppliers(
    multitenantId?: string
  ): Promise<DeviceInventorySupplier[]> {
    const params = new URLSearchParams();
    if (multitenantId || this.multitenantId) {
      params.append("multitenantId", multitenantId || this.multitenantId!);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<DeviceInventorySupplier[]>(`/suppliers${query}`);
  }

  // POST /api/DeviceInventory/suppliers
  async createSupplier(
    supplier: CreateDeviceInventorySupplierDto
  ): Promise<DeviceInventorySupplier> {
    const supplierData = {
      ...supplier,
      multitenantId: supplier.multitenantId || this.multitenantId,
    };

    return this.request<DeviceInventorySupplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  }

  // =================== EXPORT ===================

  // GET /api/DeviceInventory/export/csv
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
      filename ||
      `magazzino_apparati_${new Date().toISOString().split("T")[0]}.csv`;
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
const deviceInventoryService = new DeviceInventoryService();
export default deviceInventoryService;
