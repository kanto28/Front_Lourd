import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import Sidebar from '../components/Sidebar';

export default function ClientsPage() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // --- Données mockées ---
  const seed = [
    {
      id: 1,
      nom: 'Jean Rakoto',
      telephone: '+261 34 123 4567',
      email: 'jean.rakoto@example.com',
      adresse: 'Lot 12B, Antananarivo',
      dateNaissance: '1985-03-15',
      numeroCarteFidelite: 'FID-2025-001',
      creditDisponible: 50000,
      historiqueAchats: [
        { id: 'VTE-2025-001', date: '2025-07-12', total: 15000, medicaments: ['Paracétamol 500mg', 'Amoxicilline 1g'] },
        { id: 'VTE-2025-002', date: '2025-08-01', total: 24000, medicaments: ['Ibuprofène 400mg'] },
      ],
      allergies: 'Pénicilline',
      medecinTraitant: 'Dr. Raso',
      assuranceMaladie: 'Mutuelle Santé Madagascar',
    },
    {
      id: 2,
      nom: 'Marie Raso',
      telephone: '+261 32 987 6543',
      email: 'marie.raso@example.com',
      adresse: 'Lot 45A, Toamasina',
      dateNaissance: '1990-11-22',
      numeroCarteFidelite: 'FID-2025-002',
      creditDisponible: 0,
      historiqueAchats: [
        { id: 'VTE-2025-003', date: '2025-09-01', total: 9000, medicaments: ['Aspirine 100mg'] },
      ],
      allergies: 'Aucune',
      medecinTraitant: 'Dr. Andry',
      assuranceMaladie: 'Aucune',
    },
  ];

  const [clients, setClients] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selected, setSelected] = useState(null);

  // Dialog Ajout/Édition client
  const emptyClient = {
    id: null,
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    dateNaissance: '',
    numeroCarteFidelite: '',
    creditDisponible: 0,
    allergies: '',
    medecinTraitant: '',
    assuranceMaladie: '',
  };

  const [clientForm, setClientForm] = useState(emptyClient);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historiqueFor, setHistoriqueFor] = useState(null);

  // --- Filtrage ---
  const filtered = useMemo(() => {
    let list = [...clients];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.nom.toLowerCase().includes(q) ||
          r.telephone.includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.numeroCarteFidelite.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, globalFilter]);

  // --- Actions ---
  const openCreateClient = () => {
    setClientForm({ ...emptyClient });
    setShowClientForm(true);
  };

  const openEditClient = (row) => {
    setClientForm({ ...row });
    setShowClientForm(true);
  };

  const saveClient = () => {
    if (!clientForm.nom || !clientForm.telephone) {
      toast.current?.show({ severity: 'warn', summary: 'Champs requis', detail: 'Nom et téléphone sont requis.' });
      return;
    }
    if (clientForm.id == null) {
      const newId = clients.length + 1;
      const newNumeroCarte = `FID-2025-${String(newId).padStart(3, '0')}`;
      setClients((c) => [{ ...clientForm, id: newId, numeroCarteFidelite: newNumeroCarte, historiqueAchats: [] }, ...c]);
      toast.current?.show({ severity: 'success', summary: 'Créé', detail: 'Client ajouté.' });
    } else {
      setClients((c) => c.map((x) => (x.id === clientForm.id ? { ...clientForm } : x)));
      toast.current?.show({ severity: 'success', summary: 'Mis à jour', detail: 'Client modifié.' });
    }
    setShowClientForm(false);
  };

  const manageCredit = (row) => {
    confirmDialog({
      message: (
        <div>
          <p>Ajuster le crédit pour {row.nom}</p>
          <InputNumber
            value={row.creditDisponible}
            onValueChange={(e) => setClients((c) => c.map((x) => (x.id === row.id ? { ...x, creditDisponible: e.value || 0 } : x)))}
            mode="currency"
            currency="MGA"
            style={{ width: '100%' }}
          />
        </div>
      ),
      header: 'Gérer le crédit',
      icon: 'pi pi-wallet',
      acceptLabel: 'Enregistrer',
      accept: () => {
        toast.current?.show({ severity: 'success', summary: 'Crédit mis à jour', detail: `Crédit de ${row.nom} ajusté.` });
      },
    });
  };

  const viewHistorique = (row) => {
    setHistoriqueFor(row);
    setShowHistorique(true);
  };

  const printHistorique = (row) => {
    toast.current?.show({ severity: 'info', summary: 'Impression', detail: `Impression de l'historique pour ${row.nom} simulée.` });
  };

  const sendRappel = (row) => {
    if (row.creditDisponible <= 0) {
      toast.current?.show({ severity: 'warn', summary: 'Aucun crédit', detail: `${row.nom} n'a pas de crédit à rembourser.` });
      return;
    }
    toast.current?.show({ severity: 'info', summary: 'Rappel envoyé', detail: `Rappel de paiement simulé pour ${row.nom}.` });
  };

  // --- Rendus colonnes ---
  const creditBody = (row) => row.creditDisponible.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

  const actionsBody = (row) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEditClient(row)} tooltip="Modifier" />
      <Button icon="pi pi-history" className="p-button-text p-button-sm" onClick={() => viewHistorique(row)} tooltip="Historique achats" />
      <Button icon="pi pi-wallet" className="p-button-text p-button-sm" onClick={() => manageCredit(row)} tooltip="Gérer crédit" />
      <Button icon="pi pi-print" className="p-button-text p-button-sm" onClick={() => printHistorique(row)} tooltip="Imprimer historique" />
      <Button icon="pi pi-send" className="p-button-text p-button-sm" onClick={() => sendRappel(row)} tooltip="Envoyer rappel" />
    </div>
  );

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Clients</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (nom, téléphone, email, carte)"
        />
      </span>
      <Button label="Nouveau client" icon="pi pi-plus" onClick={openCreateClient} className="p-button-success" />
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
          <i className="pi pi-users" style={{ fontSize: 18 }} />
          <strong>Stock ▸ Vente ▸ Gestion des clients</strong>
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
                <Column field="nom" header="Nom" sortable style={{ minWidth: 200 }} />
                <Column field="telephone" header="Téléphone" sortable style={{ width: 160 }} />
                <Column field="email" header="Email" sortable style={{ minWidth: 200 }} />
                <Column field="numeroCarteFidelite" header="Carte fidélité" sortable style={{ width: 140 }} />
                <Column field="creditDisponible" header="Crédit" body={creditBody} sortable style={{ width: 140 }} />
                <Column field="allergies" header="Allergies" style={{ minWidth: 140 }} />
                <Column header="Actions" body={actionsBody} style={{ width: 260 }} frozen alignFrozen="right" />
              </DataTable>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Ajout / Édition client */}
      <Dialog
        header={clientForm.id ? 'Modifier le client' : 'Nouveau client'}
        visible={showClientForm}
        style={{ width: '720px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowClientForm(false)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <span className="p-float-label">
            <InputText
              id="nom"
              value={clientForm.nom}
              onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="nom">Nom complet</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="telephone"
              value={clientForm.telephone}
              onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="telephone">Téléphone</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="email"
              value={clientForm.email}
              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="email">Email</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="adresse"
              value={clientForm.adresse}
              onChange={(e) => setClientForm({ ...clientForm, adresse: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="adresse">Adresse</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="dateNaissance"
              value={clientForm.dateNaissance}
              onChange={(e) => setClientForm({ ...clientForm, dateNaissance: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="dateNaissance">Date de naissance (YYYY-MM-DD)</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="numeroCarteFidelite"
              value={clientForm.numeroCarteFidelite}
              onChange={(e) => setClientForm({ ...clientForm, numeroCarteFidelite: e.target.value })}
              style={{ width: '100%' }}
              disabled={clientForm.id != null}
            />
            <label htmlFor="numeroCarteFidelite">Numéro carte fidélité</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="allergies"
              value={clientForm.allergies}
              onChange={(e) => setClientForm({ ...clientForm, allergies: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="allergies">Allergies/Contre-indications</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="medecinTraitant"
              value={clientForm.medecinTraitant}
              onChange={(e) => setClientForm({ ...clientForm, medecinTraitant: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="medecinTraitant">Médecin traitant</label>
          </span>
          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <InputText
              id="assuranceMaladie"
              value={clientForm.assuranceMaladie}
              onChange={(e) => setClientForm({ ...clientForm, assuranceMaladie: e.target.value })}
              style={{ width: '100%' }}
            />
            <label htmlFor="assuranceMaladie">Assurance maladie</label>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowClientForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveClient} />
        </div>
      </Dialog>

      {/* Dialog Historique des achats */}
      <Dialog
        header={`Historique des achats — ${historiqueFor?.nom ?? 'Client'}`}
        visible={showHistorique}
        style={{ width: '760px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowHistorique(false)}
      >
        {historiqueFor && (
          <div>
            <DataTable
              value={historiqueFor.historiqueAchats}
              paginator
              rows={5}
              responsiveLayout="scroll"
              emptyMessage="Aucun achat enregistré"
            >
              <Column field="id" header="N° Vente" style={{ minWidth: 120 }} />
              <Column field="date" header="Date" style={{ minWidth: 120 }} />
              <Column field="total" header="Total" body={(row) => row.total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} style={{ minWidth: 120 }} />
              <Column field="medicaments" header="Médicaments" body={(row) => row.medicaments.join(', ')} style={{ minWidth: 200 }} />
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