import { useState } from 'react';
import './App.css';

export default function App() {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Helper to handle sending CSVs to our Backend API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, endpoint: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Points to our backend container
      const response = await fetch(`http://localhost:5000/api/uploads/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setUploadStatus(`✅ ${file.name} parsed successfully!`);
      } else {
        setUploadStatus(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setUploadStatus('❌ Connection to API failed. Is the backend server running?');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <header style={styles.header}>
        <h1 style={styles.title}>MAS Customer Credit Management</h1>
        <p style={styles.subtitle}>Automated Risk Tracking Engine</p>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainGrid}>
        
        {/* Section 1: CSV Upload Controls */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Data Ingestion Station</h2>
          <p style={styles.cardDescription}>Upload operational CSV data dumps directly into the core processing pipeline.</p>
          
          <div style={styles.uploadGroup}>
            <div style={styles.uploadRow}>
              <span style={styles.label}>1. Credit Masterfile:</span>
              <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'credit-master')} />
            </div>

            <div style={styles.uploadRow}>
              <span style={styles.label}>2. Daily Order Feed:</span>
              <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'orders')} />
            </div>

            <div style={styles.uploadRow}>
              <span style={styles.label}>3. Collections Feed:</span>
              <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'collections')} />
            </div>
          </div>

          {uploadStatus && (
            <div style={styles.statusBar}>
              {uploadStatus}
            </div>
          )}
        </section>

        {/* Section 2: Placeholder Live Monitor */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Live Risk Ledger</h2>
          <p style={styles.cardDescription}>Real-time monitoring metrics loaded directly from the production instance database.</p>
          
          <div style={styles.emptyTableState}>
            <p>Database connected. Standby for metrics connection...</p>
          </div>
        </section>

      </main>
    </div>
  );
}

// Sleek Dark Theme Dashboard Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '2rem',
  },
  header: {
    borderBottom: '1px solid #334155',
    paddingBottom: '1.5rem',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: 0,
    color: '#38bdf8',
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    color: '#94a3b8',
    fontSize: '1rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    margin: '0 0 0.5rem 0',
    color: '#f1f5f9',
  },
  cardDescription: {
    margin: '0 0 1.5rem 0',
    color: '#94a3b8',
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  uploadGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  uploadRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    border: '1px solid #1e293b',
  },
  label: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#cbd5e1',
  },
  statusBar: {
    marginTop: '1.5rem',
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    borderLeft: '4px solid #38bdf8',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  emptyTableState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    border: '2px dashed #334155',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '0.875rem',
  },
};