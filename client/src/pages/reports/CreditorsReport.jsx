import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBuilding,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTruck
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

// Import export libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CreditorsReport = () => {
  const [creditorsData, setCreditorsData] = useState({
    summary: {
      total_credit: 0,
      high_credit_accounts: 0,
      inactive_accounts: 0,
      avg_credit_balance: 0,
      total_creditors: 0
    },
    creditors: []
  });
  
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'expense_date',
    direction: 'desc'
  });

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse) {
      fetchCreditorsReport();
    }
  }, [selectedBoardingHouse]);

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const houses = response.data || [];
      setBoardingHouses(houses);
      setSelectedBoardingHouse('all');
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchCreditorsReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }
      
      const params = {};
      if (selectedBoardingHouse !== 'all') {
        params.boarding_house_id = selectedBoardingHouse;
      }

      // Fetch accounts payable data
      const [accountsPayableResponse, summaryResponse] = await Promise.all([
        axios.get(`${BASE_URL}/accounts-payable`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params
        }),
        axios.get(`${BASE_URL}/accounts-payable/summary`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params
        })
      ]);

      setCreditorsData({
        summary: {
          total_outstanding: summaryResponse.data?.data?.total_outstanding || 0,
          total_invoices: summaryResponse.data?.data?.total_invoices || 0,
          pending_amount: summaryResponse.data?.data?.pending_amount || 0,
          total_creditors: accountsPayableResponse.data?.data?.length || 0
        },
        creditors: accountsPayableResponse.data?.data || []
      });
    } catch (error) {
      console.error('Error fetching creditors report:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access forbidden. Your session may have expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to fetch creditors report');
      }
      
      setCreditorsData({
        summary: {
          total_outstanding: 0,
          total_invoices: 0,
          pending_amount: 0,
          total_creditors: 0
        },
        creditors: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedAndFilteredCreditors = () => {
    let filtered = creditorsData.creditors.filter(creditor =>
      (creditor.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (creditor.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (creditor.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle string values
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'debt':
      case 'pending':
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Creditors Report', 20, 20);
      
      // Add boarding house and date info
      doc.setFontSize(10);
      const selectedHouse = boardingHouses.find(h => h.id.toString() === selectedBoardingHouse);
      doc.text(`Boarding House: ${selectedBoardingHouse === 'all' ? 'All Boarding Houses' : selectedHouse?.name || 'Unknown'}`, 20, 35);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Add summary
      doc.text(`Total Outstanding: ${formatCurrency(creditorsData.summary.total_outstanding)}`, 20, 60);
      doc.text(`Total Invoices: ${creditorsData.summary.total_invoices}`, 20, 70);
      doc.text(`Total Creditors: ${creditorsData.summary.total_creditors}`, 20, 80);
      
      // Prepare table data
      const tableData = getSortedAndFilteredCreditors().map(creditor => [
        creditor.supplier_name || 'N/A',
        creditor.invoice_number || 'N/A',
        formatDate(creditor.date),
        formatDate(creditor.due_date),
        formatCurrency(creditor.amount),
        formatCurrency(creditor.balance),
        creditor.status || 'Pending',
        creditor.description || 'N/A'
      ]);
      
      // Create table headers
      const headers = [
        'Supplier',
        'Invoice #',
        'Date',
        'Due Date',
        'Amount',
        'Balance',
        'Status',
        'Description'
      ];
      
      // Create table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 95,
        styles: { fontSize: 8, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          7: { cellWidth: 40 } // Description column
        }
      });
      
      doc.save(`creditors-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const data = getSortedAndFilteredCreditors().map(creditor => ({
        'Supplier': creditor.supplier_name || 'N/A',
        'Invoice Number': creditor.invoice_number || 'N/A',
        'Date': formatDate(creditor.date),
        'Due Date': formatDate(creditor.due_date),
        'Amount': creditor.amount || 0,
        'Balance': creditor.balance || 0,
        'Status': creditor.status || 'Pending',
        'Description': creditor.description || 'N/A',
        'Boarding House': creditor.boarding_house_name || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Creditors Report');
      XLSX.writeFile(wb, `creditors-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-base font-medium text-gray-800 mb-1">Creditors Report</h1>
          <p className="text-xs text-gray-600">Track outstanding payments to suppliers and vendors</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="bg-gray-600 text-white px-3 py-1.5 text-xs hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <FaFilePdf className="h-3 w-3" />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="bg-gray-600 text-white px-3 py-1.5 text-xs hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <FaFileExcel className="h-3 w-3" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Boarding House Selection */}
      <div className="bg-white border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaBuilding className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Boarding House:</span>
          </div>
          <select
            value={selectedBoardingHouse}
            onChange={(e) => setSelectedBoardingHouse(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-xs text-gray-800"
          >
            <option value="all">All Boarding Houses</option>
            {boardingHouses.map(house => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-2">
          <FaSearch className="h-3 w-3 text-gray-600" />
          <input
            type="text"
            placeholder="Search suppliers, invoices, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-xs w-64 text-gray-800"
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white border border-gray-200 p-3 mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          <FaTruck className="inline h-4 w-4 mr-2" />
          {selectedBoardingHouse === 'all' ? 'Consolidated Summary' : 'Summary'}
        </h3>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600 font-medium">Total Outstanding</div>
            <div className="text-sm font-bold text-red-600">
              {formatCurrency(creditorsData.summary.total_outstanding)}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600 font-medium">Total Invoices</div>
            <div className="text-sm font-bold text-gray-800">
              {creditorsData.summary.total_invoices || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600 font-medium">Pending Amount</div>
            <div className="text-sm font-bold text-yellow-600">
              {formatCurrency(creditorsData.summary.pending_amount)}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600 font-medium">Total Creditors</div>
            <div className="text-sm font-bold text-gray-800">
              {creditorsData.summary.total_creditors || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Creditors Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('supplier_name')}
                >
                  Supplier
                  {sortConfig.key === 'supplier_name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoice_number')}
                >
                  Invoice #
                  {sortConfig.key === 'invoice_number' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Date
                  {sortConfig.key === 'date' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('due_date')}
                >
                  Due Date
                  {sortConfig.key === 'due_date' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  {sortConfig.key === 'amount' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('balance')}
                >
                  Balance
                  {sortConfig.key === 'balance' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Description</th>
                {selectedBoardingHouse === 'all' && (
                  <th className="px-4 py-3 text-left">Boarding House</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getSortedAndFilteredCreditors().length === 0 ? (
                <tr>
                  <td 
                    colSpan={selectedBoardingHouse === 'all' ? 9 : 8} 
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No creditors found
                  </td>
                </tr>
              ) : (
                getSortedAndFilteredCreditors().map((creditor, index) => (
                  <tr key={creditor.id || index} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {creditor.supplier_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {creditor.invoice_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(creditor.date)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(creditor.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(creditor.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {formatCurrency(creditor.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(creditor.status)}`}>
                        {creditor.status === 'debt' ? 'Outstanding' : 
                         creditor.status === 'partial' ? 'Partial' : 
                         creditor.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {creditor.description || 'N/A'}
                    </td>
                    {selectedBoardingHouse === 'all' && (
                      <td className="px-4 py-3">
                        {creditor.boarding_house_name || 'N/A'}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditorsReport;