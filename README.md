# wx-push

微信测试公众号信息推送 Supabase Edge Function 服务

## 项目结构

```
wx-push/
├── supabase/
│   ├── config.toml                     # Supabase 项目配置
│   ├── .env.local                      # 本地开发环境变量
│   └── functions/
│       ├── _shared/
│       │   ├── types.ts                # TypeScript 类型定义
│       │   ├── wechat.ts               # 微信 API 工具函数
│       │   └── templates.ts            # 模板处理
│       ├── wx-verify/
│       │   └── index.ts                # 微信服务器验证 (GET)
│       ├── domain-check/
│       │   └── index.ts                # 域名检查推送 (POST)
│       └── debug/
│           └── index.ts                # 调试接口 (GET)
├── package.json
└── tsconfig.json
```

## 配置说明

### 1. 安装 Supabase CLI

```bash
npm install
```

### 2. 登录 Supabase

```bash
npx supabase login
```

### 3. 配置环境变量（重要）

**⚠️ 注意：敏感信息不应在公开项目的代码中硬编码！**

#### 生产环境：使用 supabase secrets

```bash
npx supabase secrets set WECHAT_APP_ID=你的AppID
npx supabase secrets set WECHAT_APP_SECRET=你的AppSecret
npx supabase secrets set WECHAT_TEMPLATE_ID=你的模板ID
npx supabase secrets set WECHAT_TOKEN=你的Token
npx supabase secrets set API_TOKEN=你的API_TOKEN
```

#### 本地开发：编辑 `supabase/.env.local`

```bash
WECHAT_APP_ID=你的AppID
WECHAT_APP_SECRET=你的AppSecret
WECHAT_TEMPLATE_ID=你的模板ID
WECHAT_TOKEN=你的Token
API_TOKEN=你的API_TOKEN
```

### 4. 获取微信测试公众号信息

1. 访问 [微信公众平台测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandboxinfo)
2. 登录后获取 `appID` 和 `appsecret`
3. 创建模板消息，获取模板ID
4. 关注测试号二维码，获取接收用户的openid

### 5. 创建微信模板

在测试号管理页面创建模板，建议格式：

```
{{first.DATA}}
域名：{{keyword1.DATA}}
长度：{{keyword2.DATA}}
到期时间：{{keyword3.DATA}}
价格：{{keyword4.DATA}}
{{remark.DATA}}
```

## 部署

### 本地开发

```bash
npm run dev
```

### 部署到 Supabase

```bash
# 部署单个函数
npx supabase functions deploy wx-verify
npx supabase functions deploy domain-check
npx supabase functions deploy debug

# 或部署所有函数
npm run deploy
```

## 使用方法

### 微信服务器验证

配置微信后台时填写：
- **URL**: `https://你的项目id.supabase.co/functions/v1/wx-verify`
- **Token**: 与 `WECHAT_TOKEN` 环境变量设置的值完全一致

### 域名到期提醒

发送 POST 请求到 `/domain-check` 端点：

```bash
curl -X POST https://你的项目id.supabase.co/functions/v1/domain-check \
  -H "Authorization: 你的API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openid": "接收用户的openid",
    "title": "域名到期提醒",
    "data": [
      {"domain": "runben.top", "length": 6, "expire": "2036-03-20", "price": 104},
      {"domain": "shenfa.top", "length": 6, "expire": "2036-04-16", "price": 104},
      {"domain": "bawu.top", "length": 4, "expire": "2036-03-27", "price": 104}
    ]
  }'
```

### 响应示例

```json
{
  "success": true,
  "message": "推送成功",
  "msgid": 123456789,
  "text": "域名到期提醒--域名--长度--到期时间--价格(元)--runben.top--6--2036-03-20--104--shenfa.top--6--2036-04-16--104--bawu.top--4--2036-03-27--104"
}
```

### 调试接口

```bash
curl https://你的项目id.supabase.co/functions/v1/debug
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/functions/v1/wx-verify` | GET | 微信服务器验证 / 服务状态 |
| `/functions/v1/domain-check` | POST | 域名检查推送 |
| `/functions/v1/debug` | GET | 调试接口 |

## 添加新功能

1. 在 `supabase/functions/` 下创建新目录
2. 创建 `index.ts` 作为入口，使用 `Deno.serve()`
3. 共享代码放在 `supabase/functions/_shared/`
4. 部署：`npx supabase functions deploy 函数名`

### 示例

```typescript
// supabase/functions/new-function/index.ts
import { validateToken } from '../_shared/wechat.ts';

Deno.serve(async (req: Request) => {
  if (!validateToken(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 实现你的逻辑
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 注意事项

1. **openid 从请求参数获取**: 在请求中提供 `openid` 字段
2. **敏感信息使用 secrets**: 不要在代码中硬编码敏感信息
3. **Token 一致性**: `WECHAT_TOKEN` 必须与微信后台填写的 Token 完全一致
4. **API_TOKEN 验证**: 所有推送请求需要提供正确的 `Authorization` 头
5. **模板格式**: 微信模板消息需要根据实际创建的模板格式调整数据结构
6. **verify_jwt**: 默认关闭了 JWT 验证，如需开启请在 `supabase/config.toml` 中修改

## Secrets 管理

### 查看 Secrets

```bash
npx supabase secrets list
```

### 更新 Secret

```bash
npx supabase secrets set WECHAT_APP_ID=新的值
```
