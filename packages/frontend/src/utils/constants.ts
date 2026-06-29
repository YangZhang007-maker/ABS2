export const EVENT_TYPE_KNOWN_VALUES = ['establishment', 'payment', 'calculation'] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  establishment: '设立日',
  payment: '兑付日',
  calculation: '计算日',
  reminder: '提醒',
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  establishment: '#1890ff',
  payment: '#52c41a',
  calculation: '#fa8c16',
  '资产服务机构报告日': '#722ed1',
  '托管银行核算日': '#13c2c2',
  '差额支付启动日': '#eb2f96',
  '差额支付划款日': '#fa541c',
  '托管银行报告日': '#2f54eb',
  '管理人报告日': '#a0d911',
  '管理人分配日': '#faad14',
  '托管银行划款日': '#f5222d',
  '中基协备案': '#f0a050',
  '转付至托管户': '#40a9ff',
  reminder: '#f5222d',
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  establishment: '🏁',
  payment: '💰',
  calculation: '🧮',
  '资产服务机构报告日': '📊',
  '托管银行核算日': '🏦',
  '差额支付启动日': '▶️',
  '差额支付划款日': '💳',
  '托管银行报告日': '📋',
  '管理人报告日': '📝',
  '管理人分配日': '📤',
  '托管银行划款日': '🏧',
  '中基协备案': '🏛️',
  '转付至托管户': '↪️',
  reminder: '⏰',
};