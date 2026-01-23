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

  async updateLeague(leagueId, isFavorite) {
    const response = await this.client.put(`/leagues/update-league?league_id=${leagueId}&is_favorite=${isFavorite}`);
    return response.data;
  }

  async fetchFavoriteLeagues() {
    const response = await this.client.get('/leagues/favorite-leagues');
    return response.data;
  }

  // Matches 
  async fetchFixtures(date='2025-12-14') {
    const response = await this.client.get(`/matches/by-date?date=${date}`);
    return response.data;
  }

  async fetchHeadToHeadMatches(teamId1, teamId2) {
    const response = await this.client.get(`/matches/headtohead?team1=${teamId1}&team2=${teamId2}`);
    return response.data;
  }

  async fetchHeadToHeadCachedMatches() {
    const response = await this.client.get(`/matches/headtohead/cached-keys`);
    return response.data;
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

  // Tickets
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