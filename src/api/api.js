import axios from "axios"

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

  
  // Usage 
  async fetchUsage() {
    const response = await this.client.get('/status/usage');
    return response.data.requests;
  }

  // Leagues
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

  async associatePlaydoitChamp(leagueId, playdoitChampId) {
    const response = await this.client.put(
      `/leagues/associate-playdoit-champ?league_id=${leagueId}&playdoit_champ_id=${playdoitChampId}`
    );
    return response.data;
  }

  async importPlaydoit(token, dateFrom, dateTo, dryRun = false) {
    const response = await this.client.post(
      `/playdoit/import?token=${encodeURIComponent(token)}&date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}&dry_run=${dryRun}`
    );
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

  async fetchRecentMatches(teamId) {
    const response = await this.client.get(`/teams/${teamId}/recent-matches`);
    return response.data;
  }

  async fetchOdds(fixtureId) {
    const response = await this.client.get(`/odds/fixture/${fixtureId}`);
    return response.data;
  }

  async fetchRefreshFixtures(date='2025-12-14') {
    const response = await this.client.post(`/redis/refresh-fixtures-cache?date=${date}`);
    return response.data;
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
  async fetchTickets(page = 0, limit = 10, search = '', league = '', date = null) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (league) params.append('league', league);
    if (date) params.append('date', date);
    const response = await this.client.get(`/bets/get-tickets?${params}`);
    return response.data;
  }

  async fetchBetsStats(league = '', date = null) {
    const params = new URLSearchParams();
    if (league) params.append('league', league);
    if (date) params.append('date', date);
    const qs = params.toString();
    const response = await this.client.get(`/bets/stats${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async fetchBetsAnalytics() {
    const response = await this.client.get('/bets/analytics');
    return response.data;
  }

  async fetchLeaguesBySport(sport) {
    const response = await this.client.get(`/bets/leagues?sport=${encodeURIComponent(sport)}`);
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

  // BetRadar
  async fetchBetRadarSuggestions(date) {
    const response = await this.client.get(`/bet-radar/suggestions?date=${date}`, { timeout: 45000 });
    return response.data;
  }

  async fetchBetRadarCached(date) {
    const response = await this.client.get(`/bet-radar/cached?date=${date}`);
    return response.data;
  }

  async fetchBetRadarAccuracy(days = 7, minConfidence = 70) {
    const response = await this.client.get(
      `/bet-radar/accuracy?days=${days}&min_confidence=${minConfidence}`,
      { timeout: 20000 },
    );
    return response.data;
  }

  // MLB Radar
  async fetchMLBRadarCached(date, league = 'mlb') {
    const response = await this.client.get(`/mlb-radar/cached?date=${date}&league=${league}`);
    return response.data;
  }

  async fetchMLBRadarSuggestions(date, league = 'mlb') {
    const response = await this.client.get(
      `/mlb-radar/suggestions?date=${date}&league=${league}`,
      { timeout: 45000 },
    );
    return response.data;
  }

  async fetchMLBRadarAccuracy(days = 7, minConfidence = 70, league = 'mlb') {
    const response = await this.client.get(
      `/mlb-radar/accuracy?days=${days}&min_confidence=${minConfidence}&league=${league}`,
      { timeout: 20000 },
    );
    return response.data;
  }

  // NFL — schedule (short TTL, for the Partidos view) + Radar (picks)
  async fetchNFLSchedule(date) {
    const response = await this.client.get(`/nfl-radar/schedule?date=${date}`);
    return response.data;
  }

  async fetchNFLRadarCached(date) {
    const response = await this.client.get(`/nfl-radar/cached?date=${date}`);
    return response.data;
  }

  async fetchNFLRadarSuggestions(date) {
    const response = await this.client.get(`/nfl-radar/suggestions?date=${date}`, { timeout: 45000 });
    return response.data;
  }

  async fetchNFLRadarAccuracy(days = 7, minConfidence = 70) {
    const response = await this.client.get(
      `/nfl-radar/accuracy?days=${days}&min_confidence=${minConfidence}`,
      { timeout: 20000 },
    );
    return response.data;
  }

  // NBA — schedule (short TTL, for the Partidos view) + Radar (picks)
  async fetchNBASchedule(date) {
    const response = await this.client.get(`/nba-radar/schedule?date=${date}`);
    return response.data;
  }

  async fetchNBARadarCached(date) {
    const response = await this.client.get(`/nba-radar/cached?date=${date}`);
    return response.data;
  }

  async fetchNBARadarSuggestions(date) {
    const response = await this.client.get(`/nba-radar/suggestions?date=${date}`, { timeout: 45000 });
    return response.data;
  }

  async fetchNBARadarAccuracy(days = 7, minConfidence = 70) {
    const response = await this.client.get(
      `/nba-radar/accuracy?days=${days}&min_confidence=${minConfidence}`,
      { timeout: 20000 },
    );
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

  // Bankroll
  async fetchBankrollSummary() {
    const response = await this.client.get('/bankroll/summary');
    return response.data;
  }

  async fetchBankrollChartData() {
    const response = await this.client.get('/bankroll/chart-data');
    return response.data;
  }

  async fetchTransactions(page = 0, limit = 10, types = null) {
    const typesQs = types && types.length
      ? '&' + types.map(t => `types=${encodeURIComponent(t)}`).join('&')
      : '';
    const response = await this.client.get(`/bankroll/transactions?page=${page}&limit=${limit}${typesQs}`);
    return response.data;
  }

  async createTransaction(data) {
    const response = await this.client.post('/bankroll/transactions', data);
    return response.data;
  }

  async updateTransaction(id, data) {
    const response = await this.client.put(`/bankroll/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id) {
    const response = await this.client.delete(`/bankroll/transactions/${id}`);
    return response.data;
  }

  // Baseball — MLB only, ESPN-sourced (LMB has no ESPN coverage and was dropped)
  async fetchBaseballSchedule(date) {
    const response = await this.client.get(`/baseball/schedule?date=${date}`);
    return response.data;
  }

  async fetchBaseballBoxscore(gamePk) {
    const response = await this.client.get(`/baseball/boxscore/${gamePk}`);
    return response.data;
  }

  async fetchPitcherStats(personId) {
    const response = await this.client.get(`/baseball/pitcher-stats/${personId}`);
    return response.data;
  }

  async fetchPitcherGameLog(personId, seasons = 1) {
    const response = await this.client.get(`/baseball/pitcher-gamelog/${personId}?seasons=${seasons}`);
    return response.data;
  }

  async fetchGamesFinalScores(gamePks) {
    if (!gamePks.length) return {};
    const response = await this.client.get(`/baseball/games-scores?game_pks=${gamePks.join(',')}`);
    return response.data;
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_HOST);