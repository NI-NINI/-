
export enum CheckStatus {
  UNCHECKED = 'UNCHECKED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  NA = 'NA'
}

export interface CheckItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: CheckStatus;
  remark: string;
}

export interface ProjectInfo {
  caseName: string;
  caseNumber: string;
  appraiser: string;
  valuationDate: string;
}

export interface CalculationData {
  preTotalSales: number;
  postTotalSales: number;
  preTotalCost: number;
  postTotalCost: number;
  preBuildingArea: number; // 容移前總建物面積 (銷坪比用)
  postBuildingArea: number; // 容移後總建物面積
  preSalesArea: number; // 容移前總銷售面積
  postSalesArea: number; // 容移後總銷售面積
}
