import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Plus, Eye, DollarSign, ArrowRight 
} from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import BalanceCard from '../components/dashboard/BalanceCard';
import TransactionList from '../components/transactions/TransactionList';
import ExpenseChart from '../components/charts/ExpenseChart';
import ChooseLanguage from '../components/ChooseLanguage'; // Import du composant

// Fonction utilitaire pour obtenir la date de début de période personnalisée
function getStartOfCurrentPeriod(startOfMonthDay: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (now.getDate() < startOfMonthDay) {
    // On est avant le jour de début, donc on prend le mois précédent
    return new Date(year, month - 1, startOfMonthDay);
  }
  return new Date(year, month, startOfMonthDay);
}

function getEndOfCurrentPeriod(startOfMonthDay: number): Date {
  const start = getStartOfCurrentPeriod(startOfMonthDay);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return end;
}

const HomePage: React.FC = () => {
  const { transactions, settings } = useData();
  const { t } = useTranslation(); // Hook pour les traductions
  
  // BalanceCard utilise maintenant le paramètre de début de mois
  // settings.startOfMonthDay doit exister dans les paramètres

  // Get recent transactions (last 5 of each type)
  const recentExpenses = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return String(a.id).localeCompare(String(b.id));
  })
    .slice(0, 5);
    
  const recentIncome = transactions
    .filter((t) => t.type === 'income')
    .sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return String(a.id).localeCompare(String(b.id));
  })
    .slice(0, 5);
  
  const startPeriod = getStartOfCurrentPeriod(settings.firstDayOfMonth || 1);
  const endPeriod = getEndOfCurrentPeriod(settings.firstDayOfMonth || 1);
  const currentMonthTransactions = transactions.filter(
    (t) => {
      const d = new Date(t.date);
      return d >= startPeriod && d < endPeriod;
    }
  );
  
  return (
    <div className="page-container">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accueil</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'MMMM yyyy')}
          </div>
          <ChooseLanguage />
        </div>
      </header>
      
      <section className="mb-8 animate-fade-in">
        <BalanceCard 
          transactions={currentMonthTransactions}
          currency={settings.currency}
          startOfMonthDay={settings.firstDayOfMonth || 1}
        />
      </section>
      
      <section className="mb-8 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Dépenses</h2>
            <Link to="/reports" className="text-primary-600 dark:text-primary-400 flex items-center text-sm">
              <span className="mr-1">Voir tout</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card h-64">
            <ExpenseChart transactions={currentMonthTransactions} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Dépenses récentes</h2>
            <Link to="/expenses" className="text-primary-600 dark:text-primary-400 flex items-center text-sm">
              <span className="mr-1">Voir tout</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <TransactionList transactions={recentExpenses} limit={5} />
          ) : (
            <div className="card flex flex-col items-center justify-center py-8">
              <TrendingDown size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune dépense récente</p>
              <Link to="/expenses/add" className="btn-primary flex items-center">
                <Plus size={16} className="mr-2" />
                Ajouter une dépense
              </Link>
            </div>
          )}
        </div>
      </section>
      
      <section className="mb-8 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Revenus récents</h2>
          <Link to="/income" className="text-primary-600 dark:text-primary-400 flex items-center text-sm">
            <span className="mr-1">Voir tout</span>
            <ArrowRight size={16} />
          </Link>
        </div>
        {recentIncome.length > 0 ? (
          <TransactionList transactions={recentIncome} limit={5} />
        ) : (
          <div className="card flex flex-col items-center justify-center py-8">
            <TrendingUp size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun revenu récent</p>
            <Link to="/income/add" className="btn-secondary flex items-center">
              <Plus size={16} className="mr-2" />
              Ajouter un revenu
            </Link>
          </div>
        )}
      </section>
      
      <div className="fixed bottom-20 right-4 flex flex-col space-y-4">
        <Link
          to="/expenses/add"
          className="bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 transition-all"
          aria-label="Ajouter une dépense"
        >
          <TrendingDown size={24} />
        </Link>
        <Link
          to="/income/add"
          className="bg-accent-600 text-white rounded-full p-3 shadow-lg hover:bg-accent-700 transition-all"
          aria-label="Ajouter un revenu"
        >
          <TrendingUp size={24} />
        </Link>
      </div>
    </div>
  );
};

export default HomePage;