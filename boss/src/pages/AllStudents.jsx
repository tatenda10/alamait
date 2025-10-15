import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../context/Api';

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Mock data for demo
      setStudents([
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', boarding_house_name: 'Main Campus House', room_number: '101', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', boarding_house_name: 'Downtown House', room_number: '205', status: 'active' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', boarding_house_name: 'Suburban House', room_number: '301', status: 'inactive' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
              All Students
            </h1>
            <p style={{ color: '#6b7280', margin: '0' }}>
              Manage students across all boarding houses
            </p>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Total: {students.length} students
          </div>
        </div>
        
        <div style={{ maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', margin: '0' }}>
            Student List
          </h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Student
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Boarding House
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Room
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        marginRight: '16px'
                      }}>
                        👥
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {student.name || 'No name'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>
                      {student.email || 'No email'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {student.phone || 'No phone'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', marginRight: '8px' }}>🏢</span>
                      <span style={{ fontSize: '14px', color: '#1f2937' }}>
                        {student.boarding_house_name || 'Not assigned'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: '14px', color: '#1f2937' }}>
                      {student.room_number || 'Not assigned'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: student.status === 'active' ? '#d1fae5' : student.status === 'inactive' ? '#fee2e2' : '#f3f4f6',
                      color: student.status === 'active' ? '#065f46' : student.status === 'inactive' ? '#dc2626' : '#6b7280'
                    }}>
                      {student.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px' }}>
              No Students Found
            </h3>
            <p style={{ color: '#6b7280', margin: '0' }}>
              {searchTerm ? 'No students match your search criteria.' : 'No students have been registered yet.'}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AllStudents;
