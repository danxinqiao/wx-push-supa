import { getAccessToken } from '../_shared/wechat.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const appId = Deno.env.get('WECHAT_APP_ID')!;
    const appSecret = Deno.env.get('WECHAT_APP_SECRET')!;
    const templateId = Deno.env.get('WECHAT_TEMPLATE_ID')!;

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json() as any;

    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ step: 'get_token', error: tokenData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const testData = {
      touser: 'oUPTI2yAIBpKK_YkxHttqSc7TYiw',
      template_id: templateId,
      data: {
        title: { value: '测试标题' },
        content: { value: '测试内容：如果你能看到这条消息，说明模板配置正确！' }
      },
    };

    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${tokenData.access_token}`;
    const sendRes = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(testData),
    });
    const sendData = await sendRes.json() as any;

    return new Response(JSON.stringify({
      template_id_used: templateId,
      request_body: testData,
      wechat_response: sendData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
