"use client";

import { useEffect, useState } from "react";

/*
  Full Monthly Budget app (based on the long version you liked).
  - ALL previous features preserved.
  - Grouped Totals by Description has been REMOVED (per request).
  - Transaction History moved up to occupy the removed table's place.
  - Formatting: displayed amounts use $ + commas (formatCurrency).
  - Inputs are plain while editing (Option 2).
  - No custom "use..." functions that could be mistaken as hooks in callbacks.
  - Table borders, spacing, import/export, quick adds, add/edit categories, month navigation, localStorage persistence.
*/

const getMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatCurrency = (num = 0) =>
  "$" + Number(num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const defaultExpenses = [
  { name: "Groceries/Store", budget: 300 },
  { name: "Rent", budget: 1184 },
  { name: "Electricity", budget: 250 },
  { name: "Gas", budget: 200 },
  { name: "Dates & Eating Out", budget: 50 },
  { name: "Subscriptions", budget: 46 },
  { name: "Tithe", budget: 80 },
  { name: "Shopping/Wants", budget: 50 },
  { name: "Savings", budget: 0 },
  { name: "Unexpected Health", budget: 150 },
  { name: "Insurance", budget: 0 },
  { name: "Gift/Birthday/Holiday", budget: 50 },
  { name: "Other Purchases", budget: 0 },
];

const defaultIncome = [
  { name: "GSA", budget: 0 },
  { name: "Intramurals", budget: 0 },
  { name: "Bank Interest", budget: 0 },
  { name: "Gifts", budget: 0 },
  { name: "Other", budget: 0 },
];

export default function Page() {
  // ---- State
const [currentMonth, setCurrentMonth] = useState(null);

useEffect(() => {
  // Only runs in the browser
  const saved = localStorage.getItem("lastMonth");
  const monthKey = saved || getMonthKey(); // fallback to current month
  setCurrentMonth(monthKey);
}, []);

useEffect(() => {
  if (currentMonth) localStorage.setItem("lastMonth", currentMonth);
}, [currentMonth]);


// Save the month whenever it changes
useEffect(() => {
  localStorage.setItem("lastMonthVisited", currentMonth);
}, [currentMonth]);

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [beginningBalance, setBeginningBalance] = useState(0);

  // Add transaction form (plain inputs while editing)
  const [newTx, setNewTx] = useState({ type: "expense", category: "", description: "", amount: "", date: "" });

  // Quick adds (arrays for expense and income) + creator form
  const [quickAdds, setQuickAdds] = useState({ expense: [], income: [] });
  const [quickAddForm, setQuickAddForm] = useState({ type: "expense", category: "", description: "", amount: "" });

  // UI: search, sort, filter
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState("date"); // date, amount, category, description
  const [filterType, setFilterType] = useState("all"); // all, expense, income

  // ---- Load per-month data from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(currentMonth);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setExpenses(parsed.expenses ?? defaultExpenses);
        setIncome(parsed.income ?? defaultIncome);
        setTransactions(parsed.transactions ?? []);
        setBeginningBalance(parsed.beginningBalance ?? 0);
        setQuickAdds(parsed.quickAdds ?? { expense: [], income: [] });
      } catch (err) {
        // fallback defaults
        setExpenses(defaultExpenses);
        setIncome(defaultIncome);
        setTransactions([]);
        setBeginningBalance(0);
        setQuickAdds({ expense: [], income: [] });
      }
    } else {
      setExpenses(defaultExpenses);
      setIncome(defaultIncome);
      setTransactions([]);
      setBeginningBalance(0);
      setQuickAdds({ expense: [], income: [] });
    }
  }, [currentMonth]);

  // ---- Persist per-month
