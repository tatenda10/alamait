import React from 'react';

const SystemSettings = () => {
  const settingsCategories = [
    {
      name: 'Database Settings',
      description: 'Configure database connections and backups',
      icon: '🗄️',
      color: '#3b82f6'
    },
    {
      name: 'Server Configuration',
      description: 'Manage server settings and performance',
      icon: '🖥️',
      color: '#10b981'
    },
    {
      name: 'Security Settings',
      description: 'Configure security policies and access controls',
      icon: '🔒',
      color: '#ef4444'
    },
    {
      name: 'System Preferences',
      description: 'General system settings and preferences',
      icon: '⚙️',
      color: '#8b5cf6'
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
          System Settings
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Configure system-wide settings and preferences
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {settingsCategories.map((category) => (
          <div key={category.name} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: category.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                {category.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  {category.name}
                </h3>
              </div>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
              {category.description}
            </p>
            
            <button style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}>
              Configure
            </button>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px' }}>
          System Status
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Online</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Database Status</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Active</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Server Status</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Secure</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Security Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
