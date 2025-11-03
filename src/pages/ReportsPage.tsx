import React, { useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useData } from '../context/DataContext';
import { formatCurrency, getTransactionsTotalByType } from '../utils/formatters';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsPage: React.FC = () => {
  const { transactions, categories, settings } = useData();
  const [period, setPeriod] = useState('6months');
  const [chartType, setChartType] = useState('overview');
  
  const firstDayOfMonth = settings.firstDayOfMonth || 1;

  // Calcule la date de début de la période en tenant compte du paramètre de début de mois
  function getStartOfPeriod(baseDate: Date, monthsBack: number, startDay: number) {
    const ref = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    ref.setDate(startDay);
    if (baseDate.getDate() < startDay) {
      ref.setMonth(ref.getMonth() - 1);
    }
    ref.setMonth(ref.getMonth() - monthsBack);
    return ref;
  }

  const endDate = new Date();
  let startDate;
  let monthsBack = 6;
  switch (period) {
    case '1month':
      monthsBack = 1;
      break;
    case '3months':
      monthsBack = 3;
      break;
    case '6months':
      monthsBack = 6;
      break;
    case '12months':
      monthsBack = 12;
      break;
    default:
      monthsBack = 6;
  }
  startDate = getStartOfPeriod(endDate, monthsBack, firstDayOfMonth);

  // Génère les débuts de mois personnalisés pour la période
  const months = [];
  let current = new Date(startDate);
  while (current < endDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  // Filter transactions by date range
  const filteredTransactions = transactions.filter(
    (t) => new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
  
  // Adapter le groupement par mois pour utiliser les débuts/fin personnalisés
  const transactionsByMonth = months.map((monthStart, idx) => {
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return filteredTransactions.filter(
      (t) => new Date(t.date) >= monthStart && new Date(t.date) < nextMonth
    );
  });
  
  // Calculate monthly income and expenses
  const monthlyIncome = transactionsByMonth.map((monthTransactions) =>
    getTransactionsTotalByType(monthTransactions, 'income')
  );
  
  const monthlyExpenses = transactionsByMonth.map((monthTransactions) =>
    getTransactionsTotalByType(monthTransactions, 'expense')
  );
  
  // Calculate monthly balance
  const monthlyBalance = monthlyIncome.map((income, i) => income - monthlyExpenses[i]);
  
  // Format month labels
  const monthLabels = months.map((month) => format(month, 'MMM yyyy'));
  
  // Data for overview chart
  const overviewData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: monthlyIncome,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: monthlyExpenses,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Data for balance chart
  const balanceData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Balance',
        data: monthlyBalance,
        backgroundColor: 'rgba(13, 148, 136, 0.2)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += t.amount;
    });
  
  // Sort and get top categories
  const sortedExpenseCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);
  
  const categoryColors = sortedExpenseCategories.map(([categoryName]) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || '#6B7280';
  });
  
  // Data for category chart
  const categoryData = {
    labels: sortedExpenseCategories.map(([name]) => name),
    datasets: [
      {
        data: sortedExpenseCategories.map(([, value]) => value),
        backgroundColor: categoryColors,
        borderWidth: 0,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number) => formatCurrency(Number(tickValue), settings.currency),
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.raw, settings.currency);
            return label;
          },
        },
      },
    },
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${formatCurrency(value, settings.currency)} (${percentage}%)`;
          },
        },
      },
    },
  };
  
  return (
    <div className="page-container">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border-none bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1 focus:ring-0"
        >
          <option value="1month">Le mois dernier</option>
          <option value="3months">3 derniers mois</option>
          <option value="6months">6 derniers mois</option>
          <option value="12months">12 derniers mois</option>
        </select>
      </header>
      
      <div className="flex mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 mr-2 rounded-lg ${
            chartType === 'overview'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setChartType('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`px-4 py-2 mr-2 rounded-lg ${
            chartType === 'balance'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setChartType('balance')}
        >
          Solde
        </button>
        <button
          className={`px-4 py-2 mr-2 rounded-lg ${
            chartType === 'categories'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setChartType('categories')}
        >
          Catégories
        </button>
      </div>
      
      <div className="card p-4 mb-8">
        <div className="h-80">
          {chartType === 'overview' && <Bar data={overviewData} options={chartOptions} />}
          {chartType === 'balance' && <Line data={balanceData} options={chartOptions} />}
          {chartType === 'categories' && <Doughnut data={categoryData} options={pieOptions} />}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Résumé</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total des revenus</h3>
            <p className="text-xl font-semibold text-green-500 dark:text-green-400">
              {formatCurrency(monthlyIncome.reduce((sum, val) => sum + val, 0), settings.currency)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total des dépenses</h3>
            <p className="text-xl font-semibold text-red-500 dark:text-red-400">
              {formatCurrency(monthlyExpenses.reduce((sum, val) => sum + val, 0), settings.currency)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Solde net</h3>
            <p className={`text-xl font-semibold ${
              monthlyBalance.reduce((sum, val) => sum + val, 0) >= 0
                ? 'text-green-500 dark:text-green-400'
                : 'text-red-500 dark:text-red-400'
            }`}>
              {formatCurrency(monthlyBalance.reduce((sum, val) => sum + val, 0), settings.currency)}
            </p>
          </div>
        </div>
      </div>
      
      {chartType === 'categories' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Catégories de dépenses principales</h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {sortedExpenseCategories.map(([category, amount]) => (
              <div key={category} className="flex justify-between py-3">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: categories.find((c) => c.name === category)?.color || '#6B7280',
                    }}
                  ></div>
                  <span>{category}</span>
                </div>
                <span className="font-medium">{formatCurrency(amount, settings.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;