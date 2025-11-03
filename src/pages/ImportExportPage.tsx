import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileUp, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { exportData, exportCSV, importData as importDataUtil, defaultCategories } from '../utils/storage';
import * as XLSX from 'xlsx';

const ImportExportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const { importData, transactions, categories, settings, budgets } = useData();
  
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportExcel = () => {
    if (excelInputRef.current) {
      excelInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setImportStatus(null);
    
    try {
      const data = await importDataUtil(file);
      importData(data);
      setImportStatus({
        type: 'success',
        message: 'Data imported successfully!',
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import data',
      });
    } finally {
      setImporting(false);
      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportStatus(null);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target && event.target.result;
        if (result && result instanceof ArrayBuffer) {
          const data = new Uint8Array(result);
          const workbook = XLSX.read(data, { type: 'array' });
          // Nouvelle structure : toutes les opérations dans "Opérations"
          let transactions: any[] = [];
          if (workbook.SheetNames.includes('Opérations')) {
            const ops = XLSX.utils.sheet_to_json(workbook.Sheets['Opérations']);
            transactions = ops.map((item: any, idx: number) => ({
              id: item.ID || `${Date.now()}_op_${idx}`,
              date: item.Date || '',
              category: item.Category || '',
              amount: Number(Math.abs(item.Amount)) || 0,
              type: Number(item.Amount) < 0 ? 'expense' : 'income',
              notes: item.Notes || '',
              description: item.Description || '',
            }));
          }
          // Catégories
          let categories: any[] = [];
          if (workbook.SheetNames.includes('Catégories')) {
            categories = XLSX.utils.sheet_to_json(workbook.Sheets['Catégories']);
          } else {
            categories = defaultCategories;
          }
          // Paramètres
          let settings: any = undefined;
          if (workbook.SheetNames.includes('Paramètres')) {
            const settingsArr = XLSX.utils.sheet_to_json(workbook.Sheets['Paramètres']);
            settings = settingsArr[0];
          } else {
            settings = {
              currency: 'EUR',
              firstDayOfMonth: 1,
              theme: 'system',
            };
          }
          // Budgets planifiés
          let plannedBudgets: any[] = [];
          if (workbook.SheetNames.includes('Budgets planifiés')) {
            plannedBudgets = XLSX.utils.sheet_to_json(workbook.Sheets['Budgets planifiés']);
          }
          // Budgets : ajoute isTemplate true pour les planifiés
          const budgets = plannedBudgets.map((b: any, idx: number) => ({
            id: b.ID || `${Date.now()}_budget_${idx}`,
            category: b.Category || '',
            amount: Number(b.Amount) || 0,
            period: b.Period || 'monthly',
            startDate: b.StartDate || new Date().toISOString().split('T')[0],
            notes: b.Notes || '',
            isTemplate: true,
          }));
          // Catégories : typage correct
          const categoriesTyped = categories.map((c: any, idx: number) => ({
            id: c.ID || c.id || `${Date.now()}_cat_${idx}`,
            name: c.Name || c.name || '',
            type: c.Type || c.type || 'expense',
            color: c.Color || c.color || '#6B7280',
            icon: c.Icon || c.icon || undefined,
          }));
          // Paramètres : typage correct
          const settingsTyped = {
            currency: settings.currency || 'EUR',
            firstDayOfMonth: Number(settings.firstDayOfMonth) || 1,
            theme: settings.theme || 'system',
          };
          const appData = {
            transactions,
            budgets,
            categories: categoriesTyped,
            settings: settingsTyped,
          };
          importData(appData);
          setImportStatus({
            type: 'success',
            message: 'Excel data imported successfully!',
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'Failed to read Excel file.',
          });
        }
        setImporting(false);
        if (e.target) e.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import Excel data',
      });
      setImporting(false);
    }
  };

  const handleExportToExcel = () => {
    // Nouvelle structure : toutes les opérations dans "Opérations"
    const operations = transactions.map(t => ({
      ID: t.id,
      Date: t.date,
      Category: t.category,
      Amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
      Description: t.description,
      Notes: t.notes || '',
    }));
    // Catégories
    const categoriesSheet = categories.map(c => ({
      ID: c.id,
      Name: c.name,
      Type: c.type,
      Color: c.color,
      Icon: c.icon || '',
    }));
    // Paramètres
    const settingsSheet = [settings];
    // Budgets planifiés
    const plannedBudgets = budgets.filter(b => b.isTemplate).map(b => ({
      ID: b.id,
      Category: b.category,
      Amount: b.amount,
      Period: b.period,
      StartDate: b.startDate,
      Notes: b.notes || '',
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(operations), 'Opérations');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoriesSheet), 'Catégories');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(settingsSheet), 'Paramètres');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(plannedBudgets), 'Budgets planifiés');
    XLSX.writeFile(workbook, 'finance_tracker_export.xlsx');
  };
  
  return (
    <div className="page-container">
      <header className="flex items-center mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Import/Export</h1>
      </header>
      
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Exporter les données</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Téléchargez une sauvegarde de toutes vos données, y compris les transactions, les budgets et les paramètres.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => exportData()}
            className="w-full btn-primary flex items-center justify-center"
          >
            <FileDown size={20} className="mr-2" />
            Exporter toutes les données (JSON)
          </button>
          <button
            onClick={handleExportToExcel}
            className="w-full btn-outline flex items-center justify-center"
          >
            <FileDown size={20} className="mr-2" />
            Exporter les transactions (Excel)
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => exportCSV('transactions')}
              className="btn-outline flex items-center justify-center"
            >
              <FileDown size={18} className="mr-2" />
              Transactions (CSV)
            </button>
            <button
              onClick={() => exportCSV('budgets')}
              className="btn-outline flex items-center justify-center"
            >
              <FileDown size={18} className="mr-2" />
              Budgets (CSV)
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Importer des données</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Restaurez les données à partir d'un fichier JSON exporté précédemment.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleImport}
            className="w-full btn-primary flex items-center justify-center"
            disabled={importing}
          >
            <FileUp size={20} className="mr-2" />
            {importing ? 'Importation...' : 'Importer les données (JSON)'}
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleImportExcel}
            className="w-full btn-outline flex items-center justify-center"
            disabled={importing}
          >
            <FileUp size={20} className="mr-2" />
            {importing ? 'Importation...' : 'Importer depuis Excel (.xlsx)'}
          </button>
          <input
            type="file"
            ref={excelInputRef}
            onChange={handleExcelFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          
          {importStatus && (
            <div className={`p-4 rounded-lg flex items-start ${
              importStatus.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="font-medium mb-2">Notes importantes :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>L'importation de données remplacera toutes les données existantes</li>
              <li>Pensez à sauvegarder vos données actuelles avant d'importer</li>
              <li>Seuls les fichiers JSON exportés depuis cette application sont supportés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage;