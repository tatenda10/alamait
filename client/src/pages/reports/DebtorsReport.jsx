import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBuilding,
  FaFileExcel,
  FaFilePdf,
  FaSearch
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

// Import export libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DebtorsReport = () => {
  const [debtorsData, setDebtorsData] = useState({
    summary: {
      total_outstanding: 0,
      overdue_accounts: 0,
      avg_days_overdue: 0,
      total_debtors: 0,
      debt_breakdown: {
        admin_fee: 0,
        security_deposit: 0,
        rent: 0
      }
    },
    debtors: []
  });
  
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'days_overdue',
    direction: 'desc'
  });

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse) {
      fetchDebtorsReport();
    }
  }, [selectedBoardingHouse, filters]);

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Backend returns the array directly, not wrapped in boardingHouses property
      const houses = response.data || [];
      setBoardingHouses(houses);
      
      // Auto-select consolidated view
      setSelectedBoardingHouse('all');
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchDebtorsReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }
      
      const params = {
        boarding_house_id: selectedBoardingHouse,
        status: filters.status
      };

      const response = await axios.get(`${BASE_URL}/reports/debtors`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });

      setDebtorsData(response.data);
    } catch (error) {
      console.error('Error fetching debtors report:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        toast.error('Access forbidden. Your session may have expired. Please log in again.');
        // Optionally clear the invalid token
        localStorage.removeItem('token');
        // window.location.href = '/login';
      } else {
        toast.error('Failed to fetch debtors report');
      }
      
      setDebtorsData({
        summary: {
          total_outstanding: 0,
          overdue_accounts: 0,
          avg_days_overdue: 0,
          total_debtors: 0,
          debt_breakdown: {
            admin_fee: 0,
            security_deposit: 0,
            rent: 0
          }
        },
        debtors: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedAndFilteredDebtors = () => {
    let filtered = debtorsData.debtors.filter(debtor =>
      debtor.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.room_number.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    return 'bg-gray-50 text-gray-800';
  };

  const getDaysOverdueColor = (days) => {
    return 'text-gray-800';
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Debtors Report', 20, 20);
      
      // Add boarding house and date info
      doc.setFontSize(10);
      const selectedHouse = boardingHouses.find(h => h.id.toString() === selectedBoardingHouse);
      doc.text(`Boarding House: ${selectedBoardingHouse === 'all' ? 'All Boarding Houses' : selectedHouse?.name || 'Unknown'}`, 20, 35);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Filter: ${filters.status} status`, 20, 55);
      
      // Add summary
      doc.text(`Total Outstanding: ${formatCurrency(debtorsData.summary.total_outstanding)}`, 20, 70);
      doc.text(`Total Debtors: ${debtorsData.summary.total_debtors}`, 20, 80);
      
      // Prepare table data
      const tableData = getSortedAndFilteredDebtors().map(debtor => {
        const row = [
          debtor.student_name,
          ...(selectedBoardingHouse === 'all' ? [debtor.boarding_house_name] : []),
          debtor.room_number,
          formatCurrency(debtor.total_due),
          debtor.debt_breakdown ? [
            debtor.debt_breakdown.admin_fee > 0 ? `Admin: ${formatCurrency(debtor.debt_breakdown.admin_fee)}` : '',
            debtor.debt_breakdown.security_deposit > 0 ? `Security: ${formatCurrency(debtor.debt_breakdown.security_deposit)}` : '',
            debtor.debt_breakdown.rent > 0 ? `Rent: ${formatCurrency(debtor.debt_breakdown.rent)}` : ''
          ].filter(Boolean).join(', ') : '',
          formatDate(debtor.last_payment)
        ];
        return row;
      });
      
      // Create table headers
      const headers = [
        'Student Name',
        ...(selectedBoardingHouse === 'all' ? ['Boarding House'] : []),
        'Room',
        'Total Due',
        'Debt Breakdown',
        'Last Payment'
      ];
      
      // Create table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 95,
        styles: { fontSize: 8, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          [selectedBoardingHouse === 'all' ? 4 : 3]: { cellWidth: 40 } // Debt breakdown column
        }
      });
      
      doc.save(`debtors-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const data = getSortedAndFilteredDebtors().map(debtor => {
        const row = {
          'Student Name': debtor.student_name,
          ...(selectedBoardingHouse === 'all' ? { 'Boarding House': debtor.boarding_house_name } : {}),
          'Room Number': debtor.room_number,
          'Total Due': debtor.total_due,
          'Admin Fee Due': debtor.debt_breakdown?.admin_fee || 0,
          'Security Deposit Due': debtor.debt_breakdown?.security_deposit || 0,
          'Rent Due': debtor.debt_breakdown?.rent || 0,
          'Last Payment': formatDate(debtor.last_payment)
        };
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Debtors Report');
      XLSX.writeFile(wb, `debtors-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
          <h1 className="text-base font-medium text-gray-800 mb-1">Debtors Report</h1>
          <p className="text-xs text-gray-600">Track overdue payments and outstanding debts</p>
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 px-2 py-1 text-xs text-gray-800"
            >
              <option value="all">All Status</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial Payment</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <FaSearch className="h-3 w-3 text-gray-600" />
            <input
              type="text"
              placeholder="Search students or rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-xs w-48 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {selectedBoardingHouse && debtorsData.summary && (
        <div className="bg-white border border-gray-200 p-3 mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            {selectedBoardingHouse === 'all' ? 'Consolidated Summary' : 'Summary'}
          </h3>
          <div className="grid grid-cols-7 gap-3 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Total Outstanding</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(debtorsData.summary.total_outstanding)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Overdue Accounts</div>
              <div className="text-sm font-bold text-gray-800">
                {debtorsData.summary.overdue_accounts || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Avg Days Overdue</div>
              <div className="text-sm font-bold text-gray-800">
                {Math.round(debtorsData.summary.avg_days_overdue || 0)} days
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Total Debtors</div>
              <div className="text-sm font-bold text-gray-800">
                {debtorsData.summary.total_debtors || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Admin Fees</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(debtorsData.summary.debt_breakdown?.admin_fee || 0)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Security Deposits</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(debtorsData.summary.debt_breakdown?.security_deposit || 0)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Rent</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(debtorsData.summary.debt_breakdown?.rent || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debtors Table */}
      {selectedBoardingHouse && (
        <div className="bg-white border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-800">
              Debtors List ({getSortedAndFilteredDebtors().length} records)
            </h2>
          </div>
          
          {getSortedAndFilteredDebtors().length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-800">No debtors found</h3>
              <p className="mt-1 text-sm text-gray-600">
                No students match the current filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('student_name')}
                    >
                      Student Name
                      {sortConfig.key === 'student_name' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    {selectedBoardingHouse === 'all' && (
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('boarding_house_name')}
                      >
                        Boarding House
                        {sortConfig.key === 'boarding_house_name' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    )}
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('room_number')}
                    >
                      Room
                      {sortConfig.key === 'room_number' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('total_due')}
                    >
                      Total Due
                      {sortConfig.key === 'total_due' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                      Debt Breakdown
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('last_payment')}
                    >
                      Last Payment
                      {sortConfig.key === 'last_payment' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedAndFilteredDebtors().map((debtor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                        {debtor.student_name}
                      </td>
                      {selectedBoardingHouse === 'all' && (
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                          {debtor.boarding_house_name}
                        </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                        {debtor.room_number}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-800">
                        {formatCurrency(debtor.total_due)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                        <div className="space-y-1">
                          {debtor.debt_breakdown?.admin_fee > 0 && (
                            <div className="text-gray-800">
                              Admin: {formatCurrency(debtor.debt_breakdown.admin_fee)}
                            </div>
                          )}
                          {debtor.debt_breakdown?.security_deposit > 0 && (
                            <div className="text-gray-800">
                              Security: {formatCurrency(debtor.debt_breakdown.security_deposit)}
                            </div>
                          )}
                          {debtor.debt_breakdown?.rent > 0 && (
                            <div className="text-gray-800">
                              Rent: {formatCurrency(debtor.debt_breakdown.rent)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                        {formatDate(debtor.last_payment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtorsReport;