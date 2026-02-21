import { useState, useMemo } from "react";

const fmt = (n) => Math.round(n).toLocaleString("vi-VN");

function Slider({ label, value, set, min, max, step, unit }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">
          {typeof value === "number" ? fmt(value) : value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, #3b82f6 0%, #8b5cf6 ${pct}%, #374151 ${pct}%, #374151 100%)`
        }}
      />
    </div>
  );
}

export default function App() {
  const [price, setPrice] = useState(4000);
  const [growth, setGrowth] = useState(6);
  const [savings, setSavings] = useState(60);
  const [monthly, setMonthly] = useState(15);
  const [savRate, setSavRate] = useState(5);
  const [downPct, setDownPct] = useState(30);
  const [loanRate, setLoanRate] = useState(9);
  const [loanYears, setLoanYears] = useState(20);

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
      const mp = mr > 0
        ? (loan * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1)
        : loan / n;
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
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 max-w-5xl mx-auto" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}>
          Kế Hoạch Mua Nhà
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          Tính toán thời gian & chi phí với các kịch bản khác nhau
        </p>
      </header>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xs font-semibold text-blue-400 mb-4 uppercase tracking-widest">
            Thông tin nhà
          </h2>
          <Slider label="Giá nhà hiện tại" value={price} set={setPrice} min={500} max={15000} step={100} unit="triệu" />
          <Slider label="Tăng giá / năm" value={growth} set={setGrowth} min={0} max={15} step={0.5} unit="%" />
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xs font-semibold text-purple-400 mb-4 uppercase tracking-widest">
            Tích lũy của bạn
          </h2>
          <Slider label="Vốn hiện có" value={savings} set={setSavings} min={0} max={3000} step={10} unit="triệu" />
          <Slider label="Tiết kiệm / tháng" value={monthly} set={setMonthly} min={1} max={50} step={1} unit="triệu" />
          <Slider label="Lãi suất tiết kiệm" value={savRate} set={setSavRate} min={0} max={10} step={0.5} unit="%" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6">
        <h2 className="text-xs font-semibold text-green-400 mb-4 uppercase tracking-widest">
          Kịch bản vay ngân hàng
        </h2>
        <div className="grid md:grid-cols-3 gap-x-6">
          <Slider label="Trả trước" value={downPct} set={setDownPct} min={10} max={50} step={5} unit="%" />
          <Slider label="Lãi suất vay" value={loanRate} set={setLoanRate} min={5} max={15} step={0.5} unit="%" />
          <Slider label="Kỳ hạn vay" value={loanYears} set={setLoanYears} min={5} max={30} step={1} unit="năm" />
        </div>
      </div>

      {/* Summary Cards */}
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
          ) : (
            <div className="text-2xl font-bold text-red-400">Trên 10 năm</div>
          )}
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
          ) : (
            <div className="text-2xl font-bold text-red-400">Trên 10 năm</div>
          )}
        </div>
      </div>

      {/* Timeline Table */}
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

      {/* Footer */}
      <footer className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          * Tính toán mang tính tham khảo. Lãi suất vay thực tế có thể thay đổi. Chưa tính phí công chứng, thuế, nội thất.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Made with ❤️ · <a href="https://github.com/YOUR_USERNAME/house-calculator" className="text-blue-500 hover:underline">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
