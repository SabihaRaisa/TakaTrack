"use client";
import DashboardCustomizer, {
  type DashboardWidget,
} from "@/components/DashboardCustomizer";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Plus, LogOut, Download,
  LayoutDashboard, ReceiptText, Target, Lightbulb, Search, Trash2, RefreshCw,
  CircleDollarSign, CalendarDays, Sparkles, TrendingUp, AlertTriangle
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  Budget, SavingsGoal, Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, TxType
} from "@/lib/types";

type Tab = "dashboard" | "transactions" | "budgets" | "savings" | "insights";
type TxDraft = { type: TxType; amount: string; category: string; note: string; payment_method: string; transaction_date: string };

const money = (n: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
const todayISO = () => new Date().toLocaleDateString("en-CA");
const monthISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const dateMonth = (d: string) => d.slice(0,7);
const blankDraft = (): TxDraft => ({ type:"expense", amount:"", category:"Food", note:"", payment_method:"Cash", transaction_date:todayISO() });

export default function Home() {
  const [sessionUser, setSessionUser] = useState<{id:string;email?:string} | null>(null);
  const [authMode, setAuthMode] = useState<"signin"|"signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<TxDraft>(blankDraft());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("All categories");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMonth, setFilterMonth] = useState(monthISO());
  const [search, setSearch] = useState("");
  const [budgetCategory, setBudgetCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [budgetLimit, setBudgetLimit] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("0");
  const [goalDate, setGoalDate] = useState("");
  const [visibleWidgets, setVisibleWidgets] = useState<DashboardWidget[]>([
  { id: "stats", label: "Summary cards" },
  { id: "expenses", label: "Income vs expenses chart" },
  { id: "categories", label: "Expense categories chart" },
  { id: "budgets", label: "Monthly budgets" },
  { id: "goals", label: "Savings goals" },
  { id: "transactions", label: "Recent transactions" },
]);
  
  const applyDashboardWidgets = useCallback(
  
  (widgets: DashboardWidget[]) => {
    setVisibleWidgets(widgets);
  },
  []
);
  const isWidgetVisible = (id: string) =>
  visibleWidgets.some((widget) => widget.id === id);

  const loadData = useCallback(async (userId: string) => {
    if (!supabase) return;
    setBusy(true);
    const [txRes, budRes, goalRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("transaction_date", {ascending:false}).limit(2000),
      supabase.from("budgets").select("*").eq("user_id", userId).eq("month", filterMonth),
      supabase.from("savings_goals").select("*").eq("user_id", userId).order("created_at", {ascending:false})
    ]);
    if (txRes.error || budRes.error || goalRes.error) {
      setMessage(txRes.error?.message || budRes.error?.message || goalRes.error?.message || "Could not load your data.");
    } else {
      setTransactions((txRes.data || []) as Transaction[]);
      setBudgets((budRes.data || []) as Budget[]);
      setGoals((goalRes.data || []) as SavingsGoal[]);
      setMessage("");
    }
    setBusy(false);
  }, [filterMonth]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => {
      const u = data.session?.user;
      if (u) { setSessionUser({id:u.id,email:u.email}); void loadData(u.id); }
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setSessionUser(u ? {id:u.id,email:u.email} : null);
      if (u) void loadData(u.id);
      else { setTransactions([]); setBudgets([]); setGoals([]); }
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (sessionUser) void loadData(sessionUser.id);
  }, [filterMonth, sessionUser, loadData]);

  const selectedTx = useMemo(() => transactions.filter(t => dateMonth(t.transaction_date) === filterMonth), [transactions, filterMonth]);
  const income = selectedTx.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const expenses = selectedTx.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const balance = income - expenses;
  const allIncome = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const allExpense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const filteredTx = selectedTx.filter(t => `${t.category} ${t.note || ""} ${t.payment_method}`.toLowerCase().includes(search.toLowerCase()) && (filterCategory === "All categories" || t.category === filterCategory) && (!dateFrom || t.transaction_date >= dateFrom) && (!dateTo || t.transaction_date <= dateTo));
  const byCategory = EXPENSE_CATEGORIES.map(category => ({
    category,
    amount: selectedTx.filter(t=>t.type==="expense" && t.category===category).reduce((s,t)=>s+Number(t.amount),0)
  })).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount);
  const chartData = useMemo(() => {
    const months = Array.from({length:6},(_,i)=> {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-(5-i));
      return monthISO(d);
    });
    return months.map(m => ({
      month: new Date(`${m}-01T00:00:00`).toLocaleDateString("en",{month:"short"}),
      Income: transactions.filter(t=>dateMonth(t.transaction_date)===m && t.type==="income").reduce((s,t)=>s+Number(t.amount),0),
      Expenses: transactions.filter(t=>dateMonth(t.transaction_date)===m && t.type==="expense").reduce((s,t)=>s+Number(t.amount),0)
    }));
  }, [transactions]);
  const insights = useMemo(() => {
    const list: {title:string;body:string;kind:"good"|"warn"}[] = [];
    if (!selectedTx.length) list.push({title:"Start with one transaction",body:"Add your income and expenses to unlock useful summaries.",kind:"good"});
    if (income > 0) {
      const rate = Math.round((balance / income) * 100);
      list.push({title:"Monthly savings rate",body:`Your recorded income minus expenses is ${rate}% for ${filterMonth}. This is a cash-flow estimate, not a bank balance.`,kind:rate>=20?"good":"warn"});
    }
    if (byCategory[0]) list.push({title:"Top spending category",body:`${byCategory[0].category} is your largest recorded expense category at ${money(byCategory[0].amount)} this month.`,kind:"warn"});
    const previous = new Date(`${filterMonth}-01T00:00:00`); previous.setMonth(previous.getMonth()-1);
    const prevMonth = monthISO(previous);
    const prevExpense = transactions.filter(t=>dateMonth(t.transaction_date)===prevMonth && t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
    if (prevExpense>0) {
      const diff = expenses-prevExpense;
      list.push({title:"Month-to-month spending",body:`Recorded spending is ${diff>0?"up":"down"} ${money(Math.abs(diff))} compared with ${prevMonth}.`,kind:diff>0?"warn":"good"});
    }
    const duplicateCandidates = selectedTx.filter(t=>t.type==="expense" && selectedTx.some(o=>o.id!==t.id && o.type===t.type && o.amount===t.amount && o.transaction_date===t.transaction_date && o.category===t.category));
    if (duplicateCandidates.length) list.push({title:"Possible duplicate transactions",body:`${duplicateCandidates.length} transaction(s) share the same date, amount and category. Check them manually before deleting anything.`,kind:"warn"});
    return list;
  }, [selectedTx, income, balance, filterMonth, byCategory, transactions, expenses]);

  async function authSubmit(e: FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setAuthBusy(true); setAuthMessage("");
    const result = authMode==="signup"
      ? await supabase.auth.signUp({email:authEmail.trim(),password:authPassword})
      : await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword});
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode==="signup" && !result.data.session) setAuthMessage("Account created. Check your email to confirm, then sign in.");
    else setAuthMessage("Authentication request completed.");
    setAuthBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut(); setSessionUser(null); setMessage("");
  }

  function startEditTransaction(tx: Transaction) {
    setEditingId(tx.id);
    setDraft({type:tx.type, amount:String(tx.amount), category:tx.category, note:tx.note || "", payment_method:tx.payment_method, transaction_date:tx.transaction_date});
    setShowForm(true);
    setTab("transactions");
    setMessage("Editing transaction. Save changes when finished.");
  }

  async function addTransaction(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !sessionUser) return;
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage("Enter an amount greater than zero."); return; }
    if (!draft.transaction_date || !draft.category) { setMessage("Choose a date and category."); return; }
    setBusy(true); setMessage("");
    const payload = {
      user_id:sessionUser.id, type:draft.type, amount, category:draft.category,
      note:draft.note.trim() || null, payment_method:draft.payment_method, transaction_date:draft.transaction_date
    };
    const result = editingId
      ? await supabase.from("transactions").update(payload).eq("id", editingId).eq("user_id", sessionUser.id)
      : await supabase.from("transactions").insert(payload);
    if (result.error) setMessage(result.error.message);
    else { setDraft(blankDraft()); setEditingId(null); setShowForm(false); setMessage(editingId ? "Transaction updated." : "Transaction saved."); await loadData(sessionUser.id); }
    setBusy(false);
  }

  async function deleteTransaction(id: string) {
    if (!supabase || !sessionUser || !window.confirm("Delete this transaction? This cannot be undone.")) return;
    const {error} = await supabase.from("transactions").delete().eq("id",id).eq("user_id",sessionUser.id);
    if (error) setMessage(error.message); else { setMessage("Transaction deleted."); await loadData(sessionUser.id); }
  }

  async function saveBudget(e: FormEvent) {
    e.preventDefault(); if (!supabase || !sessionUser) return;
    const limit = Number(budgetLimit);
    if (!Number.isFinite(limit) || limit <= 0) { setMessage("Budget must be greater than zero."); return; }
    setBusy(true);
    const {error} = await supabase.from("budgets").upsert({
      user_id:sessionUser.id, category:budgetCategory, month:filterMonth, limit_amount:limit
    }, {onConflict:"user_id,category,month"});
    if (error) setMessage(error.message); else { setBudgetLimit(""); setMessage("Budget saved."); await loadData(sessionUser.id); }
    setBusy(false);
  }

  async function deleteBudget(id: string) {
    if (!supabase || !sessionUser) return;
    const {error} = await supabase.from("budgets").delete().eq("id",id).eq("user_id",sessionUser.id);
    if (error) setMessage(error.message); else await loadData(sessionUser.id);
  }

  async function saveGoal(e: FormEvent) {
    e.preventDefault(); if (!supabase || !sessionUser) return;
    const target = Number(goalTarget), saved = Number(goalSaved || "0");
    if (!goalName.trim() || !Number.isFinite(target) || target<=0 || !Number.isFinite(saved) || saved<0 || saved>target) {
      setMessage("Enter a name, a positive target, and savings between zero and the target."); return;
    }
    setBusy(true);
    const {error} = await supabase.from("savings_goals").insert({
      user_id:sessionUser.id, name:goalName.trim(), target_amount:target, saved_amount:saved, target_date:goalDate || null
    });
    if (error) setMessage(error.message); else {
      setGoalName(""); setGoalTarget(""); setGoalSaved("0"); setGoalDate(""); setMessage("Savings goal created."); await loadData(sessionUser.id);
    }
    setBusy(false);
  }

  async function addGoalContribution(goal: SavingsGoal) {
    if (!supabase || !sessionUser) return;
    const raw = window.prompt(`How much are you adding to "${goal.name}"? (৳)`);
    if (raw === null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount<=0) { setMessage("Contribution must be greater than zero."); return; }
    const next = Number(goal.saved_amount)+amount;
    const {error} = await supabase.from("savings_goals").update({saved_amount:Math.min(next,Number(goal.target_amount))}).eq("id",goal.id).eq("user_id",sessionUser.id);
    if (error) setMessage(error.message); else { setMessage(next>Number(goal.target_amount) ? "Goal reached; contribution was capped at its target." : "Contribution added."); await loadData(sessionUser.id); }
  }

  async function deleteGoal(id: string) {
    if (!supabase || !sessionUser || !window.confirm("Delete this savings goal?")) return;
    const {error} = await supabase.from("savings_goals").delete().eq("id",id).eq("user_id",sessionUser.id);
    if (error) setMessage(error.message); else await loadData(sessionUser.id);
  }

  function exportCsv() {
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const rows = [["date","type","category","amount_bdt","payment_method","note"], ...filteredTx.map(t=>[t.transaction_date,t.type,t.category,t.amount,t.payment_method,t.note])];
    const csv = "\uFEFF" + rows.map(row=>row.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download=`takatrack-${filterMonth}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  if (!supabaseConfigured || !supabase) {
    return <main className="auth-shell"><div className="auth-card"><div className="brand"><div className="brand-mark">৳</div><div><h1>TakaTrack</h1><p>Personal finance, made clearer.</p></div></div><div className="notice" style={{marginTop:22}}>Supabase is not configured yet.</div><p>Create a Supabase project, copy <code>.env.example</code> to <code>.env.local</code>, and fill in your project URL and public anon/publishable key.</p><p className="muted small-text">Never put a Supabase service-role key in a browser environment variable.</p></div></main>;
  }

  if (!sessionUser) {
    return <main className="auth-shell"><form className="auth-card" onSubmit={authSubmit}>
      <div className="brand"><div className="brand-mark">৳</div><div><h1>TakaTrack</h1><p>Personal finance, made clearer.</p></div></div>
      <h2 style={{marginTop:24}}>{authMode==="signin"?"Welcome back":"Create your account"}</h2>
      <p>Track your spending, plan budgets, and build savings habits.</p>
      <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" required minLength={8} autoComplete={authMode==="signin"?"current-password":"new-password"} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 8 characters"/></div>
      <button className="btn" style={{width:"100%",marginTop:7}} disabled={authBusy}>{authBusy?"Please wait…":authMode==="signin"?"Sign in":"Create account"}</button>
      {authMessage && <p className={authMessage.includes("error")?"error":"success"}>{authMessage}</p>}
      <hr className="divider"/>
      <p className="small-text" style={{margin:0}}>{authMode==="signin"?"New to TakaTrack?":"Already have an account?"} <button type="button" className="btn secondary small" onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setAuthMessage("");}}>{authMode==="signin"?"Create account":"Sign in"}</button></p>
      <p className="footer-note">Your data is stored in your own Supabase account. RLS policies in the included SQL restrict rows to their owner.</p>
    </form></main>;
  }

  const tabs: {id:Tab;label:string;icon:React.ReactNode}[] = [
    {id:"dashboard",label:"Overview",icon:<LayoutDashboard size={16}/>},
    {id:"transactions",label:"Transactions",icon:<ReceiptText size={16}/>},
    {id:"budgets",label:"Budgets",icon:<Wallet size={16}/>},
    {id:"savings",label:"Savings goals",icon:<Target size={16}/>},
    {id:"insights",label:"Smart insights",icon:<Lightbulb size={16}/>}
  ];

  
return <main className="app">
  <header className="topbar">
    <div className="brand">
      <div className="brand-mark">৳</div>
      <div>
        <h1>TakaTrack</h1>
        <p>Make your money easier to understand.</p>
      </div>
    </div>

    <div className="top-actions">
      <button
        type="button"
        className="btn secondary"
        onClick={() => void signOut()}
      >
        <LogOut size={15} /> Sign out
      </button>

      <span className="user-pill">{sessionUser.email}</span>

      <ThemeSwitcher />
    </div>
  </header>

    <nav className="nav">{tabs.map(t=><button key={t.id} className={tab===t.id?"active":""} onClick={()=>{setTab(t.id);setMessage("");}}>{t.icon} {t.label}</button>)}</nav>
    {message && <div className={message.toLowerCase().includes("error")||message.toLowerCase().includes("must")||message.toLowerCase().includes("enter")?"notice":"notice"} role="status">{message}</div>}
    <div className="page-head"><div><h2>{({dashboard:"Your money at a glance",transactions:"Transactions",budgets:"Monthly budgets",savings:"Savings goals",insights:"Smart insights"} as Record<Tab,string>)[tab]}</h2><p>Review your finances for a month at a time. Amounts are in Bangladeshi taka (৳).</p></div>
      <div className="inline-tools"><CalendarDays size={16} className="muted"/><input aria-label="Select month" className="month-select" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value || monthISO())}/></div>
    </div>

    {tab==="dashboard" && <>
    <div className="dashboard-customizer-toolbar">
    <DashboardCustomizer onApply={applyDashboardWidgets} />
  </div>
    {isWidgetVisible("stats") && (

      <section className="grid stats">
        <div className="card"><div className="stat-label"><ArrowDownLeft size={15} className="green"/> Income</div><div className="stat-value green">{money(income)}</div><div className="stat-sub">Recorded in {filterMonth}</div></div>
        <div className="card"><div className="stat-label"><ArrowUpRight size={15} className="red"/> Expenses</div><div className="stat-value red">{money(expenses)}</div><div className="stat-sub">Recorded in {filterMonth}</div></div>
        <div className="card"><div className="stat-label"><Wallet size={15}/> Net cash flow</div><div className={`stat-value ${balance>=0?"green":"red"}`}>{money(balance)}</div><div className="stat-sub">Income minus expenses for this month</div></div>
        <div className="card"><div className="stat-label"><PiggyBank size={15}/> Savings goals</div><div className="stat-value">{goals.filter(g=>Number(g.saved_amount)>=Number(g.target_amount)).length}/{goals.length}</div><div className="stat-sub">Goals reached</div></div>
      </section>
      )}
      <section className="grid two">
        <div className="card"><div className="card-title"><h3>Income vs expenses</h3><span className="badge">Last 6 months</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:8,right:4,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee9"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={48} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:String(v)}/><Tooltip formatter={(v)=>money(Number(v))}/><Bar dataKey="Income" fill="#087f5b" radius={[5,5,0,0]}/><Bar dataKey="Expenses" fill="#df756b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-title"><h3>Where money goes</h3><span className="badge">{filterMonth}</span></div>{byCategory.length?<><div className="chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={52} outerRadius={86} paddingAngle={2}>{byCategory.map((entry,index)=><Cell key={entry.category} fill={["#087f5b","#df756b","#d79b20","#4c78a8","#8b6bb1","#5aa7a0","#d17c3f","#7c8b85","#a4b0aa"][index%9]}/>)}</Pie><Tooltip formatter={(v)=>money(Number(v))}/><Legend/></PieChart></ResponsiveContainer></div>{byCategory.slice(0,6).map(c=><div className="budget-row" key={c.category}><div className="budget-top"><span>{c.category}</span><strong>{money(c.amount)}</strong></div><div className="progress"><span style={{width:`${Math.min(100,expenses?c.amount/expenses*100:0)}%`}}/></div><div className="small-text muted">{expenses?Math.round(c.amount/expenses*100):0}% of monthly expenses</div></div>)}</>:<div className="empty">No expenses recorded for this month yet.</div>}</div>
      </section>
      <section className="card" style={{marginTop:14}}><div className="card-title"><h3>Recent transactions</h3><button className="btn secondary small" onClick={()=>{setTab("transactions");setShowForm(true);}}> <Plus size={14}/> Add transaction</button></div><TransactionTable items={selectedTx.slice(0,6)} onEdit={startEditTransaction} onDelete={deleteTransaction}/></section>
    </>}
  

    {tab==="transactions" && <>
      <div className="card" style={{marginBottom:14}}><div className="card-title"><h3>{editingId ? "Edit transaction" : "Add a transaction"}</h3><button className="btn secondary small" onClick={()=>{if(showForm&&editingId){setEditingId(null);setDraft(blankDraft());}setShowForm(!showForm);}}>{showForm?"Close form":<><Plus size={14}/> New transaction</>}</button></div>
      {showForm && <form onSubmit={addTransaction}>
        <div className="form-grid">
          <div className="field"><label>Type</label><select value={draft.type} onChange={e=>{const type=e.target.value as TxType;setDraft({...draft,type,category:type==="income"?INCOME_CATEGORIES[0]:EXPENSE_CATEGORIES[0]});}}><option value="expense">Expense</option><option value="income">Income</option></select></div>
          <div className="field"><label>Amount (৳)</label><input type="number" min="0.01" step="0.01" required value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})} placeholder="e.g. 450"/></div>
          <div className="field"><label>Category</label><select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{(draft.type==="income"?INCOME_CATEGORIES:EXPENSE_CATEGORIES).map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Date</label><input type="date" required value={draft.transaction_date} onChange={e=>setDraft({...draft,transaction_date:e.target.value})}/></div>
          <div className="field"><label>Payment method</label><select value={draft.payment_method} onChange={e=>setDraft({...draft,payment_method:e.target.value})}>{PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}</select></div>
          <div className="field"><label>Note (optional)</label><input maxLength={160} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder="What was it for?"/></div>
        </div>
        <div className="form-actions"><button className="btn" disabled={busy}><Plus size={15}/> {editingId ? "Save changes" : "Save transaction"}</button><button type="button" className="btn ghost" onClick={()=>{setDraft(blankDraft());setEditingId(null);}}>Clear</button><button type="button" className="btn ghost" onClick={()=>{setDraft(blankDraft());setEditingId(null);setShowForm(false);}}>Cancel</button></div>
      </form>}
      </div>
      <div className="card"><div className="card-title"><h3>{filterMonth} transactions <span className="badge">{filteredTx.length} shown</span></h3><div className="inline-tools"><div style={{position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:13,color:"#66776f"}}/><input className="search" style={{paddingLeft:30}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search category or note"/></div><button className="btn secondary small" onClick={exportCsv}><Download size={14}/> CSV</button></div></div><div className="inline-tools" style={{marginBottom:14}}><select aria-label="Filter category" className="month-select" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}><option>All categories</option>{[...new Set(transactions.map(t=>t.category))].sort().map(c=><option key={c}>{c}</option>)}</select><label className="small-text muted">From <input className="month-select" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label><label className="small-text muted">To <input className="month-select" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label><button className="btn ghost small" onClick={()=>{setSearch("");setFilterCategory("All categories");setDateFrom("");setDateTo("");}}>Clear filters</button></div><TransactionTable items={filteredTx} onEdit={startEditTransaction} onDelete={deleteTransaction}/></div>
    </>}

    {tab==="budgets" && <section className="grid two">
      <div className="card"><div className="card-title"><h3>Set a category budget</h3><span className="badge">{filterMonth}</span></div><form onSubmit={saveBudget}><div className="field"><label>Expense category</label><select value={budgetCategory} onChange={e=>setBudgetCategory(e.target.value)}>{EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div><div className="field" style={{marginTop:12}}><label>Monthly limit (৳)</label><input type="number" min="1" step="1" required value={budgetLimit} onChange={e=>setBudgetLimit(e.target.value)} placeholder="e.g. 5000"/></div><div className="form-actions"><button className="btn" disabled={busy}>Save budget</button></div></form><p className="small-text muted">Setting the same category again updates its existing budget for this month.</p></div>
      <div className="card"><div className="card-title"><h3>Budget progress</h3><span className="badge">{budgets.length} categories</span></div>{budgets.length?budgets.map(b=>{const spent=selectedTx.filter(t=>t.type==="expense"&&t.category===b.category).reduce((s,t)=>s+Number(t.amount),0);const pct=spent/Number(b.limit_amount)*100;return <div className="budget-row" key={b.id}><div className="budget-top"><strong>{b.category}</strong><span className={pct>=100?"red":pct>=75?"amber":""}>{money(spent)} / {money(Number(b.limit_amount))}</span></div><div className="progress"><span className={pct>=100?"over":pct>=75?"warn":""} style={{width:`${Math.min(100,pct)}%`}}/></div><div className="budget-top small-text muted"><span>{pct>=100?"Over budget":pct>=75?"Near limit":"On track"}</span><button className="btn danger small" onClick={()=>void deleteBudget(b.id)}><Trash2 size={12}/> Delete</button></div></div>}) : <div className="empty">No budgets yet. Set a limit to track spending by category.</div>}</div>
    </section>}

    {tab==="savings" && <section className="grid two">
      <div className="card"><div className="card-title"><h3>Create a savings goal</h3><span className="badge">Your plan</span></div><form onSubmit={saveGoal}><div className="field"><label>Goal name</label><input required maxLength={70} value={goalName} onChange={e=>setGoalName(e.target.value)} placeholder="e.g. New laptop"/></div><div className="form-grid" style={{marginTop:12}}><div className="field"><label>Target amount (৳)</label><input type="number" min="1" required value={goalTarget} onChange={e=>setGoalTarget(e.target.value)} placeholder="50000"/></div><div className="field"><label>Already saved (৳)</label><input type="number" min="0" value={goalSaved} onChange={e=>setGoalSaved(e.target.value)}/></div><div className="field full"><label>Target date (optional)</label><input type="date" min={todayISO()} value={goalDate} onChange={e=>setGoalDate(e.target.value)}/></div></div><div className="form-actions"><button className="btn" disabled={busy}><Plus size={15}/> Create goal</button></div></form></div>
      <div className="card"><div className="card-title"><h3>Your goals</h3><span className="badge">{goals.length} total</span></div>{goals.length?<div className="grid goal-grid">{goals.map(g=>{const target=Number(g.target_amount),saved=Number(g.saved_amount),pct=target?Math.min(100,saved/target*100):0;const left=Math.max(0,target-saved);const months=g.target_date?Math.max(1,Math.ceil((new Date(`${g.target_date}T00:00:00`).getTime()-Date.now())/(1000*60*60*24*30.4375))):null;return <div className="card" key={g.id} style={{boxShadow:"none",padding:14}}><div className="card-title"><h3>{g.name}</h3><button aria-label={`Delete ${g.name}`} className="btn danger small" onClick={()=>void deleteGoal(g.id)}><Trash2 size={12}/></button></div><div className="stat-value" style={{fontSize:22}}>{money(saved)}</div><div className="goal-amounts"><span>of {money(target)}</span><strong>{Math.round(pct)}%</strong></div><div className="progress"><span style={{width:`${pct}%`}}/></div>{left>0?<p className="small-text muted">{money(left)} left{months?` · about ${money(left/months)}/month to reach target`: ""}</p>:<p className="small-text green">Goal reached!</p>}<button className="btn secondary small" onClick={()=>void addGoalContribution(g)}>Add savings</button></div>})}</div>:<div className="empty">Create a goal to start tracking progress.</div>}</div>
    </section>}

    {tab==="insights" && <section className="grid two">
      <div className="card"><div className="card-title"><h3><Sparkles size={17} className="green" style={{verticalAlign:"middle"}}/> Your money insights</h3><span className="badge">Rule-based</span></div><p className="muted small-text">These are transparent calculations from your saved transactions, not an AI financial adviser.</p>{insights.map((i,idx)=><div className="insight" key={idx}><strong>{i.kind==="warn"?<AlertTriangle size={14} style={{display:"inline",verticalAlign:"middle"}}/>:<TrendingUp size={14} style={{display:"inline",verticalAlign:"middle"}}/>} {i.title}</strong><span>{i.body}</span></div>)}</div>
      <div className="card"><div className="card-title"><h3>Month-end cash-flow estimate</h3><span className="badge">Simple estimate</span></div><p className="muted small-text">This projects using the current month’s average daily spending and recorded income. It is not a bank balance or a guarantee.</p><ForecastCard transactions={transactions} month={filterMonth}/><div className="notice" style={{marginTop:14}}>Recurring transactions and automatic reminders are not enabled in this starter version. Do not treat the forecast as financial advice.</div></div>
    </section>}

    <p className="footer-note">TakaTrack is a personal tracking tool, not a bank or financial adviser. Keep your account credentials private and export your data periodically.</p>
  </main>;
}

function TransactionTable({items,onDelete,onEdit}:{items:Transaction[];onDelete:(id:string)=>void;onEdit:(tx:Transaction)=>void}) {
  if (!items.length) return <div className="empty">No transactions found for this month.</div>;
  return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Category / note</th><th>Method</th><th style={{textAlign:"right"}}>Amount</th><th>Actions</th></tr></thead><tbody>{items.map(t=><tr key={t.id}><td>{t.transaction_date}</td><td><span className={`badge ${t.type}`}>{t.type}</span></td><td><strong>{t.category}</strong>{t.note&&<div className="small-text muted">{t.note}</div>}</td><td>{t.payment_method}</td><td className={`amount ${t.type==="income"?"green":"red"}`} style={{textAlign:"right"}}>{t.type==="income"?"+":"−"}{money(Number(t.amount))}</td><td><div className="inline-tools"><button className="btn secondary small" aria-label={`Edit transaction ${t.category}`} onClick={()=>onEdit(t)}>Edit</button><button className="btn danger small" aria-label="Delete transaction" onClick={()=>onDelete(t.id)}><Trash2 size={13}/></button></div></td></tr>)}</tbody></table></div>;
}

function ForecastCard({transactions,month}:{transactions:Transaction[];month:string}) {
  const now = new Date(), selected = new Date(`${month}-01T00:00:00`);
  const isCurrent = monthISO(now)===month;
  const daysInMonth = new Date(selected.getFullYear(),selected.getMonth()+1,0).getDate();
  const elapsed = isCurrent?Math.max(1,now.getDate()):daysInMonth;
  const spent = transactions.filter(t=>dateMonth(t.transaction_date)===month&&t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const earned = transactions.filter(t=>dateMonth(t.transaction_date)===month&&t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const projectedExpense = isCurrent ? spent/elapsed*daysInMonth : spent;
  const projectedIncome = isCurrent ? earned/elapsed*daysInMonth : earned;
  return <div className="grid" style={{gap:10}}><div className="budget-row"><div className="budget-top"><span>Recorded expenses</span><strong>{money(spent)}</strong></div></div><div className="budget-row"><div className="budget-top"><span>Projected expenses</span><strong className="red">{money(projectedExpense)}</strong></div></div><div className="budget-row"><div className="budget-top"><span>Projected income</span><strong className="green">{money(projectedIncome)}</strong></div></div><div className="budget-row"><div className="budget-top"><span>Projected net cash flow</span><strong className={projectedIncome-projectedExpense>=0?"green":"red"}>{money(projectedIncome-projectedExpense)}</strong></div></div></div>;
}
