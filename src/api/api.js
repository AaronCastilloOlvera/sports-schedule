import axios from "axios"

export const fetchStatus = async (apiKey, apiURL) => {
  const options = {
    method: 'GET',
    url: `https://${apiURL}/status`,
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiURL
    }
  }
  const response = await axios.request(options);
  return response.data;
};

class ApiClient {
  constructor(baseURL, opts = {}) {
    if (!baseURL) throw new Error('ApiClient requires a baseURL');

    this.client = axios.create({
      baseURL,
      timeout: opts.timeout || 8000,
      headers: opts.headers || {}
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async fetchLeagues() {
    try {
      const response = await this.client.get('/leagues');
      return response.data;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  }

  async fetchFavoriteLeagues() {
    try {
      const response = await this.client.get('/leagues/favorite');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorite leagues:', error);
      throw error;
    }
  }

  async fetchFixtures(date='2025-12-14') {
    try {
      const response = await this.client.get(`/matches/by-date?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      throw error;
    }
  }

  async fetchRefreshFixtures(date='2025-12-14') {
    try {
      const response = await this.client.post(`/redis/refresh-fixtures-cache?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      throw error;
    }
  }

  async fetchAnalyzeTicket(imageData) {
    try {
      const response = await this.client.post('/bets/analyze-ticket', imageData, {
        headers: {  "Content-Type": "multipart/form-data"}
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      throw error;
    }
  }

  async fetchTickets() {
    const response = await this.client.get('/bets/get-tickets');
    return response.data;
  }
  async createTicket(formData) {
    const response = await this.client.post(`/bets/create-ticket`, formData);
    return response.data;
  }

  async deleteTicket(ticketId) {
    const response = await this.client.delete(`/bets/delete-ticket?ticket_id=${ticketId}`);
    return response.data;
  }

  async updateTicket(ticketId, formData) {
    const response = await this.client.put(`/bets/update-ticket?ticket_id=${ticketId}`, formData);
    return response.data;
  }

  async uploadTicketImage(ticketId, formData) {
    const response = await this.client.post(`/bets/upload-ticket-image?ticket_id=${ticketId}`, formData);
    return response.data;
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_HOST);