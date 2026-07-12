import { validateToken, getAccessToken, sendTemplateMessage } from '../_shared/wechat.ts';
import { convertToWechatTemplate, formatDomainCheckText } from '../_shared/templates.ts';
import type { DomainCheckRequest } from '../_shared/types.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!validateToken(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as DomainCheckRequest;

    if (!body.openid || !body.title || !body.data || !Array.isArray(body.data)) {
      return new Response(JSON.stringify({ error: 'Invalid request body. openid, title and data are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formattedText = formatDomainCheckText(body.title, body.data);
    console.log('域名检查数据:\n', formattedText);

    const accessToken = await getAccessToken();
    const templateData = convertToWechatTemplate(body.title, body.data);

    const templateId = Deno.env.get('WECHAT_TEMPLATE_ID')!;
    const result = await sendTemplateMessage(
      accessToken,
      body.openid,
      templateId,
      templateData
    );

    return new Response(JSON.stringify({
      success: true,
      message: '推送成功',
      msgid: result.msgid,
      text: formattedText,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('域名检查推送失败:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
