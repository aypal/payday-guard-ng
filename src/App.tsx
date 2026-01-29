import { useMemo, useState, useEffect } from "react";

interface Expense {
  id: number;
  name: string;
  amount: number;
}

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const initialExpenses: Expense[] = [
  { id: 1, name: "Rent (House)", amount: 250000 },
  { id: 2, name: "Data/Internet", amount: 25000 },
  { id: 3, name: "Transport (Fuel/Transport)", amount: 40000 },
  { id: 4, name: "Food & Groceries", amount: 80000 },
  { id: 5, name: "Electricity", amount: 15000 },
];

// Ad data for Nigerian market
const adData = [
  { id: 1, title: "MTN Data Bundle", description: "Get 5GB for ₦1,500", cta: "Buy Now", bgColor: "bg-yellow-500" },
  { id: 2, title: "Paystack", description: "Accept payments online", cta: "Sign Up", bgColor: "bg-purple-600" },
  { id: 3, title: "Cowrywise", description: "Save smarter, earn more", cta: "Start Saving", bgColor: "bg-green-600" },
  { id: 4, title: "Jumia Food", description: "Get 20% off your first order", cta: "Order Now", bgColor: "bg-orange-500" },
];

// Helper for local storage
const getStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export function App() {
  const toNumber = (value: string, fallback = 0) => {
    const trimmed = value.trim();
    if (trimmed === "") return fallback;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : fallback;
  };
  // Initialize state from local storage or defaults
  // Store number inputs as strings so the user can clear the field (""), then parse safely for calculations.
  const [salaryInput, setSalaryInput] = useState<string>(() => String(getStorage("pg_salary", 350000)));
  const [cycleDaysInput, setCycleDaysInput] = useState<string>(() => String(getStorage("pg_cycleDays", 30)));
  const [lastPayday, setLastPayday] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() - 12);
    const defaultDate = today.toISOString().slice(0, 10);
    return getStorage("pg_lastPayday", defaultDate);
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => getStorage("pg_expenses", initialExpenses));
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  
  const [savingsGoalInput, setSavingsGoalInput] = useState<string>(() => String(getStorage("pg_savingsGoal", 100000)));
  const [emergencyFundInput, setEmergencyFundInput] = useState<string>(() => String(getStorage("pg_emergencyFund", 50000)));
  const [bettingBudgetInput, setBettingBudgetInput] = useState<string>(() => String(getStorage("pg_bettingBudget", 5000)));
  const [allowanceInput, setAllowanceInput] = useState<string>(() => String(getStorage("pg_allowance", 20000)));

  // Ad visibility state
  const [showAd, setShowAd] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const salary = useMemo(() => toNumber(salaryInput, 0), [salaryInput]);
  const cycleDays = useMemo(() => Math.max(1, toNumber(cycleDaysInput, 30)), [cycleDaysInput]);
  const savingsGoal = useMemo(() => toNumber(savingsGoalInput, 0), [savingsGoalInput]);
  const emergencyFund = useMemo(() => toNumber(emergencyFundInput, 0), [emergencyFundInput]);
  const bettingBudget = useMemo(() => toNumber(bettingBudgetInput, 0), [bettingBudgetInput]);
  const allowance = useMemo(() => toNumber(allowanceInput, 0), [allowanceInput]);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("pg_salary", JSON.stringify(salary));
    localStorage.setItem("pg_cycleDays", JSON.stringify(cycleDays));
    localStorage.setItem("pg_lastPayday", JSON.stringify(lastPayday));
    localStorage.setItem("pg_expenses", JSON.stringify(expenses));
    localStorage.setItem("pg_savingsGoal", JSON.stringify(savingsGoal));
    localStorage.setItem("pg_emergencyFund", JSON.stringify(emergencyFund));
    localStorage.setItem("pg_bettingBudget", JSON.stringify(bettingBudget));
    localStorage.setItem("pg_allowance", JSON.stringify(allowance));
  }, [salary, cycleDays, lastPayday, expenses, savingsGoal, emergencyFund, bettingBudget, allowance]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset everything for a new month? This will clear all current settings.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses]
  );

  const totalCommitments = useMemo(
    () => totalExpenses + savingsGoal + emergencyFund + bettingBudget + allowance,
    [totalExpenses, savingsGoal, emergencyFund, bettingBudget, allowance]
  );

  const disposable = Math.max(salary - totalCommitments, 0);

  const daysLeft = useMemo(() => {
    if (!lastPayday) return cycleDays;
    const last = new Date(lastPayday);
    if (Number.isNaN(last.getTime())) return cycleDays;
    const next = new Date(last);
    next.setDate(last.getDate() + cycleDays);
    const diff = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [lastPayday, cycleDays]);

  const dailyBudget = daysLeft ? disposable / daysLeft : 0;

  const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || Number.isNaN(amount) || amount <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: Date.now(), name: expenseName.trim(), amount },
    ]);
    setExpenseName("");
    setExpenseAmount("");
  };

  const handleRemoveExpense = (id: number) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const cycleAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % adData.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Ad Banner */}
      {showAd && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-2 px-4 shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-400/30 px-1.5 rounded">
                Ad
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="font-semibold text-sm">{adData[currentAdIndex].title}</span>
                <span className="text-xs text-slate-300 hidden sm:inline">•</span>
                <span className="text-xs text-slate-300">
                  {adData[currentAdIndex].description}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cycleAd}
                className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold transition hover:bg-white/20"
              >
                Next
              </button>
              <button
                onClick={() => setShowAd(false)}
                className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold transition hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <section className="flex flex-1 flex-col gap-6">
          <header className="rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.3em] text-green-100 font-bold">
                🇳🇬 Payday Guard NG
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Your Naira Salary Safety Cockpit
              </h1>
              <p className="mt-2 text-green-100/80 max-w-md">
                Master your monthly income. Track expenses, set goals, and know exactly what you can spend today.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 relative z-10">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                <p className="text-xs text-green-100 font-medium uppercase tracking-wider">Days to Payday</p>
                <p className="mt-1 text-3xl font-bold">{daysLeft}</p>
              </div>
              <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 p-4 shadow-lg ring-1 ring-white/30">
                <p className="text-xs text-green-50 font-bold uppercase tracking-wider">Safe Daily Spend</p>
                <p className="mt-1 text-3xl font-black text-white">{currency.format(dailyBudget)}</p>
              </div>
            </div>
          </header>

          {/* Sticky Total Commitments Bar */}
          {/* NOTE: top offset accounts for the sticky ad banner height */}
          <div className="sticky top-14 sm:top-12 z-40">
            <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 p-4 shadow-lg">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Commitments</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{currency.format(totalCommitments)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Remaining</p>
                  <p className="mt-1 text-2xl font-black text-green-700">{currency.format(disposable)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Income & Goals</h2>
              <p className="mt-1 text-sm text-slate-500">
                Define your base salary and savings targets
              </p>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Monthly Salary (NGN)
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
                    <span className="text-slate-400 font-bold">₦</span>
                    <input
                      type="number"
                      className="w-full bg-transparent text-xl font-bold outline-none text-slate-800"
                      value={salaryInput}
                      onChange={(event) => setSalaryInput(event.target.value)}
                      onFocus={(event) => event.target.select()}
                      min={0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Savings Goal
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="text-xs text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm font-bold outline-none text-slate-700"
                        value={savingsGoalInput}
                        onChange={(event) => setSavingsGoalInput(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        min={0}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Emergency Fund
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="text-xs text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm font-bold outline-none text-slate-700"
                        value={emergencyFundInput}
                        onChange={(event) => setEmergencyFundInput(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Betting Budget
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="text-xs text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm font-bold outline-none text-slate-700"
                        value={bettingBudgetInput}
                        onChange={(event) => setBettingBudgetInput(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        min={0}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Family Allowance
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="text-xs text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm font-bold outline-none text-slate-700"
                        value={allowanceInput}
                        onChange={(event) => setAllowanceInput(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Disposable Income Remaining
                  </p>
                  <p className="mt-2 text-2xl font-black">{currency.format(disposable)}</p>
                  <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${salary > 0 ? (disposable / salary) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Pay Cycle Setup</h2>
              <p className="mt-1 text-sm text-slate-500">
                Synchronize with your actual payday
              </p>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Last Payday
                  </label>
                  <input
                    type="date"
                    value={lastPayday}
                    onChange={(event) => setLastPayday(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Days in Cycle
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cycleDaysInput}
                    onChange={(event) => setCycleDaysInput(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="rounded-2xl bg-green-50 p-4 border border-green-100">
                  <p className="text-sm text-green-800 leading-relaxed">
                    Next payday is in <span className="font-bold underline decoration-2">{daysLeft} days</span>. 
                    Spend no more than <span className="font-bold">{currency.format(dailyBudget)}</span> daily.
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 flex gap-3">
                  <span className="text-xl">💡</span>
                  <p className="text-xs text-amber-800 leading-relaxed italic">
                    Fuel prices are volatile. We recommend keeping a buffer of ₦15,000 for unexpected transport hikes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-[400px] space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recurring Expenses</h2>
                <p className="text-xs text-slate-500">Your fixed monthly bills</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 border border-slate-200">
                {expenses.length} BILLS
              </span>
            </div>

            <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-3 group hover:border-slate-200 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{expense.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">FIXED MONTHLY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">
                      {currency.format(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-300 hover:text-red-500 transition-all"
                      title="Remove expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-sm text-slate-400">No expenses added yet</p>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleAddExpense}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-800">Add New Bill</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Bill Name
                </label>
                <input
                  value={expenseName}
                  onChange={(event) => setExpenseName(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="e.g. DSTV Subscription"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Amount (NGN)
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:ring-2 focus-within:ring-green-500 transition-all">
                  <span className="text-sm text-slate-400 font-bold">₦</span>
                  <input
                    type="number"
                    min={0}
                    value={expenseAmount}
                    onChange={(event) => setExpenseAmount(event.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200"
              >
                Add to List
              </button>
            </div>
          </form>

          {/* Google AdSense ads will appear automatically based on your index.html integration */}

          {/* Ads removed - Google AdSense handles ad placement automatically */}

          {/* Quick Stats / Insights */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Financial Health</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Housing Ratio</span>
                <span className={`text-sm font-black ${salary > 0 && (250000 / salary) > 0.35 ? 'text-red-500' : 'text-slate-800'}`}>
                  {salary > 0 ? Math.round((250000 / salary) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Daily Budget</span>
                <span className="text-sm font-black text-green-600">{currency.format(dailyBudget)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Savings Gap</span>
                <span className="text-sm font-black text-amber-600">
                  {currency.format(Math.max(0, 50000 - emergencyFund))}
                </span>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 leading-relaxed text-center">
              Insights based on average Nigerian cost of living data.
            </p>
          </div>
        </section>
      </div>

      {/* Main Footer with Reset */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center">
          <button
            onClick={handleReset}
            className="group flex items-center gap-3 rounded-2xl border-2 border-red-50 bg-red-50/30 px-6 py-3.5 text-sm font-black text-red-600 transition-all hover:bg-red-50 hover:border-red-100 mb-10"
          >
            <svg className="transition-transform group-hover:rotate-180 duration-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            RESET FOR NEW MONTH
          </button>
          
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-800 tracking-tighter italic">PAYDAY<span className="text-green-600">GUARD</span></span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">v1.0</span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              Helping Nigerians navigate the economy with better budgeting. Your data stays on your device.
            </p>
            <div className="flex gap-6 mt-2">
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Privacy</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Feedback</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Support</a>
            </div>
            <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              &copy; {new Date().getFullYear()} Payday Guard Nigeria. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
