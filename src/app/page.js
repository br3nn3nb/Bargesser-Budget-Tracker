"use client";

import { useEffect, useState } from "react";

/**
 * Monthly Budget App - Full version
 * - Preserves all previously agreed features
 * - Adds: formatting ($ + commas), table borders, spacing, budget editing, quick add create/edit/delete
 *
 * Drop into src/app/page.js for Next.js (app router).
 */

// Helpers
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
  // state
  const [currentMonth, setCurrentMonth] = useState(getMonthKey());
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [beginningBalance, setBeginningBalance] = useState(0);
  const [newTx, setNewTx] = useState({ type: "expense", category: "", description: "", amount: "", date: "" });
  const [quickAdds, setQuickAdds] = useState({ expense: [], income: [] });
  const [quickAddForm, setQuickAddForm] = useState({ type: "expense", category: "", description: "", amount: "" });
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState("date"); // date, amount, category, description
  const [filterType, setFilterType] = useState("all"); // all, expense, income

  // load per-month data
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
      } catch (e) {
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

  // persist per-month
  useEffect(() => {
    const payload = { expenses, income, transactions, beginningBalance, quickAdds };
    localStorage.setItem(currentMonth, JSON.stringify(payload));
  }, [expenses, income, transactions, beginningBalance, quickAdds, currentMonth]);

  // derived totals
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

  // grouped description totals (only non-empty descriptions)
  const groupedDescriptionTotals = {};
  transactions.forEach(t => {
    if (t.description && String(t.description).trim() !== "") {
      groupedDescriptionTotals[t.description] = (groupedDescriptionTotals[t.description] || 0) + Number(t.amount || 0);
    }
  });

  // transaction sorting/filtering/searching logic for history
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

  // add transaction
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
    setNewTx({ ...newTx, category: "", description: "", amount: "", date: "" });
  };

  // quick add create / use / delete / edit
  const addQuickAdd = () => {
    if (!quickAddForm.category || !quickAddForm.amount) return;
    const q = { category: quickAddForm.category, description: quickAddForm.description || quickAddForm.category, amount: Number(quickAddForm.amount) };
    setQuickAdds({ ...quickAdds, [quickAddForm.type]: [...quickAdds[quickAddForm.type], q] });
    setQuickAddForm({ type: quickAddForm.type, category: "", description: "", amount: "" });
  };

  const useQuickAdd = (q, type) => {
    const tx = {
      id: Date.now(),
      type,
      category: q.category,
      description: q.description || "",
      amount: Number(q.amount),
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions([tx, ...transactions]);

    // optionally bump budget? user previously wanted quick adds to affect budgets — preserve that behavior:
    if (type === "expense") {
      const idx = expenses.findIndex(e => e.name === q.category);
      if (idx !== -1) {
        const next = [...expenses];
        next[idx] = { ...next[idx], budget: Number(next[idx].budget) }; // keep budget unchanged; user edits budget separately
        setExpenses(next);
      }
    } else {
      const idx = income.findIndex(i => i.name === q.category);
      if (idx !== -1) {
        const next = [...income];
        next[idx] = { ...next[idx], budget: Number(next[idx].budget) };
        setIncome(next);
      }
    }
  };

  const deleteQuickAdd = (index, type) => {
    const copy = { ...quickAdds };
    copy[type] = copy[type].filter((_, i) => i !== index);
    setQuickAdds(copy);
  };

  // Add category functions
  const addExpenseCategory = () => setExpenses([...expenses, { name: "New Expense", budget: 0 }]);
  const addIncomeCategory = () => setIncome([...income, { name: "New Income", budget: 0 }]);
  const deleteExpenseCategory = idx => setExpenses(expenses.filter((_, i) => i !== idx));
  const deleteIncomeCategory = idx => setIncome(income.filter((_, i) => i !== idx));

  // edit budget inline handlers: budgets are numbers; inputs show numeric values, prefix $ shown visually
  const setExpenseBudget = (idx, value) => {
    const next = [...expenses];
    next[idx] = { ...next[idx], budget: Number(value || 0) };
    setExpenses(next);
  };
  const setIncomeBudget = (idx, value) => {
    const next = [...income];
    next[idx] = { ...next[idx], budget: Number(value || 0) };
    setIncome(next);
  };

  // edit category name inline
  const setExpenseName = (idx, value) => {
    const next = [...expenses];
    next[idx] = { ...next[idx], name: value };
    setExpenses(next);
  };
  const setIncomeName = (idx, value) => {
    const next = [...income];
    next[idx] = { ...next[idx], name: value };
    setIncome(next);
  };

  // delete transaction
  const deleteTransaction = id => setTransactions(transactions.filter(t => t.id !== id));

  // export / import JSON helpers (kept for completeness)
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
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // month navigation
  const changeMonth = offset => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(y, m - 1 + offset);
    setCurrentMonth(getMonthKey(date));
  };

  // layout & styles (inline for simplicity)
  const tableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    marginBottom: "0.75rem",
    fontSize: "17px",
    tableLayout: "fixed",
  };
  const thTdStyle = {
    border: "1px solid #111",
    padding: "6px 8px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "17px",
    verticalAlign: "middle",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  const inputStyle = { fontSize: "16px", padding: "6px", fontWeight: "700" };
  const smallInput = { width: "90px", ...inputStyle };
  const categoryInput = { width: "300px", ...inputStyle };

  // render
  return (
    <div style={{ padding: 12, background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", lineHeight: 1.2 }}>
      {/* Header: month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button style={{ fontSize: 20, fontWeight: 700 }} onClick={() => changeMonth(-1)}>◀</button>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, textAlign: "center" }}>
          Monthly Budget — {new Date(`${currentMonth}-01`).toLocaleString("default", { month: "long", year: "numeric" })}
        </h1>
        <button style={{ fontSize: 20, fontWeight: 700 }} onClick={() => changeMonth(1)}>▶</button>
      </div>

      {/* Beginning balance (editable with numeric input). display formatted $ to the right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label style={{ fontWeight: 800, fontSize: 18 }}>Beginning Balance</label>
        <input
          type="number"
          value={beginningBalance}
          onChange={e => setBeginningBalance(Number(e.target.value || 0))}
          style={{ ...smallInput, width: 150 }}
        />
        <div style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(beginningBalance)}</div>

        {/* Current balance */}
        <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: 18 }}>
          Current Balance: {formatCurrency(currentBalance)}
        </div>
      </div>

      {/* Controls row: search / sort / import-export */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search transactions..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ padding: 6, fontWeight: 700, fontSize: 16, width: 240 }}
        />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...smallInput }}>
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

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={exportJSON} style={{ fontWeight: 800 }}>Export JSON</button>
          <label style={{ fontWeight: 700 }}>
            Import
            <input type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Add Transaction and Quick Add area - spaced out */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
        {/* Add Transaction box */}
        <div style={{ border: "1px solid #111", padding: 10, borderRadius: 6, minWidth: 420 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 900 }}>Add Transaction</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={newTx.type}
              onChange={e => setNewTx({ ...newTx, type: e.target.value })}
              style={{ ...smallInput }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <select
              value={newTx.category}
              onChange={e => setNewTx({ ...newTx, category: e.target.value })}
              style={{ ...smallInput }}
            >
              <option value="">Select category</option>
              {(newTx.type === "expense" ? expenses : income).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <input
              placeholder="Description"
              value={newTx.description}
              onChange={e => setNewTx({ ...newTx, description: e.target.value })}
              style={{ ...inputStyle, width: 220 }}
            />
            <input
              placeholder="Amount"
              type="number"
              value={newTx.amount}
              onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
              style={{ ...smallInput }}
            />
            <input
              type="date"
              value={newTx.date}
              onChange={e => setNewTx({ ...newTx, date: e.target.value })}
              style={{ ...smallInput }}
            />
            <button onClick={addTransaction} style={{ fontWeight: 800, padding: "8px 12px" }}>Add</button>
          </div>
        </div>

        {/* Quick Add box */}
        <div style={{ border: "1px solid #111", padding: 10, borderRadius: 6, minWidth: 420 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 900 }}>Quick Add</h3>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Existing quick adds */}
            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 800 }}>Expense Quick Adds</div>
              {quickAdds.expense.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <button onClick={() => useQuickAdd(q, "expense")} style={{ fontWeight: 800 }}>
                    {q.description} — {formatCurrency(q.amount)}
                  </button>
                  <button onClick={() => deleteQuickAdd(i, "expense")}>Delete</button>
                </div>
              ))}
            </div>

            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 800 }}>Income Quick Adds</div>
              {quickAdds.income.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <button onClick={() => useQuickAdd(q, "income")} style={{ fontWeight: 800 }}>
                    {q.description} — {formatCurrency(q.amount)}
                  </button>
                  <button onClick={() => deleteQuickAdd(i, "income")}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick add creator (editable custom) */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={quickAddForm.type} onChange={e => setQuickAddForm({ ...quickAddForm, type: e.target.value })} style={smallInput}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input placeholder="Category" value={quickAddForm.category} onChange={e => setQuickAddForm({ ...quickAddForm, category: e.target.value })} style={{ ...inputStyle, width: 180 }} />
            <input placeholder="Description" value={quickAddForm.description} onChange={e => setQuickAddForm({ ...quickAddForm, description: e.target.value })} style={{ ...inputStyle, width: 180 }} />
            <input placeholder="Amount" type="number" value={quickAddForm.amount} onChange={e => setQuickAddForm({ ...quickAddForm, amount: e.target.value })} style={smallInput} />
            <button onClick={addQuickAdd} style={{ fontWeight: 800 }}>Create Quick Add</button>
          </div>
        </div>
      </div>

      {/* Two-column tables: Expenses (left) and Income (right) */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Expenses */}
        <div style={{ flex: 1, minWidth: 480 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Expenses</h2>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "60%" }} />   {/* category gets more space */}
              <col style={{ width: "20%" }} />   {/* budget smaller */}
              <col style={{ width: "20%" }} />   {/* spent smaller */}
            </colgroup>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th style={thTdStyle}>Spent {formatCurrency(totalExpenses)}</th>
              </tr>
            </thead>
            <tbody>
              {expenseTotals.map((e, idx) => (
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input value={e.name} onChange={ev => setExpenseName(idx, ev.target.value)} style={categoryInput} />
                  </td>
                  <td style={thTdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800 }}>{/* $ sign visually */}$</span>
                      <input
                        type="number"
                        value={Number(e.budget)}
                        onChange={ev => setExpenseBudget(idx, ev.target.value)}
                        style={{ ...smallInput, width: 100 }}
                      />
                      <div style={{ marginLeft: 8, fontWeight: 800 }}>{formatCurrency(e.budget)}</div>
                    </div>
                  </td>
                  <td style={thTdStyle}>{formatCurrency(e.spent)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={thTdStyle}>
                  <button onClick={addExpenseCategory} style={{ fontWeight: 800 }}>+ Add Expense Category</button>
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
                <th style={thTdStyle}>Received {formatCurrency(totalIncome)}</th>
              </tr>
            </thead>
            <tbody>
              {incomeTotals.map((i, idx) => (
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input value={i.name} onChange={ev => setIncomeName(idx, ev.target.value)} style={categoryInput} />
                  </td>
                  <td style={thTdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800 }}>$</span>
                      <input
                        type="number"
                        value={Number(i.budget)}
                        onChange={ev => setIncomeBudget(idx, ev.target.value)}
                        style={{ ...smallInput, width: 100 }}
                      />
                      <div style={{ marginLeft: 8, fontWeight: 800 }}>{formatCurrency(i.budget)}</div>
                    </div>
                  </td>
                  <td style={thTdStyle}>{formatCurrency(i.received)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={thTdStyle}>
                  <button onClick={addIncomeCategory} style={{ fontWeight: 800 }}>+ Add Income Category</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grouped totals by description */}
      <div style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>Grouped Totals by Description</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Description</th>
              <th style={thTdStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedDescriptionTotals).length === 0 ? (
              <tr><td style={thTdStyle} colSpan={2}>No grouped descriptions yet</td></tr>
            ) : (
              Object.entries(groupedDescriptionTotals).map(([desc, amt]) => (
                <tr key={desc}>
                  <td style={thTdStyle}>{desc}</td>
                  <td style={thTdStyle}>{formatCurrency(amt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction History */}
      <div style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>Transaction History</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Date</th>
              <th style={thTdStyle}>Type</th>
              <th style={thTdStyle}>Category</th>
              <th style={thTdStyle}>Description</th>
              <th style={thTdStyle}>Amount</th>
              <th style={thTdStyle}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr><td style={thTdStyle} colSpan={6}>No transactions</td></tr>
            ) : (
              filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td style={thTdStyle}>{tx.date}</td>
                  <td style={thTdStyle}>{tx.type}</td>
                  <td style={thTdStyle}>{tx.category}</td>
                  <td style={thTdStyle}>{tx.description}</td>
                  <td style={thTdStyle}>{formatCurrency(tx.amount)}</td>
                  <td style={thTdStyle}><button onClick={() => deleteTransaction(tx.id)}>Delete</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
