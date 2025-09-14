import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputNumber } from 'primereact/inputnumber';
import Sidebar from '../components/Sidebar';

/**
 * PaymentsPage – Enhanced heavy client interface
 * - Desktop window with title bar (● ● ●), resizable sidebar, and status bar.
 * - Shortcuts: Ctrl+M (Mixed Payment), Ctrl+R (Cash Report CSV), Ctrl+L (Close Cash), Ctrl+W (Cash Fund), Ctrl+F (Search), Esc (close dialogs).
 * - Full-height table, filters, Mobile Money validation, refunds, and cash fund management.
 */
export default function PaymentsPage() {
  const toast = useRef(null);
  const searchRef = useRef(null);

  // Mock data
  const clients = [
    { id: 1, nom: 'Jean Rakoto', creditDisponible: 50000 },
    { id: 2, nom: 'Marie Raso', creditDisponible: 0 },
  ];

  const seed = [
    { id: 'PAY-2025-001', venteId: 'VTE-2025-001', client: clients[0], date: '2025-07-12', typePaiement: 'Espèces', montant: 15000, numeroTransaction: null, commission: 0, statut: 'Validé' },
    { id: 'PAY-2025-002', venteId: 'VTE-2025-002', client: null, date: '2025-08-01', typePaiement: 'Mobile Money', montant: 24000, numeroTransaction: 'MM-123456789', commission: 240, statut: 'En attente' },
    { id: 'PAY-2025-003', venteId: 'VTE-2025-003', client: clients[1], date: '2025-09-01', typePaiement: 'Crédit client', montant: 9000, numeroTransaction: null, commission: 0, statut: 'En attente' },
  ];

  const [paiements, setPaiements] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState(null);
  const [caisseFond, setCaisseFond] = useState(100000);

  // Resizable sidebar
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Mixed payment dialog
  const typesPaiement = [
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Carte bancaire', value: 'Carte bancaire' },
    { label: 'Mobile Money', value: 'Mobile Money' },
    { label: 'Chèque', value: 'Chèque' },
    { label: 'Crédit client', value: 'Crédit client' },
    { label: 'Assurance', value: 'Assurance' },
  ];

  const emptyPaiement = { typePaiement: 'Espèces', montant: 0, numeroTransaction: '', commission: 0 };
  const [paiementMixte, setPaiementMixte] = useState([emptyPaiement]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);

  // Refund dialog
  const [showRemboursementForm, setShowRemboursementForm] = useState(false);
  const [remboursementPaiement, setRemboursementPaiement] = useState(null);

  const statuts = [
    { label: 'Tous', value: null },
    { label: 'Validé', value: 'Validé' },
    { label: 'En attente', value: 'En attente' },
    { label: 'Échec', value: 'Échec' },
  ];

  // Filtering
  const filtered = useMemo(() => {
    let list = [...paiements];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter((r) => r.id.toLowerCase().includes(q) || r.venteId.toLowerCase().includes(q) || (r.client && r.client.nom.toLowerCase().includes(q)) || (r.numeroTransaction || '').toLowerCase().includes(q));
    }
    if (statutFilter) list = list.filter((r) => r.statut === statutFilter);
    return list;
  }, [paiements, globalFilter, statutFilter]);

  // Mixed payment logic
  const addPaiementMixte = () => setPaiementMixte((prev) => [...prev, { ...emptyPaiement }]);
  const updatePaiementMixte = (index, field, value) => {
    setPaiementMixte((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value, commission: field === 'typePaiement' && value === 'Mobile Money' ? p.montant * 0.01 : field === 'montant' && p.typePaiement === 'Mobile Money' ? (value || 0) * 0.01 : p.commission } : p)));
  };
  const removePaiementMixte = (index) => setPaiementMixte((prev) => prev.filter((_, i) => i !== index));
  const savePaiementMixte = () => {
    const total = paiementMixte.reduce((s, p) => s + (p.montant || 0), 0);
    if (total <= 0) { toast.current?.show({ severity: 'warn', summary: 'Montant requis', detail: 'Veuillez spécifier un montant.' }); return; }
    const newId = `PAY-2025-${String(paiements.length + 1).padStart(3, '0')}`;
    const newPaiements = paiementMixte.map((p, i) => ({ id: `${newId}-${i + 1}`, venteId: `VTE-2025-${String(paiements.length + 1).padStart(3, '0')}`, client: p.typePaiement === 'Crédit client' ? clients[0] : null, date: new Date().toISOString().split('T')[0], typePaiement: p.typePaiement, montant: p.montant || 0, numeroTransaction: p.numeroTransaction || null, commission: p.commission || 0, statut: p.typePaiement === 'Mobile Money' ? 'En attente' : 'Validé' }));
    setPaiements((prev) => [...newPaiements, ...prev]);
    setCaisseFond((prev) => prev + newPaiements.filter((p) => p.typePaiement === 'Espèces').reduce((s, p) => s + p.montant, 0));
    toast.current?.show({ severity: 'success', summary: 'Paiement enregistré', detail: `Paiement ${newId} traité.` });
    setShowPaiementForm(false); setPaiementMixte([emptyPaiement]);
  };

  // Actions
  const validateMobileMoney = (row) => {
    confirmDialog({ message: `Valider la transaction ${row.numeroTransaction} ?`, header: 'Validation Mobile Money', icon: 'pi pi-mobile', accept: () => { setPaiements((prev) => prev.map((p) => (p.id === row.id ? { ...p, statut: 'Validé' } : p))); toast.current?.show({ severity: 'success', summary: 'Validé', detail: 'Transaction mobile money validée.' }); } });
  };
  const manageFondCaisse = () => {
    confirmDialog({ message: (<div><p>Ajuster le fond de caisse</p><InputNumber value={caisseFond} onValueChange={(e) => setCaisseFond(e.value || 0)} mode="currency" currency="MGA" style={{ width: '100%' }} /></div>), header: 'Gérer fond de caisse', icon: 'pi pi-wallet', acceptLabel: 'Enregistrer', accept: () => { toast.current?.show({ severity: 'success', summary: 'Fond ajusté', detail: 'Fond de caisse mis à jour.' }); } });
  };
  const makeRemboursement = (row) => { setRemboursementPaiement(row); setShowRemboursementForm(true); };
  const saveRemboursement = (montant) => {
    if (montant > caisseFond) { toast.current?.show({ severity: 'warn', summary: 'Fonds insuffisants', detail: 'Le fond de caisse est insuffisant.' }); return; }
    setPaiements((prev) => prev.map((p) => (p.id === remboursementPaiement.id ? { ...p, statut: 'Échec', montant: Math.max(0, (p.montant || 0) - (montant || 0)) } : p)));
    setCaisseFond((prev) => prev - (montant || 0));
    toast.current?.show({ severity: 'success', summary: 'Remboursement effectué', detail: `Remboursement de ${Number(montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} pour ${remboursementPaiement.id}.` });
    setShowRemboursementForm(false);
  };
  const generateRapportCaisse = () => {
    const csvContent = [
      ['ID', 'Vente', 'Client', 'Date', 'Type Paiement', 'Montant', 'Commission', 'Statut'].join(','),
      ...filtered.map((p) => [p.id, p.venteId, p.client ? p.client.nom : 'Anonyme', p.date, p.typePaiement, p.montant.toLocaleString('fr-FR'), p.commission.toLocaleString('fr-FR'), p.statut].join(',')),
      ['', '', '', '', '', `Fond de caisse: ${caisseFond.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, '', ''].join(','),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'rapport_caisse.csv'; a.click(); URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Rapport généré', detail: 'Rapport de caisse exporté.' });
  };
  const cloturerCaisse = () => { confirmDialog({ message: `Clôturer la caisse avec un fond de ${caisseFond.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} ?`, header: 'Clôture de caisse', icon: 'pi pi-lock', accept: () => { toast.current?.show({ severity: 'success', summary: 'Caisse clôturée', detail: 'Caisse journalière clôturée.' }); } }); };

  // Column templates
  const montantBody = (row) => row.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const commissionBody = (row) => row.commission.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const clientBody = (row) => (row.client ? row.client.nom : 'Anonyme');
  const statutBody = (row) => (<Tag value={row.statut} severity={row.statut === 'Validé' ? 'success' : row.statut === 'En attente' ? 'warning' : 'danger'} />);
  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {row.typePaiement === 'Mobile Money' && row.statut === 'En attente' && (
        <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={() => validateMobileMoney(row)} tooltip="Valider transaction" />
      )}
      <Button icon="pi pi-undo" className="p-button-text p-button-sm" onClick={() => makeRemboursement(row)} tooltip="Rembourser" disabled={row.statut !== 'Validé'} />
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: '#16a085' }}>Paiements</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Dropdown value={statutFilter} options={statuts} onChange={(e) => setStatutFilter(e.value)} placeholder="Filtrer par statut" style={{ minWidth: 160 }} className="p-inputtext-sm" />
      <span className="p-input-icon-left" style={{ minWidth: 280 }}>
        <i className="pi pi-search" />
        <InputText ref={searchRef} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (ID, vente, client, transaction)" className="p-inputtext-sm" />
      </span>
      <Button label="Paiement mixte" icon="pi pi-plus" onClick={() => setShowPaiementForm(true)} className="p-button-success p-button-sm" />
      <Button label="Rapport caisse" icon="pi pi-file-export" onClick={generateRapportCaisse} className="p-button-outlined p-button-sm" />
      <Button label="Clôturer caisse" icon="pi pi-lock" onClick={cloturerCaisse} className="p-button-outlined p-button-sm" />
      <Button label="Fond caisse" icon="pi pi-wallet" onClick={manageFondCaisse} className="p-button-outlined p-button-sm" />
    </div>
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowPaiementForm(false); setShowRemboursementForm(false); }
      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); setShowPaiementForm(true); }
      if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); generateRapportCaisse(); }
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); cloturerCaisse(); }
      if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); manageFondCaisse(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [generateRapportCaisse, cloturerCaisse, manageFondCaisse]);

  // UI with heavy client aesthetic
  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif', background: '#e6e9ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      {/* Window */}
      <div className="app-window" style={{ width: 'min(1500px, 100vw)', height: 'min(950px, 100vh)', background: '#ffffff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'grid', gridTemplateRows: '48px 1fr 32px', overflow: 'hidden' }}>
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(180deg,#f8f9fb,#ebedf2)', borderBottom: '1px solid #d9dde5', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', userSelect: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff605c', cursor: 'pointer' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd44', cursor: 'pointer' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ca4e', cursor: 'pointer' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Gestion des Paiements</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag severity="success" value="Ctrl+M Paiement" style={{ fontSize: 12 }} />
            <Tag severity="info" value="Ctrl+R Rapport" style={{ fontSize: 12 }} />
            <Tag severity="warning" value="Ctrl+L Clôturer" style={{ fontSize: 12 }} />
            <Tag severity="secondary" value="Ctrl+W Fond" style={{ fontSize: 12 }} />
          </div>
        </div>

        {/* Body: Resizable sidebar + handle + content */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 8px 1fr`, minHeight: 0 }}>
          {/* Sidebar */}
          <aside style={{ background: '#f8f9fb', borderRight: '1px solid #d9dde5', overflow: 'auto', padding: 16 }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Resize handle */}
          <div role="separator" aria-orientation="vertical" title="Glisser pour redimensionner" onMouseDown={() => (resizingRef.current = true)} style={{ cursor: 'col-resize', background: '#d9dde5', transition: 'background 0.2s', ':hover': { background: '#16a085' } }} />

          {/* Main content */}
          <main style={{ display: 'grid', gridTemplateRows: '48px 1fr', minWidth: 0 }}>
            {/* Module header */}
            <div style={{ background: 'linear-gradient(180deg,#16a085,#0f8b6e)', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="pi pi-wallet" style={{ fontSize: 20 }} />
                <strong style={{ fontSize: 16 }}>Stock ▸ Vente ▸ Paiements</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Plein écran • Optimisé clavier</div>
            </div>

            {/* Scrollable content */}
            <div style={{ padding: 16, overflow: 'auto', display: 'grid', gap: 16, gridTemplateRows: '1fr' }}>
              <div style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border: 0, padding: '8px 12px' }} />
                <div style={{ minHeight: 0 }}>
                  <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} scrollable scrollHeight="flex" responsiveLayout="scroll" stripedRows tableStyle={{ fontSize: 14 }}>
                    <Column field="id" header="ID Paiement" sortable style={{ minWidth: 150 }} />
                    <Column field="venteId" header="Vente" sortable style={{ minWidth: 130 }} />
                    <Column header="Client" body={clientBody} sortable style={{ minWidth: 180 }} />
                    <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                    <Column field="typePaiement" header="Type" sortable style={{ minWidth: 150 }} />
                    <Column field="montant" header="Montant" body={montantBody} sortable style={{ minWidth: 140 }} />
                    <Column field="numeroTransaction" header="N° Transaction" style={{ minWidth: 180 }} />
                    <Column field="commission" header="Commission" body={commissionBody} sortable style={{ minWidth: 140 }} />
                    <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 140 }} />
                    <Column header="Actions" body={actionsBody} style={{ width: 120 }} frozen alignFrozen="right" />
                  </DataTable>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mixed payment dialog */}
        <Dialog header="Nouveau Paiement Mixte" visible={showPaiementForm} style={{ width: '800px', maxWidth: '95vw' }} modal onHide={() => setShowPaiementForm(false)} className="p-dialog-sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16 }}>
            {paiementMixte.map((p, index) => (
              <div key={index} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Dropdown value={p.typePaiement} options={typesPaiement} onChange={(e) => updatePaiementMixte(index, 'typePaiement', e.value)} style={{ width: 200 }} className="p-inputtext-sm" />
                <InputNumber value={p.montant} onValueChange={(e) => updatePaiementMixte(index, 'montant', e.value || 0)} mode="currency" currency="MGA" style={{ width: 200 }} className="p-inputtext-sm" />
                {p.typePaiement === 'Mobile Money' && (
                  <InputText value={p.numeroTransaction} onChange={(e) => updatePaiementMixte(index, 'numeroTransaction', e.target.value)} placeholder="N° Transaction" style={{ width: 220 }} className="p-inputtext-sm" />
                )}
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => removePaiementMixte(index)} disabled={paiementMixte.length === 1} />
              </div>
            ))}
            <Button label="Ajouter mode" icon="pi pi-plus" onClick={addPaiementMixte} className="p-button-outlined p-button-sm" style={{ width: 160 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <Button label="Annuler" className="p-button-text p-button-sm" onClick={() => setShowPaiementForm(false)} />
              <Button label="Enregistrer" icon="pi pi-save" className="p-button-success p-button-sm" onClick={savePaiementMixte} />
            </div>
          </div>
        </Dialog>

        {/* Refund dialog */}
        <Dialog header={`Rembourser — ${remboursementPaiement?.id ?? 'Paiement'}`} visible={showRemboursementForm} style={{ width: '500px', maxWidth: '95vw' }} modal onHide={() => setShowRemboursementForm(false)} className="p-dialog-sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16 }}>
            <span className="p-float-label">
              <InputNumber value={remboursementPaiement?.montant || 0} onValueChange={(e) => setRemboursementPaiement((prev) => ({ ...prev, montant: e.value || 0 }))} mode="currency" currency="MGA" style={{ width: '100%' }} className="p-inputtext-sm" />
              <label htmlFor="montant">Montant à rembourser</label>
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button label="Annuler" className="p-button-text p-button-sm" onClick={() => setShowRemboursementForm(false)} />
              <Button label="Rembourser" icon="pi pi-undo" className="p-button-success p-button-sm" onClick={() => saveRemboursement(remboursementPaiement?.montant || 0)} />
            </div>
          </div>
        </Dialog>

        {/* Status bar */}
        <footer style={{ background: '#f0f2f6', borderTop: '1px solid #d9dde5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 13, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Fond de caisse: {caisseFond.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Raccourcis: Ctrl+M • Ctrl+R • Ctrl+L • Ctrl+W • Ctrl+F • Esc</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        .app-window { transition: all 0.2s ease; }
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus { outline: 2px solid #16a085 !important; outline-offset: 2px; }
        .p-dialog-sm .p-dialog-content { padding: 0 !important; }
        .p-button-sm { padding: 4px 12px !important; }
        .p-inputtext-sm { font-size: 14px !important; }
        @media (max-width: 1200px) { 
          .window-body { grid-template-columns: 0 0 1fr !important; } 
          .app-window { height: 100vh !important; border-radius: 0; width: 100vw !important; } 
        }
        @media (max-width: 768px) { 
          .p-datatable .p-datatable-thead > tr > th, 
          .p-datatable .p-datatable-tbody > tr > td { padding: 8px !important; font-size: 13px !important; }
          .p-toolbar { flex-wrap: wrap; gap: 8px; }
        }
      `}</style>
    </div>
  );
}