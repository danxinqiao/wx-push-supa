import type { WechatTemplateData, WechatVerificationParams } from './types.ts';

/**
 * 微信服务器配置验证 - 验证签名
 */
export async function verifyWechatSignature(
  token: string,
  signature: string,
  timestamp: string,
  nonce: string
): Promise<boolean> {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');

  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === signature;
}

/**
 * 处理微信服务器配置验证请求
 */
export async function handleWechatVerification(
  params: WechatVerificationParams
): Promise<string | null> {
  const { signature, timestamp, nonce, echostr } = params;

  const wechatToken = Deno.env.get('WECHAT_TOKEN')!;
  const isValid = await verifyWechatSignature(
    wechatToken,
    signature,
    timestamp,
    nonce
  );

  return isValid ? echostr : null;
}

/**
 * 获取微信access_token
 */
export async function getAccessToken(): Promise<string> {
  const appId = Deno.env.get('WECHAT_APP_ID')!;
  const appSecret = Deno.env.get('WECHAT_APP_SECRET')!;

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  const response = await fetch(url);
  const data = await response.json() as { access_token?: string; errcode?: number; errmsg?: string };

  if (!data.access_token) {
    throw new Error(`获取access_token失败: ${data.errmsg || '未知错误'}`);
  }

  return data.access_token;
}

/**
 * 发送模板消息
 */
export async function sendTemplateMessage(
  accessToken: string,
  touser: string,
  templateId: string,
  data: WechatTemplateData,
  url?: string
): Promise<{ errcode: number; errmsg: string; msgid?: number }> {
  const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  const message = {
    touser,
    template_id: templateId,
    url,
    data,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json() as { errcode: number; errmsg: string; msgid?: number };

  if (result.errcode !== 0) {
    throw new Error(`发送模板消息失败: ${result.errmsg}`);
  }

  return result;
}

/**
 * 验证Authorization token
 */
export function validateToken(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  return authHeader === Deno.env.get('API_TOKEN');
}
