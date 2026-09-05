import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trash2, Edit2, Plus, AlertCircle } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Other'];
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetSet, setBudgetSet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'week' | 'month'>('all');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [view, setView] = useState<'dashboard' | 'list' | 'add'>('dashboard');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('expenses');
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (saved) setExpenses(JSON.parse(saved));
    if (savedBudget) {
      setBudget(savedBudget);
      setBudgetSet(true);
    }
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleSetBudget = () => {
    if (budget && parseFloat(budget) > 0) {
      localStorage.setItem('monthlyBudget', budget);
      setBudgetSet(true);
    }
  };

  const handleAddExpense = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const newExpense: Expense = {
      id: editingId || Date.now().toString(),
      amount: parseFloat(amount),
      category,
      date,
      note,
    };

    if (editingId) {
      setExpenses(expenses.map(e => e.id === editingId ? newExpense : e));
      setEditingId(null);
    } else {
      setExpenses([newExpense, ...expenses]);
    }

    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setView('dashboard');
  };

  const handleEdit = (expense: Expense) => {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
    setNote(expense.note);
    setEditingId(expense.id);
    setView('add');
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;

    if (filterCategory) {
      filtered = filtered.filter(e => e.category === filterCategory);
    }

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

    if (filterDateRange === 'week') {
      filtered = filtered.filter(e => new Date(e.date) >= weekAgo);
    } else if (filterDateRange === 'month') {
      filtered = filtered.filter(e => new Date(e.date) >= monthAgo);
    }

    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  const getTodaySpending = () => {
    const today = new Date().toISOString().split('T')[0];
    return expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getWeekSpending = () => {
    const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    return expenses
      .filter(e => new Date(e.date) >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getMonthSpending = () => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return expenses
      .filter(e => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    return CATEGORIES.filter(c => breakdown[c] > 0).map(c => ({
      name: c,
      value: breakdown[c],
    }));
  };

  const monthSpending = getMonthSpending();
  const budgetLimit = budgetSet ? parseFloat(budget) : null;
  const isOverBudget = budgetLimit && monthSpending > budgetLimit;
  const isNearBudget = budgetLimit && monthSpending > budgetLimit * 0.8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💰 Expense Tracker</h1>
          <p className="text-gray-600">Track your spending offline, anytime, anywhere</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setView('dashboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              view === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              view === 'list'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setAmount('');
              setNote('');
              setDate(new Date().toISOString().split('T')[0]);
              setView('add');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              view === 'add'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            <Plus size={20} /> Add
          </button>
        </div>

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold">Today</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">${getTodaySpending().toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold">This Week</p>
                <p className="text-3xl font-bold text-green-600 mt-2">${getWeekSpending().toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm font-semibold">This Month</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">${monthSpending.toFixed(2)}</p>
              </div>
            </div>

            {/* Budget Alert */}
            {budgetSet && (budgetLimit!) && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                isOverBudget
                  ? 'bg-red-50 border-2 border-red-400'
                  : isNearBudget
                  ? 'bg-yellow-50 border-2 border-yellow-400'
                  : 'bg-green-50 border-2 border-green-400'
              }`}>
                <AlertCircle size={24} className={
                  isOverBudget ? 'text-red-600' : isNearBudget ? 'text-yellow-600' : 'text-green-600'
                } />
                <div>
                  <p className={`font-bold ${
                    isOverBudget ? 'text-red-800' : isNearBudget ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {isOverBudget ? '⚠️ Over Budget!' : isNearBudget ? '⚠️ Approaching Budget' : '✅ On Track'}
                  </p>
                  <p className={`text-sm ${
                    isOverBudget ? 'text-red-700' : isNearBudget ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    ${monthSpending.toFixed(2)} of ${budgetLimit!.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Budget Setup */}
            {!budgetSet && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Set Monthly Budget</h2>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Enter budget amount"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSetBudget}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}

            {/* Chart */}
            {filteredExpenses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Spending by Category</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Pie
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Bar
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={getCategoryBreakdown()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getCategoryBreakdown().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  ) : (
                    <BarChart data={getCategoryBreakdown()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* EXPENSE LIST VIEW */}
        {view === 'list' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <div className="flex gap-2">
                    {['all', 'week', 'month'].map(range => (
                      <button
                        key={range}
                        onClick={() => setFilterDateRange(range as 'all' | 'week' | 'month')}
                        className={`px-4 py-2 rounded font-semibold transition ${
                          filterDateRange === range
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {range === 'all' ? 'All Time' : range === 'week' ? 'This Week' : 'This Month'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        filterCategory === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded font-semibold transition ${
                          filterCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <p className="text-lg font-semibold">No expenses found</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {filteredExpenses.map(expense => (
                    <div key={expense.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {expense.category}
                          </span>
                          <span className="text-xs text-gray-500">{expense.date}</span>
                        </div>
                        {expense.note && <p className="text-sm text-gray-600 mt-1">{expense.note}</p>}
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="text-xl font-bold text-gray-800 min-w-fit">${expense.amount.toFixed(2)}</p>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD EXPENSE VIEW */}
        {view === 'add' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingId ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                <textarea
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddExpense}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update' : 'Add'} Expense
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
