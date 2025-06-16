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

const joinUrl = (apiURL, endpoint) => {
  if (!apiURL.endsWith('/')) apiURL += '/';
  return `${apiURL}${endpoint}`;
}

export const fetchLeagues = async (host) => {
  var url = joinUrl(host, 'leagues');
  const response = await fetch(url)
  return await response.json()
}

export const fetchFavoriteLeagues = async (host) => {  
  var url = joinUrl(host, 'favorite-leagues');
  console.log("Fetching favorite leagues from:", url);
  const response = await fetch(url)
  return await response.json();
}