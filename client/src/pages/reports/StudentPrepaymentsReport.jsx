import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBuilding,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaUserCheck,
  FaDollarSign
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

// Import export libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const StudentPrepaymentsReport = () => {
  const [prepaymentsData, setPrepaymentsData] = useState({
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
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'credit_balance',
    direction: 'desc'
  });

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse) {
      fetchPrepaymentsReport();
    }
  }, [selectedBoardingHouse, filters]);

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

  const fetchPrepaymentsReport = async () => {
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

      const response = await axios.get(`${BASE_URL}/reports/creditors`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });

      console.log('🔍 FRONTEND API RESPONSE DEBUG:');
      console.log('Full API Response:', response.data);
      console.log('Summary object:', response.data.summary);
      console.log('Total Credit (raw):', response.data.summary?.total_credit);
      console.log('Total Credit (type):', typeof response.data.summary?.total_credit);
      console.log('Creditors count:', response.data.creditors?.length);
      console.log('First 3 creditors:', response.data.creditors?.slice(0, 3).map(c => ({
        name: c.student_name,
        balance: c.credit_balance,
        type: typeof c.credit_balance
      })));
      
      setPrepaymentsData(response.data);
    } catch (error) {
      console.error('Error fetching prepayments report:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access forbidden. Your session may have expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to fetch prepayments report');
      }
      
      setPrepaymentsData({
        summary: {
          total_credit: 0,
          high_credit_accounts: 0,
          inactive_accounts: 0,
          avg_credit_balance: 0,
          total_creditors: 0
        },
        creditors: []
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

  const getSortedAndFilteredCreditors = () => {
    let filtered = prepaymentsData.creditors || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(creditor => 
        creditor.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creditor.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creditor.boarding_house_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(creditor => creditor.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      current: { color: 'bg-green-100 text-green-800', label: 'Current' },
      high_credit: { color: 'bg-blue-100 text-blue-800', label: 'High Credit' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.current;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const data = getSortedAndFilteredCreditors();
      
      // Header
      doc.setFontSize(20);
      doc.text('Student Prepayments Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Boarding House: ${selectedBoardingHouse === 'all' ? 'All' : boardingHouses.find(bh => bh.id === selectedBoardingHouse)?.name || 'Unknown'}`, 20, 35);
      doc.text(`Total Credit: ${formatCurrency(prepaymentsData.summary.total_credit || 0)}`, 20, 40);
      doc.text(`Students with Credit: ${prepaymentsData.summary.total_creditors}`, 20, 45);
      
      // Table headers
      const headers = selectedBoardingHouse === 'all' 
        ? ['Student Name', 'Boarding House', 'Room', 'Credit Balance', 'Last Payment', 'Status']
        : ['Student Name', 'Room', 'Credit Balance', 'Last Payment', 'Status'];
      
      // Table data
      const tableData = data.map(creditor => {
        const row = [
          creditor.student_name,
          ...(selectedBoardingHouse === 'all' ? [creditor.boarding_house_name] : []),
          creditor.room_number,
          formatCurrency(creditor.credit_balance),
          formatDate(creditor.last_payment),
          creditor.status
        ];
        return row;
      });
      
      // Create table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });
      
      doc.save(`student-prepayments-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const data = getSortedAndFilteredCreditors().map(creditor => {
        const row = {
          'Student Name': creditor.student_name,
          ...(selectedBoardingHouse === 'all' ? { 'Boarding House': creditor.boarding_house_name } : {}),
          'Room Number': creditor.room_number,
          'Credit Balance': creditor.credit_balance,
          'Last Payment': formatDate(creditor.last_payment),
          'Days Since Last Payment': creditor.days_since_last_payment,
          'Status': creditor.status
        };
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Prepayments');
      XLSX.writeFile(wb, `student-prepayments-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
      <div className="bg-white border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaUserCheck className="text-blue-500 text-2xl" />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Student Prepayments Report</h1>
              <p className="text-sm text-gray-600">Students with positive account balances (overpaid)</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaFilePdf className="text-sm" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaFileExcel className="text-sm" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boarding House</label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Boarding Houses</option>
              {boardingHouses.map(house => (
                <option key={house.id} value={house.id}>{house.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="current">Current</option>
              <option value="high_credit">High Credit</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchPrepaymentsReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {selectedBoardingHouse && prepaymentsData.summary && (
        <div className="bg-white border border-gray-200 p-3 mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            {selectedBoardingHouse === 'all' ? 'Consolidated Summary' : 'Summary'}
          </h3>
          <div className="grid grid-cols-5 gap-3 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Total Credit</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(Math.abs(prepaymentsData.summary.total_credit || 0))}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">High Credit Accounts</div>
              <div className="text-sm font-bold text-gray-800">
                {prepaymentsData.summary.high_credit_accounts || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Inactive Accounts</div>
              <div className="text-sm font-bold text-gray-800">
                {prepaymentsData.summary.inactive_accounts || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Avg Credit Balance</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(prepaymentsData.summary.avg_credit_balance || 0)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600 font-medium">Total Students</div>
              <div className="text-sm font-bold text-gray-800">
                {prepaymentsData.summary.total_creditors || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            Student Prepayments ({getSortedAndFilteredCreditors().length})
          </h3>
        </div>
        
        {getSortedAndFilteredCreditors().length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaUserCheck className="mx-auto text-4xl text-gray-300 mb-4" />
            <p>No students with prepayments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('student_name')}
                  >
                    Student Name
                    {sortConfig.key === 'student_name' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  {selectedBoardingHouse === 'all' && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('boarding_house_name')}
                    >
                      Boarding House
                      {sortConfig.key === 'boarding_house_name' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  )}
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('room_number')}
                  >
                    Room
                    {sortConfig.key === 'room_number' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('credit_balance')}
                  >
                    Credit Balance
                    {sortConfig.key === 'credit_balance' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_payment')}
                  >
                    Last Payment
                    {sortConfig.key === 'last_payment' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortConfig.key === 'status' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedAndFilteredCreditors().map((creditor, index) => (
                  <tr key={creditor.student_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800 font-medium">
                      {creditor.student_name}
                    </td>
                    {selectedBoardingHouse === 'all' && (
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                        {creditor.boarding_house_name}
                      </td>
                    )}
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                      {creditor.room_number}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                      <div className="flex items-center space-x-1">
                        <FaDollarSign className="text-green-600" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(Math.abs(creditor.credit_balance))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                      {formatDate(creditor.last_payment)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-800">
                      {getStatusBadge(creditor.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPrepaymentsReport;
