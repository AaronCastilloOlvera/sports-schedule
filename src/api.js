
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

export const fetchLeagues = async (host) => {
  const response = await fetch(`${host}/leagues`)
  return await response.json()
}

export const fetchFavoriteLeagues = async (host) => {
  const response = await fetch(`${host}/favorite-leagues`)
  return await response.json();
}

export const fetchLeaguesCountries = async (host) => {
  const response = await fetch(`${host}/leagues`)
  return await response.json();
}