import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { isIP } from 'node:net';

const REQUEST_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
};

const GENERIC_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'live.com',
]);

const BLOCKED_WEBSITE_HOSTS = [
  'linkedin.com',
  'instagram.com',
  'facebook.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'wikipedia.org',
  'google.com',
  'bing.com',
];

type ReceitaProvider = 'brasilapi' | 'receitaws';
type WebsiteSource = 'api' | 'email' | 'duckduckgo' | 'guess';

type Cnae = {
  code: string | null;
  description: string | null;
};

type CompanyAddress = {
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
};

export type CnpjCompanyData = {
  cnpj: string;
  officialName: string;
  tradeName: string | null;
  registrationStatus: string | null;
  primaryCnae: Cnae | null;
  secondaryCnaes: Cnae[];
  address: CompanyAddress;
  email: string | null;
  phone: string | null;
};

export type WebsiteDiscoveryResult = {
  url: string | null;
  source: WebsiteSource | null;
  candidatesTried: string[];
};

export type WebsiteScrapingResult = {
  attempted: boolean;
  success: boolean;
  logoUrl: string | null;
  about: string | null;
  services: string[];
  error: string | null;
};

export type CnpjLookupResult = {
  provider: ReceitaProvider;
  normalizedCnpj: string;
  formattedCnpj: string;
  company: CnpjCompanyData;
  website: WebsiteDiscoveryResult;
  scraping: WebsiteScrapingResult;
  rawReceitaData: unknown;
};

export class CnpjLookupError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'CnpjLookupError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type BrasilApiResponse = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  descricao_situacao_cadastral?: string | null;
  cnae_fiscal?: number | string | null;
  cnae_fiscal_descricao?: string | null;
  cnaes_secundarios?: Array<{
    codigo: number | string | null;
    descricao: string | null;
  }>;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  ddd_telefone_1?: string | null;
  ddd_telefone_2?: string | null;
  email?: string | null;
};

type ReceitaWsResponse = {
  status?: string;
  message?: string;
  cnpj?: string;
  nome?: string;
  fantasia?: string;
  situacao?: string;
  atividade_principal?: Array<{ code?: string; text?: string }>;
  atividades_secundarias?: Array<{ code?: string; text?: string }>;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  site?: string;
};

export async function lookupCnpjData(rawCnpj: string): Promise<CnpjLookupResult> {
  const normalizedCnpj = sanitizeCnpj(rawCnpj);

  if (!isValidCnpj(normalizedCnpj)) {
    throw new CnpjLookupError('CNPJ invalido.', 'INVALID_CNPJ', 400);
  }

  const receitaPayload = await fetchReceitaPayload(normalizedCnpj);
  const website = await discoverOfficialWebsite(receitaPayload.company, receitaPayload.rawData);
  const scraping = website.url
    ? await scrapeCompanyWebsite(website.url)
    : {
        attempted: false,
        success: false,
        logoUrl: null,
        about: null,
        services: [],
        error: 'SITE_NOT_FOUND',
      };

  return {
    provider: receitaPayload.provider,
    normalizedCnpj,
    formattedCnpj: formatCnpj(normalizedCnpj),
    company: receitaPayload.company,
    website,
    scraping,
    rawReceitaData: receitaPayload.rawData,
  };
}

function sanitizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const firstDigit = calculateCnpjDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjDigit(
    cnpj.slice(0, 12) + String(firstDigit),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

function calculateCnpjDigit(base: string, weights: number[]): number {
  const sum = base
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

async function fetchReceitaPayload(cnpj: string): Promise<{
  provider: ReceitaProvider;
  company: CnpjCompanyData;
  rawData: unknown;
}> {
  try {
    const fromBrasilApi = await fetchFromBrasilApi(cnpj);
    return {
      provider: 'brasilapi',
      company: mapBrasilApiCompany(fromBrasilApi),
      rawData: fromBrasilApi,
    };
  } catch (error) {
    const mapped = mapAxiosError(error);
    if (mapped.code === 'CNPJ_NOT_FOUND' || mapped.code === 'INVALID_CNPJ') {
      throw mapped;
    }
  }

  try {
    const fromReceitaWs = await fetchFromReceitaWs(cnpj);
    return {
      provider: 'receitaws',
      company: mapReceitaWsCompany(fromReceitaWs, cnpj),
      rawData: fromReceitaWs,
    };
  } catch (error) {
    throw mapAxiosError(error);
  }
}

async function fetchFromBrasilApi(cnpj: string): Promise<BrasilApiResponse> {
  const response = await axios.get<BrasilApiResponse>(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: REQUEST_HEADERS,
      validateStatus: () => true,
    }
  );

  if (response.status === 404) {
    throw new CnpjLookupError('CNPJ nao encontrado na Receita Federal.', 'CNPJ_NOT_FOUND', 404);
  }

  if (response.status === 429) {
    throw new CnpjLookupError(
      'Limite da API de CNPJ excedido. Tente novamente em instantes.',
      'RECEITA_RATE_LIMIT',
      429
    );
  }

  if (response.status >= 500) {
    throw new CnpjLookupError(
      'Servico da Receita indisponivel temporariamente.',
      'RECEITA_UNAVAILABLE',
      502
    );
  }

  if (response.status !== 200 || !response.data?.razao_social) {
    throw new CnpjLookupError(
      'Falha ao consultar CNPJ na Receita Federal.',
      'RECEITA_LOOKUP_FAILED',
      502,
      response.data
    );
  }

  return response.data;
}

async function fetchFromReceitaWs(cnpj: string): Promise<ReceitaWsResponse> {
  const response = await axios.get<ReceitaWsResponse>(
    `https://www.receitaws.com.br/v1/cnpj/${cnpj}`,
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: REQUEST_HEADERS,
      validateStatus: () => true,
    }
  );

  if (response.status === 429) {
    throw new CnpjLookupError(
      'Limite da API de CNPJ excedido. Tente novamente em instantes.',
      'RECEITA_RATE_LIMIT',
      429
    );
  }

  if (response.status >= 500) {
    throw new CnpjLookupError(
      'Servico da Receita indisponivel temporariamente.',
      'RECEITA_UNAVAILABLE',
      502
    );
  }

  const payload = response.data;
  const errorMessage = payload?.message?.toLowerCase() ?? '';

  if (payload?.status === 'ERROR') {
    if (errorMessage.includes('cnpj')) {
      if (errorMessage.includes('nao encontrado')) {
        throw new CnpjLookupError('CNPJ nao encontrado na Receita Federal.', 'CNPJ_NOT_FOUND', 404);
      }
      throw new CnpjLookupError('CNPJ invalido.', 'INVALID_CNPJ', 400);
    }

    throw new CnpjLookupError(
      payload.message ?? 'Falha ao consultar CNPJ na Receita Federal.',
      'RECEITA_LOOKUP_FAILED',
      502,
      payload
    );
  }

  if (!payload?.nome) {
    throw new CnpjLookupError(
      'Falha ao consultar CNPJ na Receita Federal.',
      'RECEITA_LOOKUP_FAILED',
      502,
      payload
    );
  }

  return payload;
}

function mapBrasilApiCompany(payload: BrasilApiResponse): CnpjCompanyData {
  const secondaryCnaes = (payload.cnaes_secundarios ?? []).map((item) => ({
    code: item.codigo ? String(item.codigo) : null,
    description: item.descricao ?? null,
  }));

  return {
    cnpj: formatCnpj(sanitizeCnpj(payload.cnpj)),
    officialName: payload.razao_social,
    tradeName: payload.nome_fantasia ?? null,
    registrationStatus: payload.descricao_situacao_cadastral ?? null,
    primaryCnae: {
      code: payload.cnae_fiscal ? String(payload.cnae_fiscal) : null,
      description: payload.cnae_fiscal_descricao ?? null,
    },
    secondaryCnaes,
    address: {
      street: payload.logradouro ?? null,
      number: payload.numero ?? null,
      complement: payload.complemento ?? null,
      district: payload.bairro ?? null,
      city: payload.municipio ?? null,
      state: payload.uf ?? null,
      zipCode: payload.cep ?? null,
    },
    email: payload.email ?? null,
    phone: payload.ddd_telefone_1 ?? payload.ddd_telefone_2 ?? null,
  };
}

