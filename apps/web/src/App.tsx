import { useState, useEffect } from 'react';
import './App.css';

interface LedgerItem {
  groupId: string;
  groupName: string;
  approvedLimit: number;
  totalOutstanding: number;
  availableCredit: number;
  paymentTerms: number;
  status: string;
}

export default function App() {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch the live ledger metrics from the Backend engine (No more localhost!)
  const fetchLedger = async () => {
    try {
      const response = await fetch('/api/reports/credit-ledger');
      const resData = await response.json();
      if (resData.success) {
        setLedgerData(resData.data);
      }
    } catch (err) {
      console.error('Failed to grab live ledger metrics:', err);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Upload handler (No more localhost!)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, endpoint: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/uploads/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setUploadStatus(`✅ ${file.name} parsed successfully!`);
        fetchLedger();
      } else {
        setUploadStatus(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setUploadStatus('❌ Connection to API failed. Is the backend server running?');
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['Group ID', 'Group Name', 'Approved Limit', 'Outstanding Balance', 'Available Credit', 'Payment Terms', 'Status'];
    
    const rows = filteredData.map(item => [
      item.groupId,
      item.groupName,
      item.approvedLimit,
      item.totalOutstanding,
      item.availableCredit,
      item.paymentTerms,
      item.status
    ]);

    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MAS_Credit_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = ledgerData.filter(item => {
    const matchesSearch = item.groupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.groupId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Blocked':
        return { backgroundColor: '#ef4444', color: '#fff' };
      case 'Limit Review':
        return { backgroundColor: '#eab308', color: '#000' };
      default:
        return { backgroundColor: '#10b981', color: '#fff' };
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>MAS Customer Credit Management</h1>
        <p style={styles.subtitle}>Automated Risk Tracking Engine</p>
      </header>

      <main style={styles.mainGrid}>
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

        <section style={styles.cardFullWidth}>
          <div style={styles.ledgerHeader}>
            <div>
              <h2 style={styles.cardTitle}>Live Risk Ledger</h2>
              <p style={styles.cardDescription}>Real-time monitoring metrics loaded directly from the production instance database.</p>
            </div>
            
            <button onClick={exportToCSV} disabled={filteredData.length === 0} style={styles.exportBtn}>
              📥 Export Ledger to CSV
            </button>
          </div>

          <div style={styles.filterBar}>
            <input 
              type="text" 
              placeholder="🔍 Search by Group ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              style={styles.selectInput}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Limit Review">Limit Review</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          
          {filteredData.length === 0 ? (
            <div style={styles.emptyTableState}>
              <p>No operational metrics discovered. Please ingest files to build calculations ledger.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Group ID</th>
                    <th style={styles.th}>Group Name</th>
                    <th style={styles.th}>Approved Limit</th>
                    <th style={styles.th}>Outstanding Balance</th>
                    <th style={styles.th}>Available Credit</th>
                    <th style={styles.th}>Terms</th>
                    <th style={styles.th}>Risk Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.groupId} style={styles.tr}>
                      <td style={styles.td}>{item.groupId}</td>
                      <td style={styles.td}><strong>{item.groupName}</strong></td>
                      <td style={styles.td}>₱{item.approvedLimit.toLocaleString()}</td>
                      <td style={styles.td} style={{...styles.td, color: item.totalOutstanding > 0 ? '#f43f5e' : '#cbd5e1'}}>
                        ₱{item.totalOutstanding.toLocaleString()}
                      </td>
                      <td style={styles.td} style={{...styles.td, color: item.availableCredit < 0 ? '#ef4444' : '#38bdf8'}}>
                        ₱{item.availableCredit.toLocaleString()}
                      </td>
                      <td style={styles.td}>{item.paymentTerms} Days</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, ...getStatusBadgeStyle(item.status)}}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem' },
  header: { borderBottom: '1px solid #334155', paddingBottom: '1.5rem', marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 700, margin: 0, color: '#38bdf8' },
  subtitle: { margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '1rem' },
  mainGrid: { display: 'flex', flexDirection: 'column' as const, gap: '2rem' },
  card: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' },
  cardFullWidth: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' },
  cardTitle: { fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#f1f5f9' },
  cardDescription: { margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.4' },
  uploadGroup: { display: 'flex', flexDirection: 'column' as const, gap: '1.25rem' },
  uploadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' },
  label: { fontWeight: 500, fontSize: '0.875rem', color: '#cbd5e1' },
  statusBar: { marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#0f172a', borderLeft: '4px solid #38bdf8', borderRadius: '4px', fontSize: '0.875rem' },
  ledgerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  exportBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' },
  filterBar: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  searchInput: { flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.625rem 1rem', borderRadius: '6px', fontSize: '0.875rem' },
  selectInput: { backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.625rem 1rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' },
  emptyTableState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', border: '2px dashed #334155', borderRadius: '8px', color: '#64748b', fontSize: '0.875rem' },
  tableWrapper: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const, fontSize: '0.875rem' },
  th: { borderBottom: '2px solid #334155', padding: '0.75rem 1rem', color: '#94a3b8', fontWeight: 600 },
  tr: { borderBottom: '1px solid #334155', backgroundColor: '#1e293b' },
  td: { padding: '1rem', color: '#e2e8f0' },
  badge: { padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' as const }
};