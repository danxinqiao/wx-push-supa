/**
 * Upstash Redis 工具函数
 * 用于通过 REST API 操作 Redis
 */

const UPSTASH_URL = 'https://supreme-mackerel-128896.upstash.io';

function getToken(): string {
  const token = Deno.env.get('UPSTASH_REDIS_TOKEN');
  if (!token) {
    throw new Error('环境变量 UPSTASH_REDIS_TOKEN 未配置');
  }
  return token;
}

/**
 * 获取 Redis 中指定 key 的值
 */
export async function redisGet(key: string): Promise<string | null> {
  const token = getToken();
  const url = `${UPSTASH_URL}/get/${key}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Upstash GET 失败: ${response.status}`);
  }

  const data = await response.json() as { result: string | null };
  return data.result;
}

/**
 * 设置 Redis 中指定 key 的值
 */
export async function redisSet(key: string, value: string): Promise<void> {
  const token = getToken();
  const url = `${UPSTASH_URL}/set/${key}/${value}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Upstash SET 失败: ${response.status}`);
  }
}
