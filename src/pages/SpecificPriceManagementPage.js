import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { jsPDF } from 'jspdf';
import { Tag } from 'primereact/tag';
import Sidebar from '../components/Sidebar';

/**
 * SpecificPriceManagementPage – Interface client lourd améliorée
 * - Fenêtre desktop (● ● ●), sidebar redimensionnable, contenu scrollable, barre d'état.
 * - Raccourcis : Ctrl+A (ajouter prix), Ctrl+E (exporter).
 * - Gestion des prix spécifiques (CRUD, changement statut).
 * - Filtres + recherche, exports CSV/PDF.
 * - Palette MediFinder : verts (#16a085/#0f8b6e), gris (#f0f2f6).
 * - Scroll global sur la zone principale + scrolls internes sur la table et dialog.
 */
export default function SpecificPriceManagementPage() {
  const toast = useRef(null);

  // Données mockées
  const medicaments = useMemo(
    () => [
      { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000 },
      { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500 },
      { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000 },
      { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000 },
      { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000 },
    ],
    []
  );

  const [prixSpecifiques, setPrixSpecifiques] = useState([
    {
      id: 'SP-001',
      idMedicament: 'MED-001',
      prixSpecifique: 1500,
      statut: 'Actif',
      dateCreation: new Date('2025-07-01'),
      dateModification: new Date('2025-07-01'),
      raison: 'Promotion saisonnière',
    },
    {
      id: 'SP-002',
      idMedicament: 'MED-002',
      prixSpecifique: 2000,
      statut: 'Inactif',
      dateCreation: new Date('2025-08-01'),
      dateModification: new Date('2025-08-15'),
      raison: 'Ajustement concurrence',
    },
  ]);

  // Configuration par défaut
  const configuration = {
    margeGlobale: 30,
    margesParCategorie: {
      'Médicaments sur ordonnance': 25,
      'Médicaments sans ordonnance': 35,
      'Produits de parapharmacie': 40,
      'Produits cosmétiques': 50,
      'Matériel médical': 20,
    },
    tvaDefaut: 20,
    regleArrondi: 'À l’euro près',
    prixMinimum: 500,
    prixMaximum: 100000,
  };

  // États UI
  const [filtreStatut, setFiltreStatut] = useState(null);
  const [filtreCategorie, setFiltreCategorie] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPrix, setSelectedPrix] = useState(null);
  const [formData, setFormData] = useState({
    idMedicament: '',
    prixSpecifique: 0,
    statut: 'Actif',
    raison: '',
  });

  const statuts = [
    { label: 'Tous', value: null },
    { label: 'Actif', value: 'Actif' },
    { label: 'Inactif', value: 'Inactif' },
    { label: 'Archivé', value: 'Archivé' },
  ];

  const categories = [
    { label: 'Toutes', value: null },
    { label: 'Médicaments sur ordonnance', value: 'Médicaments sur ordonnance' },
    { label: 'Médicaments sans ordonnance', value: 'Médicaments sans ordonnance' },
    { label: 'Produits de parapharmacie', value: 'Produits de parapharmacie' },
    { label: 'Produits cosmétiques', value: 'Produits cosmétiques' },
    { label: 'Matériel médical', value: 'Matériel médical' },
  ];

  // Sidebar redimensionnable
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'a') { e.preventDefault(); openDialog(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); exporterListe('Excel'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Helpers
  const calculerPrixCalcule = (medicament) => {
    const marge = configuration.margesParCategorie[medicament.categorie] ?? configuration.margeGlobale;
    let prix = medicament.prixAchat * (1 + marge / 100) * (1 + configuration.tvaDefaut / 100);
    if (configuration.regleArrondi === 'À l’euro près') prix = Math.round(prix);
    return Math.max(configuration.prixMinimum, Math.min(prix, configuration.prixMaximum));
  };

  const tableData = useMemo(() => {
    return prixSpecifiques
      .map((p) => {
        const m = medicaments.find((x) => x.id === p.idMedicament);
        if (!m) return null;
        const prixCalcule = calculerPrixCalcule(m);
        return {
          ...p,
          nomMedicament: m.nom,
          categorie: m.categorie,
          prixAchat: m.prixAchat,
          prixCalcule,
          differenceMGA: p.prixSpecifique - prixCalcule,
          differencePourcentage: prixCalcule ? (((p.prixSpecifique - prixCalcule) / prixCalcule) * 100).toFixed(2) : '0.00',
        };
      })
      .filter(Boolean)
      .filter((i) => !filtreStatut || i.statut === filtreStatut)
      .filter((i) => !filtreCategorie || i.categorie === filtreCategorie)
      .filter((i) => !recherche || i.nomMedicament.toLowerCase().includes(recherche.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixSpecifiques, medicaments, filtreStatut, filtreCategorie, recherche]);

  // Dialog
  const openDialog = (row = null) => {
    setSelectedPrix(row);
    setFormData(
      row
        ? {
            idMedicament: row.idMedicament,
            prixSpecifique: row.prixSpecifique,
            statut: row.statut,
            raison: row.raison,
          }
        : { idMedicament: '', prixSpecifique: 0, statut: 'Actif', raison: '' }
    );
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setSelectedPrix(null);
    setFormData({ idMedicament: '', prixSpecifique: 0, statut: 'Actif', raison: '' });
  };

  // Actions CRUD
  const ajouterPrix = () => {
    const nouveau = {
      id: `SP-${String(prixSpecifiques.length + 1).padStart(3, '0')}`,
      idMedicament: formData.idMedicament,
      prixSpecifique: formData.prixSpecifique,
      statut: formData.statut,
      dateCreation: new Date(),
      dateModification: new Date(),
      raison: formData.raison,
    };
    setPrixSpecifiques((prev) => [...prev, nouveau]);
    toast.current?.show({ severity: 'success', summary: 'Ajout', detail: 'Prix spécifique ajouté.' });
    closeDialog();
  };

  const modifierPrix = () => {
    setPrixSpecifiques((prev) =>
      prev.map((p) => (p.id === selectedPrix.id ? { ...p, ...formData, dateModification: new Date() } : p))
    );
    toast.current?.show({ severity: 'success', summary: 'Modification', detail: 'Prix spécifique modifié.' });
    closeDialog();
  };

  const changerStatut = (row, nouveauStatut) => {
    setPrixSpecifiques((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, statut: nouveauStatut, dateModification: new Date() } : p))
    );
    toast.current?.show({ severity: 'success', summary: 'Statut', detail: `Statut changé à ${nouveauStatut}.` });
  };

  const supprimerPrix = (row) => {
    setPrixSpecifiques((prev) => prev.filter((p) => p.id !== row.id));
    toast.current?.show({ severity: 'success', summary: 'Suppression', detail: 'Prix spécifique supprimé.' });
  };

  // Export
  const exporterListe = (format) => {
    if (format === 'Excel') {
      const csvContent = [
        [
          'ID',
          'Médicament',
          'Catégorie',
          'Prix d’achat',
          'Prix calculé',
          'Prix spécifique',
          'Différence (MGA)',
          'Différence (%)',
          'Statut',
          'Date création',
          'Date modification',
          'Raison',
        ].join(','),
        ...tableData.map((item) =>
          [
            item.id,
            `"${item.nomMedicament}"`,
            item.categorie,
            item.prixAchat.toLocaleString('fr-FR'),
            item.prixCalcule.toLocaleString('fr-FR'),
            item.prixSpecifique.toLocaleString('fr-FR'),
            item.differenceMGA.toLocaleString('fr-FR'),
            item.differencePourcentage,
            item.statut,
            item.dateCreation.toLocaleDateString('fr-FR'),
            item.dateModification.toLocaleDateString('fr-FR'),
            `"${item.raison}"`,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prix_specifiques.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste exportée en CSV.' });
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Liste des Prix Spécifiques', 20, 20);
      let y = 30;
      tableData.forEach((item, i) => {
        doc.setFontSize(12);
        doc.text(`ID: ${item.id}`, 20, y); y += 10;
        doc.text(`Médicament: ${item.nomMedicament}`, 20, y); y += 8;
        doc.text(`Catégorie: ${item.categorie}`, 20, y); y += 8;
        doc.text(`Prix d’achat: ${item.prixAchat.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
        doc.text(`Prix calculé: ${item.prixCalcule.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
        doc.text(`Prix spécifique: ${item.prixSpecifique.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
        doc.text(`Différence (MGA): ${item.differenceMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
        doc.text(`Différence (%): ${item.differencePourcentage}%`, 20, y); y += 8;
        doc.text(`Statut: ${item.statut}`, 20, y); y += 8;
        doc.text(`Date création: ${item.dateCreation.toLocaleDateString('fr-FR')}`, 20, y); y += 8;
        doc.text(`Date modification: ${item.dateModification.toLocaleDateString('fr-FR')}`, 20, y); y += 8;
        doc.text(`Raison: ${item.raison}`, 20, y); y += 12;
        if (y > 260 && i < tableData.length - 1) {
          doc.addPage();
          y = 20;
        }
      });
      doc.save('prix_specifiques.pdf');
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste exportée en PDF.' });
    }
  };

  // Rendus colonnes
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const pourcentageBody = (row) => `${row.differencePourcentage}%`;
  const dateBody = (row, field) => row[field]?.toLocaleDateString('fr-FR');
  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openDialog(row)} tooltip="Modifier" />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => supprimerPrix(row)} tooltip="Supprimer" />
      <Button icon="pi pi-toggle-on" className="p-button-text p-button-sm" onClick={() => changerStatut(row, row.statut === 'Actif' ? 'Inactif' : 'Actif')} tooltip={row.statut === 'Actif' ? 'Désactiver' : 'Activer'} />
      <Button icon="pi pi-archive" className="p-button-text p-button-sm" onClick={() => changerStatut(row, 'Archivé')} tooltip="Archiver" disabled={row.statut === 'Archivé'} />
    </div>
  );

  // Header left (filtres)
  const headerLeft = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ minWidth: 280 }}>
        <i className="pi pi-search" />
        <InputText value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher médicament" className="p-inputtext-sm" />
      </span>
      <Dropdown value={filtreStatut} options={statuts} onChange={(e) => setFiltreStatut(e.value)} placeholder="Filtrer par statut" className="p-inputtext-sm" style={{ width: 160 }} />
      <Dropdown value={filtreCategorie} options={categories} onChange={(e) => setFiltreCategorie(e.value)} placeholder="Filtrer par catégorie" className="p-inputtext-sm" style={{ width: 260 }} />
    </div>
  );

  // Header right (boutons)
  const headerRight = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button label="Ajouter" icon="pi pi-plus" onClick={() => openDialog()} className="p-button-success p-button-sm" />
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterListe('Excel')} className="p-button-outlined p-button-sm" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterListe('PDF')} className="p-button-outlined p-button-sm" />
    </div>
  );

  // UI client lourd
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: '#e6e9ef',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <Toast ref={toast} position="top-right" />
      <div className="app-window" style={{
        width: 'min(1500px, 100vw)',
        height: 'min(950px, 100vh)',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'grid',
        gridTemplateRows: '48px 1fr 32px',
        overflow: 'hidden',
      }}>
        {/* Barre de titre */}
        <div style={{
          background: 'linear-gradient(180deg,#f8f9fb,#ebedf2)',
          borderBottom: '1px solid #d9dde5',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff605c', cursor: 'pointer' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd44', cursor: 'pointer' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ca4e', cursor: 'pointer' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Gestion des prix spécifiques</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag severity="success" value="Ctrl+A Ajouter" style={{ fontSize: 12 }} />
            <Tag severity="info" value="Ctrl+E Exporter" style={{ fontSize: 12 }} />
          </div>
        </div>

        {/* Corps : Sidebar + poignée + contenu */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 8px 1fr`, height: '100%' }}>
          {/* Sidebar */}
          <aside style={{ background: '#f8f9fb', borderRight: '1px solid #d9dde5', overflow: 'auto', padding: 16 }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Poignée redimensionnable */}
          <div role="separator" aria-orientation="vertical" title="Glisser pour redimensionner" onMouseDown={() => (resizingRef.current = true)} style={{ cursor: 'col-resize', background: '#d9dde5', transition: 'background 0.2s' }} />

          {/* Contenu principal */}
          <main style={{ display: 'grid', gridTemplateRows: '48px 1fr', height: '100%' }}>
            {/* Bandeau module */}
            <div style={{
              background: 'linear-gradient(180deg,#16a085,#0f8b6e)',
              color: '#fff',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="pi pi-money-bill" style={{ fontSize: 20 }} />
                <strong style={{ fontSize: 16 }}>Gestion des prix spécifiques</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Plein écran • Optimisé clavier</div>
            </div>

            {/* Contenu scrollable global */}
            <div style={{ padding: 16, overflowY: 'auto', display: 'grid', gap: 16, height: '100%', maxHeight: 'calc(100% - 48px)' }}>
              <Card style={{
                background: '#fff',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                maxHeight: '100%',
                overflowY: 'auto',
              }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border: 0, padding: '8px 12px' }} />
                <div style={{ minHeight: 0 }}>
                  <DataTable value={tableData} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} scrollable scrollHeight="400px" responsiveLayout="scroll" stripedRows tableStyle={{ fontSize: 14 }}>
                    <Column field="id" header="ID" sortable style={{ minWidth: 100 }} />
                    <Column field="nomMedicament" header="Médicament" sortable style={{ minWidth: 180 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 200 }} />
                    <Column field="prixAchat" header="Prix d’achat" body={(r) => montantBody(r, 'prixAchat')} sortable style={{ minWidth: 120 }} />
                    <Column field="prixCalcule" header="Prix calculé" body={(r) => montantBody(r, 'prixCalcule')} sortable style={{ minWidth: 120 }} />
                    <Column field="prixSpecifique" header="Prix spécifique" body={(r) => montantBody(r, 'prixSpecifique')} sortable style={{ minWidth: 120 }} />
                    <Column field="differenceMGA" header="Différence (MGA)" body={(r) => montantBody(r, 'differenceMGA')} sortable style={{ minWidth: 140 }} />
                    <Column field="differencePourcentage" header="Différence (%)" body={pourcentageBody} sortable style={{ minWidth: 140 }} />
                    <Column field="statut" header="Statut" sortable style={{ minWidth: 100 }} />
                    <Column field="dateCreation" header="Date création" body={(r) => dateBody(r, 'dateCreation')} sortable style={{ minWidth: 140 }} />
                    <Column field="dateModification" header="Date modification" body={(r) => dateBody(r, 'dateModification')} sortable style={{ minWidth: 140 }} />
                    <Column field="raison" header="Raison" sortable style={{ minWidth: 200 }} />
                    <Column header="Actions" body={actionsBody} style={{ width: 200 }} frozen alignFrozen="right" />
                  </DataTable>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Dialog: Ajouter/Modifier */}
        <Dialog
          header={selectedPrix ? 'Modifier Prix Spécifique' : 'Ajouter Prix Spécifique'}
          visible={dialogVisible}
          style={{ width: '500px', maxWidth: '95vw' }}
          modal
          onHide={closeDialog}
          className="p-dialog-sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, maxHeight: '400px', overflowY: 'auto' }}>
            <span className="p-float-label">
              <Dropdown
                value={formData.idMedicament}
                options={medicaments.map((m) => ({ label: m.nom, value: m.id }))}
                onChange={(e) => setFormData({ ...formData, idMedicament: e.value })}
                placeholder="Sélectionner un médicament"
                style={{ width: '100%' }}
                className="p-inputtext-sm"
              />
              <label htmlFor="idMedicament">Médicament</label>
            </span>
            <span className="p-float-label">
              <InputNumber
                value={formData.prixSpecifique}
                onValueChange={(e) => setFormData({ ...formData, prixSpecifique: e.value })}
                min={0}
                suffix=" MGA"
                style={{ width: '100%' }}
                className="p-inputtext-sm"
              />
              <label htmlFor="prixSpecifique">Prix spécifique (MGA)</label>
            </span>
            <span className="p-float-label">
              <Dropdown
                value={formData.statut}
                options={statuts.slice(1)}
                onChange={(e) => setFormData({ ...formData, statut: e.value })}
                style={{ width: '100%' }}
                className="p-inputtext-sm"
              />
              <label htmlFor="statut">Statut</label>
            </span>
            <span className="p-float-label">
              <InputTextarea
                value={formData.raison}
                onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
                rows={4}
                style={{ width: '100%' }}
                className="p-inputtext-sm"
              />
              <label htmlFor="raison">Raison</label>
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button label="Annuler" className="p-button-text p-button-sm" onClick={closeDialog} />
              <Button label={selectedPrix ? 'Modifier' : 'Ajouter'} icon="pi pi-check" className="p-button-success p-button-sm" onClick={selectedPrix ? modifierPrix : ajouterPrix} disabled={!formData.idMedicament || !formData.prixSpecifique} />
            </div>
          </div>
        </Dialog>

        {/* Barre d'état */}
        <footer style={{ background: '#f0f2f6', borderTop: '1px solid #d9dde5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 13, color: '#2f3b52' }}>
          <span>{tableData.length} élément(s) filtré(s)</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        .app-window { transition: all 0.2s ease; }
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus, .app-window .p-inputtextarea:focus { outline: 2px solid #16a085 !important; outline-offset: 2px; }
        .p-button-sm { padding: 4px 12px !important; }
        .p-inputtext-sm { font-size: 14px !important; }
        .window-body .separator:hover { background: #16a085; }
        .p-dialog-sm .p-dialog-content { padding: 0 !important; }
        .p-datatable .p-datatable-thead > tr > th, .p-datatable .p-datatable-tbody > tr > td { padding: 8px !important; font-size: 14px !important; }
        @media (max-width: 1200px) { 
          .window-body { grid-template-columns: 0 0 1fr !important; } 
          .app-window { height: 100vh !important; border-radius: 0; width: 100vw !important; } 
        }
        @media (max-width: 768px) { 
          .p-datatable .p-datatable-thead > tr > th, .p-datatable .p-datatable-tbody > tr > td { font-size: 13px !important; }
          .p-toolbar { flex-wrap: wrap; gap: 8px; }
        }
      `}</style>
    </div>
  );
}