function mapReceitaWsCompany(payload: ReceitaWsResponse, cnpj: string): CnpjCompanyData {
  const primary = payload.atividade_principal?.[0];
  const secondaryCnaes = (payload.atividades_secundarias ?? []).map((item) => ({
    code: item.code ?? null,
    description: item.text ?? null,
  }));

  return {
    cnpj: formatCnpj(cnpj),
    officialName: payload.nome ?? '',
    tradeName: payload.fantasia ?? null,
    registrationStatus: payload.situacao ?? null,
    primaryCnae: {
      code: primary?.code ?? null,
      description: primary?.text ?? null,
    },
    secondaryCnaes,
    address: {
      street: payload.logradouro ?? null,
      number: payload.numero ?? null,
      complement: payload.complemento ?? null,
      district: payload.bairro ?? null,
      city: payload.municipio ?? null,
      state: payload.uf ?? null,
      zipCode: payload.cep ?? null,
    },
    email: payload.email ?? null,
    phone: payload.telefone ?? null,
  };
}

async function discoverOfficialWebsite(
  company: CnpjCompanyData,
  rawData: unknown
): Promise<WebsiteDiscoveryResult> {
  const candidatesTried: string[] = [];
  const candidates = await buildWebsiteCandidates(company, rawData);

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate.url);
    if (!normalized || isBlockedHost(normalized)) {
      continue;
    }

    if (!candidatesTried.includes(normalized)) {
      candidatesTried.push(normalized);
    }

    const finalUrl = await probeWebsite(normalized);
    if (finalUrl) {
      const source = candidate.source;
      return {
        url: finalUrl,
        source,
        candidatesTried,
      };
    }
  }

  return {
    url: null,
    source: null,
    candidatesTried,
  };
}

async function buildWebsiteCandidates(company: CnpjCompanyData, rawData: unknown): Promise<
  Array<{ url: string; source: WebsiteSource }>
> {
  const candidates: Array<{ url: string; source: WebsiteSource }> = [];
  const added = new Set<string>();

  const addCandidate = (url: string | null | undefined, source: WebsiteSource) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    if (!normalized || added.has(normalized)) return;
    added.add(normalized);
    candidates.push({ url: normalized, source });
  };

  for (const url of extractUrlsFromUnknown(rawData)) {
    addCandidate(url, 'api');
  }

  addCandidate(buildWebsiteFromEmail(company.email), 'email');

  for (const guessed of guessDomainsFromCompanyName(company.tradeName ?? company.officialName)) {
    addCandidate(guessed, 'guess');
  }

  const duckDuckGo = await searchWebsiteInDuckDuckGo(company.tradeName ?? company.officialName);
  for (const url of duckDuckGo) {
    addCandidate(url, 'duckduckgo');
  }

  return candidates;
}

function extractUrlsFromUnknown(value: unknown): string[] {
  const urls = new Set<string>();

  const walk = (current: unknown) => {
    if (!current) return;

    if (typeof current === 'string') {
      for (const url of extractUrlCandidates(current)) {
        urls.add(url);
      }
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }

    if (typeof current === 'object') {
      Object.values(current as Record<string, unknown>).forEach(walk);
    }
  };

  walk(value);
  return [...urls];
}

