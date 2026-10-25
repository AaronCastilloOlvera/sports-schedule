// Talks to Playdoit (Altenar) straight from the browser: Cloudflare blocks its API from
// datacenter IPs like Railway's, but accepts the user's own connection. Uses fetch, not
// apiClient, so the app's own session token is never sent to Playdoit.
const BASE = 'https://sb2bethistory-gateway-altenar2.biahosted.com/api/WidgetReports';

// Copied from the Playdoit widget's own requests; Altenar answers an empty 400 without them.
const STATIC_PARAMS = {
  culture: 'es-ES',
  integration: 'playdoit2',
  deviceType: 2,
  numFormat: 'en-GB',
  countryCode: 'MX',
  liveOnly: false,
  timezoneOffset: 360,
};

// Every known status (0 open, 1 won, 2 lost, 8 push, 18 closed). The site's own default
// [1, 8] silently drops losses and open bets.
const ALL_STATUSES = [0, 1, 2, 8, 18];
const PAGE_SIZE = 50;

export class PlaydoitError extends Error {
  constructor(status) {
    super(`Playdoit respondió ${status}`);
    this.status = status;
  }
}

async function post(path, token, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    referrerPolicy: 'no-referrer',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...STATIC_PARAMS, ...body }),
  });
  if (!res.ok) throw new PlaydoitError(res.status);
  return res.json();
}

/** Bet summaries (id, status, stake...) between two ISO UTC instants, all pages. */
export async function getAllBets(token, dateFrom, dateTo) {
  const bets = [];
  for (let page = 1; ; page++) {
    const data = await post('widgetBetHistory', token, {
      dateFrom, dateTo, pageNumber: page, pageSize: PAGE_SIZE, statuses: ALL_STATUSES,
    });
    bets.push(...(data.bets || []));
    if (data.isLastPage !== false || !data.bets?.length) return bets;
  }
}

/** Full bet with its selections. Altenar sometimes answers 200 with {error} instead of a bet. */
export async function getBetDetail(token, betId) {
  const data = await post('WidgetGetBetDetails', token, { id: betId });
  if (data.error || !data.bet) throw new PlaydoitError(200);
  return data.bet;
}
