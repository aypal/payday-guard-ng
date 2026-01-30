import { useMemo, useState, useEffect } from "react";
import { 
  Wallet, 
  Target, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  PiggyBank,
  Shield,
  Users,
  Dices,
  Calendar,
  Bell,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Moon,
  Sun,
  Receipt,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  HeartPulse,
  Plane,
  Gift,
  Smartphone,
  Zap,
  Repeat,
  CheckCircle2,
  XCircle,
  Info,
  Copy,
  Check,
  HelpCircle,
  X
} from "lucide-react";
import { format, addDays, differenceInDays, addMonths } from 'date-fns';

// Types
interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  isPaid: boolean;
  dueDate?: Date;
  isRecurring: boolean;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  autoSaveAmount: number;
  icon: string;
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: Date;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: Date;
  read: boolean;
}

// Icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'emergency': <Shield className="w-5 h-5" />,
  'rent': <Home className="w-5 h-5" />,
  'car': <Car className="w-5 h-5" />,
  'education': <GraduationCap className="w-5 h-5" />,
  'health': <HeartPulse className="w-5 h-5" />,
  'travel': <Plane className="w-5 h-5" />,
  'gift': <Gift className="w-5 h-5" />,
  'gadget': <Smartphone className="w-5 h-5" />,
  'general': <PiggyBank className="w-5 h-5" />,
};

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const initialExpenses: Expense[] = [
  { id: "1", name: "Rent (House)", amount: 250000, category: "housing", isPaid: false, dueDate: new Date(), isRecurring: true },
  { id: "2", name: "Data/Internet", amount: 25000, category: "utilities", isPaid: false, dueDate: addDays(new Date(), 5), isRecurring: true },
  { id: "3", name: "Transport (Fuel/Transport)", amount: 40000, category: "transport", isPaid: false, dueDate: addDays(new Date(), 1), isRecurring: true },
  { id: "4", name: "Food & Groceries", amount: 80000, category: "food", isPaid: false, dueDate: addDays(new Date(), 3), isRecurring: true },
  { id: "5", name: "Electricity", amount: 15000, category: "utilities", isPaid: false, dueDate: addDays(new Date(), 10), isRecurring: true },
];

const initialGoals: SavingsGoal[] = [
  { id: "1", name: "Emergency Fund", targetAmount: 500000, currentAmount: 100000, deadline: addMonths(new Date(), 6), category: "emergency", autoSaveAmount: 20000, icon: "emergency" },
  { id: "2", name: "New Phone", targetAmount: 400000, currentAmount: 50000, deadline: addMonths(new Date(), 4), category: "gadget", autoSaveAmount: 15000, icon: "gadget" },
];

