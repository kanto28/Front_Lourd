import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function PaymentsPage() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // --- Données mockées ---
  const clients = [
    { id: 1, nom: 'Jean Rakoto', creditDisponible: 50000 },
    { id: 2, nom: 'Marie Raso', creditDisponible: 0 },
  ];

  const seed = [
    {
      id: 'PAY-2025-001',
      venteId: 'VTE-2025-001',
      client: clients[0],
      date: '2025-07-12',
      typePaiement: 'Espèces',
      montant: 15000,
      numeroTransaction: null,
      commission: 0,
      statut: 'Validé',
    },
    {
      id: 'PAY-2025-002',
      venteId: 'VTE-2025-002',
      client: null,
      date: '2025-08-01',
      typePaiement: 'Mobile Money',
      montant: 24000,
      numeroTransaction: 'MM-123456789',
      commission: 240,
      statut: 'Validé',
    },
    {
      id: 'PAY-2025-003',
      venteId: 'VTE-2025-003',
      client: clients[1],
      date: '2025-09-01',
      typePaiement: 'Crédit client',
      montant: 9000,
      numeroTransaction: null,
      commission: 0,
      statut: 'En attente',
    },
  ];

  const [paiements, setPaiements] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState(null);
  const [caisseFond, setCaisseFond] = useState(100000); // Fond de caisse initial

  // Dialog Paiement mixte
  const emptyPaiement = {
    typePaiement: 'Espèces',
    montant: 0,
    numeroTransaction: '',
    commission: 0,
  };

  const [paiementMixte, setPaiementMixte] = useState([emptyPaiement]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [showRemboursementForm, setShowRemboursementForm] = useState(false);
  const [remboursementPaiement, setRemboursementPaiement] = useState(null);

  const typesPaiement = [
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Carte bancaire', value: 'Carte bancaire' },
    { label: 'Mobile Money', value: 'Mobile Money' },
    { label: 'Chèque', value: 'Chèque' },
    { label: 'Crédit client', value: 'Crédit client' },
    { label: 'Assurance', value: 'Assurance' },
  ];

  const statuts = [
    { label: 'Tous', value: null },
    { label: 'Validé', value: 'Validé' },
    { label: 'En attente', value: 'En attente' },
    { label: 'Échec', value: 'Échec' },
  ];

  // --- Filtrage ---
  const filtered = useMemo(() => {
    let list = [...paiements];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.venteId.toLowerCase().includes(q) ||
          (r.client && r.client.nom.toLowerCase().includes(q)) ||
          r.numeroTransaction?.toLowerCase().includes(q)
      );
    }
    if (statutFilter) {
      list = list.filter((r) => r.statut === statutFilter);
    }
    return list;
  }, [paiements, globalFilter, statutFilter]);

  // --- Actions ---
  const addPaiementMixte = () => {
    setPaiementMixte((prev) => [...prev, { ...emptyPaiement }]);
  };

  const updatePaiementMixte = (index, field, value) => {
    setPaiementMixte((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: value,
              commission: field === 'typePaiement' && value === 'Mobile Money' ? p.montant * 0.01 : field === 'montant' && p.typePaiement === 'Mobile Money' ? value * 0.01 : 0,
            }
          : p
      )
    );
  };

  const removePaiementMixte = (index) => {
    setPaiementMixte((prev) => prev.filter((_, i) => i !== index));
  };

  const savePaiementMixte = () => {
    const total = paiementMixte.reduce((sum, p) => sum + p.montant, 0);
    if (total <= 0) {
      toast.current?.show({ severity: 'warn', summary: 'Montant requis', detail: 'Veuillez spécifier un montant.' });
      return;
    }
    const newId = `PAY-2025-${String(paiements.length + 1).padStart(3, '0')}`;
    const newPaiements = paiementMixte.map((p, i) => ({
      id: `${newId}-${i + 1}`,
      venteId: `VTE-2025-${String(paiements.length + 1).padStart(3, '0')}`,
      client: p.typePaiement === 'Crédit client' ? clients[0] : null,
      date: new Date().toISOString().split('T')[0],
      typePaiement: p.typePaiement,
      montant: p.montant,
      numeroTransaction: p.numeroTransaction || null,
      commission: p.commission,
      statut: p.typePaiement === 'Mobile Money' ? 'En attente' : 'Validé',
    }));
    setPaiements((prev) => [...newPaiements, ...prev]);
    setCaisseFond((prev) => prev + newPaiements.filter((p) => p.typePaiement === 'Espèces').reduce((sum, p) => sum + p.montant, 0));
    toast.current?.show({ severity: 'success', summary: 'Paiement enregistré', detail: `Paiement ${newId} traité.` });
    setShowPaiementForm(false);
    setPaiementMixte([emptyPaiement]);
  };

  const validateMobileMoney = (row) => {
    confirmDialog({
      message: `Valider la transaction ${row.numeroTransaction} ?`,
      header: 'Validation Mobile Money',
      icon: 'pi pi-mobile',
      accept: () => {
        setPaiements((prev) => prev.map((p) => (p.id === row.id ? { ...p, statut: 'Validé' } : p)));
        toast.current?.show({ severity: 'success', summary: 'Validé', detail: 'Transaction mobile money validée.' });
      },
    });
  };

  const manageFondCaisse = () => {
    confirmDialog({
      message: (
        <div>
          <p>Ajuster le fond de caisse</p>
          <InputNumber
            value={caisseFond}
            onValueChange={(e) => setCaisseFond(e.value || 0)}
            mode="currency"
            currency="MGA"
            style={{ width: '100%' }}
          />
        </div>
      ),
      header: 'Gérer fond de caisse',
      icon: 'pi pi-wallet',
      acceptLabel: 'Enregistrer',
      accept: () => {
        toast.current?.show({ severity: 'success', summary: 'Fond ajusté', detail: 'Fond de caisse mis à jour.' });
      },
    });
  };

  const makeRemboursement = (row) => {
    setRemboursementPaiement(row);
    setShowRemboursementForm(true);
  };

  const saveRemboursement = (montant) => {
    if (montant > caisseFond) {
      toast.current?.show({ severity: 'warn', summary: 'Fonds insuffisants', detail: 'Le fond de caisse est insuffisant.' });
      return;
    }
    setPaiements((prev) =>
      prev.map((p) =>
        p.id === remboursementPaiement.id ? { ...p, statut: 'Échec', montant: p.montant - montant } : p
      )
    );
    setCaisseFond((prev) => prev - montant);
    toast.current?.show({
      severity: 'success',
      summary: 'Remboursement effectué',
      detail: `Remboursement de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} pour ${remboursementPaiement.id}.`,
    });
    setShowRemboursementForm(false);
  };

  const generateRapportCaisse = () => {
    const csvContent = [
      ['ID', 'Vente', 'Client', 'Date', 'Type Paiement', 'Montant', 'Commission', 'Statut'].join(','),
      ...filtered.map((p) =>
        [
          p.id,
          p.venteId,
          p.client ? p.client.nom : 'Anonyme',
          p.date,
          p.typePaiement,
          p.montant.toLocaleString('fr-FR'),
          p.commission.toLocaleString('fr-FR'),
          p.statut,
        ].join(',')
      ),
      ['', '', '', '', '', `Fond de caisse: ${caisseFond.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, '', ''].join(','),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_caisse.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Rapport généré', detail: 'Rapport de caisse exporté.' });
  };

  const cloturerCaisse = () => {
    confirmDialog({
      message: `Clôturer la caisse avec un fond de ${caisseFond.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} ?`,
      header: 'Clôture de caisse',
      icon: 'pi pi-lock',
      accept: () => {
        toast.current?.show({ severity: 'success', summary: 'Caisse clôturée', detail: 'Caisse journalière clôturée.' });
      },
    });
  };

  // --- Rendus colonnes ---
  const montantBody = (row) => row.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const commissionBody = (row) => row.commission.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const clientBody = (row) => (row.client ? row.client.nom : 'Anonyme');
  const statutBody = (row) => (
    <Tag
      value={row.statut}
      severity={row.statut === 'Validé' ? 'success' : row.statut === 'En attente' ? 'warning' : 'danger'}
    />
  );

  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {row.typePaiement === 'Mobile Money' && row.statut === 'En attente' && (
        <Button
          icon="pi pi-check"
          className="p-button-text p-button-sm"
          onClick={() => validateMobileMoney(row)}
          tooltip="Valider transaction"
        />
      )}
      <Button
        icon="pi pi-undo"
        className="p-button-text p-button-sm"
        onClick={() => makeRemboursement(row)}
        tooltip="Rembourser"
        disabled={row.statut !== 'Validé'}
      />
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Paiements</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Dropdown
        value={statutFilter}
        options={statuts}
        onChange={(e) => setStatutFilter(e.value)}
        placeholder="Statut"
        style={{ minWidth: 140 }}
      />
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (ID, vente, client, transaction)"
        />
      </span>
      <Button label="Paiement mixte" icon="pi pi-plus" onClick={() => setShowPaiementForm(true)} className="p-button-success" />
      <Button label="Rapport caisse" icon="pi pi-file-export" onClick={generateRapportCaisse} className="p-button-outlined" />
      <Button label="Clôturer caisse" icon="pi pi-lock" onClick={cloturerCaisse} className="p-button-outlined" />
      <Button label="Fond caisse" icon="pi pi-wallet" onClick={manageFondCaisse} className="p-button-outlined" />
    </div>
  );

  // --- Rendu principal ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#eef1f2' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

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
          <i className="pi pi-wallet" style={{ fontSize: 18 }} />
          <strong>Stock ▸ Vente ▸ Gestion des paiements</strong>
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
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              flex: 1,
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />

            <div style={{ flex: 1, minHeight: 0 }}>
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
                <Column field="id" header="ID Paiement" sortable style={{ minWidth: 120 }} />
                <Column field="venteId" header="Vente" sortable style={{ minWidth: 120 }} />
                <Column header="Client" body={clientBody} sortable style={{ minWidth: 160 }} />
                <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                <Column field="typePaiement" header="Type" sortable style={{ minWidth: 140 }} />
                <Column field="montant" header="Montant" body={montantBody} sortable style={{ minWidth: 120 }} />
                <Column field="numeroTransaction" header="N° Transaction" style={{ minWidth: 140 }} />
                <Column field="commission" header="Commission" body={commissionBody} sortable style={{ minWidth: 120 }} />
                <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 120 }} />
                <Column header="Actions" body={actionsBody} style={{ width: 120 }} frozen alignFrozen="right" />
              </DataTable>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Paiement mixte */}
      <Dialog
        header="Paiement mixte"
        visible={showPaiementForm}
        style={{ width: '720px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowPaiementForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {paiementMixte.map((p, index) => (
            <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Dropdown
                value={p.typePaiement}
                options={typesPaiement}
                onChange={(e) => updatePaiementMixte(index, 'typePaiement', e.value)}
                style={{ width: 160 }}
              />
              <InputNumber
                value={p.montant}
                onValueChange={(e) => updatePaiementMixte(index, 'montant', e.value || 0)}
                mode="currency"
                currency="MGA"
                style={{ width: 160 }}
              />
              {p.typePaiement === 'Mobile Money' && (
                <InputText
                  value={p.numeroTransaction}
                  onChange={(e) => updatePaiementMixte(index, 'numeroTransaction', e.target.value)}
                  placeholder="N° Transaction"
                  style={{ width: 160 }}
                />
              )}
              <Button
                icon="pi pi-trash"
                className="p-button-text p-button-danger p-button-sm"
                onClick={() => removePaiementMixte(index)}
                disabled={paiementMixte.length === 1}
              />
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
      <Dialog
        header={`Rembourser — ${remboursementPaiement?.id ?? 'Paiement'}`}
        visible={showRemboursementForm}
        style={{ width: '500px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowRemboursementForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="p-float-label">
            <InputNumber
              value={remboursementPaiement?.montant || 0}
              onValueChange={(e) => setRemboursementPaiement((prev) => ({ ...prev, montant: e.value || 0 }))}
              mode="currency"
              currency="MGA"
              style={{ width: '100%' }}
            />
            <label htmlFor="montant">Montant à rembourser</label>
          </span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button label="Annuler" className="p-button-text" onClick={() => setShowRemboursementForm(false)} />
            <Button
              label="Rembourser"
              icon="pi pi-undo"
              className="p-button-success"
              onClick={() => saveRemboursement(remboursementPaiement.montant)}
            />
          </div>
        </div>
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