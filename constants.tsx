
import { CheckItem, CheckStatus } from './types';

export const INITIAL_CHECKLIST: CheckItem[] = [
  // 版面格式
  { id: 'f-1', category: '版面格式', title: '字體規範', description: '內文14號字、表格10號字以上。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'f-2', category: '版面格式', title: '面積取位', description: '土地面積m2取2位/坪取4位；建物取2位。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'f-3', category: '版面格式', title: '金額進位', description: '單價取至千位、總價取至個位。採四捨五入。', status: CheckStatus.UNCHECKED, remark: '' },
  
  // 呈現次序
  { id: 'o-1', category: '呈現次序', title: '附件排序', description: '調整表->專案意見->公會意見->自主檢核->摘要表。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'o-2', category: '呈現次序', title: '版本標註', description: '初審版/修正版/審議會版標註是否正確。', status: CheckStatus.UNCHECKED, remark: '' },

  // 估價前提
  { id: 'p-1', category: '估價前提', title: '價格日期', description: '應為「都市設計審議送件日」。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'p-2', category: '估價前提', title: '勘察日期', description: '應在價格日期之前，且具時效性。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'p-3', category: '估價前提', title: '實設容積', description: '土開法面積應採「實設容積」而非基準容積。', status: CheckStatus.UNCHECKED, remark: '' },

  // 比較法
  { id: 'c-1', category: '比較法', title: '案例屋齡', description: '應採3年內新成屋，若無則須說明。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'c-2', category: '比較法', title: '成交日期', description: '應在價格日期前後1年內。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'c-3', category: '比較法', title: '車位拆算', description: '車位價格應與市場行情一致且單獨列示。', status: CheckStatus.UNCHECKED, remark: '' },

  // 土地開發分析法 (重點)
  { id: 'l-1', category: '土地開發分析', title: '開挖率限制', description: '地下室開挖率縮減幅度以10%為限(如70%->63%)。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'l-2', category: '土地開發分析', title: '利潤率', description: '113年常見規範：通常不得超過15%或依審議決定。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'l-3', category: '土地開發分析', title: '營造單價', description: '應參考台北市營造工料標準並考慮物價指數調整。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'l-4', category: '土地開發分析', title: '銷坪比一致性', description: '容移前後銷坪比原則應一致，如有變動須詳述理由。', status: CheckStatus.UNCHECKED, remark: '' },
  { id: 'l-5', category: '土地開發分析', title: '邏輯合理性', description: '[增量銷售 - 增量成本] > 0。', status: CheckStatus.UNCHECKED, remark: '' }
];
