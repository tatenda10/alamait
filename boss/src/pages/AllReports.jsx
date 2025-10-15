import React from 'react';

const AllReports = () => {
  const reports = [
    {
      id: 1,
      name: 'Income Statement',
      description: 'Comprehensive income and expense report',
      type: 'financial',
      icon: '📈',
      color: '#10b981'
    },
    {
      id: 2,
      name: 'Cash Flow Report',
      description: 'Track cash inflows and outflows',
      type: 'financial',
      icon: '💰',
      color: '#3b82f6'
    },
    {
      id: 3,
      name: 'Student Payments',
      description: 'Payment status and outstanding balances',
      type: 'student',
      icon: '📊',
      color: '#8b5cf6'
    },
    {
      id: 4,
      name: 'Expense Analysis',
      description: 'Detailed expense breakdown by category',
      type: 'expense',
      icon: '📉',
      color: '#ef4444'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
          All Reports
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Access comprehensive reports across all boarding houses
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {reports.map((report) => (
          <div key={report.id} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: report.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                {report.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>
                  {report.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0', textTransform: 'capitalize' }}>
                  {report.type} Report
                </p>
              </div>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
              {report.description}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: report.type === 'financial' ? '#d1fae5' : report.type === 'student' ? '#dbeafe' : '#fee2e2',
                color: report.type === 'financial' ? '#065f46' : report.type === 'student' ? '#1e40af' : '#dc2626'
              }}>
                {report.type}
              </span>
              <button style={{
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}>
                Generate Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px' }}>
          Report Statistics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>12</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Financial Reports</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>8</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Student Reports</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>5</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Custom Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllReports;
