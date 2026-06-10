export const config = { runtime: 'edge' };

const MLB = 'https://statsapi.mlb.com/api/v1';
const ODDS = 'https://api.the-odds-api.com/v4';

export default async function handler(req) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const oddsKey = url.searchParams.get('oddsKey') || '';
  const book = url.searchParams.get('book') || 'draftkings';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    if (type === 'mlb') {
      const [alR, nlR] = await Promise.all([
        fetch(`${MLB}/standings?leagueId=103&season=2026&standingsTypes=regularSeason`),
        fetch(`${MLB}/standings?leagueId=104&season=2026&standingsTypes=regularSeason`)
      ]);
      const [alD, nlD] = await Promise.all([alR.json(), nlR.json()]);
      return new Response(JSON.stringify({ al: alD, nl: nlD }), { headers });
    }

    if (type === 'odds') {
      const oddsR = await fetch(
        `${ODDS}/sports/baseball_mlb/odds/?apiKey=${oddsKey}&regions=us&markets=totals,h2h&bookmakers=${book}&oddsFormat=american`
      );
      const data = await oddsR.json();
      const rem = oddsR.headers.get('x-requests-remaining') || '?';
      return new Response(JSON.stringify({ games: data, remaining: rem }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
