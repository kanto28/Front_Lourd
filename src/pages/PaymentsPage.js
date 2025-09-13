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
 * PaymentsPage – Look & feel "interface client lourd"
 * - Fenêtre desktop (● ● ●), sidebar redimensionnable, barre d'état.
 * - Raccourcis: Ctrl+M (Paiement mixte), Ctrl+R (Rapport caisse CSV), Ctrl+L (Clôturer), Ctrl+W (Fond de caisse), Ctrl+F (Rechercher), Esc (fermer dialogs).
 * - Table full-height, filtres, validation Mobile Money, remboursements, fond de caisse.
 */
export default function PaymentsPage() {
  const toast = useRef(null);
  const searchRef = useRef(null);

  // ===== Données mockées =====
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

  // ===== Sidebar redimensionnable =====
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ===== Dialog Paiement mixte =====
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

  // ===== Dialog Remboursement =====
  const [showRemboursementForm, setShowRemboursementForm] = useState(false);
  const [remboursementPaiement, setRemboursementPaiement] = useState(null);

  const statuts = [
    { label: 'Tous', value: null },
    { label: 'Validé', value: 'Validé' },
    { label: 'En attente', value: 'En attente' },
    { label: 'Échec', value: 'Échec' },
  ];

  // ===== Filtrage =====
  const filtered = useMemo(() => {
    let list = [...paiements];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter((r) => r.id.toLowerCase().includes(q) || r.venteId.toLowerCase().includes(q) || (r.client && r.client.nom.toLowerCase().includes(q)) || (r.numeroTransaction || '').toLowerCase().includes(q));
    }
    if (statutFilter) list = list.filter((r) => r.statut === statutFilter);
    return list;
  }, [paiements, globalFilter, statutFilter]);

  // ===== Paiement mixte logic =====
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

  // ===== Actions =====
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

  // ===== Colonnes =====
  const montantBody = (row) => row.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const commissionBody = (row) => row.commission.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const clientBody = (row) => (row.client ? row.client.nom : 'Anonyme');
  const statutBody = (row) => (<Tag value={row.statut} severity={row.statut === 'Validé' ? 'success' : row.statut === 'En attente' ? 'warning' : 'danger'} />);
  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {row.typePaiement === 'Mobile Money' && row.statut === 'En attente' && (
        <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={() => validateMobileMoney(row)} tooltip="Valider transaction" />
      )}
      <Button icon="pi pi-undo" className="p-button-text p-button-sm" onClick={() => makeRemboursement(row)} tooltip="Rembourser" disabled={row.statut !== 'Validé'} />
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 800, color: '#16a085' }}>Paiements</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Dropdown value={statutFilter} options={statuts} onChange={(e) => setStatutFilter(e.value)} placeholder="Statut" style={{ minWidth: 140 }} />
      <span className="p-input-icon-left" style={{ minWidth: 260 }}>
        <i className="pi pi-search" />
        <InputText ref={searchRef} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (ID, vente, client, transaction)" />
      </span>
      <Button label="Paiement mixte" icon="pi pi-plus" onClick={() => setShowPaiementForm(true)} className="p-button-success" />
      <Button label="Rapport caisse" icon="pi pi-file-export" onClick={generateRapportCaisse} className="p-button-outlined" />
      <Button label="Clôturer caisse" icon="pi pi-lock" onClick={cloturerCaisse} className="p-button-outlined" />
      <Button label="Fond caisse" icon="pi pi-wallet" onClick={manageFondCaisse} className="p-button-outlined" />
    </div>
  );

  // ===== Raccourcis clavier =====
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

  // ===== UI style client lourd =====
  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif', background: '#e6e9ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Fenêtre */}
      <div className="app-window" style={{ width: 'min(1450px, 100vw)', height: 'min(920px, 100vh)', background: '#f7f8fb', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,0.18)', display: 'grid', gridTemplateRows: '44px 1fr 28px', overflow: 'hidden' }}>
        {/* Barre de titre */}
        <div style={{ background: 'linear-gradient(180deg,#fdfdfd,#f1f3f7)', borderBottom: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', userSelect: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Paiements</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag severity="success" value="Ctrl+M Paiement mixte" />
            <Tag severity="info" value="Ctrl+R Rapport" />
            <Tag severity="warning" value="Ctrl+L Clôturer" />
            <Tag severity="secondary" value="Ctrl+W Fond" />
          </div>
        </div>

        {/* Corps : Sidebar redimensionnable + poignée + contenu */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 6px 1fr`, minHeight: 0 }}>
          {/* Sidebar */}
          <aside style={{ background: '#fff', borderRight: '1px solid #e3e6ee', overflow: 'auto' }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Poignée */}
          <div role="separator" aria-orientation="vertical" title="Glisser pour redimensionner" onMouseDown={() => (resizingRef.current = true)} style={{ cursor: 'col-resize', background: '#e3e6ee' }} />

          {/* Contenu principal */}
          <main style={{ display: 'grid', gridTemplateRows: '42px 1fr', minWidth: 0 }}>
            {/* Bandeau module */}
            <div style={{ background: 'linear-gradient(180deg,#16a085,#11967b)', color: '#fff', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="pi pi-wallet" style={{ fontSize: 18 }} />
                <strong>Stock ▸ Vente ▸ Gestion des paiements</strong>
              </div>
              <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ padding: 12, minHeight: 0, overflow: 'auto', display: 'grid', gap: 16, gridTemplateRows: '1fr' }}>
              <div style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 26px rgba(0,0,0,0.06)', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
                <div style={{ minHeight: 0 }}>
                  <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} scrollable scrollHeight="flex" responsiveLayout="scroll" stripedRows>
                    <Column field="id" header="ID Paiement" sortable style={{ minWidth: 140 }} />
                    <Column field="venteId" header="Vente" sortable style={{ minWidth: 120 }} />
                    <Column header="Client" body={clientBody} sortable style={{ minWidth: 160 }} />
                    <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                    <Column field="typePaiement" header="Type" sortable style={{ minWidth: 140 }} />
                    <Column field="montant" header="Montant" body={montantBody} sortable style={{ minWidth: 130 }} />
                    <Column field="numeroTransaction" header="N° Transaction" style={{ minWidth: 160 }} />
                    <Column field="commission" header="Commission" body={commissionBody} sortable style={{ minWidth: 130 }} />
                    <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 130 }} />
                    <Column header="Actions" body={actionsBody} style={{ width: 140 }} frozen alignFrozen="right" />
                  </DataTable>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Dialog Paiement mixte */}
        <Dialog header="Paiement mixte" visible={showPaiementForm} style={{ width: '760px', maxWidth: '95vw' }} modal onHide={() => setShowPaiementForm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paiementMixte.map((p, index) => (
              <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Dropdown value={p.typePaiement} options={typesPaiement} onChange={(e) => updatePaiementMixte(index, 'typePaiement', e.value)} style={{ width: 180 }} />
                <InputNumber value={p.montant} onValueChange={(e) => updatePaiementMixte(index, 'montant', e.value || 0)} mode="currency" currency="MGA" style={{ width: 180 }} />
                {p.typePaiement === 'Mobile Money' && (
                  <InputText value={p.numeroTransaction} onChange={(e) => updatePaiementMixte(index, 'numeroTransaction', e.target.value)} placeholder="N° Transaction" style={{ width: 200 }} />
                )}
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => removePaiementMixte(index)} disabled={paiementMixte.length === 1} />
              </div>
            ))}
            <Button label="Ajouter mode" icon="pi pi-plus" onClick={addPaiementMixte} className="p-button-outlined" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button label="Annuler" className="p-button-text" onClick={() => setShowPaiementForm(false)} />
              <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={savePaiementMixte} />
            </div>
          </div>
        </Dialog>

        {/* Dialog Remboursement */}
        <Dialog header={`Rembourser — ${remboursementPaiement?.id ?? 'Paiement'}`} visible={showRemboursementForm} style={{ width: '520px', maxWidth: '95vw' }} modal onHide={() => setShowRemboursementForm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="p-float-label">
              <InputNumber value={remboursementPaiement?.montant || 0} onValueChange={(e) => setRemboursementPaiement((prev) => ({ ...prev, montant: e.value || 0 }))} mode="currency" currency="MGA" style={{ width: '100%' }} />
              <label htmlFor="montant">Montant à rembourser</label>
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button label="Annuler" className="p-button-text" onClick={() => setShowRemboursementForm(false)} />
              <Button label="Rembourser" icon="pi pi-undo" className="p-button-success" onClick={() => saveRemboursement(remboursementPaiement?.montant || 0)} />
            </div>
          </div>
        </Dialog>

        {/* Barre d'état */}
        <footer style={{ background: '#eef1f6', borderTop: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12, fontSize: 12, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span>Raccourcis: Ctrl+M • Ctrl+R • Ctrl+L • Ctrl+W • Ctrl+F • Esc</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Focus & responsive */}
      <style>{`
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus { outline: 2px solid #16a085 !important; outline-offset: 1px; }
        @media (max-width: 1200px) { .window-body { grid-template-columns: 0 0 1fr !important; } .app-window { height: 100vh !important; border-radius: 0; } }
      `}</style>
    </div>
  );
}