useEffect(() => {
  const payload = { expenses, income, transactions, beginningBalance, quickAdds };
  localStorage.setItem(currentMonth, JSON.stringify(payload));

  // Save the last viewed month for next visit
  localStorage.setItem("lastViewedMonth", currentMonth);
}, [expenses, income, transactions, beginningBalance, quickAdds, currentMonth]);

  // ---- Derived totals
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const currentBalance = Number(beginningBalance || 0) + totalIncome - totalExpenses;

  const expenseTotals = expenses.map(e => {
    const spent = transactions.filter(t => t.type === "expense" && t.category === e.name).reduce((s, t) => s + Number(t.amount || 0), 0);
    return { ...e, spent };
  });

  const incomeTotals = income.map(i => {
    const received = transactions.filter(t => t.type === "income" && t.category === i.name).reduce((s, t) => s + Number(t.amount || 0), 0);
    return { ...i, received };
  });

  // ---- Transaction list with search/sort/filter
  const filteredTransactions = transactions
    .filter(tx => (filterType === "all" ? true : tx.type === filterType))
    .filter(tx => {
      if (!searchText) return true;
      const s = searchText.toLowerCase();
      return (
        String(tx.description || "").toLowerCase().includes(s) ||
        String(tx.category || "").toLowerCase().includes(s) ||
        String(tx.amount || "").toLowerCase().includes(s)
      );
    })
    .slice()
    .sort((a, b) => {
      if (sortKey === "date") return new Date(b.date) - new Date(a.date);
      if (sortKey === "amount") return Number(b.amount) - Number(a.amount);
      if (sortKey === "category") return String(a.category).localeCompare(String(b.category));
      if (sortKey === "description") return String(a.description).localeCompare(String(b.description));
      return 0;
    });

  // ---- Actions

  // Add transaction (adds to transaction history; budgets are editable separately)
  const addTransaction = () => {
    if (!newTx.category || !newTx.amount) return;
    const tx = {
      id: Date.now(),
      type: newTx.type,
      category: newTx.category,
      description: newTx.description || "",
      amount: Number(newTx.amount),
      date: newTx.date || new Date().toISOString().split("T")[0],
    };
    setTransactions([tx, ...transactions]);
    setNewTx({ type: newTx.type, category: "", description: "", amount: "", date: "" });
  };

  // Quick Add: create / apply / delete / edit
  const createQuickAdd = () => {
    if (!quickAddForm.category || !quickAddForm.amount) return;
    const q = {
      category: quickAddForm.category,
      description: quickAddForm.description || quickAddForm.category,
      amount: Number(quickAddForm.amount),
    };
    setQuickAdds({ ...quickAdds, [quickAddForm.type]: [...quickAdds[quickAddForm.type], q] });
    setQuickAddForm({ type: quickAddForm.type, category: "", description: "", amount: "" });
  };

  const applyQuickAdd = (q, type) => {
    const tx = {
      id: Date.now(),
      type,
      category: q.category,
      description: q.description || "",
      amount: Number(q.amount),
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions([tx, ...transactions]);
  };

  const deleteQuickAdd = (index, type) => {
    const copy = { ...quickAdds };
    copy[type] = copy[type].filter((_, i) => i !== index);
    setQuickAdds(copy);
  };

  // Category management
  const addExpenseCategory = () => setExpenses([...expenses, { name: "New Expense", budget: 0 }]);
  const addIncomeCategory = () => setIncome([...income, { name: "New Income", budget: 0 }]);
  const deleteExpenseCategory = index => setExpenses(expenses.filter((_, i) => i !== index));
  const deleteIncomeCategory = index => setIncome(income.filter((_, i) => i !== index));

  // Inline edits for budgets and names (plain numeric while editing)
  const setExpenseBudget = (idx, value) => {
    const next = [...expenses];
    next[idx] = { ...next[idx], budget: Number(value || 0) };
    setExpenses(next);
  };
  const setExpenseName = (idx, value) => {
    const next = [...expenses];
    next[idx] = { ...next[idx], name: value };
    setExpenses(next);
  };

  const setIncomeBudget = (idx, value) => {
    const next = [...income];
    next[idx] = { ...next[idx], budget: Number(value || 0) };
    setIncome(next);
  };
  const setIncomeName = (idx, value) => {
    const next = [...income];
    next[idx] = { ...next[idx], name: value };
    setIncome(next);
  };

  // Transaction deletion
  const deleteTransaction = id => setTransactions(transactions.filter(t => t.id !== id));

  // Export/import JSON
  const exportJSON = () => {
    const data = { expenses, income, transactions, beginningBalance, quickAdds };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentMonth}-budget.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.income) setIncome(parsed.income);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.beginningBalance !== undefined) setBeginningBalance(parsed.beginningBalance);
        if (parsed.quickAdds) setQuickAdds(parsed.quickAdds);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Month navigation
  const goMonth = offset => {
    const [y, m] = currentMonth.split("-").map(Number);
    // Force to the 1st day of the month to prevent rollover issues
    const date = new Date(y, m - 1 + offset, 1);
    setCurrentMonth(getMonthKey(date));
  };

  // ---- Styles
  const tableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    marginBottom: 12,
    fontSize: 16,
    tableLayout: "fixed",
  };
  const thTdStyle = {
    border: "1px solid #111",
    padding: "6px 8px",
    textAlign: "left",
    fontWeight: 800,
    fontSize: 16,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };
  const smallInput = { width: 100, fontSize: 15, padding: 6, fontWeight: 800 };
  const mediumInput = { width: 220, fontSize: 15, padding: 6, fontWeight: 800 };
  const categoryInput = { width: "100%", fontSize: 15, padding: 6, fontWeight: 700 };

  // ---- Render
  return (
    <div style={{ padding: 14, background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", lineHeight: 1.25 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button style={{ fontWeight: 800, fontSize: 20 }} onClick={() => goMonth(-1)}>◀</button>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, textAlign: "center" }}>
          Monthly Budget — {new Date(`${currentMonth}-01`).toLocaleString("default", { month: "long", year: "numeric" })}
        </h1>
        <button style={{ fontWeight: 800, fontSize: 20 }} onClick={() => goMonth(1)}>▶</button>
      </div>

      {/* Beginning Balance */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <label style={{ fontWeight: 900, fontSize: 18 }}>Beginning Balance</label>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>$</span>
          <input
            type="number"
            value={beginningBalance}
            onChange={e => setBeginningBalance(Number(e.target.value || 0))}
            style={{ ...smallInput, width: 150 }}
          />
        </div>
        <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: 18 }}>Current Balance: {formatCurrency(currentBalance)}</div>
      </div>

      {/* Search / Sort / Import / Export */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input placeholder="Search transactions..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 260, padding: 6, fontWeight: 700 }} />
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
          style={{ ...smallInput, width: 160 }}
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
          <option value="category">Sort: Category</option>
          <option value="description">Sort: Description</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...smallInput }}>
          <option value="all">All</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        </div> {/* <-- add this to close Search / Sort / Import / Export */}
      {/* Add Transaction & Quick Add area (spaced) */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
        {/* Add Transaction */}
        <div style={{ border: "1px solid #111", padding: 10, borderRadius: 6, minWidth: 440 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 900 }}>Add Transaction</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} style={smallInput}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <select value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })} style={mediumInput}>
              <option value="">Select category</option>
              {(newTx.type === "expense" ? expenses : income).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <input placeholder="Description" value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} style={{ width: 260, padding: 6, fontWeight: 700 }} />
            <input placeholder="Amount" type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} style={smallInput} />
            <input
              type="date"
              value={newTx.date}
              onChange={e => setNewTx({ ...newTx, date: e.target.value })}
              style={{ ...smallInput, width: 160 }}
            />
            <button onClick={addTransaction} style={{ fontWeight: 900, padding: "8px 12px" }}>Add</button>
          </div>
        </div>

        {/* Quick Add */}
        <div style={{ border: "1px solid #111", padding: 10, borderRadius: 6, minWidth: 440 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 900 }}>Quick Add</h3>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 900 }}>Expense Quick Adds</div>
              {quickAdds.expense.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <button onClick={() => applyQuickAdd(q, "expense")} style={{ fontWeight: 800 }}>
                    {q.description} — {formatCurrency(q.amount)}
                  </button>
                  <button onClick={() => deleteQuickAdd(i, "expense")}>Delete</button>
                </div>
              ))}
            </div>

            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 900 }}>Income Quick Adds</div>
              {quickAdds.income.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <button onClick={() => applyQuickAdd(q, "income")} style={{ fontWeight: 800 }}>
                    {q.description} — {formatCurrency(q.amount)}
                  </button>
                  <button onClick={() => deleteQuickAdd(i, "income")}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add creator (editable custom) */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={quickAddForm.type} onChange={e => setQuickAddForm({ ...quickAddForm, type: e.target.value })} style={smallInput}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input placeholder="Category" value={quickAddForm.category} onChange={e => setQuickAddForm({ ...quickAddForm, category: e.target.value })} style={{ width: 180, padding: 6, fontWeight: 700 }} />
            <input placeholder="Description" value={quickAddForm.description} onChange={e => setQuickAddForm({ ...quickAddForm, description: e.target.value })} style={{ width: 180, padding: 6, fontWeight: 700 }} />
            <input placeholder="Amount" type="number" value={quickAddForm.amount} onChange={e => setQuickAddForm({ ...quickAddForm, amount: e.target.value })} style={smallInput} />
            <button onClick={createQuickAdd} style={{ fontWeight: 900 }}>Create</button>
          </div>
        </div>
      </div>

      {/* Expenses & Income tables side-by-side */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {/* Expenses */}
        <div style={{ flex: 1, minWidth: 520 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Expenses</h2>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "60%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th
                  style={{
                    ...thTdStyle,
                    whiteSpace: "normal",
                    overflow: "visible",
                    textOverflow: "clip",
                    fontSize: 16,
                  }}
                >
                  Spent {formatCurrency(totalExpenses)}
                </th>
              </tr>
            </thead>
            <tbody>
              {expenseTotals.map((e, idx) => (
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input value={e.name} onChange={ev => setExpenseName(idx, ev.target.value)} style={categoryInput} />
                  </td>
                  <td style={thTdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800 }}>$</span>
                      <input
                        type="number"
                        value={Number(e.budget)}
                        onChange={ev => setExpenseBudget(idx, ev.target.value)}
                        style={{ width: 110, fontSize: 15, padding: 6, fontWeight: 800 }}
                      />
                      <div style={{ marginLeft: 6, fontWeight: 800 }}>{formatCurrency(e.budget)}</div>
                    </div>
                  </td>
                  <td
                    style={{
                      ...thTdStyle,
                      whiteSpace: "normal",
                      overflow: "visible",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(e.spent)}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={thTdStyle}>
                  <button onClick={addExpenseCategory} style={{ fontWeight: 900 }}>+ Add Expense Category</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Income */}
        <div style={{ flex: 1, minWidth: 420 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Income</h2>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "60%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th
                  style={{
                    ...thTdStyle,
                    whiteSpace: "normal",
                    overflow: "visible",
                    textOverflow: "clip",
                    fontSize: 16,
                  }}
                >
                  Received {formatCurrency(totalIncome)}
                </th>
              </tr>
            </thead>
            <tbody>
              {incomeTotals.map((i, idx) => (
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input value={i.name} onChange={ev => setIncomeName(idx, ev.target.value)} style={categoryInput} />
                  </td>
                  <td style={thTdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800 }}>$</span>
                      <input
                        type="number"
                        value={Number(i.budget)}
                        onChange={ev => setIncomeBudget(idx, ev.target.value)}
                        style={{ width: 110, fontSize: 15, padding: 6, fontWeight: 800 }}
                      />
                      <div style={{ marginLeft: 6, fontWeight: 800 }}>{formatCurrency(i.budget)}</div>
                    </div>
                  </td>
                  <td
                    style={{
                      ...thTdStyle,
                      whiteSpace: "normal",
                      overflow: "visible",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(i.received)}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={thTdStyle}>
                  <button onClick={addIncomeCategory} style={{ fontWeight: 900 }}>+ Add Income Category</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

                       {/* Transaction History */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Transaction History</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thTdStyle}>Date</th>
              <th style={thTdStyle}>Type</th>
              <th style={thTdStyle}>Category</th>
              <th style={thTdStyle}>Description</th>
              <th style={thTdStyle}>Amount</th>
              <th style={thTdStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td style={thTdStyle} colSpan={6}>No transactions</td>
              </tr>
            ) : (
              filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td style={thTdStyle}>{tx.date}</td>
                  <td style={thTdStyle}>{tx.type}</td>
                  <td style={thTdStyle}>{tx.category}</td>
                  <td style={thTdStyle}>{tx.description}</td>
                  <td style={thTdStyle}>{formatCurrency(tx.amount)}</td>
                  <td style={thTdStyle}>
                    <button onClick={() => deleteTransaction(tx.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Transaction History ends */}
      </div>

      {/* Main wrapper ends */}
    </div>
  );
} // End of Page component
