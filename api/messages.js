import { list, put } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
  regions: ['hkg1']
};

const pathname = 'message-board/messages.json';
const maxMessages = 120;

const json = (response, status, payload) => {
  response.status(status);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(payload));
};

const readMessages = async () => {
  const result = await list({ prefix: pathname, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === pathname);
  if (!blob) return [];
  const response = await fetch(`${blob.url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return [];
  const value = await response.json();
  return Array.isArray(value) ? value.slice(-maxMessages) : [];
};

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      return json(response, 200, { messages: await readMessages() });
    } catch (error) {
      console.error('message board read failed', error);
      return json(response, 503, { error: '留言暂时无法读取，请稍后重试。' });
    }
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    if (body.website) return json(response, 201, { ok: true });

    const name = String(body.name || '').trim().slice(0, 24) || '匿名访客';
    const message = String(body.message || '').trim().slice(0, 500);
    if (!message) return json(response, 400, { error: '请先写下一句话。' });

    const messages = await readMessages();
    const item = {
      id: crypto.randomUUID(),
      name,
      message,
      createdAt: Date.now()
    };
    const nextMessages = [...messages, item].slice(-maxMessages);
    await put(pathname, JSON.stringify(nextMessages), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: 'application/json'
    });
    return json(response, 201, { ok: true, message: item });
  } catch (error) {
    console.error('message board write failed', error);
    return json(response, 503, { error: '留言暂时没有保存成功，请稍后重试。' });
  }
}
