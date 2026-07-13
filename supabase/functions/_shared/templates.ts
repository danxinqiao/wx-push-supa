import type { WechatTemplateData, DomainCheckItem, BilibiliPushItem } from './types.ts';

/**
 * 格式化域名检查数据为文本（供日志使用）
 */
export function formatDomainCheckText(title: string, items: DomainCheckItem[]): string {
  const rows = items.map(item =>
    `${item.domain}--${item.length}--${item.expire}--${item.price}`
  );
  return `${title}--域名--长度--到期时间--价格(元)--${rows.join('--')}`;
}

/**
 * 将域名检查数据转换为微信模板消息格式
 */
export function convertToWechatTemplate(
  title: string,
  items: DomainCheckItem[]
): WechatTemplateData {
  const data: WechatTemplateData = {
    title: {
      value: '域名--长度--到期时间--价格(元)',
      color: '#173177',
    },
  };

  for (let i = 1; i <= 5; i++) {
    const item = items[i - 1];
    data[`domain${i}`] = {
      value: item
        ? `${item.domain}--${item.length}--${item.expire}--${item.price}`
        : '',
      color: '#333333',
    };
  }

  return data;
}

/**
 * 将 B 站推送数据转换为微信模板消息格式
 * text 内容按 20 个字符分片，分别放入 text1、text2...
 */
export function convertToBilibiliTemplate(item: BilibiliPushItem): WechatTemplateData {
  const data: WechatTemplateData = {
    name: {
      value: item.name,
      color: '#173177',
    },
  };

  // 每 20 个字符分一段
  const text = item.text;
  for (let i = 0; i < text.length; i += 20) {
    const chunk = text.slice(i, i + 20);
    const key = `text${Math.floor(i / 20) + 1}`;
    data[key] = {
      value: chunk,
      color: '#333333',
    };
  }

  return data;
}
