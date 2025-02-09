
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