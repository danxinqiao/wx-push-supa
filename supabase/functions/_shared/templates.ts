import type { WechatTemplateData, DomainCheckItem } from './types.ts';

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