const initialDebts: Debt[] = [
  { id: "1", name: "Laptop Loan", totalAmount: 300000, paidAmount: 100000, interestRate: 5, monthlyPayment: 25000, dueDate: addMonths(new Date(), 2) },
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

  // Theme
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("paydayGuard_darkMode") === "true";
    }
    return false;
  });

  // View state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'debts' | 'analytics' | 'transactions'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize state from local storage or defaults
  const [salaryInput, setSalaryInput] = useState<string>(() => String(getStorage("pg_salary", 350000)));
  const [cycleDaysInput, setCycleDaysInput] = useState<string>(() => String(getStorage("pg_cycleDays", 30)));
  const [lastPayday, setLastPayday] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() - 12);
    const defaultDate = today.toISOString().slice(0, 10);
    return getStorage("pg_lastPayday", defaultDate);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = getStorage("pg_expenses_v2", null as Expense[] | null);
    if (saved) return saved.map((e: any) => ({ ...e, dueDate: e.dueDate ? new Date(e.dueDate) : undefined }));
    return initialExpenses;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = getStorage("pg_goals", null as SavingsGoal[] | null);
    if (saved) return saved.map((g: any) => ({ ...g, deadline: new Date(g.deadline) }));
    return initialGoals;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = getStorage("pg_debts", null as Debt[] | null);
    if (saved) return saved.map((d: any) => ({ ...d, dueDate: new Date(d.dueDate) }));
    return initialDebts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = getStorage("pg_transactions", null as Transaction[] | null);
    if (saved) return saved.map((t: any) => ({ ...t, date: new Date(t.date) })).sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime());
    return [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [copied, setCopied] = useState(false);
  
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("general");
  const [newExpenseRecurring, setNewExpenseRecurring] = useState(false);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("general");
  const [newGoalAutoSave, setNewGoalAutoSave] = useState("");

  const [newTransactionType, setNewTransactionType] = useState<'income' | 'expense'>('expense');
  const [newTransactionAmount, setNewTransactionAmount] = useState("");
  const [newTransactionDesc, setNewTransactionDesc] = useState("");

  const [savingsGoalInput, setSavingsGoalInput] = useState<string>(() => String(getStorage("pg_savingsGoal", 100000)));
  const [emergencyFundInput, setEmergencyFundInput] = useState<string>(() => String(getStorage("pg_emergencyFund", 50000)));
  const [bettingBudgetInput, setBettingBudgetInput] = useState<string>(() => String(getStorage("pg_bettingBudget", 5000)));
  const [allowanceInput, setAllowanceInput] = useState<string>(() => String(getStorage("pg_allowance", 20000)));

  // Parse numbers safely
  const salary = useMemo(() => toNumber(salaryInput, 0), [salaryInput]);
  const cycleDays = useMemo(() => Math.max(1, toNumber(cycleDaysInput, 30)), [cycleDaysInput]);
  const savingsGoal = useMemo(() => toNumber(savingsGoalInput, 0), [savingsGoalInput]);
  const emergencyFund = useMemo(() => toNumber(emergencyFundInput, 0), [emergencyFundInput]);
  const bettingBudget = useMemo(() => toNumber(bettingBudgetInput, 0), [bettingBudgetInput]);
  const allowance = useMemo(() => toNumber(allowanceInput, 0), [allowanceInput]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("pg_salary", JSON.stringify(salary));
    localStorage.setItem("pg_cycleDays", JSON.stringify(cycleDays));
    localStorage.setItem("pg_lastPayday", JSON.stringify(lastPayday));
    localStorage.setItem("pg_expenses_v2", JSON.stringify(expenses));
    localStorage.setItem("pg_savingsGoal", JSON.stringify(savingsGoal));
    localStorage.setItem("pg_emergencyFund", JSON.stringify(emergencyFund));
    localStorage.setItem("pg_bettingBudget", JSON.stringify(bettingBudget));
    localStorage.setItem("pg_allowance", JSON.stringify(allowance));
    localStorage.setItem("pg_goals", JSON.stringify(savingsGoals));
    localStorage.setItem("pg_debts", JSON.stringify(debts));
    localStorage.setItem("pg_transactions", JSON.stringify(transactions));
    localStorage.setItem("paydayGuard_darkMode", darkMode.toString());
  }, [salary, cycleDays, lastPayday, expenses, savingsGoal, emergencyFund, bettingBudget, allowance, savingsGoals, debts, transactions, darkMode]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Calculations
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const totalCommitments = useMemo(() => totalExpenses + savingsGoal + emergencyFund + bettingBudget + allowance, [totalExpenses, savingsGoal, emergencyFund, bettingBudget, allowance]);
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
  const hourlyBudget = dailyBudget / 24;

  const totalDebt = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const netWorth = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0) - totalDebt;
  const savingsRate = salary > 0 ? ((savingsGoal + emergencyFund + savingsGoals.reduce((s, g) => s + g.autoSaveAmount, 0)) / salary) * 100 : 0;

  // Financial health score
  const financialHealthScore = useMemo(() => {
    let score = 50;
    if (savingsRate >= 20) score += 15;
    else if (savingsRate >= 10) score += 10;
    if (emergencyFund >= salary * 0.5) score += 15;
    if (totalDebt < salary * 0.3) score += 10;
    if (dailyBudget > 5000) score += 10;
    return Math.min(100, Math.max(0, score));
  }, [savingsRate, emergencyFund, salary, totalDebt, dailyBudget]);

  // AI Insights
  const aiInsights = useMemo(() => {
    const insights: string[] = [];
    
    const housingExpenses = expenses.filter(e => e.category === 'housing').reduce((sum, e) => sum + e.amount, 0);
    if (housingExpenses > salary * 0.3) {
      insights.push('🏠 Your housing costs exceed 30% of income. Consider a side hustle or roommate.');
    }
    
    const totalSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    if (totalSavings < salary * 0.1) {
      insights.push('💡 Try to save at least 10% of your income. Start small with ₦5,000/week.');
    }
    
    if (dailyBudget < 3000) {
      insights.push('⚠️ Your daily budget is low. Review non-essential expenses like betting/subscriptions.');
    }
    
    if (emergencyFund < salary * 0.5) {
      insights.push('🚨 Build emergency fund to 3 months expenses. Set auto-save of ₦10,000/month.');
    }
    
    const totalDebtMonthly = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    if (totalDebtMonthly > salary * 0.2) {
      insights.push('📉 Debt payments are high. Focus on highest interest debt first (avalanche method).');
    }
    
    const upcomingBills = expenses.filter(e => !e.isPaid && e.dueDate && differenceInDays(e.dueDate, new Date()) <= 3);
    if (upcomingBills.length > 0) {
      insights.push(`📅 You have ${upcomingBills.length} bills due in 3 days. Total: ${currency.format(upcomingBills.reduce((s, e) => s + e.amount, 0))}`);
    }
    
    return insights;
  }, [salary, expenses, savingsGoals, dailyBudget, emergencyFund, debts]);

  // Generate notifications
  useEffect(() => {
    const notifs: Notification[] = [];
    
    expenses.filter(e => !e.isPaid && e.dueDate && differenceInDays(e.dueDate, new Date()) <= 2)
      .forEach(e => {
        notifs.push({
          id: `bill-${e.id}`,
          message: `${e.name} of ${currency.format(e.amount)} is due soon`,
          type: 'warning',
          date: new Date(),
          read: false
        });
      });
    
    savingsGoals.forEach(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100;
      if (progress >= 50 && progress < 55) {
        notifs.push({
          id: `goal-${g.id}`,
          message: `🎉 You're halfway to your ${g.name} goal!`,
          type: 'success',
          date: new Date(),
          read: false
        });
      }
    });
    
    if (disposable < 50000) {
      notifs.push({
        id: 'low-balance',
        message: '⚠️ Low disposable income this month. Be careful with spending!',
        type: 'warning',
        date: new Date(),
        read: false
      });
    }
    
    setNotifications(notifs);
  }, [expenses, savingsGoals, disposable]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handlers
  const handleReset = () => {
    if (confirm("Are you sure you want to reset everything for a new month? This will clear all current settings.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || Number.isNaN(amount) || amount <= 0) return;
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: expenseName.trim(),
      amount,
      category: newExpenseCategory,
      isPaid: false,
      dueDate: addDays(new Date(), 7),
      isRecurring: newExpenseRecurring,
    };
    
    setExpenses((prev) => [...prev, newExpense]);
    setExpenseName("");
    setExpenseAmount("");
    setNewExpenseRecurring(false);
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount,
      description: expenseName.trim(),
      category: newExpenseCategory,
      date: new Date(),
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleExpensePaid = (id: string) => {
    setExpenses(expenses.map(e => {
      if (e.id === id) {
        const updated = { ...e, isPaid: !e.isPaid };
        if (!e.isPaid) {
          const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'expense',
            amount: e.amount,
            description: `Paid: ${e.name}`,
            category: e.category,
            date: new Date(),
          };
          setTransactions(prev => [transaction, ...prev]);
        }
        return updated;
      }
      return e;
    }));
  };

  const addSavingsGoal = () => {
    if (newGoalName && newGoalTarget) {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        currentAmount: 0,
        deadline: newGoalDeadline ? new Date(newGoalDeadline) : addMonths(new Date(), 3),
        category: newGoalCategory,
        autoSaveAmount: parseFloat(newGoalAutoSave) || 0,
        icon: newGoalCategory,
      };
      setSavingsGoals([...savingsGoals, newGoal]);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalDeadline('');
      setNewGoalAutoSave('');
      setShowAddGoal(false);
    }
  };

  const updateGoalProgress = (id: string, amount: number) => {
    setSavingsGoals(savingsGoals.map(g => {
      if (g.id === id) {
        const newAmount = Math.min(g.targetAmount, Math.max(0, g.currentAmount + amount));
        if (amount > 0) {
          const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'expense',
            amount: amount,
            description: `Saved for: ${g.name}`,
            category: 'savings',
            date: new Date(),
          };
          setTransactions(prev => [transaction, ...prev]);
        }
        return { ...g, currentAmount: newAmount };
      }
      return g;
    }));
  };

  const removeSavingsGoal = (id: string) => {
    setSavingsGoals(savingsGoals.filter(g => g.id !== id));
  };

  const addDebtPayment = (id: string, amount: number) => {
    setDebts(debts.map(d => {
      if (d.id === id) {
        const newPaid = Math.min(d.totalAmount, d.paidAmount + amount);
        const transaction: Transaction = {
          id: Date.now().toString(),
          type: 'expense',
          amount: amount,
          description: `Debt payment: ${d.name}`,
          category: 'debt',
          date: new Date(),
        };
        setTransactions(prev => [transaction, ...prev]);
        return { ...d, paidAmount: newPaid };
      }
      return d;
    }));
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const addTransaction = () => {
    if (newTransactionAmount && newTransactionDesc) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: newTransactionType,
        amount: parseFloat(newTransactionAmount),
        description: newTransactionDesc,
        category: 'general',
        date: new Date(),
      };
      setTransactions([transaction, ...transactions]);
      setNewTransactionAmount('');
      setNewTransactionDesc('');
    }
  };

  const exportData = () => {
    const data = {
      salary,
      expenses,
      savingsGoals,
      debts,
      transactions,
      exportDate: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render helpers
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Financial Health Score */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-500" />
            Your Monthly Money Health (0–100)
          </h2>
          <span className="text-3xl font-bold text-emerald-500">{financialHealthScore}/100</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              financialHealthScore >= 70 ? 'bg-emerald-500' : 
              financialHealthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${financialHealthScore}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {financialHealthScore >= 70 ? 'Excellent! Your finances are in great shape.' :
           financialHealthScore >= 50 ? 'Good progress, but there\'s room for improvement.' :
           'Warning: Your financial health needs attention.'}
        </p>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            AI Financial Insights
          </h2>
          <div className="space-y-3">
            {aiInsights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Daily Budget</p>
          <p className="text-2xl font-bold text-emerald-600">{currency.format(dailyBudget)}</p>
          <p className="text-xs text-slate-400 mt-1">{currency.format(hourlyBudget)}/hour</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Savings Rate</p>
          <p className="text-2xl font-bold text-blue-600">{savingsRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">of income</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Net Worth</p>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {currency.format(netWorth)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Assets - Debts</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Days Left</p>
          <p className="text-2xl font-bold text-purple-600">{daysLeft}</p>
          <p className="text-xs text-slate-400 mt-1">until payday</p>
        </div>
      </div>

      {/* Income & Cycle */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Step 1 – Tell us your monthly take‑home
          </h2>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-3 focus-within:ring-2 focus-within:ring-green-500 transition-all">
            <span className="text-slate-400 font-bold">₦</span>
            <input
              type="number"
              className="w-full bg-transparent text-xl font-bold outline-none text-slate-800 dark:text-white"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              min={0}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Enter what finally lands in your account after tax, pension, and other deductions.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pay Cycle
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Last Payday</label>
              <input
                type="date"
                value={lastPayday}
                onChange={(e) => setLastPayday(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Days in Cycle</label>
              <input
                type="number"
                value={cycleDaysInput}
                onChange={(e) => setCycleDaysInput(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Commitments */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Step 3 – Lock in your non‑negotiables</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Rent, family support, betting, savings – everything that must leave your salary every month.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Savings Goal', value: savingsGoalInput, setter: setSavingsGoalInput, icon: Target },
            { label: 'Emergency Fund', value: emergencyFundInput, setter: setEmergencyFundInput, icon: Shield },
            { label: 'Betting Budget', value: bettingBudgetInput, setter: setBettingBudgetInput, icon: Dices },
            { label: 'Family Allowance', value: allowanceInput, setter: setAllowanceInput, icon: Users },
          ].map((item) => (
            <div key={item.label}>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                {item.label}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                <span className="text-slate-400 text-xs">₦</span>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Monthly Expenses
            <span className="text-sm font-normal text-slate-500">({currency.format(totalExpenses)})</span>
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">This is where your money actually disappears – food, fuel, data, small small flex.</p>

        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 group">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleExpensePaid(expense.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    expense.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500 hover:border-emerald-500'
                  }`}
                >
                  {expense.isPaid && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div>
                  <p className={`font-medium text-slate-800 dark:text-white ${expense.isPaid ? 'line-through opacity-50' : ''}`}>
                    {expense.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {expense.isRecurring && <Repeat className="w-3 h-3" />}
                    {expense.dueDate && (
                      <span className={differenceInDays(expense.dueDate, new Date()) <= 2 ? 'text-red-500' : ''}>
                        Due {format(expense.dueDate, 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-slate-800 dark:text-white ${expense.isPaid ? 'opacity-50' : ''}`}>
                  {currency.format(expense.amount)}
                </span>
                <button
                  onClick={() => handleRemoveExpense(expense.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Expense name"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 sm:col-span-1"
            />
            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={newExpenseCategory}
              onChange={(e) => setNewExpenseCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="general">General</option>
              <option value="housing">Housing</option>
              <option value="utilities">Utilities</option>
              <option value="transport">Transport</option>
              <option value="food">Food</option>
              <option value="health">Health</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newExpenseRecurring}
                onChange={(e) => setNewExpenseRecurring(e.target.checked)}
                className="rounded border-slate-300"
              />
              Recurring monthly
            </label>
            <button
              type="submit"
              disabled={!expenseName || !expenseAmount}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Goals – What are you really working towards?</h2>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {savingsGoals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const daysLeft = differenceInDays(goal.deadline, new Date());
          const monthlyNeeded = (goal.targetAmount - goal.currentAmount) / Math.max(1, Math.ceil(daysLeft / 30));
          
          return (
            <div key={goal.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                    {categoryIcons[goal.icon] || <PiggyBank className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{goal.name}</h3>
                    <p className="text-sm text-slate-500">{goal.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeSavingsGoal(goal.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{progress.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">{daysLeft} days left</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                  <span>{currency.format(goal.currentAmount)}</span>
                  <span>{currency.format(goal.targetAmount)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-slate-500">Need to save monthly:</span>
                <span className="font-bold text-emerald-600">{currency.format(monthlyNeeded)}</span>
              </div>

              {goal.autoSaveAmount > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Repeat className="w-4 h-4" />
                  Auto-save: {currency.format(goal.autoSaveAmount)}/month
                </div>
              )}

              <div className="flex gap-2">
                {[5000, 10000, 20000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => updateGoalProgress(goal.id, amount)}
                    className="flex-1 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium transition-colors text-sm"
                  >
                    +{currency.format(amount).replace('₦', '₦')}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Create New Goal</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Goal name (e.g., New Car)"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Target amount"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="general">General</option>
                <option value="emergency">Emergency</option>
                <option value="rent">Rent</option>
                <option value="car">Car</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="travel">Travel</option>
                <option value="gadget">Gadget</option>
                <option value="gift">Gift</option>
              </select>
              <input
                type="number"
                placeholder="Auto-save amount per month (optional)"
                value={newGoalAutoSave}
                onChange={(e) => setNewGoalAutoSave(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSavingsGoal}
                disabled={!newGoalName || !newGoalTarget}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDebts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Debt Radar – See Every Kobo You Owe</h2>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Remaining</p>
          <p className="text-2xl font-bold text-red-500">{currency.format(totalDebt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {debts.map(debt => {
          const remaining = debt.totalAmount - debt.paidAmount;
          const progress = (debt.paidAmount / debt.totalAmount) * 100;
          
          return (
            <div key={debt.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{debt.name}</h3>
                  <p className="text-sm text-slate-500">Interest: {debt.interestRate}% per annum</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeDebt(debt.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 transition-colors"
                    title="Delete debt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{progress.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">paid</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                  <span>Paid: {currency.format(debt.paidAmount)}</span>
                  <span>Total: {currency.format(debt.totalAmount)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="font-bold text-red-500">{currency.format(remaining)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Monthly Payment</p>
                  <p className="font-bold text-slate-800 dark:text-white">{currency.format(debt.monthlyPayment)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="font-bold text-slate-800 dark:text-white">{format(debt.dueDate, 'MMM yyyy')}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => addDebtPayment(debt.id, debt.monthlyPayment)}
                  className="flex-1 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium transition-colors text-sm"
                >
                  Pay Monthly
                </button>
                <button
                  onClick={() => addDebtPayment(debt.id, 10000)}
                  className="py-2 px-4 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium transition-colors"
                >
                  +₦10k
                </button>
                <button
                  onClick={() => addDebtPayment(debt.id, 50000)}
                  className="py-2 px-4 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium transition-colors"
                >
                  +₦50k
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {debts.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-lg text-slate-500">No debts tracked</p>
          <p className="text-sm text-slate-400">Great job staying debt-free!</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics – Where is your salary really going?</h2>
      
      {/* Spending Breakdown */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Spending Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Housing', amount: expenses.filter(e => e.category === 'housing').reduce((s, e) => s + e.amount, 0), color: 'bg-blue-500' },
            { name: 'Utilities', amount: expenses.filter(e => e.category === 'utilities').reduce((s, e) => s + e.amount, 0), color: 'bg-yellow-500' },
            { name: 'Transport', amount: expenses.filter(e => e.category === 'transport').reduce((s, e) => s + e.amount, 0), color: 'bg-green-500' },
            { name: 'Food', amount: expenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0), color: 'bg-red-500' },
            { name: 'Savings', amount: savingsGoal + emergencyFund + savingsGoals.reduce((s, g) => s + g.autoSaveAmount, 0), color: 'bg-emerald-500' },
            { name: 'Other', amount: expenses.filter(e => !['housing', 'utilities', 'transport', 'food'].includes(e.category)).reduce((s, e) => s + e.amount, 0) + bettingBudget + allowance, color: 'bg-purple-500' },
          ]
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map(item => {
              const percentage = (item.amount / salary) * 100;
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{currency.format(item.amount)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.min(100, percentage)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Expenses vs Income</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{((totalExpenses / salary) * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalExpenses > salary * 0.5 ? '⚠️ High expense ratio' : '✅ Within healthy range'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Debt-to-Income</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{((totalDebt / salary) * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalDebt > salary * 0.3 ? '⚠️ High debt load' : '✅ Manageable'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Emergency Coverage</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{(emergencyFund / (totalExpenses / 30)).toFixed(1)} days</p>
          <p className="text-xs text-slate-400 mt-1">
            {(emergencyFund / (totalExpenses / 30)) < 30 ? '⚠️ Build emergency fund' : '✅ Good buffer'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Projected Annual Savings</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{currency.format((savingsGoal + emergencyFund) * 12)}</p>
          <p className="text-xs text-slate-400 mt-1">At current rate</p>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Transaction History</h2>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Export Data'}
        </button>
      </div>

      {/* Add Transaction */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="grid sm:grid-cols-5 gap-3">
          <select
            value={newTransactionType}
            onChange={(e) => setNewTransactionType(e.target.value as 'income' | 'expense')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={newTransactionAmount}
            onChange={(e) => setNewTransactionAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={newTransactionDesc}
            onChange={(e) => setNewTransactionDesc(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
          />
          <button
            onClick={addTransaction}
            disabled={!newTransactionAmount || !newTransactionDesc}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg text-slate-500">No transactions yet</p>
          </div>
        ) : (
          transactions.slice(0, 50).map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                  {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{t.description}</p>
                  <p className="text-xs text-slate-500">{format(t.date, 'MMM d, yyyy • h:mm a')}</p>
                </div>
              </div>
              <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}{currency.format(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Payday Guard NG</h1>
                <p className="text-xs text-green-100">Turn salary into a plan – not vibes.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="How to use this app"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Wallet },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'debts', label: 'Debts', icon: CreditCard },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'transactions', label: 'History', icon: Receipt },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-700 shadow-md' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-50 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-slate-500 text-center">No notifications</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 border-b border-slate-100 dark:border-slate-700 ${n.read ? 'opacity-60' : ''}`}>
                <p className={`text-sm ${n.type === 'warning' ? 'text-amber-600' : n.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">{format(n.date, 'MMM d, h:mm a')}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Help Sidebar */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowHelp(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full overflow-y-auto shadow-2xl border-l border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-600" />
                How to Use Payday Guard
              </h2>
              <button 
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Quick Start Section */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Start (3 Steps)
                </h3>
                <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600">1.</span>
                    <span>Enter your salary (what actually lands in your account)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600">2.</span>
                    <span>Add all your fixed expenses (rent, transport, data)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600">3.</span>
                    <span>Check your Daily Budget – that's your safe spending limit!</span>
                  </li>
                </ol>
              </div>

              {/* Tabs Guide */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Understanding Each Tab
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      Dashboard
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Your command center. See your Money Health Score, Daily Budget, and all expenses. The sticky bar at top shows commitments vs remaining money.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Goals
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Create savings targets (Emergency Fund, Rent, Japa, etc.). Track progress with visual bars. The app tells you how much to save monthly to hit your deadline.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-red-600" />
                      Debts
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Your "Gbese Radar." Add all loans (FairMoney, friends, bank). See total debt, progress bars, and make payments. Know exactly how deep you are!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-600" />
                      Analytics
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Visual breakdown of where your salary goes. See if rent is eating 50% of your income. Check savings rate and emergency coverage.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-orange-600" />
                      History
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Every change you make is logged here. Export your data as backup. See your financial journey over time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Routine Tips */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800">
                <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Daily Routine
                </h3>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Morning:</strong> Check your Daily Budget number</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Before buying:</strong> Is it more than today's budget?</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Weekend:</strong> Update Goals when you save money</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Month-end:</strong> Log debt payments, check Analytics</span>
                  </li>
                </ul>
              </div>

              {/* Golden Rules */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Golden Rules</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <span className="font-bold text-emerald-600">50/30/20:</span>
                    <span className="text-slate-700 dark:text-slate-300">50% needs, 30% wants, 20% savings</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <span className="font-bold text-emerald-600">Emergency First:</span>
                    <span className="text-slate-700 dark:text-slate-300">Save 3 months expenses before flexing</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <span className="font-bold text-emerald-600">Debt Snowball:</span>
                    <span className="text-slate-700 dark:text-slate-300">Pay smallest debt first for quick wins</span>
                  </div>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">Common Issues</h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p><strong>Red Health Score?</strong> Your expenses exceed income. Reduce commitments or increase salary.</p>
                  <p><strong>Low Daily Budget?</strong> You have too many fixed expenses. Cut non-essentials.</p>
                  <p><strong>Data lost?</strong> Export regularly from History tab as backup.</p>
                </div>
              </div>

              {/* Footer in sidebar */}
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500">
                  Payday Guard NG v2.0<br/>
                  Your salary, your control. 🇳🇬
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Sticky Total Commitments Bar */}
        <div className="sticky top-[140px] sm:top-[132px] z-40 -mx-6 px-6 py-3 bg-gradient-to-r from-emerald-600/95 to-green-700/95 backdrop-blur-md shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-100 font-medium uppercase tracking-wider">Total Commitments</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{currency.format(totalCommitments)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-100 font-medium uppercase tracking-wider">Remaining</p>
              <p className={`text-xl sm:text-2xl font-bold ${disposable >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {currency.format(disposable)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'goals' && renderGoals()}
          {activeTab === 'debts' && renderDebts()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'transactions' && renderTransactions()}
        </div>

        {/* Reset Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Reset for New Month
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Helping Nigerians navigate the economy with better budgeting. Your data stays on your device.
          </p>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Payday Guard NG v2.0
          </p>
          <a  className="text-xs font-medium text-emerald-600 dark:text-emerald-400"  href="https://www.facebook.com/ajayip1">Developed by <u>Paul Ajayi</u></a>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Payday Guard Nigeria. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
