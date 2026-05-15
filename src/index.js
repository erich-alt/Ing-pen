function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function walletAmount(amount) {
  if (amount && typeof amount === 'object') return Number(amount.value || 0);
  return Number(amount || 0);
}

function normalizeWalletRecord(record) {
  const value = walletAmount(record.amount || record.baseAmount);
  const date = String(record.recordDate || record.date || record.createdAt || '').slice(0, 10);
  const category = record.category && record.category.name ? record.category.name : 'Otros';
  const labels = Array.isArray(record.labels) ? record.labels.map((label) => label.name).filter(Boolean) : [];
  const description = record.note || record.payee || record.merchant || category || 'Wallet';
  const type = record.recordType || (value < 0 ? 'expense' : 'income');

  return {
    walletId: record.id,
    date,
    description,
    category,
    amount: Math.abs(value),
    signedAmount: value,
    currency: (record.amount && record.amount.currencyCode) || (record.baseAmount && record.baseAmount.currencyCode) || 'CLP',
    accountId: record.accountId || '',
    paymentType: record.paymentType || '',
    recordType: type,
    recordState: record.recordState || '',
    labels,
    updatedAt: record.updatedAt || record.createdAt || ''
  };
}

async function walletFetch(pathname, token) {
  const response = await fetch(`https://rest.budgetbakers.com/wallet${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) return { ok: false, status: response.status, body };
  return {
    ok: true,
    status: response.status,
    body,
    headers: {
      rateLimit: response.headers.get('x-ratelimit-limit'),
      rateRemaining: response.headers.get('x-ratelimit-remaining'),
      syncInProgress: response.headers.get('x-sync-in-progress'),
      lastChangeAt: response.headers.get('x-last-data-change-at'),
      lastChangeRev: response.headers.get('x-last-data-change-rev')
    }
  };
}

async function syncWallet(request, env) {
  const token = env.WALLET_API_TOKEN || env.Token || env.TOKEN;
  if (!token) return json({ ok: false, error: 'missing_wallet_token' }, 500);

  const url = new URL(request.url);
  const allHistory = url.searchParams.get('all') === '1';
  let from = url.searchParams.get('from') || '';
  let to = url.searchParams.get('to') || '';
  const start = url.searchParams.get('start') || '2010-01-01';
  const end = url.searchParams.get('end') || new Date().toISOString().slice(0, 10);
  const max = Math.min(Number(url.searchParams.get('max') || 10000), 50000);
  const pageSize = 200;
  const records = [];
  const seen = new Set();
  let meta = {};

  if (from && to) {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T00:00:00Z`);
    const maxMs = 369 * 24 * 60 * 60 * 1000;
    if (Number.isFinite(fromDate.getTime()) && Number.isFinite(toDate.getTime()) && toDate - fromDate > maxMs) {
      from = new Date(toDate.getTime() - maxMs).toISOString().slice(0, 10);
    }
  }

  async function fetchRange(rangeFrom, rangeTo) {
    let offset = 0;
    while (records.length < max) {
      const params = new URLSearchParams();
      params.set('limit', String(Math.min(pageSize, max - records.length)));
      params.set('offset', String(offset));
      params.set('agentHints', 'true');
      if (rangeFrom) params.append('recordDate', `gte.${rangeFrom}`);
      if (rangeTo) params.append('recordDate', `lte.${rangeTo}`);

      const result = await walletFetch(`/v1/api/records?${params.toString()}`, token);
      if (!result.ok) return result;
      meta = result.headers;
      const page = Array.isArray(result.body.records) ? result.body.records : [];
      page.map(normalizeWalletRecord).forEach((record) => {
        if (!record.walletId || seen.has(record.walletId)) return;
        seen.add(record.walletId);
        records.push(record);
      });
      if (result.body.nextOffset === undefined || result.body.nextOffset === null || page.length === 0) break;
      offset = Number(result.body.nextOffset);
    }
    return { ok: true };
  }

  if (allHistory) {
    let cursor = new Date(`${start}T00:00:00Z`);
    const finalDate = new Date(`${end}T00:00:00Z`);
    while (cursor <= finalDate && records.length < max) {
      const chunkStart = cursor.toISOString().slice(0, 10);
      const chunkEndDate = new Date(cursor.getTime() + 359 * 24 * 60 * 60 * 1000);
      const chunkEnd = (chunkEndDate > finalDate ? finalDate : chunkEndDate).toISOString().slice(0, 10);
      const result = await fetchRange(chunkStart, chunkEnd);
      if (!result.ok) return json({ ok: false, error: 'wallet_api_error', detail: result.body }, result.status || 500);
      cursor = new Date(chunkEndDate.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    const result = await fetchRange(from, to);
    if (!result.ok) return json({ ok: false, error: 'wallet_api_error', detail: result.body }, result.status || 500);
  }

  return json({ ok: true, syncedAt: new Date().toISOString(), count: records.length, records, meta });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (url.pathname === '/api/wallet/sync') {
      return syncWallet(request, env);
    }

    if (url.pathname === '/') {
      const appUrl = new URL(request.url);
      appUrl.pathname = '/v2-wallet.html';
      return env.ASSETS.fetch(new Request(appUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};