function extractUrlCandidates(text: string): string[] {
  const explicitUrlRegex = /(https?:\/\/[^\s"'<>]+)/gi;
  const domainRegex = /\b([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s"'<>]*)?\b/gi;

  const found: string[] = [];
  const explicitMatches = text.match(explicitUrlRegex) ?? [];
  const domainMatches = text.match(domainRegex) ?? [];

  for (const item of [...explicitMatches, ...domainMatches]) {
    found.push(item.trim());
  }

  return found;
}

function buildWebsiteFromEmail(email: string | null): string | null {
  if (!email) return null;
  const [, domain = ''] = email.toLowerCase().split('@');
  if (!domain || GENERIC_EMAIL_PROVIDERS.has(domain)) return null;
  return `https://${domain}`;
}

function guessDomainsFromCompanyName(companyName: string): string[] {
  const slug = normalizeCompanySlug(companyName);
  if (!slug) return [];

  const tokens = slug.split('-').filter(Boolean);
  const roots = new Set<string>();

  if (tokens[0]) roots.add(tokens[0]);
  if (tokens.length >= 2) roots.add(`${tokens[0]}${tokens[1]}`);
  roots.add(tokens.join(''));

  const candidates: string[] = [];
  for (const root of roots) {
    if (root.length < 4) continue;
    candidates.push(`https://${root}.com.br`, `https://${root}.com`);
  }

  return candidates;
}

function normalizeCompanySlug(name: string): string {
  const stopWords = new Set([
    'ltda',
    'me',
    'eireli',
    'sa',
    's',
    'a',
    'de',
    'da',
    'do',
    'dos',
    'das',
    'empresa',
    'tecnologia',
    'comercio',
    'servicos',
  ]);

  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .slice(0, 3)
    .join('-');
}

async function searchWebsiteInDuckDuckGo(companyName: string): Promise<string[]> {
  try {
    const response = await axios.get<string>('https://duckduckgo.com/html/', {
      params: {
        q: `${companyName} site oficial`,
      },
      timeout: REQUEST_TIMEOUT_MS,
      headers: REQUEST_HEADERS,
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const $ = cheerio.load(response.data);
    const links: string[] = [];

    $('a.result__a').each((_index, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      const finalUrl = parseDuckDuckGoRedirect(href);
      if (finalUrl) links.push(finalUrl);
    });

    return uniqueStrings(links).slice(0, 5);
  } catch {
    return [];
  }
}

function parseDuckDuckGoRedirect(href: string): string | null {
  try {
    const parsed = new URL(href, 'https://duckduckgo.com');
    const uddg = parsed.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return href;
  } catch {
    return null;
  }
}

function normalizeUrl(url: string): string | null {
  const candidate = url.trim();
  if (!candidate) return null;

  const withProtocol = candidate.startsWith('http://') || candidate.startsWith('https://')
    ? candidate
    : `https://${candidate}`;

  try {
    const parsed = new URL(withProtocol);
    const hostname = parsed.hostname.replace(/^www\./, 'www.');
    const cleanPath = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.protocol}//${hostname}${cleanPath}`;
  } catch {
    return null;
  }
}

function isBlockedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (BLOCKED_WEBSITE_HOSTS.some((blocked) => host.includes(blocked))) return true;
    return isPrivateOrLocalHost(host);
  } catch {
    return true;
  }
}

function isPrivateOrLocalHost(host: string): boolean {
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === '0.0.0.0'
  ) {
    return true;
  }

  const ipType = isIP(host);
  if (!ipType) return false;

  if (ipType === 4) {
    if (host.startsWith('10.')) return true;
    if (host.startsWith('127.')) return true;
    if (host.startsWith('192.168.')) return true;
    if (host.startsWith('169.254.')) return true;

    const octets = host.split('.').map((item) => Number(item));
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  }

  if (ipType === 6) {
    if (host === '::1') return true;
    if (host.startsWith('fc') || host.startsWith('fd')) return true;
    if (host.startsWith('fe80')) return true;
  }

  return false;
}

async function probeWebsite(url: string): Promise<string | null> {
  const candidates = [url];

  try {
    const host = new URL(url).hostname;
    if (!host.startsWith('www.')) {
      candidates.push(url.replace('://', '://www.'));
    }
  } catch {
    return null;
  }

  for (const candidate of uniqueStrings(candidates)) {
    try {
      const response = await axios.get(candidate, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: REQUEST_HEADERS,
        maxContentLength: MAX_HTML_BYTES,
        maxBodyLength: MAX_HTML_BYTES,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (response.status >= 200 && response.status < 400) {
        const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
        if (!contentType || contentType.includes('text/html')) {
          return response.request?.res?.responseUrl ?? candidate;
        }
      }
    } catch {
      // Try next candidate URL.
    }
  }

  return null;
}

async function scrapeCompanyWebsite(url: string): Promise<WebsiteScrapingResult> {
  try {
    const response = await axios.get<string>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: REQUEST_HEADERS,
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const finalUrl = response.request?.res?.responseUrl ?? url;
    const $ = cheerio.load(response.data);

    const logoUrl = extractLogoUrl($, finalUrl);
    const about = extractAboutText($);
    const services = extractServices($);

    return {
      attempted: true,
      success: true,
      logoUrl,
      about,
      services,
      error: null,
    };
  } catch (error) {
    const mapped = mapAxiosError(error);
    return {
      attempted: true,
      success: false,
      logoUrl: null,
      about: null,
      services: [],
      error: mapped.code,
    };
  }
}

function extractLogoUrl($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const iconHref =
    $('link[rel="icon"]').attr('href') ??
    $('link[rel="shortcut icon"]').attr('href') ??
    $('link[rel="apple-touch-icon"]').attr('href');

  if (iconHref) {
    return toAbsoluteUrl(baseUrl, iconHref);
  }

  const logoImg =
    findImageByKeyword($, 'src', 'logo') ??
    findImageByKeyword($, 'class', 'logo') ??
    $('header img').first().attr('src');

  return logoImg ? toAbsoluteUrl(baseUrl, logoImg) : null;
}

function findImageByKeyword(
  $: cheerio.CheerioAPI,
  attribute: 'src' | 'class',
  keyword: string
): string | null {
  let match: string | null = null;

  $('img').each((_index, element) => {
    if (match) return;
    const value = String($(element).attr(attribute) ?? '').toLowerCase();
    if (!value.includes(keyword)) return;
    const src = $(element).attr('src');
    if (src) match = src;
  });

  return match;
}

function extractAboutText($: cheerio.CheerioAPI): string | null {
  const headingPattern = /sobre|quem somos|a empresa|about|nossa historia/i;
  let aboutText: string | null = null;

  $('h1,h2,h3,h4').each((_index, element) => {
    if (aboutText) return;
    const heading = cleanText($(element).text());
    if (!headingPattern.test(heading)) return;

    const sectionText = cleanText(
      $(element).closest('section,article,div').text() || $(element).parent().text()
    );

    if (sectionText.length >= 80) {
      aboutText = sectionText.slice(0, 1200);
    }
  });

  if (aboutText) return aboutText;

  const metaDescription = cleanText($('meta[name="description"]').attr('content') ?? '');
  return metaDescription || null;
}

function extractServices($: cheerio.CheerioAPI): string[] {
  const headingPattern = /solu[cç][oõ]es|servi[cç]os|o que fazemos|produtos/i;
  const services: string[] = [];

  $('h1,h2,h3,h4').each((_index, element) => {
    const heading = cleanText($(element).text());
    if (!headingPattern.test(heading)) return;

    const container = $(element).closest('section,article,div');
    container.find('li, .card, .service, .solution, .item').each((_i, item) => {
      const text = cleanText($(item).text());
      if (text.length >= 4 && text.length <= 140) {
        services.push(text);
      }
    });
  });

  if (services.length === 0) {
    $('a, button').each((_index, element) => {
      const text = cleanText($(element).text());
      if (/solu[cç][oõ]es|servi[cç]os/i.test(text) && text.length <= 80) {
        services.push(text);
      }
    });
  }

  return uniqueStrings(services).slice(0, 20);
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mapAxiosError(error: unknown): CnpjLookupError {
  if (error instanceof CnpjLookupError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    return mapAxiosNetworkError(error);
  }

  return new CnpjLookupError('Erro interno ao consultar CNPJ.', 'INTERNAL_ERROR', 500, error);
}

function mapAxiosNetworkError(error: AxiosError): CnpjLookupError {
  if (error.code === 'ECONNABORTED') {
    return new CnpjLookupError(
      'Tempo limite excedido ao consultar servicos externos.',
      'REQUEST_TIMEOUT',
      504
    );
  }

  return new CnpjLookupError(
    'Falha de comunicacao com servicos externos.',
    'NETWORK_ERROR',
    502,
    error.message
  );
}
