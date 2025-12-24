
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CheckItem, CheckStatus, CalculationData, ProjectInfo } from './types';
import { INITIAL_CHECKLIST } from './constants';

const StatusBadge: React.FC<{ status: CheckStatus }> = ({ status }) => {
  const styles = {
    [CheckStatus.UNCHECKED]: 'bg-slate-100 text-slate-500 border-slate-200',
    [CheckStatus.PASSED]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    [CheckStatus.FAILED]: 'bg-rose-50 text-rose-600 border-rose-200',
    [CheckStatus.NA]: 'bg-slate-200 text-slate-500 border-slate-300',
  };
  const labels = {
    [CheckStatus.UNCHECKED]: '未檢',
    [CheckStatus.PASSED]: '符合',
    [CheckStatus.FAILED]: '不符',
    [CheckStatus.NA]: 'N/A',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const App: React.FC = () => {
  // --- State & Initialization ---
  const [checklist, setChecklist] = useState<CheckItem[]>(() => {
    const saved = localStorage.getItem('valuation-checklist');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
  });

  const [project, setProject] = useState<ProjectInfo>(() => {
    const saved = localStorage.getItem('valuation-project');
    return saved ? JSON.parse(saved) : { caseName: '', caseNumber: '', appraiser: '', valuationDate: '' };
  });

  const [calcData, setCalcData] = useState<CalculationData>(() => {
    const saved = localStorage.getItem('valuation-calc');
    return saved ? JSON.parse(saved) : {
      preTotalSales: 0, postTotalSales: 0,
      preTotalCost: 0, postTotalCost: 0,
      preBuildingArea: 1, postBuildingArea: 1,
      preSalesArea: 0, postSalesArea: 0
    };
  });

  const [activeTab, setActiveTab] = useState<string>('all');
  const [geminiResult, setGeminiResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Effects (Persistence) ---
  useEffect(() => {
    localStorage.setItem('valuation-checklist', JSON.stringify(checklist));
    localStorage.setItem('valuation-project', JSON.stringify(project));
    localStorage.setItem('valuation-calc', JSON.stringify(calcData));
  }, [checklist, project, calcData]);

  // --- Logic Computations ---
  const analysis = useMemo(() => {
    const deltaSales = calcData.postTotalSales - calcData.preTotalSales;
    const deltaCost = calcData.postTotalCost - calcData.preTotalCost;
    const preRatio = (calcData.preSalesArea / (calcData.preBuildingArea || 1)) * 100;
    const postRatio = (calcData.postSalesArea / (calcData.postBuildingArea || 1)) * 100;
    const ratioDiff = Math.abs(preRatio - postRatio);
    
    return {
      isProfitValid: deltaSales > deltaCost,
      isRatioConsistent: ratioDiff < 0.1, // 差異小於0.1%視為一致
      preRatio: preRatio.toFixed(2),
      postRatio: postRatio.toFixed(2),
      deltaVal: deltaSales - deltaCost
    };
  }, [calcData]);

  const stats = useMemo(() => ({
    total: checklist.length,
    completed: checklist.filter(i => i.status !== CheckStatus.UNCHECKED).length,
    failed: checklist.filter(i => i.status === CheckStatus.FAILED).length,
  }), [checklist]);

  // --- Handlers ---
  const toggleStatus = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const sequence = [CheckStatus.UNCHECKED, CheckStatus.PASSED, CheckStatus.FAILED, CheckStatus.NA];
        const next = sequence[(sequence.indexOf(item.status) + 1) % sequence.length];
        return { ...item, status: next };
      }
      return item;
    }));
  };

  const askAI = async (q: string) => {
    setIsAnalyzing(true);
    setGeminiResult('正在查詢 113 年最新規範...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位專精於台北市容積代金估價的資深估價師。請依據 113 年修正版範本回答：${q}`,
        config: { systemInstruction: "回答請保持專業、精確，並指出具體範本頁碼或條款。如果是關於地下室、銷坪比或開挖率，請特別強調 113 年的新舊差異。" }
      });
      setGeminiResult(resp.text || '無結果');
    } catch (e) {
      setGeminiResult('連線失敗，請檢查網路。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(INITIAL_CHECKLIST.map(i => i.category)))];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-slate-300 p-6 flex flex-col h-auto lg:h-screen lg:fixed">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-stamp text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-white text-base">估價報告智慧檢核</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">113 TPE VOL PREMIUM</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-bold text-slate-500 mb-2 block tracking-widest">檢核進度</label>
          <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>已核 {stats.completed} / {stats.total}</span>
            <span className={stats.failed > 0 ? 'text-rose-400 font-bold' : ''}>異常: {stats.failed}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex justify-between items-center ${
                activeTab === cat ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{cat === 'all' ? '全部項目' : cat}</span>
              {activeTab === cat && <i className="fa-solid fa-chevron-right text-[10px]"></i>}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={() => { if(confirm('確定要清空所有資料嗎？')) { localStorage.clear(); location.reload(); } }}
            className="w-full text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-trash-can"></i> 重置專案資料
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-10 pb-32">
        
        {/* Project Header */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">案件名稱</label>
            <input 
              className="w-full bg-slate-50 border-none focus:ring-2 ring-indigo-500 rounded-lg p-2 text-sm" 
              value={project.caseName} onChange={e => setProject({...project, caseName: e.target.value})}
              placeholder="例如：臺北市XX區XX段..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">案號</label>
            <input 
              className="w-full bg-slate-50 border-none focus:ring-2 ring-indigo-500 rounded-lg p-2 text-sm" 
              value={project.caseNumber} onChange={e => setProject({...project, caseNumber: e.target.value})}
              placeholder="113-XXX-001"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">主辦估價師</label>
            <input 
              className="w-full bg-slate-50 border-none focus:ring-2 ring-indigo-500 rounded-lg p-2 text-sm" 
              value={project.appraiser} onChange={e => setProject({...project, appraiser: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">價格日期</label>
            <input 
              className="w-full bg-slate-50 border-none focus:ring-2 ring-indigo-500 rounded-lg p-2 text-sm" 
              value={project.valuationDate} onChange={e => setProject({...project, valuationDate: e.target.value})}
              placeholder="113/01/01"
            />
          </div>
        </section>

        {/* Dynamic Analysis Cards */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Logic Calculator */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <i className="fa-solid fa-calculator text-slate-100 text-6xl rotate-12"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              核心數值與邏輯檢核
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 relative z-10">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded">容移前 (Pre-Transfer)</h4>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-500">總銷售額</span>
                  <input type="number" className="w-32 border-slate-200 rounded p-1 text-sm text-right" value={calcData.preTotalSales} onChange={e => setCalcData({...calcData, preTotalSales: +e.target.value})} />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-500">總造價</span>
                  <input type="number" className="w-32 border-slate-200 rounded p-1 text-sm text-right" value={calcData.preTotalCost} onChange={e => setCalcData({...calcData, preTotalCost: +e.target.value})} />
                </div>
                <div className="flex justify-between items-center gap-4 border-t pt-2">
                  <span className="text-xs text-slate-400 italic">銷坪比 (銷/建)</span>
                  <div className="flex gap-2">
                    <input placeholder="銷" type="number" className="w-16 border-slate-100 rounded p-1 text-xs" value={calcData.preSalesArea} onChange={e => setCalcData({...calcData, preSalesArea: +e.target.value})} />
                    <input placeholder="建" type="number" className="w-16 border-slate-100 rounded p-1 text-xs" value={calcData.preBuildingArea} onChange={e => setCalcData({...calcData, preBuildingArea: +e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-500 bg-emerald-50 inline-block px-2 py-1 rounded">容移後 (Post-Transfer)</h4>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-500">總銷售額</span>
                  <input type="number" className="w-32 border-slate-200 rounded p-1 text-sm text-right" value={calcData.postTotalSales} onChange={e => setCalcData({...calcData, postTotalSales: +e.target.value})} />
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-500">總造價</span>
                  <input type="number" className="w-32 border-slate-200 rounded p-1 text-sm text-right" value={calcData.postTotalCost} onChange={e => setCalcData({...calcData, postTotalCost: +e.target.value})} />
                </div>
                <div className="flex justify-between items-center gap-4 border-t pt-2">
                  <span className="text-xs text-slate-400 italic">銷坪比 (銷/建)</span>
                  <div className="flex gap-2">
                    <input placeholder="銷" type="number" className="w-16 border-slate-100 rounded p-1 text-xs" value={calcData.postSalesArea} onChange={e => setCalcData({...calcData, postSalesArea: +e.target.value})} />
                    <input placeholder="建" type="number" className="w-16 border-slate-100 rounded p-1 text-xs" value={calcData.postBuildingArea} onChange={e => setCalcData({...calcData, postBuildingArea: +e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${analysis.isProfitValid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">增量收益邏輯</p>
                  <p className={`text-sm font-bold ${analysis.isProfitValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {analysis.isProfitValid ? '符合 (收益 > 成本)' : '異常 (收益 < 成本)'}
                  </p>
                </div>
                <i className={`fa-solid ${analysis.isProfitValid ? 'fa-check-circle text-emerald-500' : 'fa-triangle-exclamation text-rose-500'} text-xl`}></i>
              </div>
              
              <div className={`p-4 rounded-xl border flex items-center justify-between ${analysis.isRatioConsistent ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">銷坪比一致性</p>
                  <p className="text-sm font-bold text-slate-700">
                    {analysis.preRatio}% → {analysis.postRatio}%
                  </p>
                </div>
                <i className={`fa-solid ${analysis.isRatioConsistent ? 'fa-link text-emerald-500' : 'fa-link-slash text-amber-500'} text-xl`}></i>
              </div>
            </div>
          </div>

          {/* AI Consultant */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              AI 法規顧問
            </h3>
            <div className="space-y-2 mb-4">
              <button onClick={() => askAI("請列出113年版關於地下室開挖率變動的審議規則")} className="w-full text-left p-2 rounded bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors">開挖率變動規則</button>
              <button onClick={() => askAI("容積代金評估時，土地開發分析法的利潤率取值標準？")} className="w-full text-left p-2 rounded bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors">利潤率取值標準</button>
              <button onClick={() => askAI("比較案例如果找不到3年內新成屋，該如何處理？")} className="w-full text-left p-2 rounded bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors">案例屋齡例外處理</button>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4 text-[13px] text-slate-300 leading-relaxed overflow-y-auto font-light whitespace-pre-line border border-white/5">
              {geminiResult || "隨時點擊上方按鈕或在下方輸入問題諮詢 AI..."}
            </div>
          </div>
        </section>

        {/* Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32">分類</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">檢核規範與要點</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">結果</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">估價師備註</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {checklist
                .filter(i => activeTab === 'all' || i.category === activeTab)
                .map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded leading-none uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <h5 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h5>
                    <p className="text-xs text-slate-500 font-light">{item.description}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => toggleStatus(item.id)} className="transition-transform active:scale-90">
                      <StatusBadge status={item.status} />
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <input 
                      type="text" 
                      placeholder="點擊輸入備註..." 
                      className="w-full bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-300 text-slate-600"
                      value={item.remark}
                      onChange={e => setChecklist(prev => prev.map(i => i.id === item.id ? {...i, remark: e.target.value} : i))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Floating AI Input */}
        <div className="fixed bottom-8 right-8 z-50">
          <div className="flex items-center bg-white rounded-2xl shadow-2xl border border-indigo-100 p-1 pl-4 md:w-96">
            <input 
              type="text" 
              placeholder="輸入問題，AI 為您解惑..." 
              className="flex-1 border-none focus:ring-0 text-sm bg-transparent"
              onKeyDown={e => e.key === 'Enter' && askAI(e.currentTarget.value)}
            />
            <button 
              onClick={(e) => askAI((e.currentTarget.previousElementSibling as HTMLInputElement).value)}
              className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
            >
              {isAnalyzing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane text-xs"></i>}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
