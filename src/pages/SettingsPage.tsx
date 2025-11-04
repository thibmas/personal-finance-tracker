import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Tag, Download, Upload, Trash, Moon, Sun, ArrowRight, 
  DollarSign, Calendar, FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { exportData, exportCSV } from '../utils/storage';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import EditBudgetModal from '../EditBudgetPage';
import { Category } from '../types';

const defaultCategories: Category[] = [
  { id: "1", name: "Solde initial", type: "income", color: "#EF4444", icon: "" },
  { id: "2", name: "Revenus professionnels", type: "income", color: "#F59E0B", icon: "" },
  { id: "3", name: "Prime", type: "income", color: "#1ab783", icon: "" },
  { id: "4", name: "Achat", type: "expense", color: "#f27379", icon: "" },
  { id: "5", name: "Course Alimentation", type: "expense", color: "#deafe4", icon: "" },
  { id: "6", name: "Numérique Téléphonie", type: "expense", color: "#f7ef97", icon: "" },
  { id: "7", name: "Sortie", type: "expense", color: "#ff8e7a", icon: "" },
  { id: "8", name: "Voiture", type: "expense", color: "#f28073", icon: "" },
  { id: "9", name: "Bébé", type: "expense", color: "#f0a3d4", icon: "" },
  { id: "10", name: "Santé", type: "expense", color: "#ffcfa8", icon: "" },
  { id: "11", name: "Epargne", type: "expense", color: "#a76fec", icon: "" },
  { id: "12", name: "Assurance", type: "expense", color: "#ff99bd", icon: "" },
  { id: "13", name: "Restaurant", type: "expense", color: "#f0d589", icon: "" },
  { id: "14", name: "Essence", type: "expense", color: "#b1c8ec", icon: "" },
  { id: "15", name: "Logement", type: "expense", color: "#a6f995", icon: "" },
  { id: "16", name: "Frais compte", type: "expense", color: "#91a3ee", icon: "" },
  { id: "17", name: "Hors Budget", type: "expense", color: "#afe8f3", icon: "" },
  { id: "18", name: "Energie", type: "expense", color: "#b795e9", icon: "" },
  { id: "19", name: "Impôts", type: "expense", color: "#a8e1b9", icon: "" },
  { id: "02d193b1-3276-40c4-8aeb-c8449a399ed9", name: "Début de mois", type: "expense", color: "#f5b3d6", icon: "" }
];

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, resetData, transactions, importData } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const docId = 'budget-share-id'; // Remplacer par la logique réelle pour obtenir l'id
  const shareLink = `${window.location.origin}/share/${docId}`;
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      ...settings,
      currency: e.target.value,
    });
  };
  
  const handleFirstDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      ...settings,
      firstDayOfMonth: parseInt(e.target.value),
    });
  };
  
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      ...settings,
      theme: e.target.value as 'light' | 'dark' | 'system',
    });
  };
  
  const handleReset = () => {
    // Réinitialise toutes les données et restaure les catégories par défaut
    updateSettings({
      currency: 'USD',
      firstDayOfMonth: 1,
      theme: 'system',
    });
    // Remet les catégories par défaut et vide transactions et budgets
    // On suppose que useData expose une méthode importData ou setData
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('finance_tracker_data');
    }
    // Si importData est disponible dans useData
    if (typeof importData === 'function') {
      importData({
        transactions: [],
        budgets: [],
        categories: defaultCategories,
        settings: {
          currency: 'USD',
          firstDayOfMonth: 1,
          theme: 'system',
        },
      });
    } else if (typeof resetData === 'function') {
      // Fallback : resetData recharge les données initiales (qui incluent les catégories par défaut)
      resetData();
    }
    setShowResetConfirm(false);
  };

  const handleExportToExcel = () => {
    const data = transactions.map(transaction => ({
      Date: transaction.date,
      Category: transaction.category,
      Amount: transaction.amount,
      Type: transaction.type,
      Notes: transaction.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    XLSX.writeFile(workbook, 'transactions.xlsx');
  };

  const handleImportFromExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target && event.target.result;
      if (result && result instanceof ArrayBuffer) {
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Imported data:', jsonData);
        // Process and save the imported data
      } else {
        console.error('Failed to read file as ArrayBuffer.');
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  return (
    <div className="page-container">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </header>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Préférences</h2>
        <div className="card space-y-6">
          <div>
            <label htmlFor="currency" className="input-label">Devise</label>
            <div className="flex items-center">
              <DollarSign size={20} className="text-gray-500 mr-2" />
              <select
                id="currency"
                value={settings.currency}
                onChange={handleCurrencyChange}
                className="flex-1"
              >
                <option value="USD">Dollar américain (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">Livre sterling (GBP)</option>
                <option value="JPY">Yen (JPY)</option>
                <option value="CAD">Dollar canadien (CAD)</option>
                <option value="AUD">Dollar australien (AUD)</option>
                <option value="CHF">Franc suisse (CHF)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="firstDay" className="input-label">Premier jour du mois</label>
            <div className="flex items-center">
              <Calendar size={20} className="text-gray-500 mr-2" />
              <select
                id="firstDay"
                value={settings.firstDayOfMonth}
                onChange={handleFirstDayChange}
                className="flex-1"
              >
                <option value="1">1</option>
                <option value="15">15</option>
                <option value="25">25</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="theme" className="input-label">Thème</label>
            <div className="flex items-center">
              {theme === 'dark' ? (
                <Moon size={20} className="text-gray-500 mr-2" />
              ) : (
                <Sun size={20} className="text-gray-500 mr-2" />
              )}
              <select
                id="theme"
                value={settings.theme}
                onChange={handleThemeChange}
                className="flex-1"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="system">Système</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Gestion des données</h2>
        <div className="space-y-2">
          <Link
            to="/settings/categories"
            className="card block hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                  <Tag size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium">Catégories</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gérez vos catégories de dépenses et de revenus
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </div>
          </Link>
          
          <Link
            to="/settings/import-export"
            className="card block hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                  <FileText size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium">Import/Export</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Importez ou exportez vos données
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </div>
          </Link>
                    
          <button
            onClick={() => setShowResetConfirm(true)}
            className="card block w-full hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg mr-3">
                <Trash size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Réinitialiser toutes les données</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Réinitialisez toutes vos données et restaurez les catégories par défaut
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>
      
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Confirmer la réinitialisation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="btn-outline"
                onClick={() => setShowResetConfirm(false)}
              >
                Annuler
              </button>
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white"
                onClick={handleReset}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setModalOpen(true)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }} title="Partager">
        <span role="img" aria-label="share">🔗</span>
      </button>
      <EditBudgetModal open={modalOpen} onClose={() => setModalOpen(false)} shareLink={shareLink} />
    </div>
  );
};

export default SettingsPage;