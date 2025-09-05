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
  const [beginningBalance, setBeginningBalance] = useState(0);
  const [quickAdds, setQuickAdds] = useState({ expense: [], income: [] });
  const [newTx, setNewTx] = useState({ type: "expense", category: "", description: "", amount: 0, date: "" });

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

  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const balance = beginningBalance + totalIncome - totalExpenses;

  const expenseTotals = expenses.map(e => ({
    ...e,
    spent: transactions.filter(t => t.type === "expense" && t.category === e.name).reduce((sum, t) => sum + t.amount, 0)
  }));

  const incomeTotals = income.map(i => ({
    ...i,
    received: transactions.filter(t => t.type === "income" && t.category === i.name).reduce((sum, t) => sum + t.amount, 0)
  }));

  const groupedDescriptionTotals = {};
  transactions.forEach(t => {
    if (t.description) {
      if (!groupedDescriptionTotals[t.description]) groupedDescriptionTotals[t.description] = 0;
      groupedDescriptionTotals[t.description] += t.amount;
    }
  });

  const formatCurrency = (num) => "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addTransaction = () => {
    if (!newTx.category || !newTx.amount) return;
    const tx = { ...newTx, amount: Number(newTx.amount), id: Date.now() };
    setTransactions([tx, ...transactions]);
    setNewTx({ type: newTx.type, category: "", description: "", amount: 0, date: "" });
  };

  const handleQuickAdd = (q, type) => {
    const tx = { id: Date.now(), type, category: q.category, description: q.description, amount: q.amount, date: new Date().toISOString().split("T")[0] };
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

  const monthTitle = new Date(`${currentMonth}-01`).toLocaleString("default", { month: "long", year: "numeric" });

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

      <div style={{ margin: "0.5rem 0" }}>
        <label style={{ fontWeight: "bold", fontSize: "20px", marginRight: "0.5rem" }}>Beginning Balance: </label>
        <input
          type="number"
          value={beginningBalance}
          onChange={(e) => setBeginningBalance(Number(e.target.value))}
          style={{ fontWeight: "bold", fontSize: "20px", width: "150px", padding: "4px" }}
        />
        <span style={{ fontWeight: "bold", fontSize: "20px", marginLeft: "0.5rem" }}>{formatCurrency(beginningBalance)}</span>
      </div>

      <h3 style={{ margin: "0.5rem 0 1rem", fontWeight: "bold", fontSize: "20px" }}>
        Current Balance: {formatCurrency(balance)}
      </h3>

      {/* Add Transaction Section */}
      <div style={{ marginBottom: "1rem", fontWeight: "bold" }}>
        <h2 style={{ fontSize: "22px" }}>Add Transaction</h2>
        <select value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value })} style={compactInput}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select value={newTx.category} onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} style={compactInput}>
          {(newTx.type === "expense" ? expenses : income).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <input type="text" placeholder="Description" value={newTx.description} onChange={(e)=>setNewTx({...newTx, description:e.target.value})} style={{ ...compactInput, width:"200px" }} />
        <input type="number" placeholder="Amount" value={newTx.amount} onChange={(e)=>setNewTx({...newTx, amount:Number(e.target.value)})} style={compactInput} />
        <input type="date" value={newTx.date} onChange={(e)=>setNewTx({...newTx, date:e.target.value})} style={compactInput} />
        <button onClick={addTransaction} style={{ fontWeight: "bold", fontSize: "18px", marginLeft:"5px" }}>Add</button>
      </div>

      {/* Quick Add Section */}
      <div style={{ marginBottom: "1rem", fontWeight: "bold" }}>
        <h2 style={{ fontSize: "22px" }}>Quick Add</h2>
        <div>
          <h3>Expense Quick Adds</h3>
          {quickAdds.expense.map((q,i)=>(
            <div key={i}>
              <button onClick={()=>handleQuickAdd(q,"expense")}>{q.description} – {formatCurrency(q.amount)}</button>
              <button onClick={()=>{setQuickAdds({...quickAdds,expense:quickAdds.expense.filter((_,idx)=>idx!==i)})}}>Delete</button>
            </div>
          ))}
          <button onClick={()=>setQuickAdds({...quickAdds,expense:[...quickAdds.expense,{category:"Rent",description:"Rent",amount:1184}]})}>+ Add Quick Expense</button>
        </div>
        <div>
          <h3>Income Quick Adds</h3>
          {quickAdds.income.map((q,i)=>(
            <div key={i}>
              <button onClick={()=>handleQuickAdd(q,"income")}>{q.description} – {formatCurrency(q.amount)}</button>
              <button onClick={()=>{setQuickAdds({...quickAdds,income:quickAdds.income.filter((_,idx)=>idx!==i)})}}>Delete</button>
            </div>
          ))}
          <button onClick={()=>setQuickAdds({...quickAdds,income:[...quickAdds.income,{category:"GSA",description:"GSA",amount:0}]})}>+ Add Quick Income</button>
        </div>
      </div>

      {/* Expenses & Income Tables */}
      <div style={{ display:"flex", gap:"2rem", flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:"20px", fontWeight:"bold" }}>Expenses</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th style={thTdStyle}>Spent {formatCurrency(totalExpenses)}</th>
              </tr>
            </thead>
            <tbody>
              {expenseTotals.map((e,idx)=>(
                <tr key={idx}>
                  <td><input type="text" value={e.name} onChange={(ev)=>{const newEx=[...expenses];newEx[idx].name=ev.target.value; setExpenses(newEx)}} style={nameInput} /></td>
                  <td><input type="number" value={e.budget} onChange={(ev)=>{const newEx=[...expenses];newEx[idx].budget=Number(ev.target.value); setExpenses(newEx)}} style={compactInput} /></td>
                  <td>{formatCurrency(e.spent)}</td>
                </tr>
              ))}
              <tr><td colSpan={3}><button onClick={()=>setExpenses([...expenses,{name:"New Expense",budget:0}])} style={{fontWeight:"bold"}}>+ Add Expense Category</button></td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:"20px", fontWeight:"bold" }}>Income</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Category</th>
                <th style={thTdStyle}>Budget</th>
                <th style={thTdStyle}>Received {formatCurrency(totalIncome)}</th>
              </tr>
            </thead>
            <tbody>
              {incomeTotals.map((i,idx)=>(
                <tr key={idx}>
                  <td><input type="text" value={i.name} onChange={(ev)=>{const newIn=[...income];newIn[idx].name=ev.target.value; setIncome(newIn)}} style={nameInput} /></td>
                  <td><input type="number" value={i.budget} onChange={(ev)=>{const newIn=[...income];newIn[idx].budget=Number(ev.target.value); setIncome(newIn)}} style={compactInput} /></td>
                  <td>{formatCurrency(i.received)}</td>
                </tr>
              ))}
              <tr><td colSpan={3}><button onClick={()=>setIncome([...income,{name:"New Income",budget:0}])} style={{fontWeight:"bold"}}>+ Add Income Category</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grouped Totals */}
      <h2 style={{ fontWeight:"bold", fontSize:"20px" }}>Grouped Totals by Description</h2>
      <table style={tableStyle}>
        <thead><tr><th style={thTdStyle}>Description</th><th style={thTdStyle}>Total</th></tr></thead>
        <tbody>
          {Object.entries(groupedDescriptionTotals).map(([desc,total])=>(
            <tr key={desc}><td style={thTdStyle}>{desc}</td><td style={thTdStyle}>{formatCurrency(total)}</td></tr>
          ))}
        </tbody>
      </table>

      {/* Transaction History */}
      <h2 style={{ fontWeight:"bold", fontSize:"20px" }}>Transaction History</h2>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thTdStyle}>Date</th><th style={thTdStyle}>Type</th><th style={thTdStyle}>Category</th><th style={thTdStyle}>Description</th><th style={thTdStyle}>Amount</th></tr>
        </thead>
        <tbody>
          {transactions.map(tx=>(
            <tr key={tx.id}>
              <td style={thTdStyle}>{tx.date}</td>
              <td style={thTdStyle}>{tx.type}</td>
              <td style={thTdStyle}>{tx.category}</td>
              <td style={thTdStyle}>{tx.description}</td>
              <td style={thTdStyle}>{formatCurrency(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
