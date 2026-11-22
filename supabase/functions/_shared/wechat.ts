import type { WechatTemplateData, WechatVerificationParams } from './types.ts';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from './sign.ts';

interface WechatTokenResponse {
  access_token?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatSendResponse {
  errcode: number;
  errmsg: string;
  msgid?: number;
}

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
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex === signature;
}

export async function handleWechatVerification(
  params: WechatVerificationParams
): Promise<string | null> {
  const { signature, timestamp, nonce, echostr } = params;

  const wechatToken = Deno.env.get('WECHAT_TOKEN');
  if (!wechatToken) {
    throw new Error('环境变量 WECHAT_TOKEN 未配置');
  }

  const isValid = await verifyWechatSignature(wechatToken, signature, timestamp, nonce);
  return isValid ? echostr : null;
}

export async function getAccessToken(): Promise<string> {
  const appId = Deno.env.get('WECHAT_APP_ID');
  const appSecret = Deno.env.get('WECHAT_APP_SECRET');
  if (!appId || !appSecret) {
    throw new Error('环境变量 WECHAT_APP_ID 或 WECHAT_APP_SECRET 未配置');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const response = await fetch(url);
  const data: WechatTokenResponse = await response.json();

  if (!data.access_token) {
    throw new Error(`获取access_token失败: ${data.errmsg ?? '未知错误'}`);
  }

  return data.access_token;
}

export async function sendTemplateMessage(
  accessToken: string,
  touser: string,
  templateId: string,
  data: WechatTemplateData,
  url?: string
): Promise<WechatSendResponse> {
  const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  const message = {
    touser,
    template_id: templateId,
    url,
    data,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(message),
  });

  const result: WechatSendResponse = await response.json();

  if (result.errcode !== 0) {
    throw new Error(`发送模板消息失败: ${result.errmsg}`);
  }

  return result;
}

/**
 * 旧鉴权：Authorization 头直接等于 WECHAT_API_TOKEN。
 * 保留给 auto-check-domain / auto-get-bz-info 等尚未迁移的调用方。
 */
export function validateToken(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiToken = Deno.env.get('WECHAT_API_TOKEN');
  if (!apiToken) {
    return false;
  }
  return authHeader === apiToken;
}

/**
 * 新鉴权：在本函数内部直接校验签名，不再请求 wx-reply。
 * 算法与 wx-reply 的 /sign 一致：md5(毫秒时间戳 + CRON_SECRET)，时间窗 ±60 秒。
 */
export function verifyRequestSignature(request: Request): boolean {
  const timestamp = request.headers.get(TIMESTAMP_HEADER);
  const signature = request.headers.get(SIGNATURE_HEADER);
  if (!timestamp || !signature) return false;

  const secret = Deno.env.get('CRON_SECRET');
  if (!secret) return false;

  return verifySignature(timestamp, signature, secret).valid;
}
