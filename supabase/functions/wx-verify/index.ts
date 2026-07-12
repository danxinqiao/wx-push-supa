import { handleWechatVerification } from '../_shared/wechat.ts';
import type { WechatVerificationParams } from '../_shared/types.ts';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const signature = url.searchParams.get('signature');
    const timestamp = url.searchParams.get('timestamp');
    const nonce = url.searchParams.get('nonce');
    const echostr = url.searchParams.get('echostr');

    if (signature && timestamp && nonce && echostr) {
      const params: WechatVerificationParams = {
        signature,
        timestamp,
        nonce,
        echostr,
      };

      try {
        const result = await handleWechatVerification(params);

        if (result) {
          console.log('微信服务器配置验证成功');
          return new Response(result, { status: 200 });
        } else {
          console.error('微信服务器配置验证失败: 签名不匹配');
          return new Response('验证失败', { status: 403 });
        }
      } catch (error) {
        console.error('微信服务器配置验证错误:', error);
        return new Response('验证错误', { status: 500 });
      }
    }

    return new Response(JSON.stringify({
      status: 'ok',
      message: '微信推送服务运行正常',
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
});
