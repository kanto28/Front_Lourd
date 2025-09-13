import React, { useMemo, useRef, useState } from 'react';
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
import Sidebar from '../components/Sidebar';

export default function PayrollPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const employes = [
    { id_personne: 1, nom: 'Jean Rakoto', poste: 'Pharmacien' },
    { id_personne: 2, nom: 'Marie Raso', poste: 'Vendeur' },
  ];

  const seed = [
    {
      id: 'SAL-2025-001',
      id_personne: 1,
      nom: 'Jean Rakoto',
      poste: 'Pharmacien',
      salaireBase: 1000000,
      datePaiement: '2025-07-31',
      periode: '2025-07',
      heuresTravaillees: 160,
      heuresSupplementaires: 10,
      primes: 50000,
      deductions: 20000,
      salaireNet: 1000000 + 10 * 6250 + 50000 - 20000, // Salaire + HS (6250/heure) + primes - déductions
      modePaiement: 'Virement',
      statut: 'Payé',
    },
    {
      id: 'SAL-2025-002',
      id_personne: 2,
      nom: 'Marie Raso',
      poste: 'Vendeur',
      salaireBase: 800000,
      datePaiement: '2025-07-31',
      periode: '2025-07',
      heuresTravaillees: 160,
      heuresSupplementaires: 0,
      primes: 0,
      deductions: 10000,
      salaireNet: 800000 - 10000,
      modePaiement: 'Espèces',
      statut: 'Payé',
    },
    {
      id: 'SAL-2025-003',
      id_personne: 1,
      nom: 'Jean Rakoto',
      poste: 'Pharmacien',
      salaireBase: 1000000,
      datePaiement: null,
      periode: '2025-08',
      heuresTravaillees: 160,
      heuresSupplementaires: 5,
      primes: 30000,
      deductions: 0,
      salaireNet: 1000000 + 5 * 6250 + 30000,
      modePaiement: 'Virement',
      statut: 'En attente',
    },
  ];

  const [salaires, setSalaires] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showSalaireForm, setShowSalaireForm] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historiqueFor, setHistoriqueFor] = useState(null);
  const [salaireForm, setSalaireForm] = useState({
    id: null,
    id_personne: null,
    nom: '',
    poste: '',
    salaireBase: 0,
    periode: '',
    heuresTravaillees: 0,
    heuresSupplementaires: 0,
    primes: 0,
    deductions: 0,
    salaireNet: 0,
    modePaiement: 'Virement',
    statut: 'Préparé',
  });

  const modesPaiement = [
    { label: 'Virement', value: 'Virement' },
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Chèque', value: 'Chèque' },
  ];

  // --- Filtrage ---
  const filtered = useMemo(() => {
    let list = [...salaires];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.nom.toLowerCase().includes(q) ||
          r.poste.toLowerCase().includes(q) ||
          r.periode.includes(q)
      );
    }
    return list;
  }, [salaires, globalFilter]);

  // --- Calcul salaire net ---
  const calculerSalaireNet = (form) => {
    const tauxHoraireSup = 6250; // Exemple : 6250 MGA/heure supplémentaire
    return form.salaireBase + form.heuresSupplementaires * tauxHoraireSup + form.primes - form.deductions;
  };

  // --- Actions ---
  const openCreateSalaire = () => {
    setSalaireForm({
      id: null,
      id_personne: null,
      nom: '',
      poste: '',
      salaireBase: 0,
      periode: '',
      heuresTravaillees: 0,
      heuresSupplementaires: 0,
      primes: 0,
      deductions: 0,
      salaireNet: 0,
      modePaiement: 'Virement',
      statut: 'Préparé',
    });
    setShowSalaireForm(true);
  };

  const openEditSalaire = (row) => {
    setSalaireForm({ ...row });
    setShowSalaireForm(true);
  };

  const saveSalaire = () => {
    if (!salaireForm.id_personne || !salaireForm.periode) {
      toast.current?.show({ severity: 'warn', summary: 'Champs requis', detail: 'Employé et période sont requis.' });
      return;
    }
    const salaireNet = calculerSalaireNet(salaireForm);
    const employe = employes.find((e) => e.id_personne === salaireForm.id_personne);
    const salaireData = {
      ...salaireForm,
      nom: employe.nom,
      poste: employe.poste,
      salaireNet,
      id: salaireForm.id || `SAL-2025-${String(salaires.length + 1).padStart(3, '0')}`,
      datePaiement: salaireForm.statut === 'Payé' ? new Date().toISOString().split('T')[0] : null,
    };

    if (salaireForm.id) {
      setSalaires((prev) => prev.map((s) => (s.id === salaireForm.id ? salaireData : s)));
      toast.current?.show({ severity: 'success', summary: 'Mis à jour', detail: 'Salaire modifié.' });
    } else {
      setSalaires((prev) => [salaireData, ...prev]);
      toast.current?.show({ severity: 'success', summary: 'Créé', detail: 'Salaire ajouté.' });
    }
    setShowSalaireForm(false);
  };

  const markAsPaid = (row) => {
    setSalaires((prev) =>
      prev.map((s) =>
        s.id === row.id ? { ...s, statut: 'Payé', datePaiement: new Date().toISOString().split('T')[0] } : s
      )
    );
    toast.current?.show({ severity: 'success', summary: 'Payé', detail: `Salaire ${row.id} marqué comme payé.` });
  };

  const generateBulletin = (row) => {
    const csvContent = [
      ['Bulletin de paie', row.id],
      ['Employé', row.nom],
      ['Poste', row.poste],
      ['Période', row.periode],
      ['Date de paiement', row.datePaiement || 'Non payé'],
      [''],
      ['Salaire de base', row.salaireBase.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      ['Heures travaillées', row.heuresTravaillees],
      ['Heures supplémentaires', row.heuresSupplementaires],
      ['Primes', row.primes.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      ['Déductions', row.deductions.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      ['Salaire net', row.salaireNet.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      ['Mode de paiement', row.modePaiement],
      ['Statut', row.statut],
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulletin_${row.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Bulletin généré', detail: `Bulletin pour ${row.nom} exporté.` });
  };

  const printBulletin = (row) => {
    toast.current?.show({ severity: 'info', summary: 'Impression', detail: `Impression du bulletin pour ${row.nom} simulée.` });
  };

  const viewHistorique = (row) => {
    setHistoriqueFor(row);
    setShowHistorique(true);
  };

  const exportListePaie = () => {
    const csvContent = [
      ['ID', 'Employé', 'Poste', 'Période', 'Salaire de base', 'Heures travaillées', 'Heures supplémentaires', 'Primes', 'Déductions', 'Salaire net', 'Mode de paiement', 'Statut'].join(','),
      ...filtered.map((s) =>
        [
          s.id,
          s.nom,
          s.poste,
          s.periode,
          s.salaireBase.toLocaleString('fr-FR'),
          s.heuresTravaillees,
          s.heuresSupplementaires,
          s.primes.toLocaleString('fr-FR'),
          s.deductions.toLocaleString('fr-FR'),
          s.salaireNet.toLocaleString('fr-FR'),
          s.modePaiement,
          s.statut,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liste_paie.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste de paie exportée.' });
  };

  const calculerCoutsSociaux = () => {
    const totalSalaires = filtered.reduce((sum, s) => sum + s.salaireNet, 0);
    const coutsSociaux = totalSalaires * 0.2; // Exemple : 20% de charges sociales
    toast.current?.show({
      severity: 'info',
      summary: 'Coûts sociaux',
      detail: `Coûts sociaux estimés : ${coutsSociaux.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`,
    });
  };

  // --- Rendus colonnes ---
  const salaireBody = (row, field) => row[field].toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const statutBody = (row) => (
    <Tag
      value={row.statut}
      severity={row.statut === 'Payé' ? 'success' : row.statut === 'En attente' ? 'warning' : 'info'}
    />
  );
  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => openEditSalaire(row)}
        tooltip="Modifier"
        disabled={row.statut === 'Payé'}
      />
      <Button
        icon="pi pi-check"
        className="p-button-text p-button-sm"
        onClick={() => markAsPaid(row)}
        tooltip="Marquer comme payé"
        disabled={row.statut === 'Payé'}
      />
      <Button
        icon="pi pi-file"
        className="p-button-text p-button-sm"
        onClick={() => generateBulletin(row)}
        tooltip="Générer bulletin"
      />
      <Button
        icon="pi pi-print"
        className="p-button-text p-button-sm"
        onClick={() => printBulletin(row)}
        tooltip="Imprimer bulletin"
      />
      <Button
        icon="pi pi-history"
        className="p-button-text p-button-sm"
        onClick={() => viewHistorique(row)}
        tooltip="Historique"
      />
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Gestion des salaires</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (ID, nom, poste, période)"
        />
      </span>
      <Button label="Nouveau salaire" icon="pi pi-plus" onClick={openCreateSalaire} className="p-button-success" />
      <Button label="Exporter paie" icon="pi pi-file-export" onClick={exportListePaie} className="p-button-outlined" />
      <Button label="Coûts sociaux" icon="pi pi-calculator" onClick={calculerCoutsSociaux} className="p-button-outlined" />
    </div>
  );

  // --- Rendu principal ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#eef1f2' }}>
      <Toast ref={toast} />

      {/* Bandeau module */}
      <div
        style={{
          background: 'linear-gradient(180deg,#16a085,#11967b)',
          color: '#fff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="pi pi-money-bill" style={{ fontSize: 18 }} />
          <strong>RH ▸ Gestion des salaires</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
              flex: 1,
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            <DataTable
              value={filtered}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 20, 50]}
              scrollable
              scrollHeight="flex"
              responsiveLayout="scroll"
              stripedRows
            >
              <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
              <Column field="nom" header="Employé" sortable style={{ minWidth: 160 }} />
              <Column field="poste" header="Poste" sortable style={{ minWidth: 140 }} />
              <Column field="periode" header="Période" sortable style={{ minWidth: 120 }} />
              <Column field="salaireBase" header="Salaire de base" body={(row) => salaireBody(row, 'salaireBase')} sortable style={{ minWidth: 140 }} />
              <Column field="heuresTravaillees" header="Heures" sortable style={{ minWidth: 100 }} />
              <Column field="heuresSupplementaires" header="Heures sup." sortable style={{ minWidth: 100 }} />
              <Column field="primes" header="Primes" body={(row) => salaireBody(row, 'primes')} sortable style={{ minWidth: 120 }} />
              <Column field="deductions" header="Déductions" body={(row) => salaireBody(row, 'deductions')} sortable style={{ minWidth: 120 }} />
              <Column field="salaireNet" header="Salaire net" body={(row) => salaireBody(row, 'salaireNet')} sortable style={{ minWidth: 140 }} />
              <Column field="modePaiement" header="Paiement" sortable style={{ minWidth: 120 }} />
              <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 120 }} />
              <Column header="Actions" body={actionsBody} style={{ width: 260 }} frozen alignFrozen="right" />
            </DataTable>
          </div>
        </main>
      </div>

      {/* Dialog Ajout/Modification salaire */}
      <Dialog
        header={salaireForm.id ? 'Modifier salaire' : 'Nouveau salaire'}
        visible={showSalaireForm}
        style={{ width: '720px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowSalaireForm(false)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <span className="p-float-label">
            <Dropdown
              value={salaireForm.id_personne}
              options={employes.map((e) => ({ label: e.nom, value: e.id_personne }))}
              onChange={(e) => setSalaireForm({ ...salaireForm, id_personne: e.value })}
              style={{ width: '100%' }}
              disabled={salaireForm.id != null}
            />
            <label htmlFor="id_personne">Employé</label>
          </span>
          <span className="p-float-label">
            <InputText
              value={salaireForm.periode}
              onChange={(e) => setSalaireForm({ ...salaireForm, periode: e.target.value })}
              style={{ width: '100%' }}
              placeholder="YYYY-MM"
            />
            <label htmlFor="periode">Période (YYYY-MM)</label>
          </span>
          <span className="p-float-label">
            <InputNumber
              value={salaireForm.salaireBase}
              onValueChange={(e) => setSalaireForm({ ...salaireForm, salaireBase: e.value || 0 })}
              mode="currency"
              currency="MGA"
              style={{ width: '100%' }}
            />
            <label htmlFor="salaireBase">Salaire de base</label>
          </span>
          <span className="p-float-label">
            <InputNumber
              value={salaireForm.heuresTravaillees}
              onValueChange={(e) => setSalaireForm({ ...salaireForm, heuresTravaillees: e.value || 0 })}
              style={{ width: '100%' }}
            />
            <label htmlFor="heuresTravaillees">Heures travaillées</label>
          </span>
          <span className="p-float-label">
            <InputNumber
              value={salaireForm.heuresSupplementaires}
              onValueChange={(e) => setSalaireForm({ ...salaireForm, heuresSupplementaires: e.value || 0 })}
              style={{ width: '100%' }}
            />
            <label htmlFor="heuresSupplementaires">Heures supplémentaires</label>
          </span>
          <span className="p-float-label">
            <InputNumber
              value={salaireForm.primes}
              onValueChange={(e) => setSalaireForm({ ...salaireForm, primes: e.value || 0 })}
              mode="currency"
              currency="MGA"
              style={{ width: '100%' }}
            />
            <label htmlFor="primes">Primes</label>
          </span>
          <span className="p-float-label">
            <InputNumber
              value={salaireForm.deductions}
              onValueChange={(e) => setSalaireForm({ ...salaireForm, deductions: e.value || 0 })}
              mode="currency"
              currency="MGA"
              style={{ width: '100%' }}
            />
            <label htmlFor="deductions">Déductions</label>
          </span>
          <span className="p-float-label">
            <Dropdown
              value={salaireForm.modePaiement}
              options={modesPaiement}
              onChange={(e) => setSalaireForm({ ...salaireForm, modePaiement: e.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="modePaiement">Mode de paiement</label>
          </span>
          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <InputNumber
              value={calculerSalaireNet(salaireForm)}
              mode="currency"
              currency="MGA"
              style={{ width: '100%' }}
              disabled
            />
            <label htmlFor="salaireNet">Salaire net (calculé)</label>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowSalaireForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveSalaire} />
        </div>
      </Dialog>

      {/* Dialog Historique des salaires */}
      <Dialog
        header={`Historique des salaires — ${historiqueFor?.nom ?? 'Employé'}`}
        visible={showHistorique}
        style={{ width: '760px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowHistorique(false)}
      >
        {historiqueFor && (
          <div>
            <DataTable
              value={salaires.filter((s) => s.id_personne === historiqueFor.id_personne)}
              paginator
              rows={5}
              responsiveLayout="scroll"
              emptyMessage="Aucun salaire enregistré"
            >
              <Column field="id" header="ID" style={{ minWidth: 120 }} />
              <Column field="periode" header="Période" style={{ minWidth: 120 }} />
              <Column
                field="salaireNet"
                header="Salaire net"
                body={(row) => row.salaireNet.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                style={{ minWidth: 140 }}
              />
              <Column field="modePaiement" header="Paiement" style={{ minWidth: 120 }} />
              <Column field="statut" header="Statut" body={statutBody} style={{ minWidth: 120 }} />
            </DataTable>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button label="Fermer" className="p-button-text" onClick={() => setShowHistorique(false)} />
            </div>
          </div>
        )}
      </Dialog>

      {/* Styles inline responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}