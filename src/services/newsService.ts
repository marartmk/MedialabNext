const API_URL = import.meta.env.VITE_API_URL;

// DTOs matching BE
export interface CreateServiceNewsDto {
  title: string;
  content: string;
  summary?: string;
  publishDate?: string;
  expirationDate?: string;
  isVisible: boolean;
  priority?: number;
  category?: string;
  imageUrl?: string;
  companyId: string;
  multitenantId: string;
  createdBy?: string;
}

export interface UpdateServiceNewsDto {
  title?: string;
  content?: string;
  summary?: string;
  publishDate?: string;
  expirationDate?: string;
  isVisible?: boolean;
  priority?: number;
  category?: string;
  imageUrl?: string;
  updatedBy?: string;
}

export interface ServiceNewsDetailDto {
  id: number;
  newsId: string;
  title: string;
  content: string;
  summary?: string;
  publishDate: string;
  expirationDate?: string;
  isVisible: boolean;
  priority: number;
  category?: string;
  imageUrl?: string;
  companyId: string;
  multitenantId: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServiceNewsListDto {
  id: number;
  newsId: string;
  title: string;
  summary?: string;
  publishDate: string;
  expirationDate?: string;
  isVisible: boolean;
  priority: number;
  category?: string;
  createdAt: string;
}

export interface ServiceNewsSearchDto {
  multitenantId?: string;
  companyId?: string;
  searchQuery?: string;
  newsId?: string;
  category?: string;
  isVisible?: boolean;
  onlyActive?: boolean;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateServiceNewsResponseDto {
  id: number;
  newsId: string;
  title: string;
  message: string;
}

class NewsService {
  private baseUrl = `${API_URL}/api/ServiceNews`;

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

  // Helper to get current multitenantId
  getMultitenantId(): string {
    return (
      sessionStorage.getItem("IdCompanyAdmin") ||
      sessionStorage.getItem("IdCompany") ||
      ""
    );
  }

  // Create
  async createNews(data: CreateServiceNewsDto): Promise<CreateServiceNewsResponseDto> {
    return this.request<CreateServiceNewsResponseDto>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Read - Get by ID
  async getNewsById(id: number): Promise<ServiceNewsDetailDto> {
    return this.request<ServiceNewsDetailDto>(`/${id}`);
  }

  // Read - Get by GUID
  async getNewsByGuid(newsId: string): Promise<ServiceNewsDetailDto> {
    return this.request<ServiceNewsDetailDto>(`/guid/${newsId}`);
  }

  // Read - Get all (optionally filtered by tenant)
  async getAllNews(multitenantId?: string): Promise<ServiceNewsDetailDto[]> {
    const params = multitenantId ? `?multitenantId=${multitenantId}` : "";
    return this.request<ServiceNewsDetailDto[]>(params);
  }

  // Read - Search with filters
  async searchNews(searchRequest: ServiceNewsSearchDto): Promise<ServiceNewsListDto[]> {
    return this.request<ServiceNewsListDto[]>("/search", {
      method: "POST",
      body: JSON.stringify(searchRequest),
    });
  }

  // Read - Get visible news (for dashboard)
  async getVisibleNews(multitenantId: string): Promise<ServiceNewsListDto[]> {
    return this.request<ServiceNewsListDto[]>(`/visible/${multitenantId}`);
  }

  // Update
  async updateNews(newsId: string, data: UpdateServiceNewsDto): Promise<void> {
    await this.request<{ message: string }>(`/${newsId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Toggle visibility
  async toggleVisibility(newsId: string, updatedBy?: string): Promise<void> {
    const params = updatedBy ? `?updatedBy=${encodeURIComponent(updatedBy)}` : "";
    await this.request<{ message: string }>(`/${newsId}/toggle-visibility${params}`, {
      method: "PUT",
    });
  }

  // Delete (soft delete)
  async deleteNews(newsId: string): Promise<void> {
    await this.request<{ message: string }>(`/${newsId}`, {
      method: "DELETE",
    });
  }

  // Restore
  async restoreNews(newsId: string): Promise<void> {
    await this.request<{ message: string }>(`/${newsId}/restore`, {
      method: "POST",
    });
  }

  // Statistics - Get count
  async getNewsCount(multitenantId: string, onlyVisible?: boolean): Promise<{ count: number }> {
    const params = onlyVisible !== undefined ? `?onlyVisible=${onlyVisible}` : "";
    return this.request<{ count: number }>(`/count/${multitenantId}${params}`);
  }
}

export const newsService = new NewsService();
