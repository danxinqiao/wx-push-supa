import { handleWechatVerification, validateToken, getAccessToken, sendTemplateMessage } from '../_shared/wechat.ts';
import { convertToWechatTemplate, formatDomainCheckText } from '../_shared/templates.ts';
import type { WechatVerificationParams, DomainCheckRequest } from '../_shared/types.ts';

interface WechatTokenResponse {
  access_token?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatDebugSendResponse {
  errcode: number;
  errmsg: string;
  msgid?: number;
}

const FN_NAME = 'wx-push';

const JSON_HEADER = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADER });
}

function stripFunctionPrefix(pathname: string): string {
  let path = pathname.replace(/\/+$/, '');
  if (path.startsWith(`/${FN_NAME}/`)) {
    path = path.slice(FN_NAME.length + 1);
  } else if (path === `/${FN_NAME}`) {
    path = '/';
  }
  if (path === '') path = '/';
  return path;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = stripFunctionPrefix(url.pathname);

  // GET / - 微信服务器验证 / 服务状态
  if (path === '/') {
    if (req.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const signature = url.searchParams.get('signature');
    const timestamp = url.searchParams.get('timestamp');
    const nonce = url.searchParams.get('nonce');
    const echostr = url.searchParams.get('echostr');

    if (signature && timestamp && nonce && echostr) {
      const params: WechatVerificationParams = { signature, timestamp, nonce, echostr };
      try {
        const result = await handleWechatVerification(params);
        if (result) {
          console.log('微信服务器配置验证成功');
          return new Response(result, { status: 200 });
        }
        console.error('微信服务器配置验证失败: 签名不匹配');
        return new Response('验证失败', { status: 403 });
      } catch (error) {
        console.error('微信服务器配置验证错误:', error);
        return new Response('验证错误', { status: 500 });
      }
    }

    return jsonResponse({
      status: 'ok',
      message: '微信推送服务运行正常',
      timestamp: new Date().toISOString(),
    });
  }

  // POST /domain-check - 域名检查推送
  if (path === '/domain-check') {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!validateToken(req)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    try {
      const body: DomainCheckRequest = await req.json();

      if (!body.openid || !body.title || !body.data || !Array.isArray(body.data)) {
        return jsonResponse({ error: 'Invalid request body. openid, title and data are required' }, 400);
      }

      const formattedText = formatDomainCheckText(body.title, body.data);
      console.log('域名检查数据:\n', formattedText);

      const accessToken = await getAccessToken();
      const templateData = convertToWechatTemplate(body.title, body.data);
      const templateId = Deno.env.get('WECHAT_TEMPLATE_ID');
      if (!templateId) {
        return jsonResponse({ error: '环境变量 WECHAT_TEMPLATE_ID 未配置' }, 500);
      }

      const result = await sendTemplateMessage(accessToken, body.openid, templateId, templateData);

      return jsonResponse({
        success: true,
        message: '推送成功',
        msgid: result.msgid,
        text: formattedText,
      });
    } catch (error) {
      console.error('域名检查推送失败:', error);
      return jsonResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  }

  // GET /debug - 调试接口
  if (path === '/debug') {
    try {
      const appId = Deno.env.get('WECHAT_APP_ID');
      const appSecret = Deno.env.get('WECHAT_APP_SECRET');
      const templateId = Deno.env.get('WECHAT_TEMPLATE_ID');
      if (!appId || !appSecret || !templateId) {
        return jsonResponse({ error: '微信环境变量未配置' }, 500);
      }

      const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData: WechatTokenResponse = await tokenRes.json();

      if (!tokenData.access_token) {
        return jsonResponse({ step: 'get_token', error: tokenData });
      }

      const testData = {
        touser: 'oUPTI2yAIBpKK_YkxHttqSc7TYiw',
        template_id: templateId,
        data: {
          title: { value: '测试标题' },
          content: { value: '测试内容：如果你能看到这条消息，说明模板配置正确！' },
        },
      };

      const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${tokenData.access_token}`;
      const sendRes = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(testData),
      });
      const sendData: WechatDebugSendResponse = await sendRes.json();

      return jsonResponse({
        template_id_used: templateId,
        request_body: testData,
        wechat_response: sendData,
      });
    } catch (error) {
      return jsonResponse({
        error: error instanceof Error ? error.message : 'Unknown',
      }, 500);
    }
  }

  return jsonResponse({ error: 'Not Found' }, 404);
});
