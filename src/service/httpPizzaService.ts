import {
  PizzaService,
  Franchise,
  FranchiseList,
  Store,
  OrderHistory,
  User,
  Menu,
  Order,
  Endpoints,
  OrderResponse,
  JWTPayload,
} from "./pizzaService";

const pizzaServiceUrl = import.meta.env.VITE_PIZZA_SERVICE_URL;
const pizzaFactoryUrl = import.meta.env.VITE_PIZZA_FACTORY_URL;

function resolvePath(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }
  return pizzaServiceUrl + path;
}

/** Login (PUT) and register (POST) must not send a stale Bearer token. */
function isAuthLoginOrRegister(resolvedPath: string, method: string): boolean {
  try {
    const u = new URL(resolvedPath);
    return (
      u.pathname.endsWith("/api/auth") &&
      (method === "POST" || method === "PUT")
    );
  } catch {
    return (
      resolvedPath.includes("/api/auth") &&
      (method === "POST" || method === "PUT")
    );
  }
}

async function parseJsonBody(r: Response): Promise<any> {
  const text = await r.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

export type ApiError = {
  code: number;
  message: string;
  retryAfter?: string;
};

class HttpPizzaService implements PizzaService {
  async callEndpoint(
    path: string,
    method: string = "GET",
    body?: any,
  ): Promise<any> {
    const resolvedPath = resolvePath(path);
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "omit",
    };

    const authToken = localStorage.getItem("token")?.trim();
    const sendAuth =
      !!authToken && !isAuthLoginOrRegister(resolvedPath, method);
    if (sendAuth) {
      (options.headers as Record<string, string>)["Authorization"] =
        `Bearer ${authToken}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const r = await fetch(resolvedPath, options);
      const j = await parseJsonBody(r);

      if (r.ok) {
        return j;
      }

      const message =
        typeof j?.message === "string"
          ? j.message
          : `Request failed (${r.status})`;
      const err: ApiError = { code: r.status, message };

      if (r.status === 429) {
        const ra = r.headers.get("Retry-After");
        if (ra) {
          err.retryAfter = ra;
        }
      }

      if (r.status === 401 && sendAuth) {
        localStorage.removeItem("token");
      }

      return Promise.reject(err);
    } catch (e: any) {
      return Promise.reject({
        code: 500,
        message: e?.message ?? "Network error",
      } as ApiError);
    }
  }

  async login(email: string, password: string): Promise<User> {
    const { user, token } = await this.callEndpoint("/api/auth", "PUT", {
      email,
      password,
    });
    localStorage.setItem("token", token);
    return Promise.resolve(user);
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const { user, token } = await this.callEndpoint("/api/auth", "POST", {
      name,
      email,
      password,
    });
    localStorage.setItem("token", token);
    return Promise.resolve(user);
  }

  logout(): void {
    this.callEndpoint("/api/auth", "DELETE");
    localStorage.removeItem("token");
  }

  async getUser(): Promise<User | null> {
    let result: User | null = null;
    if (localStorage.getItem("token")?.trim()) {
      try {
        result = await this.callEndpoint("/api/user/me");
      } catch {
        localStorage.removeItem("token");
      }
    }
    return Promise.resolve(result);
  }

  async getMenu(): Promise<Menu> {
    return this.callEndpoint("/api/order/menu");
  }

  async getOrders(user: User): Promise<OrderHistory> {
    return this.callEndpoint("/api/order");
  }

  async order(order: Order): Promise<OrderResponse> {
    return this.callEndpoint("/api/order", "POST", order);
  }

  async verifyOrder(jwt: string): Promise<JWTPayload> {
    return this.callEndpoint(pizzaFactoryUrl + "/api/order/verify", "POST", {
      jwt,
    });
  }

  async getFranchise(user: User): Promise<Franchise[]> {
    return this.callEndpoint(`/api/franchise/${user.id}`);
  }

  async createFranchise(franchise: Franchise): Promise<Franchise> {
    return this.callEndpoint("/api/franchise", "POST", franchise);
  }

  async getFranchises(
    page: number = 0,
    limit: number = 10,
    nameFilter: string = "*",
  ): Promise<FranchiseList> {
    return this.callEndpoint(
      `/api/franchise?page=${page}&limit=${limit}&name=${nameFilter}`,
    );
  }

  async closeFranchise(franchise: Franchise): Promise<void> {
    return this.callEndpoint(`/api/franchise/${franchise.id}`, "DELETE");
  }

  async createStore(franchise: Franchise, store: Store): Promise<Store> {
    return this.callEndpoint(
      `/api/franchise/${franchise.id}/store`,
      "POST",
      store,
    );
  }

  async closeStore(franchise: Franchise, store: Store): Promise<null> {
    return this.callEndpoint(
      `/api/franchise/${franchise.id}/store/${store.id}`,
      "DELETE",
    );
  }

  async docs(docType: string): Promise<Endpoints> {
    if (docType === "factory") {
      return this.callEndpoint(pizzaFactoryUrl + `/api/docs`);
    }
    return this.callEndpoint(`/api/docs`);
  }
}

const httpPizzaService = new HttpPizzaService();
export default httpPizzaService;
