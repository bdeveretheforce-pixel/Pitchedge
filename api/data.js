const MLB = 'https://statsapi.mlb.com/api/v1';
const ODDS = 'https://api.the-odds-api.com/v4';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const oddsKey = searchParams.get('oddsKey') || '';
  const book = searchParams.get('book') || 'draftkings';

  try {
    if (type === 'mlb') {
      const [alRes, nlRes] = await Promise.all([
        fetch(`${MLB}/standings?leagueId=103&season=2026&standingsTypes=regularSeason`),
        fetch(`${MLB}/standings?leagueId=104&season=2026&standingsTypes=regularSeason`),
      ]);
      const [al, nl] = await Promise.all([alRes.json(), nlRes.json()]);
      return new Response(JSON.stringify({ al, nl }), { headers: CORS });
    }

    if (type === 'odds') {
      const res = await fetch(
        `${ODDS}/sports/baseball_mlb/odds/?apiKey=${oddsKey}&regions=us&markets=totals,h2h&bookmakers=${book}&oddsFormat=american`
      );
      const data = await res.json();
      const remaining = res.headers.get('x-requests-remaining') || '?';
      return new Response(JSON.stringify({ games: Array.isArray(data) ? data : [], remaining }), { headers: CORS });
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: CORS });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}
