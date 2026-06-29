export enum UserRole {
  ROOT = 'root',
  ROOT2 = 'root2',
  PRODUCT_OWNER = 'product_owner',
  SALES = 'sales',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ROOT]: '部门总负责人',
  [UserRole.ROOT2]: '存续期负责人',
  [UserRole.PRODUCT_OWNER]: '产品负责人',
  [UserRole.SALES]: '销售人员',
};