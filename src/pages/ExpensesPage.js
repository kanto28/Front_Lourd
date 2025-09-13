import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import Sidebar from '../components/Sidebar';

/**
 * ExpensesPage – Look & feel "interface client lourd"
 * - Fenêtre avec barre de titre (● ● ●), sidebar redimensionnable, barre d'état.
 * - Raccourcis : Ctrl+N (nouvelle dépense), Ctrl+F (recherche), Ctrl+E (export CSV), Ctrl+B (analyse budgets), Esc (fermer dialogs).
 * - Tableau principal full-height + section Suivi budgétaire.
 */
export default function ExpensesPage() {
  const toast = useRef(null);
  const searchRef = useRef(null);

  // ===== Données mockées =====
  const fournisseurs = [
    { id: 1, nom: 'ElectroMad', contact: 'contact@electromad.mg' },
    { id: 2, nom: 'AquaVita', contact: 'contact@aquavita.mg' },
  ];

  const categories = [
    'Électricité', 'Eau', 'Téléphone/Internet', 'Loyer', 'Assurance', 'Maintenance',
    'Fournitures de bureau', 'Transport', 'Publicité/Marketing', 'Formations', 'Taxes et impôts', 'Autres',
  ].map((cat) => ({ label: cat, value: cat }));

  const budgets = {
    'Électricité': 500000,
    'Eau': 200000,
    'Téléphone/Internet': 150000,
    'Loyer': 1000000,
    'Assurance': 300000,
    'Maintenance': 200000,
    'Fournitures de bureau': 100000,
    'Transport': 150000,
    'Publicité/Marketing': 200000,
    'Formations': 100000,
    'Taxes et impôts': 500000,
    'Autres': 100000,
  };

  const seed = [
    {
      id: 'DEP-2025-001', montant: 450000, description: 'Facture électricité juillet', date: '2025-07-15',
      categorie: 'Électricité', fournisseur: fournisseurs[0], numeroFacture: 'ELEC-2025-001', modePaiement: 'Virement',
      statut: 'Payé', justificatif: 'facture_elec_001.pdf', budgetPrevu: budgets['Électricité'], budgetRealise: 450000,
    },
    {
      id: 'DEP-2025-002', montant: 180000, description: 'Abonnement internet août', date: '2025-08-01',
      categorie: 'Téléphone/Internet', fournisseur: null, numeroFacture: 'INET-2025-001', modePaiement: 'Espèces',
      statut: 'En attente', justificatif: null, budgetPrevu: budgets['Téléphone/Internet'], budgetRealise: 180000,
    },
    {
      id: 'DEP-2025-003', montant: 1100000, description: 'Loyer pharmacie septembre', date: '2025-09-01',
      categorie: 'Loyer', fournisseur: null, numeroFacture: 'LOYER-2025-001', modePaiement: 'Chèque',
      statut: 'En attente', justificatif: 'contrat_loyer_001.pdf', budgetPrevu: budgets['Loyer'], budgetRealise: 1100000,
    },
  ];

  const [depenses, setDepenses] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [depenseForm, setDepenseForm] = useState({
    id: null,
    montant: 0,
    description: '',
    date: null,
    categorie: 'Autres',
    fournisseur: null,
    numeroFacture: '',
    modePaiement: 'Virement',
    statut: 'En attente',
    justificatif: null,
    budgetPrevu: budgets['Autres'] || 0,
  });

  const modesPaiement = [
    { label: 'Virement', value: 'Virement' },
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Chèque', value: 'Chèque' },
  ];

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

  // ===== Filtrage =====
  const filtered = useMemo(() => {
    let list = [...depenses];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter((d) =>
        d.id.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.categorie.toLowerCase().includes(q) ||
        (d.fournisseur && d.fournisseur.nom.toLowerCase().includes(q)) ||
        d.numeroFacture.toLowerCase().includes(q)
      );
    }
    return list;
  }, [depenses, globalFilter]);

  // ===== Analyse budgétaire =====
  const budgetStats = useMemo(() => {
    const stats = categories.reduce((acc, cat) => {
      const depensesCat = filtered.filter((d) => d.categorie === cat.value);
      const totalRealise = depensesCat.reduce((sum, d) => sum + d.montant, 0);
      acc[cat.value] = {
        budgetPrevu: budgets[cat.value] || 0,
        budgetRealise: totalRealise,
        depassement: totalRealise > (budgets[cat.value] || 0) ? totalRealise - (budgets[cat.value] || 0) : 0,
      };
      return acc;
    }, {});
    return stats;
  }, [filtered]);

  // ===== Actions =====
  const openCreateDepense = () => {
    setDepenseForm({ id: null, montant: 0, description: '', date: null, categorie: 'Autres', fournisseur: null, numeroFacture: '', modePaiement: 'Virement', statut: 'En attente', justificatif: null, budgetPrevu: budgets['Autres'] || 0 });
    setShowDepenseForm(true);
  };
  const openEditDepense = (row) => { setDepenseForm({ ...row, date: row.date ? new Date(row.date) : null }); setShowDepenseForm(true); };

  const saveDepense = () => {
    if (!depenseForm.montant || !depenseForm.description || !depenseForm.date || !depenseForm.categorie) {
      toast.current?.show({ severity: 'warn', summary: 'Champs requis', detail: 'Montant, description, date et catégorie sont requis.' });
      return;
    }
    const depenseData = {
      ...depenseForm,
      id: depenseForm.id || `DEP-2025-${String(depenses.length + 1).padStart(3, '0')}`,
      date: depenseForm.date.toISOString().split('T')[0],
      budgetPrevu: budgets[depenseForm.categorie] || 0,
      budgetRealise: depenseForm.montant,
    };

    if (depenseForm.id) {
      setDepenses((prev) => prev.map((d) => (d.id === depenseForm.id ? depenseData : d)));
      toast.current?.show({ severity: 'success', summary: 'Mis à jour', detail: 'Dépense modifiée.' });
    } else {
      setDepenses((prev) => [depenseData, ...prev]);
      toast.current?.show({ severity: 'success', summary: 'Créée', detail: 'Dépense ajoutée.' });
    }
    setShowDepenseForm(false);
  };

  const validateDepense = (row) => { setDepenses((prev) => prev.map((d) => (d.id === row.id ? { ...d, statut: 'Payé' } : d))); toast.current?.show({ severity: 'success', summary: 'Validée', detail: `Dépense ${row.id} validée.` }); };
  const rejectDepense = (row) => { setDepenses((prev) => prev.map((d) => (d.id === row.id ? { ...d, statut: 'Rejeté' } : d))); toast.current?.show({ severity: 'warn', summary: 'Rejetée', detail: `Dépense ${row.id} rejetée.` }); };
  const joindreJustificatif = (row) => { toast.current?.show({ severity: 'info', summary: 'Justificatif', detail: `Simulation : Justificatif joint pour ${row.id} (fichier : justificatif_${row.id}.pdf).` }); };
  const printRecu = (row) => { toast.current?.show({ severity: 'info', summary: 'Impression', detail: `Simulation : Impression du reçu pour ${row.id}.` }); };

  const exportDepenses = () => {
    const csvContent = [
      ['ID', 'Montant', 'Description', 'Date', 'Catégorie', 'Fournisseur', 'N° Facture', 'Mode de paiement', 'Statut', 'Budget prévu', 'Budget réalisé'].join(','),
      ...filtered.map((d) => [d.id, d.montant, d.description, d.date, d.categorie, d.fournisseur ? d.fournisseur.nom : 'N/A', d.numeroFacture, d.modePaiement, d.statut, budgets[d.categorie] || 0, d.montant].join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'depenses.csv'; a.click(); URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste des dépenses exportée.' });
  };

  const analyserDepassements = () => {
    const depassements = Object.entries(budgetStats)
      .filter(([_, stat]) => stat.depassement > 0)
      .map(([cat, stat]) => `${cat}: ${stat.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`);
    if (depassements.length === 0) {
      toast.current?.show({ severity: 'info', summary: 'Analyse', detail: 'Aucun dépassement budgétaire détecté.' });
    } else {
      toast.current?.show({ severity: 'warn', summary: 'Dépassements budgétaires', detail: depassements.join('\n'), life: 5000 });
    }
  };

  // ===== Raccourcis clavier =====
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowDepenseForm(false); }
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); openCreateDepense(); }
      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); exportDepenses(); }
      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); analyserDepassements(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered]);

  // ===== Colonnes =====
  const montantBody = (row, field) => row[field].toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const fournisseurBody = (row) => (row.fournisseur ? row.fournisseur.nom : 'N/A');
  const statutBody = (row) => (<Tag value={row.statut} severity={row.statut === 'Payé' ? 'success' : row.statut === 'En attente' ? 'warning' : 'danger'} />);
  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEditDepense(row)} tooltip="Modifier" disabled={row.statut === 'Payé'} />
      <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={() => validateDepense(row)} tooltip="Valider" disabled={row.statut !== 'En attente'} />
      <Button icon="pi pi-times" className="p-button-text p-button-sm p-button-danger" onClick={() => rejectDepense(row)} tooltip="Rejeter" disabled={row.statut !== 'En attente'} />
      <Button icon="pi pi-paperclip" className="p-button-text p-button-sm" onClick={() => joindreJustificatif(row)} tooltip="Joindre justificatif" />
      <Button icon="pi pi-print" className="p-button-text p-button-sm" onClick={() => printRecu(row)} tooltip="Imprimer reçu" />
    </div>
  );

  // ===== Entêtes toolbar =====
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 800, color: '#16a085' }}>Gestion des dépenses</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ minWidth: 260 }}>
        <i className="pi pi-search" />
        <InputText ref={searchRef} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (ID, description, catégorie, fournisseur)" />
      </span>
      <Button label="Nouvelle dépense" icon="pi pi-plus" onClick={openCreateDepense} className="p-button-success" />
      <Button label="Exporter CSV" icon="pi pi-file-export" onClick={exportDepenses} className="p-button-outlined" />
      <Button label="Analyser budgets" icon="pi pi-chart-bar" onClick={analyserDepassements} className="p-button-outlined" />
    </div>
  );

  // ===== Layout client lourd =====
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: '#e6e9ef',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <Toast ref={toast} />

      {/* Fenêtre */}
      <div className="app-window" style={{
        width: 'min(1450px, 100vw)',
        height: 'min(920px, 100vh)',
        background: '#f7f8fb',
        borderRadius: 12,
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        display: 'grid',
        gridTemplateRows: '44px 1fr 28px',
        overflow: 'hidden',
      }}>
        {/* Barre de titre */}
        <div style={{
          background: 'linear-gradient(180deg,#fdfdfd,#f1f3f7)',
          borderBottom: '1px solid #e3e6ee',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Dépenses</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag severity="success" value="Ctrl+N Nouveau" />
            <Tag severity="success" value="Ctrl+F Rechercher" />
            <Tag severity="info" value="Ctrl+E Export" />
            <Tag severity="warning" value="Ctrl+B Analyse" />
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
            <div style={{
              background: 'linear-gradient(180deg,#16a085,#11967b)',
              color: '#fff',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="pi pi-wallet" style={{ fontSize: 18 }} />
                <strong>Comptabilité ▸ Gestion des dépenses</strong>
              </div>
              <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ padding: 12, minHeight: 0, overflow: 'auto', display: 'grid', gap: 16, gridTemplateRows: 'auto 1fr' }}>
              {/* Suivi budgétaire */}
              <div style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, padding: 16, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', color: '#16a085' }}>Suivi budgétaire</h3>
                <DataTable value={Object.entries(budgetStats).map(([cat, stat]) => ({ categorie: cat, ...stat }))} responsiveLayout="scroll">
                  <Column field="categorie" header="Catégorie" sortable />
                  <Column field="budgetPrevu" header="Budget prévu" body={(row) => row.budgetPrevu.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} sortable />
                  <Column field="budgetRealise" header="Budget réalisé" body={(row) => row.budgetRealise.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} sortable />
                  <Column field="depassement" header="Dépassement" body={(row) => row.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} sortable />
                </DataTable>
              </div>

              {/* Liste des dépenses */}
              <div style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 26px rgba(0,0,0,0.06)', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
                <div style={{ minHeight: 0 }}>
                  <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} scrollable scrollHeight="flex" responsiveLayout="scroll" stripedRows>
                    <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
                    <Column field="montant" header="Montant" body={(row) => montantBody(row, 'montant')} sortable style={{ minWidth: 120 }} />
                    <Column field="description" header="Description" sortable style={{ minWidth: 200 }} />
                    <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 140 }} />
                    <Column header="Fournisseur" body={fournisseurBody} sortable style={{ minWidth: 160 }} />
                    <Column field="numeroFacture" header="N° Facture" sortable style={{ minWidth: 140 }} />
                    <Column field="modePaiement" header="Paiement" sortable style={{ minWidth: 120 }} />
                    <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 120 }} />
                    <Column field="justificatif" header="Justificatif" sortable style={{ minWidth: 140 }} />
                    <Column header="Actions" body={actionsBody} style={{ width: 260 }} frozen alignFrozen="right" />
                  </DataTable>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Dialog Ajout/Modification dépense */}
        <Dialog header={depenseForm.id ? 'Modifier dépense' : 'Nouvelle dépense'} visible={showDepenseForm} style={{ width: '760px', maxWidth: '95vw' }} modal onHide={() => setShowDepenseForm(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <span className="p-float-label">
              <InputNumber value={depenseForm.montant} onValueChange={(e) => setDepenseForm({ ...depenseForm, montant: e.value || 0 })} mode="currency" currency="MGA" style={{ width: '100%' }} />
              <label htmlFor="montant">Montant</label>
            </span>
            <span className="p-float-label">
              <InputText value={depenseForm.description} onChange={(e) => setDepenseForm({ ...depenseForm, description: e.target.value })} style={{ width: '100%' }} />
              <label htmlFor="description">Description</label>
            </span>
            <span className="p-float-label">
              <Calendar value={depenseForm.date} onChange={(e) => setDepenseForm({ ...depenseForm, date: e.value })} style={{ width: '100%' }} dateFormat="yy-mm-dd" />
              <label htmlFor="date">Date</label>
            </span>
            <span className="p-float-label">
              <Dropdown value={depenseForm.categorie} options={categories} onChange={(e) => setDepenseForm({ ...depenseForm, categorie: e.value, budgetPrevu: budgets[e.value] || 0 })} style={{ width: '100%' }} />
              <label htmlFor="categorie">Catégorie</label>
            </span>
            <span className="p-float-label">
              <Dropdown value={depenseForm.fournisseur} options={[{ label: 'Aucun', value: null }, ...fournisseurs.map((f) => ({ label: f.nom, value: f }))]} onChange={(e) => setDepenseForm({ ...depenseForm, fournisseur: e.value })} style={{ width: '100%' }} optionLabel="label" />
              <label htmlFor="fournisseur">Fournisseur</label>
            </span>
            <span className="p-float-label">
              <InputText value={depenseForm.numeroFacture} onChange={(e) => setDepenseForm({ ...depenseForm, numeroFacture: e.target.value })} style={{ width: '100%' }} />
              <label htmlFor="numeroFacture">N° Facture</label>
            </span>
            <span className="p-float-label">
              <Dropdown value={depenseForm.modePaiement} options={[{ label: 'Virement', value: 'Virement' }, { label: 'Espèces', value: 'Espèces' }, { label: 'Chèque', value: 'Chèque' }]} onChange={(e) => setDepenseForm({ ...depenseForm, modePaiement: e.value })} style={{ width: '100%' }} />
              <label htmlFor="modePaiement">Mode de paiement</label>
            </span>
            <span className="p-float-label">
              <InputText value={depenseForm.justificatif || ''} onChange={(e) => setDepenseForm({ ...depenseForm, justificatif: e.target.value })} style={{ width: '100%' }} placeholder="Nom du fichier (simulé)" />
              <label htmlFor="justificatif">Justificatif</label>
            </span>
            <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
              <InputNumber value={depenseForm.budgetPrevu} mode="currency" currency="MGA" style={{ width: '100%' }} disabled />
              <label htmlFor="budgetPrevu">Budget prévu</label>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button label="Annuler" className="p-button-text" onClick={() => setShowDepenseForm(false)} />
            <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveDepense} />
          </div>
        </Dialog>

        {/* Barre d'état */}
        <footer style={{ background: '#eef1f6', borderTop: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12, fontSize: 12, color: '#2f3b52' }}>
          <span style={{ opacity: 0.9 }}>État: prêt</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span>Raccourcis: Ctrl+N • Ctrl+F • Ctrl+E • Ctrl+B • Esc</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Focus & responsive */}
      <style>{`
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus {
          outline: 2px solid #16a085 !important;
          outline-offset: 1px;
        }
        @media (max-width: 1200px) {
          .window-body { grid-template-columns: 0 0 1fr !important; }
          .app-window { height: 100vh !important; border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
