import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
const STORAGE_KEY = "financial-planner-state";

function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return saved[key] !== undefined ? saved[key] : defaultValue;
    } catch { return defaultValue; }
  });
  const set = useCallback((v) => {
    setValue(v);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      saved[key] = v;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }, [key]);
  return [value, set];
}

/* ===================== HEADER ===================== */
function Header({ page, setPage }) {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}>
          Financial Planner
        </h1>
        <nav className="flex gap-1 bg-gray-900 rounded-xl p-1">
          {[
            { id: "house", label: "Kế hoạch mua nhà", icon: "🏠" },
            { id: "invest", label: "Phân bổ đầu tư", icon: "📊" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                page === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <span className="mr-1.5">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ===================== SLIDER ===================== */
function Slider({ label, value, set, min, max, step, unit, color = "#3b82f6" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">
          {typeof value === "number" ? fmt(value) : value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
        style={{ background: `linear-gradient(90deg, ${color} ${pct}%, #374151 ${pct}%)` }}
      />
    </div>
  );
}

/* ===================== HOUSE CALCULATOR ===================== */
function HouseCalculator() {
  const [price, setPrice] = usePersistedState("h_price", 4000);
  const [growth, setGrowth] = usePersistedState("h_growth", 6);
  const [savings, setSavings] = usePersistedState("h_savings", 60);
  const [monthly, setMonthly] = usePersistedState("h_monthly", 15);
  const [savRate, setSavRate] = usePersistedState("h_savRate", 5);
  const [downPct, setDownPct] = usePersistedState("h_downPct", 30);
  const [loanRate, setLoanRate] = usePersistedState("h_loanRate", 9);
  const [loanYears, setLoanYears] = usePersistedState("h_loanYears", 20);

  const data = useMemo(() => {
    const rows = [];
    let total = savings;
    for (let y = 1; y <= 10; y++) {
      for (let m = 0; m < 12; m++) {
        total += monthly;
        total *= 1 + savRate / 100 / 12;
      }
      const hp = price * Math.pow(1 + growth / 100, y);
      const dp = hp * (downPct / 100);
      const loan = hp - dp;
      const mr = loanRate / 100 / 12;
      const n = loanYears * 12;
      const mp = mr > 0 ? (loan * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) : loan / n;
      const totalPaid = mp * n;
      rows.push({
        year: y, totalSaved: total, housePrice: hp,
        downPayment: dp, canBuyFull: total >= hp,
        canBuyLoan: total >= dp, loanAmount: loan,
        monthlyPayment: mp, totalLoanPaid: totalPaid,
        surplus: total - hp, surplusDown: total - dp,
      });
    }
    return rows;
  }, [price, growth, savings, monthly, savRate, downPct, loanRate, loanYears]);

  const fullBuyYear = data.find((r) => r.canBuyFull);
  const loanBuyYear = data.find((r) => r.canBuyLoan);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}>
          Kế Hoạch Mua Nhà
        </h2>
        <p className="text-gray-400 text-sm">Tính toán thời gian & chi phí với các kịch bản khác nhau</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-xs font-semibold text-blue-400 mb-4 uppercase tracking-widest">Thông tin nhà</h3>
          <Slider label="Giá nhà hiện tại" value={price} set={setPrice} min={500} max={15000} step={100} unit="triệu" />
          <Slider label="Tăng giá / năm" value={growth} set={setGrowth} min={0} max={15} step={0.5} unit="%" />
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-xs font-semibold text-purple-400 mb-4 uppercase tracking-widest">Tích lũy của bạn</h3>
          <Slider label="Vốn hiện có" value={savings} set={setSavings} min={0} max={3000} step={10} unit="triệu" color="#a78bfa" />
          <Slider label="Tiết kiệm / tháng" value={monthly} set={setMonthly} min={1} max={50} step={1} unit="triệu" color="#a78bfa" />
          <Slider label="Lãi suất tiết kiệm" value={savRate} set={setSavRate} min={0} max={10} step={0.5} unit="%" color="#a78bfa" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6">
        <h3 className="text-xs font-semibold text-green-400 mb-4 uppercase tracking-widest">Kịch bản vay ngân hàng</h3>
        <div className="grid md:grid-cols-3 gap-x-6">
          <Slider label="Trả trước" value={downPct} set={setDownPct} min={10} max={50} step={5} unit="%" color="#22c55e" />
          <Slider label="Lãi suất vay" value={loanRate} set={setLoanRate} min={5} max={15} step={0.5} unit="%" color="#22c55e" />
          <Slider label="Kỳ hạn vay" value={loanYears} set={setLoanYears} min={5} max={30} step={1} unit="năm" color="#22c55e" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-2xl p-5 border ${fullBuyYear ? "bg-emerald-950/60 border-emerald-800" : "bg-red-950/40 border-red-900"}`}>
          <div className="text-sm text-gray-300 mb-2">🏠 Mua đứt (trả 100%)</div>
          {fullBuyYear ? (
            <>
              <div className="text-4xl font-bold text-emerald-400 mb-1">Năm thứ {fullBuyYear.year}</div>
              <p className="text-sm text-gray-400">
                Giá nhà: <span className="text-white">{fmt(fullBuyYear.housePrice)} tr</span> ·
                Tích lũy: <span className="text-emerald-300">{fmt(fullBuyYear.totalSaved)} tr</span>
              </p>
            </>
          ) : <div className="text-2xl font-bold text-red-400">Trên 10 năm</div>}
        </div>
        <div className={`rounded-2xl p-5 border ${loanBuyYear ? "bg-blue-950/60 border-blue-800" : "bg-red-950/40 border-red-900"}`}>
          <div className="text-sm text-gray-300 mb-2">🏦 Trả góp ({downPct}% trả trước)</div>
          {loanBuyYear ? (
            <>
              <div className="text-4xl font-bold text-blue-400 mb-1">Năm thứ {loanBuyYear.year}</div>
              <p className="text-sm text-gray-400">
                Trả trước: <span className="text-white">{fmt(loanBuyYear.downPayment)} tr</span> ·
                Góp/tháng: <span className="text-blue-300">{fmt(loanBuyYear.monthlyPayment)} tr</span>
              </p>
              <p className="text-sm text-yellow-500 mt-1">
                Tổng trả NH: {fmt(loanBuyYear.totalLoanPaid)} tr
                (gốc {fmt(loanBuyYear.loanAmount)} + lãi {fmt(loanBuyYear.totalLoanPaid - loanBuyYear.loanAmount)})
              </p>
            </>
          ) : <div className="text-2xl font-bold text-red-400">Trên 10 năm</div>}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-3 text-left">Năm</th>
              <th className="p-3 text-right">Tích lũy</th>
              <th className="p-3 text-right">Giá nhà</th>
              <th className="p-3 text-right">Cần trả trước</th>
              <th className="p-3 text-center">Mua đứt</th>
              <th className="p-3 text-center">Đủ vay</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.year} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                <td className="p-3 font-medium">Năm {r.year}</td>
                <td className="p-3 text-right font-mono text-blue-300">{fmt(r.totalSaved)}</td>
                <td className="p-3 text-right font-mono text-orange-300">{fmt(r.housePrice)}</td>
                <td className="p-3 text-right font-mono text-purple-300">{fmt(r.downPayment)}</td>
                <td className="p-3 text-center">
                  {r.canBuyFull ? <span className="text-emerald-400">✅</span> : <span className="text-red-400 font-mono text-xs">−{fmt(-r.surplus)}</span>}
                </td>
                <td className="p-3 text-center">
                  {r.canBuyLoan ? <span className="text-emerald-400">✅</span> : <span className="text-red-400 font-mono text-xs">−{fmt(-r.surplusDown)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        * Tính toán mang tính tham khảo. Lãi suất vay thực tế có thể thay đổi. Chưa tính phí công chứng, thuế, nội thất.
      </p>
    </div>
  );
}

/* ===================== INVESTMENT PORTFOLIO ===================== */
const INIT = [
  { name: "Tiết kiệm ngân hàng", amount: 7, color: "#22c55e", group: "A", risk: "Rất thấp", ret: "4-6%/năm", defRate: 5 },
  { name: "Quỹ trái phiếu", amount: 3, color: "#4ade80", group: "A", risk: "Thấp", ret: "6-8%/năm", defRate: 7 },
  { name: "Quỹ mở cổ phiếu / ETF", amount: 2.5, color: "#3b82f6", group: "B", risk: "Trung bình", ret: "10-15%/năm", defRate: 12 },
  { name: "Crypto (BTC + ETH)", amount: 3, color: "#f59e0b", group: "B", risk: "Cao", ret: "20-50%+", defRate: 25 },
  { name: "Altcoin / Đầu cơ", amount: 1, color: "#ef4444", group: "C", risk: "Rất cao", ret: "x2-x10 hoặc mất", defRate: 0 },
  { name: "Tự thưởng & phát triển", amount: 2, color: "#a78bfa", group: "D", risk: "—", ret: "—", defRate: 0 },
];

const groupInfo = {
  A: { label: "Nền móng mua nhà", color: "#22c55e" },
  B: { label: "Tăng trưởng dài hạn", color: "#3b82f6" },
  C: { label: "Đánh cược có tính toán", color: "#ef4444" },
  D: { label: "Cá nhân", color: "#a78bfa" },
};

function InvestmentPortfolio() {
  const [items, setItems] = usePersistedState("inv_items", INIT);
  const [showRates, setShowRates] = useState(false);
  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  const updateAmount = (idx, val) => {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, amount: Math.max(0, val) } : it)));
  };
  const updateRate = (idx, val) => {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, defRate: val } : it)));
  };

  const pieData = useMemo(() => items.filter((i) => i.amount > 0).map((i) => ({ ...i, value: i.amount })), [items]);

  const groups = useMemo(() => {
    const g = {};
    items.forEach((it) => {
      if (!g[it.group]) g[it.group] = { ...groupInfo[it.group], items: [], total: 0 };
      g[it.group].items.push(it);
      g[it.group].total += it.amount;
    });
    return g;
  }, [items]);

  const projections = useMemo(() => {
    const years = [1, 3, 5, 10];
    return years.map((y) => {
      let tv = 0;
      items.forEach((it) => {
        const r = it.defRate / 100;
        if (r <= 0 || it.amount <= 0) return;
        const mr = r / 12, n = y * 12;
        tv += it.amount * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr);
      });
      return { year: y, value: tv };
    });
  }, [items]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
          <p className="font-semibold text-white">{d.name}</p>
          <p className="text-gray-300">{fmt(d.amount * 1000000)} đ/tháng ({((d.amount / total) * 100).toFixed(0)}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #f59e0b)" }}>
          Phân Bổ Danh Mục Đầu Tư
        </h2>
        <p className="text-gray-400 text-sm">Tổng phân bổ: {fmt(total * 1000000)} đ/tháng · Kéo thanh trượt để điều chỉnh</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col items-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" animationDuration={500}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {items.filter((i) => i.amount > 0).map((it, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                {it.name}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(groups).map(([key, g]) => (
            <div key={key} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: g.color }}>{g.label}</h3>
                <span className="text-sm text-gray-400">{fmt(g.total * 1000000)} đ ({total > 0 ? ((g.total / total) * 100).toFixed(0) : 0}%)</span>
              </div>
              {g.items.map((it) => {
                const idx = items.indexOf(it);
                return (
                  <div key={idx} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{it.name}</span>
                      <span className="font-semibold" style={{ color: it.color }}>{it.amount} tr</span>
                    </div>
                    <input type="range" min={0} max={30} step={0.5} value={it.amount}
                      onChange={(e) => updateAmount(idx, Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(90deg, ${it.color} ${(it.amount / 30) * 100}%, #374151 ${(it.amount / 30) * 100}%)` }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Rủi ro: {it.risk}</span>
                      <span>Kỳ vọng: {it.ret}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Toggle custom rates */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Lãi suất kỳ vọng (cho dự phóng)</h3>
          <button onClick={() => setShowRates(!showRates)}
            className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
            {showRates ? "Ẩn" : "Tùy chỉnh"}
          </button>
        </div>
        {showRates && (
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            {items.filter((it) => it.group !== "D").map((it) => {
              const idx = items.indexOf(it);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{it.name}</span>
                    <span className="font-semibold" style={{ color: it.color }}>{it.defRate}%/năm</span>
                  </div>
                  <input type="range" min={0} max={50} step={1} value={it.defRate}
                    onChange={(e) => updateRate(idx, Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(90deg, ${it.color} ${(it.defRate / 50) * 100}%, #374151 ${(it.defRate / 50) * 100}%)` }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {!showRates && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {items.filter((it) => it.defRate > 0).map((it, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
                {it.name}: {it.defRate}%
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Projections */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
        <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-4">Dự phóng tài sản tích lũy (lãi kép)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {projections.map((p) => (
            <div key={p.year} className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">Sau {p.year} năm</div>
              <div className="text-xl md:text-2xl font-bold text-yellow-400">{fmt(Math.round(p.value))} tr</div>
              <div className="text-xs text-gray-500 mt-1">≈ {(p.value / 1000).toFixed(1)} tỷ</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          * Dự phóng dựa trên lãi kép DCA hàng tháng. Không bao gồm phần tự thưởng. Kết quả thực tế có thể khác biệt lớn.
        </p>
      </div>

      {/* Summary table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Tổng kết phân bổ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase">
                <th className="p-2 text-left">Kênh</th>
                <th className="p-2 text-right">Số tiền</th>
                <th className="p-2 text-right">Tỷ lệ</th>
                <th className="p-2 text-right">Rủi ro</th>
              </tr>
            </thead>
            <tbody>
              {items.filter((i) => i.amount > 0).map((it, i) => (
                <tr key={i} className="border-b border-gray-800/40">
                  <td className="p-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: it.color }} />
                    {it.name}
                  </td>
                  <td className="p-2 text-right font-mono">{it.amount} tr</td>
                  <td className="p-2 text-right font-mono">{total > 0 ? ((it.amount / total) * 100).toFixed(0) : 0}%</td>
                  <td className="p-2 text-right text-gray-400">{it.risk}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="p-2">Tổng</td>
                <td className="p-2 text-right font-mono">{total} tr</td>
                <td className="p-2 text-right">100%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN APP ===================== */
export default function App() {
  const [page, setPage] = useState("house");

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Header page={page} setPage={setPage} />
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {page === "house" ? <HouseCalculator /> : <InvestmentPortfolio />}
      </main>
      <footer className="text-center py-6 text-xs text-gray-600 border-t border-gray-800">
        Made with ❤️ ·{" "}
        <a href="https://github.com/ntdang20th/house-calculator" className="text-blue-500 hover:underline">GitHub</a>
      </footer>
    </div>
  );
}