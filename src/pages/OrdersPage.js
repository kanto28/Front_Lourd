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
import { MultiSelect } from 'primereact/multiselect';
import Sidebar from '../components/Sidebar';

export default function OrdersPage() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // --- Données mockées ---
  const suppliers = [
    { id: 1, nom: 'PharmaSup Madagascar' },
    { id: 2, nom: 'MediDistrib Tana' },
    { id: 3, nom: 'Océan Pharma' },
  ];

  const medicaments = [
    { id: 1, nom: 'Paracétamol 500mg', prixUnitaire: 500 },
    { id: 2, nom: 'Amoxicilline 1g', prixUnitaire: 1200 },
    { id: 3, nom: 'Ibuprofène 400mg', prixUnitaire: 800 },
  ];

  const seed = [
    {
      id: 'CMD-2025-001',
      fournisseur: suppliers[0],
      dateCommande: '2025-07-12',
      dateLivraisonPrevue: '2025-07-17',
      statut: 'Livrée',
      medicaments: [
        { id: 1, nom: 'Paracétamol 500mg', quantite: 100, prixUnitaire: 500 },
        { id: 2, nom: 'Amoxicilline 1g', quantite: 50, prixUnitaire: 1200 },
      ],
      conditionsLivraison: 'Livraison standard',
      notes: 'Commande urgente',
    },
    {
      id: 'CMD-2025-002',
      fournisseur: suppliers[1],
      dateCommande: '2025-08-02',
      dateLivraisonPrevue: '2025-08-05',
      statut: 'Confirmée',
      medicaments: [
        { id: 3, nom: 'Ibuprofène 400mg', quantite: 200, prixUnitaire: 800 },
      ],
      conditionsLivraison: 'Livraison express',
      notes: '',
    },
  ];

  const [orders, setOrders] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  // Dialog Ajout/Édition
  const emptyForm = {
    id: null,
    fournisseur: null,
    dateCommande: new Date().toISOString().slice(0, 10),
    dateLivraisonPrevue: '',
    statut: 'Brouillon',
    medicaments: [],
    conditionsLivraison: '',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsFor, setDetailsFor] = useState(null);

  const statuts = [
    { label: 'Brouillon', value: 'Brouillon' },
    { label: 'Envoyée', value: 'Envoyée' },
    { label: 'Confirmée', value: 'Confirmée' },
    { label: 'Expédiée', value: 'Expédiée' },
    { label: 'Livrée', value: 'Livrée' },
    { label: 'Annulée', value: 'Annulée' },
  ];

  // Filtrage
  const filtered = useMemo(() => {
    let list = [...orders];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.fournisseur.nom.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
      );
    }
    if (statutFilter) {
      list = list.filter((r) => r.statut === statutFilter);
    }
    return list;
  }, [orders, globalFilter, statutFilter]);

  // --- Actions ---
  const openCreate = () => {
    setForm({ ...emptyForm, id: null });
    setShowForm(true);
  };

  const openEdit = (row) => {
    if (row.statut === 'Expédiée' || row.statut === 'Livrée' || row.statut === 'Annulée') {
      toast.current?.show({ severity: 'warn', summary: 'Action impossible', detail: 'Commande non modifiable.' });
      return;
    }
    setForm({ ...row });
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.fournisseur || !form.dateLivraisonPrevue || !form.medicaments.length) {
      toast.current?.show({ severity: 'warn', summary: 'Champs requis', detail: 'Fournisseur, date de livraison et médicaments requis.' });
      return;
    }
    if (form.id == null) {
      const newId = `CMD-2025-${String(orders.length + 1).padStart(3, '0')}`;
      setOrders((o) => [{ ...form, id: newId }, ...o]);
      toast.current?.show({ severity: 'success', summary: 'Créée', detail: 'Commande ajoutée.' });
    } else {
      setOrders((o) => o.map((x) => (x.id === form.id ? form : x)));
      toast.current?.show({ severity: 'success', summary: 'Modifiée', detail: 'Commande mise à jour.' });
    }
    setShowForm(false);
  };

  const duplicateOrder = (row) => {
    const newId = `CMD-2025-${String(orders.length + 1).padStart(3, '0')}`;
    setOrders((o) => [{ ...row, id: newId, statut: 'Brouillon', dateCommande: new Date().toISOString().slice(0, 10) }, ...o]);
    toast.current?.show({ severity: 'success', summary: 'Dupliquée', detail: 'Commande dupliquée.' });
  };

  const cancelOrder = (row) => {
    confirmDialog({
      message: `Annuler la commande « ${row.id} » ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setOrders((o) => o.map((x) => (x.id === row.id ? { ...x, statut: 'Annulée' } : x)));
        toast.current?.show({ severity: 'success', summary: 'Annulée', detail: 'Commande annulée.' });
      },
    });
  };

  const receiveOrder = (row) => {
    if (row.statut !== 'Expédiée') {
      toast.current?.show({ severity: 'warn', summary: 'Action impossible', detail: 'Seules les commandes expédiées peuvent être réceptionnées.' });
      return;
    }
    confirmDialog({
      message: `Réceptionner la commande « ${row.id} » ?`,
      header: 'Confirmation réception',
      icon: 'pi pi-check-circle',
      accept: () => {
        setOrders((o) => o.map((x) => (x.id === row.id ? { ...x, statut: 'Livrée' } : x)));
        toast.current?.show({ severity: 'success', summary: 'Reçue', detail: 'Commande réceptionnée.' });
      },
    });
  };

  const sendEmail = (row) => {
    toast.current?.show({ severity: 'info', summary: 'Envoi', detail: `Envoi simulé au fournisseur ${row.fournisseur.nom}.` });
  };

  const printOrder = (row) => {
    toast.current?.show({ severity: 'info', summary: 'Impression', detail: `Impression simulée pour ${row.id}.` });
  };

  const trackOrder = (row) => {
    toast.current?.show({ severity: 'info', summary: 'Suivi', detail: `Suivi simulé pour ${row.id} : Statut ${row.statut}.` });
  };

  const openDetails = (row) => {
    setDetailsFor(row);
    setShowDetails(true);
  };

  // --- Rendus colonnes ---
  const statutBody = (row) => (
    <Tag
      value={row.statut}
      severity={
        row.statut === 'Livrée'
          ? 'success'
          : row.statut === 'Expédiée'
          ? 'info'
          : row.statut === 'Confirmée'
          ? 'primary'
          : row.statut === 'Envoyée'
          ? 'warning'
          : row.statut === 'Annulée'
          ? 'danger'
          : 'secondary'
      }
    />
  );

  const totalBody = (row) => {
    const total = row.medicaments.reduce((sum, m) => sum + m.quantite * m.prixUnitaire, 0);
    return total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  };

  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Button icon="pi pi-eye" className="p-button-text p-button-sm" onClick={() => openDetails(row)} tooltip="Détails" />
      {row.statut !== 'Expédiée' && row.statut !== 'Livrée' && row.statut !== 'Annulée' && (
        <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} tooltip="Modifier" />
      )}
      <Button icon="pi pi-copy" className="p-button-text p-button-sm" onClick={() => duplicateOrder(row)} tooltip="Dupliquer" />
      <Button icon="pi pi-print" className="p-button-text p-button-sm" onClick={() => printOrder(row)} tooltip="Imprimer" />
      <Button icon="pi pi-send" className="p-button-text p-button-sm" onClick={() => sendEmail(row)} tooltip="Envoyer email" />
      <Button icon="pi pi-truck" className="p-button-text p-button-sm" onClick={() => trackOrder(row)} tooltip="Suivre" />
      {row.statut === 'Expédiée' && (
        <Button icon="pi pi-check-square" className="p-button-text p-button-sm" onClick={() => receiveOrder(row)} tooltip="Réceptionner" />
      )}
      {row.statut !== 'Annulée' && row.statut !== 'Livrée' && (
        <Button icon="pi pi-times" className="p-button-text p-button-danger p-button-sm" onClick={() => cancelOrder(row)} tooltip="Annuler" />
      )}
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Commandes</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Dropdown
        value={statutFilter}
        options={[{ label: 'Tous', value: null }, ...statuts]}
        onChange={(e) => setStatutFilter(e.value)}
        placeholder="Statut"
        style={{ minWidth: 140 }}
      />
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (N°, fournisseur, notes)" />
      </span>
      <Button label="Nouvelle commande" icon="pi pi-plus" onClick={openCreate} className="p-button-success" />
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
          <i className="pi pi-shopping-cart" style={{ fontSize: 18 }} />
          <strong>Stock ▸ Achat ▸ Gestion des commandes</strong>
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
                selection={selected}
                onSelectionChange={(e) => setSelected(e.value)}
                dataKey="id"
                responsiveLayout="scroll"
                stripedRows
              >
                <Column field="id" header="N° Commande" sortable style={{ minWidth: 160 }} />
                <Column field="fournisseur.nom" header="Fournisseur" sortable style={{ minWidth: 200 }} />
                <Column field="dateCommande" header="Date commande" sortable style={{ minWidth: 140 }} />
                <Column field="dateLivraisonPrevue" header="Livraison prévue" sortable style={{ minWidth: 140 }} />
                <Column field="statut" header="Statut" body={statutBody} style={{ width: 140 }} />
                <Column header="Montant total" body={totalBody} style={{ minWidth: 160, textAlign: 'right' }} />
                <Column header="Actions" body={actionsBody} style={{ width: 300 }} frozen alignFrozen="right" />
              </DataTable>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Ajout / Édition */}
      <Dialog
        header={form.id ? 'Modifier la commande' : 'Nouvelle commande'}
        visible={showForm}
        style={{ width: '720px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowForm(false)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <span className="p-float-label">
            <Dropdown
              id="fournisseur"
              value={form.fournisseur}
              options={suppliers}
              optionLabel="nom"
              onChange={(e) => setForm({ ...form, fournisseur: e.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="fournisseur">Fournisseur</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="dateCommande"
              value={form.dateCommande}
              onChange={(e) => setForm({ ...form, dateCommande: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="dateCommande">Date commande (YYYY-MM-DD)</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="dateLivraisonPrevue"
              value={form.dateLivraisonPrevue}
              onChange={(e) => setForm({ ...form, dateLivraisonPrevue: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="dateLivraisonPrevue">Date livraison prévue (YYYY-MM-DD)</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="statut"
              value={form.statut}
              options={statuts}
              onChange={(e) => setForm({ ...form, statut: e.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="statut">Statut</label>
          </span>

          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <MultiSelect
              id="medicaments"
              value={form.medicaments}
              options={medicaments}
              optionLabel="nom"
              onChange={(e) => {
                const selectedMeds = e.value.map((med) => ({
                  ...med,
                  quantite: form.medicaments.find((m) => m.id === med.id)?.quantite || 1,
                }));
                setForm({ ...form, medicaments: selectedMeds });
              }}
              style={{ width: '100%' }}
            />
            <label htmlFor="medicaments">Médicaments</label>
          </span>

          {form.medicaments.map((med, index) => (
            <div key={med.id} style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, alignItems: 'center' }}>
              <span>{med.nom}</span>
              <InputText
                type="number"
                value={med.quantite}
                onChange={(e) => {
                  const newMeds = [...form.medicaments];
                  newMeds[index].quantite = parseInt(e.target.value) || 1;
                  setForm({ ...form, medicaments: newMeds });
                }}
                style={{ width: 100 }}
                placeholder="Quantité"
              />
            </div>
          ))}

          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <InputText
              id="conditionsLivraison"
              value={form.conditionsLivraison}
              onChange={(e) => setForm({ ...form, conditionsLivraison: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="conditionsLivraison">Conditions de livraison</label>
          </span>

          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <InputText
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="notes">Notes / Commentaires</label>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveForm} />
        </div>
      </Dialog>

      {/* Dialog Détails commande */}
      <Dialog
        header={`Détails — Commande ${detailsFor?.id ?? ''}`}
        visible={showDetails}
        style={{ width: '760px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowDetails(false)}
      >
        {detailsFor && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>N° Commande :</strong> {detailsFor.id}</div>
            <div><strong>Fournisseur :</strong> {detailsFor.fournisseur.nom}</div>
            <div><strong>Date commande :</strong> {detailsFor.dateCommande}</div>
            <div><strong>Date livraison prévue :</strong> {detailsFor.dateLivraisonPrevue}</div>
            <div><strong>Statut :</strong> {detailsFor.statut}</div>
            <div><strong>Conditions de livraison :</strong> {detailsFor.conditionsLivraison}</div>
            <div><strong>Notes :</strong> {detailsFor.notes || '-'}</div>
            <div>
              <strong>Médicaments :</strong>
              <DataTable value={detailsFor.medicaments} responsiveLayout="scroll">
                <Column field="nom" header="Nom" />
                <Column field="quantite" header="Quantité" />
                <Column field="prixUnitaire" header="Prix unitaire (Ar)" body={(r) => r.prixUnitaire.toLocaleString()} />
                <Column
                  header="Total (Ar)"
                  body={(r) => (r.quantite * r.prixUnitaire).toLocaleString()}
                />
              </DataTable>
            </div>
            <div>
              <strong>Total :</strong>{' '}
              {detailsFor.medicaments
                .reduce((sum, m) => sum + m.quantite * m.prixUnitaire, 0)
                .toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button label="Fermer" className="p-button-text" onClick={() => setShowDetails(false)} />
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