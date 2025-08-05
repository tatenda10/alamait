import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const RentLedger = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchLedgerEntries();
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/students/boarding-house/${user.boarding_house_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/payments/students/${selectedStudent}/ledger`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLedgerEntries(response.data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRunningBalance = (entries) => {
    let balance = 0;
    return entries.map(entry => {
      if (entry.type === 'charge') {
        balance += parseFloat(entry.amount);
      } else if (entry.type === 'payment') {
        balance -= parseFloat(entry.amount);
      }
      return { ...entry, balance };
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !selectedStudent) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-base font-medium text-gray-900">Rent Ledger</h2>
      <p className="mt-1 text-sm text-gray-500">
        View detailed rent payment history and balances
      </p>

      <div className="mt-6 space-y-6">
        {/* Student Selector */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-6">
            <div className="max-w-xl">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                Select Student
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="block w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.room_name || 'No Room'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {selectedStudent && (
          <div className="border border-gray-200 rounded-lg">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Description</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Type</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Charges</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Payments</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Balance</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculateRunningBalance(ledgerEntries).map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900">{entry.description}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          <span className="capitalize">
                            {entry.payment_type?.replace('_', ' ') || entry.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {entry.type === 'charge' ? `${entry.currency} ${parseFloat(entry.amount).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {entry.type === 'payment' ? `${entry.currency} ${parseFloat(entry.amount).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <span className={entry.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                            {entry.currency} {Math.abs(entry.balance).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(entry.status)}`}>
                            {entry.status || (entry.balance > 0 ? 'Outstanding' : 'Cleared')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {ledgerEntries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                          {selectedStudent ? 'No ledger entries found' : 'Select a student to view ledger'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentLedger; 