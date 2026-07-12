/**
 * 微信模板消息数据项
 */
export interface WechatTemplateDataItem {
  value: string;
  color?: string;
}

/**
 * 微信模板消息数据
 */
export interface WechatTemplateData {
  [key: string]: WechatTemplateDataItem;
}

/**
 * 微信发送模板消息请求
 */
export interface WechatTemplateMessage {
  touser: string;
  template_id: string;
  url?: string;
  data: WechatTemplateData;
}

/**
 * 域名检查数据项
 */
export interface DomainCheckItem {
  domain: string;
  length: number;
  expire: string;
  price: number;
}

/**
 * 域名检查请求
 */
export interface DomainCheckRequest {
  openid: string;
  title: string;
  data: DomainCheckItem[];
}

/**
 * 微信服务器配置验证请求参数
 */
export interface WechatVerificationParams {
  signature: string;
  timestamp: string;
  nonce: string;
  echostr: string;
}
