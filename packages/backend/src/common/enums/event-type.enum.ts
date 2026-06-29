export enum EventType {
  ESTABLISHMENT = 'establishment',
  PAYMENT = 'payment',
  CALCULATION = 'calculation',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.ESTABLISHMENT]: '设立日',
  [EventType.PAYMENT]: '兑付日',
  [EventType.CALCULATION]: '计算日',
};