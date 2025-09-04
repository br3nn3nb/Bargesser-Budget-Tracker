"use client";

import { useState, useEffect } from "react";

const getMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(getMonthKey());
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ type: "expense", category: "", description: "", amount: 0, date: "" });
  const [beginningBalance, setBeginningBalance] = useState(0);
  const [quickAdds, setQuickAdds] = useState({ expense: [], income: [] });

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem(currentMonth));
    if (savedData) {
      setExpenses(savedData.expenses || defaultExpenses);
      setIncome(savedData.income || defaultIncome);
      setTransactions(savedData.transactions || []);
      setBeginningBalance(savedData.beginningBalance || 0);
      setQuickAdds(savedData.quickAdds || { expense: [], income: [] });
    } else {
      setExpenses(defaultExpenses);
      setIncome(defaultIncome);
      setTransactions([]);
      setBeginningBalance(0);
      setQuickAdds({ expense: [], income: [] });
    }
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem(
      currentMonth,
      JSON.stringify({ expenses, income, transactions, beginningBalance, quickAdds })
    );
  }, [expenses, income, transactions, beginningBalance, quickAdds, currentMonth]);

  const expenseTotals = expenses.map(e => ({
    ...e,
    total: transactions.filter(t => t.type === "expense" && t.category === e.name)
                       .reduce((sum, t) => sum + t.amount, 0)
  }));

  const incomeTotals = income.map(i => ({
    ...i,
    total: transactions.filter(t => t.type === "income" && t.category === i.name)
                       .reduce((sum, t) => sum + t.amount, 0)
  }));

  const totalIncome = incomeTotals.reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenseTotals.reduce((sum, e) => sum + e.total, 0);
  const balance = beginningBalance + totalIncome - totalExpenses;

  const groupedDescriptionTotals = {};
  transactions.forEach(t => {
    if (!groupedDescriptionTotals[t.description]) groupedDescriptionTotals[t.description] = 0;
    groupedDescriptionTotals[t.description] += t.amount;
  });

  const addTransaction = () => {
    if (!newTx.category || !newTx.amount) return;
    const tx = { ...newTx, amount: Number(newTx.amount), id: Date.now() };
    setTransactions([tx, ...transactions]);
    setNewTx({ type: newTx.type, category: "", description: "", amount: 0, date: "" });
  };

  const useQuickAdd = (q, type) => {
    const tx = {
      id: Date.now(),
      type,
      category: q.category,
      description: q.description,
      amount: q.amount,
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions([tx, ...transactions]);
    if (type === "expense") {
      const idx = expenses.findIndex(e => e.name === q.category);
      if (idx !== -1) {
        const newExpenses = [...expenses];
        newExpenses[idx].budget += q.amount;
        setExpenses(newExpenses);
      }
    } else {
      const idx = income.findIndex(i => i.name === q.category);
      if (idx !== -1) {
        const newIncome = [...income];
        newIncome[idx].budget += q.amount;
        setIncome(newIncome);
      }
    }
  };

  const changeMonth = (offset) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset);
    setCurrentMonth(getMonthKey(date));
  };

  const monthTitle = new Date(`${currentMonth}-01`).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const tableStyle = { borderCollapse: "collapse", width: "100%", marginBottom: "0.5rem", fontSize: "18px" };
  const thTdStyle = { border: "1px solid black", padding: "6px", textAlign: "left", fontWeight: "bold", fontSize: "18px" };
  const compactInput = { width: "100px", fontSize: "18px", padding: "4px", fontWeight: "bold" };
  const nameInput = { width: "150px", fontSize: "18px", padding: "4px", fontWeight: "bold" };

  return (
    <div style={{ padding: "0.5rem", backgroundColor: "white", color: "black", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={{ fontWeight: "bold", fontSize: "20px" }} onClick={() => changeMonth(-1)}>◀</button>
        <h1 style={{ textAlign: "center", fontSize: "30px", fontWeight: "bold", margin: "0" }}>Monthly Budget – {monthTitle}</h1>
        <button style={{ fontWeight: "bold", fontSize: "20px" }} onClick={() => changeMonth(1)}>▶</button>
      </div>

      <h3 style={{ margin: "0.5rem 0", fontWeight: "bold", fontSize: "20px" }}>Beginning Balance: ${beginningBalance.toFixed(2)}</h3>
      <h3 style={{ margin: "0.5rem 0 1rem", fontWeight: "bold", fontSize: "20px" }}>Current Balance: ${balance.toFixed(2)}</h3>

      {/* Add Transaction Form */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <select value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value })} style={{ fontWeight: "bold", fontSize: "18px" }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select value={newTx.category} onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} style={{ fontWeight: "bold", fontSize: "18px" }}>
          <option value="">Select Category</option>
          {(newTx.type === "expense" ? expenses : income).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <input type="text" placeholder="Description" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} style={{ fontWeight: "bold", fontSize: "18px" }} />
        <input type="number" placeholder="Amount" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} style={compactInput} />
        <input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} style={{ fontWeight: "bold", fontSize: "18px" }} />
        <button style={{ fontWeight: "bold", fontSize: "18px" }} onClick={addTransaction}>Add</button>
      </div>

      {/* Quick Add Tab */}
      <h2 style={{ fontWeight: "bold", fontSize: "22px", marginBottom: "0.5rem" }}>Quick Add</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {["expense", "income"].map(type => quickAdds[type].map((q, idx) => (
          <div key={`${type}-${idx}`} style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            <button style={{ fontWeight: "bold", fontSize: "18px" }} onClick={() => useQuickAdd(q, type)}>{q.description} – ${q.amount} ({type})</button>
            <button style={{ fontWeight: "bold", fontSize: "18px" }} onClick={() => setQuickAdds({...quickAdds, [type]: quickAdds[type].filter((_, i) => i !== idx)})}>✕</button>
          </div>
        )))}
        <button style={{ fontWeight: "bold", fontSize: "18px" }}
          onClick={() => {
            const desc = prompt("Quick Add Description:");
            const amt = parseFloat(prompt("Amount:"));
            const cat = prompt("Category:");
            const type = prompt("Type (expense/income):");
            if(desc && !isNaN(amt) && cat && (type==="expense"||type==="income")){
              setQuickAdds({...quickAdds, [type]: [...quickAdds[type], {description:desc, amount:amt, category:cat}]});
            }
          }}>+ Add Quick Add</button>
      </div>

      {/* Expenses and Income side by side */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0.5rem 0", fontWeight: "bold", fontSize: "20px" }}>Expenses</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th style={thTdStyle}>Spent</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, idx) => (
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input type="text" value={e.name} onChange={(ev)=>{
                      const newExpenses = [...expenses]; newExpenses[idx].name = ev.target.value; setExpenses(newExpenses);
                    }} style={nameInput} />
                  </td>
                  <td style={thTdStyle}>
                    <input type="number" value={e.budget} onChange={(ev)=>{
                      const newExpenses = [...expenses]; newExpenses[idx].budget = Number(ev.target.value); setExpenses(newExpenses);
                    }} style={compactInput} />
                  </td>
                  <td style={thTdStyle}>{transactions.filter(t=>t.type==="expense"&&t.category===e.name).reduce((sum,t)=>sum+t.amount,0).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{textAlign:"center", padding:"4px"}}>
                  <button style={{fontWeight:"bold", fontSize:"18px"}} onClick={()=>setExpenses([...expenses,{name:"New Expense",budget:0}])}>+ Add Expense Category</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0.5rem 0", fontWeight: "bold", fontSize: "20px" }}>Income</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th style={thTdStyle}>Received</th>
              </tr>
            </thead>
            <tbody>
              {income.map((i, idx)=>(
                <tr key={idx}>
                  <td style={thTdStyle}>
                    <input type="text" value={i.name} onChange={(ev)=>{
                      const newIncome=[...income]; newIncome[idx].name=ev.target.value; setIncome(newIncome);
                    }} style={nameInput}/>
                  </td>
                  <td style={thTdStyle}>
                    <input type="number" value={i.budget} onChange={(ev)=>{
                      const newIncome=[...income]; newIncome[idx].budget=Number(ev.target.value); setIncome(newIncome);
                    }} style={compactInput}/>
                  </td>
                  <td style={thTdStyle}>{transactions.filter(t=>t.type==="income"&&t.category===i.name).reduce((sum,t)=>sum+t.amount,0).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{textAlign:"center", padding:"4px"}}>
                  <button style={{fontWeight:"bold", fontSize:"18px"}} onClick={()=>setIncome([...income,{name:"New Income",budget:0}])}>+ Add Income Category</button>
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontWeight:"bold", fontSize:"18px"}}>Grouped Transaction Totals</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Description</th>
                <th style={thTdStyle}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedDescriptionTotals).map(([desc, amt])=>(
                <tr key={desc}>
                  <td style={thTdStyle}>{desc}</td>
                  <td style={thTdStyle}>{amt.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <h2 style={{ margin: "0.5rem 0", fontWeight:"bold", fontSize:"20px"}}>Transaction History</h2>
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
          {transactions.map(t=>(
            <tr key={t.id}>
              <td style={thTdStyle}>{t.date}</td>
              <td style={thTdStyle}>{t.type}</td>
              <td style={thTdStyle}>{t.category}</td>
              <td style={thTdStyle}>{t.description}</td>
              <td style={thTdStyle}>{t.amount.toFixed(2)}</td>
              <td style={thTdStyle}><button style={{fontWeight:"bold", fontSize:"18px"}} onClick={()=>setTransactions(transactions.filter(tx=>tx.id!==t.id))}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
