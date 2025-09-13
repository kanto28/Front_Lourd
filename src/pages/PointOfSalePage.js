import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputNumber } from 'primereact/inputnumber';
import Sidebar from '../components/Sidebar';

export default function PointOfSalePage() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // --- Données mockées ---
  const medicaments = [
    { id: 1, nom: 'Paracétamol 500mg', codeBarres: '1234567890123', dci: 'Paracétamol', stock: 150, prixUnitaire: 500 },
    { id: 2, nom: 'Amoxicilline 1g', codeBarres: '1234567890124', dci: 'Amoxicilline', stock: 30, prixUnitaire: 1200 },
    { id: 3, nom: 'Ibuprofène 400mg', codeBarres: '1234567890125', dci: 'Ibuprofène', stock: 0, prixUnitaire: 800 },
    { id: 4, nom: 'Aspirine 100mg', codeBarres: '1234567890126', dci: 'Acide acétylsalicylique', stock: 300, prixUnitaire: 300 },
  ];

  const users = [
    { id: 1, nom: 'Jean Rakoto' },
    { id: 2, nom: 'Marie Raso' },
  ];

  const [panier, setPanier] = useState([]);
  const [search, setSearch] = useState('');
  const [client, setClient] = useState('');
  const [typePaiement, setTypePaiement] = useState(null);
  const [montantRecu, setMontantRecu] = useState(0);
  const [remise, setRemise] = useState(0);
  const [vendeur, setVendeur] = useState(users[0]);
  const [venteStatut, setVenteStatut] = useState('En cours');
  const [venteId, setVenteId] = useState(null);

  const typesPaiement = [
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Carte', value: 'Carte' },
    { label: 'Mobile Money', value: 'Mobile Money' },
  ];

  // --- Calculs ---
  const total = useMemo(() => {
    const subtotal = panier.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0);
    return subtotal * (1 - remise / 100);
  }, [panier, remise]);

  const monnaieRendue = useMemo(() => Math.max(0, montantRecu - total), [montantRecu, total]);

  // --- Recherche médicament ---
  const filteredMedicaments = useMemo(() => {
    if (!search) return medicaments;
    const q = search.toLowerCase();
    return medicaments.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.codeBarres.includes(q) ||
        m.dci.toLowerCase().includes(q)
    );
  }, [search]);

  // --- Actions ---
  const addToPanier = (medicament) => {
    if (medicament.stock === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Stock épuisé', detail: `${medicament.nom} est en rupture.` });
      return;
    }
    setPanier((prev) => {
      const existing = prev.find((item) => item.id === medicament.id);
      if (existing) {
        if (existing.quantite >= medicament.stock) {
          toast.current?.show({ severity: 'warn', summary: 'Stock insuffisant', detail: `Stock disponible : ${medicament.stock}.` });
          return prev;
        }
        return prev.map((item) =>
          item.id === medicament.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { ...medicament, quantite: 1 }];
    });
    setSearch('');
  };

  const updateQuantite = (item, quantite) => {
    if (quantite <= 0) {
      setPanier((prev) => prev.filter((i) => i.id !== item.id));
    } else if (quantite > item.stock) {
      toast.current?.show({ severity: 'warn', summary: 'Stock insuffisant', detail: `Stock disponible : ${item.stock}.` });
    } else {
      setPanier((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantite } : i))
      );
    }
  };

  const removeFromPanier = (item) => {
    setPanier((prev) => prev.filter((i) => i.id !== item.id));
  };

  const finalizeVente = () => {
    if (!panier.length) {
      toast.current?.show({ severity: 'warn', summary: 'Panier vide', detail: 'Ajoutez des médicaments.' });
      return;
    }
    if (!typePaiement) {
      toast.current?.show({ severity: 'warn', summary: 'Paiement requis', detail: 'Sélectionnez un type de paiement.' });
      return;
    }
    if (montantRecu < total) {
      toast.current?.show({ severity: 'warn', summary: 'Paiement insuffisant', detail: 'Montant reçu insuffisant.' });
      return;
    }
    confirmDialog({
      message: 'Finaliser la vente ?',
      header: 'Confirmation',
      icon: 'pi pi-check-circle',
      accept: () => {
        const newVenteId = venteId || `VTE-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        // Simuler mise à jour stock
        medicaments.forEach((med) => {
          const item = panier.find((i) => i.id === med.id);
          if (item) med.stock -= item.quantite;
        });
        toast.current?.show({ severity: 'success', summary: 'Vente finalisée', detail: `Vente ${newVenteId} enregistrée.` });
        resetVente();
      },
    });
  };

  const cancelVente = () => {
    confirmDialog({
      message: 'Annuler la vente ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setVenteStatut('Annulée');
        toast.current?.show({ severity: 'success', summary: 'Vente annulée', detail: 'La vente a été annulée.' });
        resetVente();
      },
    });
  };

  const suspendVente = () => {
    toast.current?.show({ severity: 'info', summary: 'Vente suspendue', detail: 'Vente mise en attente.' });
    setVenteStatut('En cours');
    // Simuler sauvegarde pour reprise ultérieure
  };

  const resumeVente = () => {
    toast.current?.show({ severity: 'info', summary: 'Vente reprise', detail: 'Reprise de la vente.' });
    setVenteStatut('En cours');
  };

  const printReceipt = () => {
    toast.current?.show({ severity: 'info', summary: 'Impression', detail: 'Impression du reçu simulée.' });
  };

  const sendReceipt = () => {
    toast.current?.show({ severity: 'info', summary: 'Envoi', detail: 'Envoi du reçu par SMS/email simulé.' });
  };

  const resetVente = () => {
    setPanier([]);
    setClient('');
    setTypePaiement(null);
    setMontantRecu(0);
    setRemise(0);
    setVenteStatut('En cours');
    setVenteId(null);
  };

  // --- Rendus colonnes ---
  const quantiteBody = (row) => (
    <InputNumber
      value={row.quantite}
      onValueChange={(e) => updateQuantite(row, e.value)}
      min={0}
      max={row.stock}
      showButtons
      buttonLayout="horizontal"
      style={{ width: 100 }}
    />
  );

  const sousTotalBody = (row) => (row.quantite * row.prixUnitaire).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

  const actionsBody = (row) => (
    <Button
      icon="pi pi-trash"
      className="p-button-text p-button-danger p-button-sm"
      onClick={() => removeFromPanier(row)}
      tooltip="Supprimer"
    />
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
          <strong>Vente ▸ Point de vente</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', gap: 16 }}>
          {/* Recherche et ajout */}
          <div
            style={{
              width: 300,
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="p-float-label">
                <InputText
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, code-barres, DCI"
                  style={{ width: '100%' }}
                />
                <label htmlFor="search">Rechercher médicament</label>
              </span>
              {filteredMedicaments.map((med) => (
                <div
                  key={med.id}
                  style={{
                    padding: 8,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    {med.nom} <br />
                    <small style={{ color: '#6b7280' }}>
                      Stock: {med.stock} | {med.dci}
                    </small>
                  </div>
                  <Button
                    icon="pi pi-plus"
                    className="p-button-text p-button-sm"
                    onClick={() => addToPanier(med)}
                    disabled={med.stock === 0}
                    tooltip="Ajouter au panier"
                  />
                </div>
              ))}
            </div>
            <Button
              label="Scanner code-barres"
              icon="pi pi-barcode"
              className="p-button-outlined"
              onClick={() => toast.current?.show({ severity: 'info', summary: 'Scan', detail: 'Scan de code-barres simulé.' })}
            />
          </div>

          {/* Panier et finalisation */}
          <div
            style={{
              flex: 1,
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#16a085' }}>Panier</span>
                  <Tag value={venteStatut} severity={venteStatut === 'Finalisée' ? 'success' : venteStatut === 'Annulée' ? 'danger' : 'warning'} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    icon="pi pi-pause"
                    className="p-button-text p-button-sm"
                    onClick={suspendVente}
                    disabled={venteStatut !== 'En cours'}
                    tooltip="Suspendre"
                  />
                  <Button
                    icon="pi pi-play"
                    className="p-button-text p-button-sm"
                    onClick={resumeVente}
                    disabled={venteStatut !== 'En cours'}
                    tooltip="Reprendre"
                  />
                  <Button
                    icon="pi pi-times"
                    className="p-button-text p-button-danger p-button-sm"
                    onClick={cancelVente}
                    disabled={venteStatut !== 'En cours'}
                    tooltip="Annuler"
                  />
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataTable
                value={panier}
                scrollable
                scrollHeight="flex"
                responsiveLayout="scroll"
                emptyMessage="Aucun article dans le panier"
              >
                <Column field="nom" header="Médicament" style={{ minWidth: 200 }} />
                <Column field="quantite" header="Quantité" body={quantiteBody} style={{ width: 120 }} />
                <Column field="prixUnitaire" header="Prix unitaire" body={(row) => row.prixUnitaire.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} style={{ width: 140 }} />
                <Column header="Sous-total" body={sousTotalBody} style={{ width: 140 }} />
                <Column header="Actions" body={actionsBody} style={{ width: 80 }} />
              </DataTable>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <span className="p-float-label">
                  <InputText
                    id="client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    style={{ width: '100%' }}
                    disabled={venteStatut !== 'En cours'}
                  />
                  <label htmlFor="client">Client (optionnel)</label>
                </span>
                <span className="p-float-label">
                  <Dropdown
                    id="vendeur"
                    value={vendeur}
                    options={users}
                    optionLabel="nom"
                    onChange={(e) => setVendeur(e.value)}
                    style={{ width: '100%' }}
                    disabled={venteStatut !== 'En cours'}
                  />
                  <label htmlFor="vendeur">Vendeur</label>
                </span>
                <span className="p-float-label">
                  <Dropdown
                    id="typePaiement"
                    value={typePaiement}
                    options={typesPaiement}
                    onChange={(e) => setTypePaiement(e.value)}
                    style={{ width: '100%' }}
                    disabled={venteStatut !== 'En cours'}
                  />
                  <label htmlFor="typePaiement">Type de paiement</label>
                </span>
                <span className="p-float-label">
                  <InputNumber
                    id="montantRecu"
                    value={montantRecu}
                    onValueChange={(e) => setMontantRecu(e.value || 0)}
                    style={{ width: '100%' }}
                    disabled={venteStatut !== 'En cours'}
                  />
                  <label htmlFor="montantRecu">Montant reçu (Ar)</label>
                </span>
                <span className="p-float-label">
                  <InputNumber
                    id="remise"
                    value={remise}
                    onValueChange={(e) => setRemise(e.value || 0)}
                    min={0}
                    max={100}
                    suffix="%"
                    style={{ width: '100%' }}
                    disabled={venteStatut !== 'En cours'}
                  />
                  <label htmlFor="remise">Remise (%)</label>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Total:</strong> {total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} <br />
                  <strong>Monnaie rendue:</strong> {monnaieRendue.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    label="Imprimer reçu"
                    icon="pi pi-print"
                    className="p-button-outlined"
                    onClick={printReceipt}
                    disabled={venteStatut !== 'Finalisée'}
                  />
                  <Button
                    label="Envoyer reçu"
                    icon="pi pi-send"
                    className="p-button-outlined"
                    onClick={sendReceipt}
                    disabled={venteStatut !== 'Finalisée'}
                  />
                  <Button
                    label="Finaliser"
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={finalizeVente}
                    disabled={venteStatut !== 'En cours'}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Styles inline responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; flex-direction: column; }
          .p-datatable { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}