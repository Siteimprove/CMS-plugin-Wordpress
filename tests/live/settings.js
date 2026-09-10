const SECRET_NAMES = [
  'SITEIMPROVE_PUBLIC_URL', 'SITEIMPROVE_CRAWLED_URL',
  'SITEIMPROVE_API_USERNAME', 'SITEIMPROVE_API_KEY',
  'SITEIMPROVE_USERNAME', 'SITEIMPROVE_PASSWORD',
];

function fixtureLocation(baseValue, pageValue) {
  let base, page;
  try { base = new URL(baseValue); page = new URL(pageValue); } catch { throw new Error('Invalid test URL configuration'); }
  if (![base, page].every(url => ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.hash)) {
    throw new Error('Invalid test URL configuration');
  }
  const basePath = base.pathname.replace(/\/$/, '');
  if (base.search || base.origin !== page.origin || (page.pathname !== basePath && !page.pathname.startsWith(`${basePath}/`))) {
    throw new Error('The crawled page must belong to the configured public base URL');
  }
  const path = page.pathname.slice(basePath.length) || '/';
  if (path.startsWith('//') || /^\/wp-(admin|login\.php|json)(\/|$)/.test(path)) throw new Error('Unsupported fixture path');
  for (const key of ['preview', 'preview_id', 'preview_nonce', 'si_preview_nonce', 'p', 'page_id', 'rest_route']) {
    if (page.searchParams.has(key)) throw new Error('Crawled URL uses a reserved WordPress preview parameter');
  }
  return { path, query: page.search.slice(1), publicBase: `${base.origin}${basePath}`, crawledUrl: page.href };
}

function loadSettings(env) {
  if (SECRET_NAMES.some(name => !env[name]?.trim())) throw new Error('All six Siteimprove secrets are required');
  return { ...Object.fromEntries(SECRET_NAMES.map(name => [name, env[name]])),
    fixture: fixtureLocation(env.SITEIMPROVE_PUBLIC_URL, env.SITEIMPROVE_CRAWLED_URL) };
}

// Fields used by the current public overlay-latest.js SDK polling contract.
function isLivePageData(body) {
  return body?.authed === true && body.error === 'None' &&
    Number.isFinite(body.issues) && body.issues >= 0 && typeof body.mainUrl === 'string' && body.mainUrl.length > 0;
}
module.exports = { SECRET_NAMES, fixtureLocation, loadSettings, isLivePageData };
