import React, { useEffect, useMemo, useRef, useState } from 'react';
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

/**
 * ClientsPage – Look & feel "interface client lourd" (desktop app-like)
 * - Fenêtre avec barre de titre, poignée de redimensionnement de la sidebar, barre d'état.
 * - Raccourcis : Ctrl+N (nouveau), Ctrl+F (focus recherche), Ctrl+P (imprimer histor.), Ctrl+R (rappel), Esc (fermer dialogs).
 * - Table gelant la colonne Actions à droite, hauteur flexible.
 * - Style et palette alignés avec AuthPage.
 */
export default function ClientsPage() {
  const toast = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // === Données mock ===
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
    historiqueAchats: [],
  };

  const [clientForm, setClientForm] = useState(emptyClient);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historiqueFor, setHistoriqueFor] = useState(null);

  // === Sidebar redimensionnable ===
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // === Filtrage ===
  const filtered = useMemo(() => {
    let list = [...clients];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.nom.toLowerCase().includes(q) ||
          r.telephone.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.numeroCarteFidelite.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, globalFilter]);

  // === Actions ===
  const openCreateClient = () => { setClientForm({ ...emptyClient }); setShowClientForm(true); };
  const openEditClient = (row) => { setClientForm({ ...row }); setShowClientForm(true); };

  const saveClient = () => {
    if (!clientForm.nom || !clientForm.telephone) {
      toast.current?.show({ severity: 'warn', summary: 'Champs requis', detail: 'Nom et téléphone sont requis.' });
      return;
    }
    if (clientForm.id == null) {
      const newId = (clients.at(0)?.id ?? 0) + 1;
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
    let tmp = row.creditDisponible;
    confirmDialog({
      message: (
        <div>
          <p style={{ marginTop: 0 }}>Ajuster le crédit pour <strong>{row.nom}</strong></p>
          <InputNumber
            value={tmp}
            onValueChange={(e) => (tmp = e.value || 0)}
            mode="currency"
            currency="MGA"
            style={{ width: '100%' }}
          />
        </div>
      ),
      header: 'Gérer le crédit',
      icon: 'pi pi-wallet',
      acceptLabel: 'Enregistrer',
      rejectLabel: 'Annuler',
      accept: () => {
        setClients((c) => c.map((x) => (x.id === row.id ? { ...x, creditDisponible: tmp } : x)));
        toast.current?.show({ severity: 'success', summary: 'Crédit mis à jour', detail: `Crédit de ${row.nom} ajusté.` });
      },
    });
  };

  const viewHistorique = (row) => { setHistoriqueFor(row); setShowHistorique(true); };
  const printHistorique = (row) => { toast.current?.show({ severity: 'info', summary: 'Impression', detail: `Impression de l\'historique pour ${row.nom} simulée.` }); };
  const sendRappel = (row) => {
    if (row.creditDisponible <= 0) {
      toast.current?.show({ severity: 'warn', summary: 'Aucun crédit', detail: `${row.nom} n'a pas de crédit à rembourser.` });
      return;
    }
    toast.current?.show({ severity: 'info', summary: 'Rappel envoyé', detail: `Rappel de paiement simulé pour ${row.nom}.` });
  };

  // === Raccourcis clavier globaux ===
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowClientForm(false); setShowHistorique(false);
      }
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); openCreateClient(); }
      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); if (selected) printHistorique(selected); }
      if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); if (selected) sendRappel(selected); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // === Rendus colonnes ===
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
      <span style={{ fontWeight: 800, color: '#16a085' }}>Clients</span>
      <Tag value={`${filtered.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ minWidth: 260 }}>
        <i className="pi pi-search" />
        <InputText
          ref={searchRef}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (nom, téléphone, email, carte)"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </span>
      <Button label="Nouveau client" icon="pi pi-plus" onClick={openCreateClient} className="p-button-success" />
    </div>
  );

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
      <ConfirmDialog />

      {/* Fenêtre */}
      <div className="app-window" style={{
        width: 'min(1400px, 100vw)',
        height: 'min(900px, 100vh)',
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
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Clients</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag severity="success" value="Ctrl+N Nouveau" />
            <Tag severity="success" value="Ctrl+F Rechercher" />
            <Tag severity="info" value="Ctrl+P Imprimer" />
            <Tag severity="warning" value="Ctrl+R Rappel" />
          </div>
        </div>

        {/* Corps : Sidebar redimensionnable + poignée + contenu */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 6px 1fr`, minHeight: 0 }}>
          {/* Sidebar */}
          <aside style={{ background: '#fff', borderRight: '1px solid #e3e6ee', overflow: 'auto' }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Poignée */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Glisser pour redimensionner"
            onMouseDown={() => (resizingRef.current = true)}
            style={{ cursor: 'col-resize', background: '#e3e6ee' }}
          />

          {/* Contenu */}
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
                <i className="pi pi-users" style={{ fontSize: 18 }} />
                <strong>Stock ▸ Vente ▸ Gestion des clients</strong>
              </div>
              <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
            </div>

            {/* Carte/table */}
            <div style={{ padding: 12, minHeight: 0, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
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
            </div>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{
          background: '#eef1f6',
          borderTop: '1px solid #e3e6ee',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: 12,
          fontSize: 12,
          color: '#2f3b52',
        }}>
          <span style={{ opacity: 0.9 }}>État: prêt</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span>Raccourcis: Ctrl+N • Ctrl+F • Ctrl+P • Ctrl+R • Esc</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Focus & responsive */}
      <style>{`
        .app-window input:focus, .app-window button:focus {
          outline: 2px solid #16a085 !important;
          outline-offset: 1px;
        }
        @media (max-width: 1100px) {
          .window-body { grid-template-columns: 0 0 1fr !important; }
        }
      `}</style>
    </div>
  );

  // === Dialog Ajout / Édition client ===
  function ClientFormDialog() {
    return (
      <Dialog
        header={clientForm.id ? 'Modifier le client' : 'Nouveau client'}
        visible={showClientForm}
        style={{ width: '760px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowClientForm(false)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <span className="p-float-label">
            <InputText id="nom" value={clientForm.nom} onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="nom">Nom complet</label>
          </span>
          <span className="p-float-label">
            <InputText id="telephone" value={clientForm.telephone} onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="telephone">Téléphone</label>
          </span>
          <span className="p-float-label">
            <InputText id="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="email">Email</label>
          </span>
          <span className="p-float-label">
            <InputText id="adresse" value={clientForm.adresse} onChange={(e) => setClientForm({ ...clientForm, adresse: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="adresse">Adresse</label>
          </span>
          <span className="p-float-label">
            <InputText id="dateNaissance" value={clientForm.dateNaissance} onChange={(e) => setClientForm({ ...clientForm, dateNaissance: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="dateNaissance">Date de naissance (YYYY-MM-DD)</label>
          </span>
          <span className="p-float-label">
            <InputText id="numeroCarteFidelite" value={clientForm.numeroCarteFidelite} onChange={(e) => setClientForm({ ...clientForm, numeroCarteFidelite: e.target.value })} style={{ width: '100%' }} disabled={clientForm.id != null} />
            <label htmlFor="numeroCarteFidelite">Numéro carte fidélité</label>
          </span>
          <span className="p-float-label">
            <InputText id="allergies" value={clientForm.allergies} onChange={(e) => setClientForm({ ...clientForm, allergies: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="allergies">Allergies/Contre-indications</label>
          </span>
          <span className="p-float-label">
            <InputText id="medecinTraitant" value={clientForm.medecinTraitant} onChange={(e) => setClientForm({ ...clientForm, medecinTraitant: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="medecinTraitant">Médecin traitant</label>
          </span>
          <span className="p-float-label" style={{ gridColumn: '1 / -1' }}>
            <InputText id="assuranceMaladie" value={clientForm.assuranceMaladie} onChange={(e) => setClientForm({ ...clientForm, assuranceMaladie: e.target.value })} style={{ width: '100%' }} />
            <label htmlFor="assuranceMaladie">Assurance maladie</label>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowClientForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveClient} />
        </div>
      </Dialog>
    );
  }

  // === Dialog Historique ===
  function HistoriqueDialog() {
    return (
      <Dialog
        header={`Historique des achats — ${historiqueFor?.nom ?? 'Client'}`}
        visible={showHistorique}
        style={{ width: '820px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowHistorique(false)}
      >
        {historiqueFor && (
          <div>
            <DataTable value={historiqueFor.historiqueAchats} paginator rows={5} responsiveLayout="scroll" emptyMessage="Aucun achat enregistré">
              <Column field="id" header="N° Vente" style={{ minWidth: 120 }} />
              <Column field="date" header="Date" style={{ minWidth: 120 }} />
              <Column field="total" header="Total" body={(row) => row.total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} style={{ minWidth: 120 }} />
              <Column field="medicaments" header="Médicaments" body={(row) => row.medicaments.join(', ')} style={{ minWidth: 240 }} />
            </DataTable>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button label="Fermer" className="p-button-text" onClick={() => setShowHistorique(false)} />
            </div>
          </div>
        )}
      </Dialog>
    );
  }
}
