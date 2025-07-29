const API_BASE_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

export class ApiClient {
  private static instance: ApiClient;
  private ws: WebSocket | null = null;
  private wsCallbacks: ((data: any) => void)[] = [];

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async getRules() {
    const response = await fetch(`${API_BASE_URL}/rules`);
    return response.json();
  }

  async getTasks() {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    return response.json();
  }

  async processInput(input: string) {
    const response = await fetch(`${API_BASE_URL}/process-input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });
    return response.json();
  }

  async updateTask(taskId: string, updates: { status?: string; priority?: string }) {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  connectWebSocket(callback: (data: any) => void) {
    this.wsCallbacks.push(callback);
    
    if (!this.ws) {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.wsCallbacks.forEach(cb => cb(data));
      };
      
      this.ws.onclose = () => {
        this.ws = null;
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (this.wsCallbacks.length > 0) {
            this.connectWebSocket(() => {});
          }
        }, 3000);
      };
    }
  }

  disconnectWebSocket(callback: (data: any) => void) {
    this.wsCallbacks = this.wsCallbacks.filter(cb => cb !== callback);
    
    if (this.wsCallbacks.length === 0 && this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}