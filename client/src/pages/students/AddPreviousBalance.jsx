import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

export default function AddPreviousBalance() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [students, setStudents] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({}); // { studentId: { enrollment_id, amount, balance_type } }
  const [studentBalances, setStudentBalances] = useState({}); // { studentId: { balance, currency } }
  const [updatingStudents, setUpdatingStudents] = useState({}); // { studentId: true/false }
  const [revenueAccounts, setRevenueAccounts] = useState([]);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueAccountCode, setRevenueAccountCode] = useState('40001');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch boarding houses and students
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Fetch boarding houses
        const housesResponse = await axios.get(`${BASE_URL}/boarding-houses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBoardingHouses(housesResponse.data || []);
        

        // Fetch revenue accounts
        try {
          const revenueResponse = await axios.get(`${BASE_URL}/chart-of-accounts/type/Revenue`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const accounts = revenueResponse.data?.data || revenueResponse.data || [];
          setRevenueAccounts(accounts);
        } catch (err) {
          console.error('Error fetching revenue accounts:', err);
          setRevenueAccounts([{ code: '40001', name: 'Rentals Income' }]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch students when boarding house is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      
      try {
        let url = `${BASE_URL}/students`;
        if (selectedBoardingHouse) {
          url = `${BASE_URL}/students/boarding-house/${selectedBoardingHouse}`;
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const studentsData = response.data || [];
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        
        // Fetch balances for all students
        await fetchStudentBalances(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
        setStudents([]);
        setFilteredStudents([]);
      }
    };

    fetchStudents();
  }, [selectedBoardingHouse, token]);

  // Fetch student balances (now included in student data from backend)
  const fetchStudentBalances = async (studentsList) => {
    const balances = {};
    studentsList.forEach(student => {
      balances[student.id] = {
        balance: parseFloat(student.current_balance || 0),
        currency: student.balance_currency || student.currency || 'USD'
      };
    });
    setStudentBalances(balances);
  };

  // Fetch enrollments for a student (including past enrollments)
  const fetchStudentEnrollments = async (studentId) => {
    try {
      // Try enrollment history endpoint first (returns all enrollments including past)
      const response = await axios.get(`${BASE_URL}/students/${studentId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Response might be array directly or { enrollments: [...] }
      const enrollments = Array.isArray(response.data) ? response.data : (response.data.enrollments || []);
      return enrollments;
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      return [];
    }
  };


  // Handle student selection
  const handleStudentSelect = async (studentId, isSelected) => {
    if (!isSelected) {
      // Remove from selection
      const newSelected = { ...selectedStudents };
      delete newSelected[studentId];
      setSelectedStudents(newSelected);
      return;
    }

    // Add to selection - fetch enrollments first (including past enrollments)
    const enrollments = await fetchStudentEnrollments(studentId);
    
    let enrollmentId = null;
    let enrollment = null;
    
    if (enrollments.length > 0) {
      // Use the most recent enrollment (first in the list from getEnrollmentHistory)
      // This includes past/terminated enrollments, which is what we want for students who have left
      enrollment = enrollments[0];
      enrollmentId = enrollment.id;
    } else {
      // Student has no enrollments at all - show warning but allow selection
      // We'll need to handle this in submission
      const student = students.find(s => s.id === studentId);
      const proceed = window.confirm(
        `${student?.full_name || 'This student'} has no enrollments (including past enrollments). ` +
        `You can still add a balance, but an enrollment may be required. Continue?`
      );
      
      if (!proceed) {
        return;
      }
      
      // Set enrollment_id to null - we'll handle this in the backend or show error on submit
      setError(`Warning: ${student?.full_name || 'Student'} has no enrollments. Balance update may fail.`);
    }

    setSelectedStudents(prev => ({
      ...prev,
      [studentId]: {
        enrollment_id: enrollmentId,
        amount: '',
        balance_type: 'debit',
        enrollment: enrollment,
        hasNoEnrollments: enrollments.length === 0
      }
    }));
  };

  // Update student balance data
  const updateStudentBalance = (studentId, field, value) => {
    setSelectedStudents(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Handle individual student update
  const handleStudentUpdate = async (studentId) => {
    const studentData = selectedStudents[studentId];
    if (!studentData) {
      setError('Student not selected');
      return;
    }

    if (!studentData.amount || parseFloat(studentData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!studentData.enrollment_id || studentData.hasNoEnrollments) {
      const student = students.find(s => s.id === parseInt(studentId));
      setError(`${student?.full_name || 'Student'} has no enrollments. Please create an enrollment first.`);
      return;
    }

    setUpdatingStudents(prev => ({ ...prev, [studentId]: true }));
    setError('');
    setSuccess('');

    try {
      const payload = {
        student_id: parseInt(studentId),
        enrollment_id: studentData.enrollment_id,
        amount: parseFloat(studentData.amount),
        balance_type: studentData.balance_type,
        description: description || undefined,
        transaction_date: transactionDate || undefined,
        notes: notes || undefined,
        revenue_account_code: revenueAccountCode || '40001'
      };

      const response = await axios.post(
        `${BASE_URL}/students/previous-balance`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const student = students.find(s => s.id === parseInt(studentId));
        setSuccess(
          `Balance updated for ${student?.full_name || `Student ${studentId}`}. ` +
          `New balance: ${formatCurrency(response.data.data.new_balance)}`
        );
        
        // Update local balance
        setStudentBalances(prev => ({
          ...prev,
          [studentId]: {
            balance: parseFloat(response.data.data.new_balance),
            currency: response.data.data.currency || 'USD'
          }
        }));

        // Clear the student's form data
        const newSelected = { ...selectedStudents };
        delete newSelected[studentId];
        setSelectedStudents(newSelected);

        // Refresh student list to get updated balance
        const url = selectedBoardingHouse 
          ? `${BASE_URL}/students/boarding-house/${selectedBoardingHouse}`
          : `${BASE_URL}/students`;
        const refreshResponse = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedStudents = refreshResponse.data || [];
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);
        await fetchStudentBalances(updatedStudents);
      }
    } catch (err) {
      const student = students.find(s => s.id === parseInt(studentId));
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        `Failed to update balance for ${student?.full_name || `Student ${studentId}`}`
      );
    } finally {
      setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Handle bulk submit (kept for backward compatibility but not used in UI)
  const handleBulkSubmit = async () => {
    const selectedCount = Object.keys(selectedStudents).length;
    if (selectedCount === 0) {
      setError('Please select at least one student');
      return;
    }

    // Validate all selected students
    const invalid = [];
    const noEnrollments = [];
    
    Object.entries(selectedStudents).forEach(([studentId, data]) => {
      const student = students.find(s => s.id === parseInt(studentId));
      
      if (!data.amount || parseFloat(data.amount) <= 0) {
        invalid.push(student?.full_name || `Student ${studentId}`);
      }
      
      if (!data.enrollment_id || data.hasNoEnrollments) {
        noEnrollments.push(student?.full_name || `Student ${studentId}`);
      }
    });

    if (invalid.length > 0) {
      setError(`Please enter valid amounts for: ${invalid.join(', ')}`);
      return;
    }

    if (noEnrollments.length > 0) {
      setError(`The following students have no enrollments and cannot be updated: ${noEnrollments.join(', ')}. Please create enrollments first.`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const results = {
      success: [],
      failed: []
    };

    // Submit each student's balance update
    for (const [studentId, data] of Object.entries(selectedStudents)) {
      try {
        const payload = {
          student_id: parseInt(studentId),
          enrollment_id: data.enrollment_id,
          amount: parseFloat(data.amount),
          balance_type: data.balance_type,
          description: description || undefined,
          transaction_date: transactionDate || undefined,
          notes: notes || undefined,
          revenue_account_code: revenueAccountCode || '40001'
        };

        const response = await axios.post(
          `${BASE_URL}/students/previous-balance`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const student = students.find(s => s.id === parseInt(studentId));
          results.success.push({
            name: student?.full_name || `Student ${studentId}`,
            new_balance: response.data.data.new_balance
          });
        }
      } catch (err) {
        const student = students.find(s => s.id === parseInt(studentId));
        results.failed.push({
          name: student?.full_name || `Student ${studentId}`,
          error: err.response?.data?.message || err.message
        });
      }
    }

    setSubmitting(false);

    if (results.success.length > 0) {
      setSuccess(
        `Successfully updated ${results.success.length} student(s). ` +
        (results.failed.length > 0 ? `${results.failed.length} failed.` : '')
      );
      
      // Clear selections after successful submission
      setTimeout(() => {
        setSelectedStudents({});
        setDescription('');
        setNotes('');
      }, 3000);
    }

    if (results.failed.length > 0 && results.success.length === 0) {
      setError(`Failed to update ${results.failed.length} student(s). Check console for details.`);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#f58020]"></div>
          <p className="mt-2 text-xs text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Update Student Balances</h1>
          <p className="text-xs text-gray-500">
            Select students and update their account balances (debit or credit). This affects Accounts Receivable and Revenue accounts.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="flex items-center px-4 py-2 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Students
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {success}
        </div>
      )}

      {/* Boarding House Selection */}
      <div className="bg-white border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Select Boarding House</h3>
        <div className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => {
                setSelectedBoardingHouse(e.target.value);
                setSelectedStudents({}); // Clear selections when changing boarding house
              }}
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            >
              <option value="">All Boarding Houses</option>
              {boardingHouses.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name} - {house.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Settings */}
      <div className="bg-white border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Global Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Transaction Date *
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Revenue Account
            </label>
            <select
              value={revenueAccountCode}
              onChange={(e) => setRevenueAccountCode(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            >
              {revenueAccounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description for all transactions"
              className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes for all transactions"
            className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
          />
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const isSelected = !!selectedStudents[student.id];
                  const studentData = selectedStudents[student.id];

                  return (
                    <tr key={student.id} className={isSelected ? 'bg-[#f58020]/5' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                          className="h-4 w-4 text-[#f58020] focus:ring-[#f58020] border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium">
                        {formatCurrency(studentBalances[student.id]?.balance || student.current_balance || 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {student.room_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {isSelected ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={studentData?.amount || ''}
                            onChange={(e) => updateStudentBalance(student.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSelected ? (
                          <select
                            value={studentData?.balance_type || 'debit'}
                            onChange={(e) => updateStudentBalance(student.id, 'balance_type', e.target.value)}
                            className="px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                          >
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSelected ? (
                          <button
                            onClick={() => handleStudentUpdate(student.id)}
                            disabled={updatingStudents[student.id]}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#f58020] rounded hover:bg-[#f58020]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            {updatingStudents[student.id] ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-3 w-3" />
                                Update
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedBoardingHouse ? (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-xs text-gray-500">No students found for the selected boarding house.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-xs text-gray-500">Please select a boarding house to view students.</p>
        </div>
      )}


      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200">
        <h3 className="text-xs font-semibold text-blue-900 mb-2">How Balance Updates Work</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>
            <strong>Debit Balance:</strong> Student owes money. Increases Accounts Receivable and Revenue.
          </li>
          <li>
            <strong>Credit Balance:</strong> Student has prepaid/credit. Decreases Accounts Receivable and Revenue.
          </li>
          <li className="mt-2 text-blue-700">
            <strong>Note:</strong> You can select multiple students and update their balances in bulk. Each student's enrollment will be used automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}
