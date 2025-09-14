import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputNumber } from 'primereact/inputnumber';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import Sidebar from '../components/Sidebar';

export default function PointOfSalePage() {
  const toast = useRef(null);
  const searchRef = useRef(null);

  // --- Données mockées ---
  const medicaments = [
    { id: 1, nom: 'Paracétamol 500mg', codeBarres: '1234567890123', dci: 'Paracétamol', stock: 150, prixUnitaire: 500, famille: 'Antalgiques' },
    { id: 2, nom: 'Amoxicilline 1g', codeBarres: '1234567890124', dci: 'Amoxicilline', stock: 30, prixUnitaire: 1200, famille: 'Antibiotiques' },
    { id: 3, nom: 'Ibuprofène 400mg', codeBarres: '1234567890125', dci: 'Ibuprofène', stock: 0, prixUnitaire: 800, famille: 'Anti-inflammatoires' },
    { id: 4, nom: 'Aspirine 100mg', codeBarres: '1234567890126', dci: 'Acide acétylsalicylique', stock: 300, prixUnitaire: 300, famille: 'Antiagrégants' },
    { id: 5, nom: 'Doliprane 1000mg', codeBarres: '1234567890127', dci: 'Paracétamol', stock: 75, prixUnitaire: 650, famille: 'Antalgiques' },
    { id: 6, nom: 'Augmentin 625mg', codeBarres: '1234567890128', dci: 'Amoxicilline/Acide clavulanique', stock: 45, prixUnitaire: 2500, famille: 'Antibiotiques' },
  ];

  const users = [
    { id: 1, nom: 'Jean Rakoto', poste: 'Pharmacien' },
    { id: 2, nom: 'Marie Raso', poste: 'Assistant' },
    { id: 3, nom: 'Paul Andriamalala', poste: 'Vendeur' },
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
  const [selectedFamille, setSelectedFamille] = useState(null);

  const typesPaiement = [
    { label: 'Espèces', value: 'Espèces', icon: 'pi pi-money-bill' },
    { label: 'Carte Bancaire', value: 'Carte', icon: 'pi pi-credit-card' },
    { label: 'Mobile Money', value: 'Mobile Money', icon: 'pi pi-mobile' },
    { label: 'Chèque', value: 'Chèque', icon: 'pi pi-file-edit' },
  ];

  const familles = [
    { label: 'Toutes familles', value: null },
    { label: 'Antalgiques', value: 'Antalgiques' },
    { label: 'Antibiotiques', value: 'Antibiotiques' },
    { label: 'Anti-inflammatoires', value: 'Anti-inflammatoires' },
    { label: 'Antiagrégants', value: 'Antiagrégants' },
  ];

  // --- Calculs ---
  const total = useMemo(() => {
    const subtotal = panier.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0);
    return subtotal * (1 - (remise || 0) / 100);
  }, [panier, remise]);

  const monnaieRendue = useMemo(() => Math.max(0, (montantRecu || 0) - total), [montantRecu, total]);

  // --- Recherche médicament ---
  const filteredMedicaments = useMemo(() => {
    let filtered = medicaments;
    
    if (selectedFamille) {
      filtered = filtered.filter(m => m.famille === selectedFamille);
    }
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.nom.toLowerCase().includes(q) ||
          m.codeBarres.includes(q) ||
          m.dci.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [search, selectedFamille]);

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
        return prev.map((item) => (item.id === medicament.id ? { ...item, quantite: item.quantite + 1 } : item));
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
      setPanier((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantite } : i)));
    }
  };

  const removeFromPanier = (item) => {
    setPanier((prev) => prev.filter((i) => i.id !== item.id));
  };

  const finalizeVente = () => {
    if (!panier.length) {
      toast.current?.show({ severity: 'warn', summary: 'Panier vide', detail: 'Ajoutez des médicaments avant de finaliser.' });
      return;
    }
    if (!typePaiement) {
      toast.current?.show({ severity: 'warn', summary: 'Paiement requis', detail: 'Sélectionnez un type de paiement.' });
      return;
    }
    if ((montantRecu || 0) < total) {
      toast.current?.show({ severity: 'warn', summary: 'Paiement insuffisant', detail: 'Le montant reçu est insuffisant.' });
      return;
    }
    
    confirmDialog({
      message: `Finaliser la vente de ${panier.length} article(s) pour un total de ${total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} ?`,
      header: 'Confirmation de vente',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Finaliser',
      rejectLabel: 'Annuler',
      accept: () => {
        const newVenteId = venteId || `VTE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        setVenteStatut('Finalisée');
        setVenteId(newVenteId);
        toast.current?.show({ 
          severity: 'success', 
          summary: 'Vente finalisée', 
          detail: `Vente ${newVenteId} enregistrée avec succès.`,
          life: 5000
        });
      }
    });
  };

  const cancelVente = () => {
    if (!panier.length && venteStatut === 'En cours') {
      toast.current?.show({ severity: 'info', summary: 'Aucune vente', detail: 'Aucune vente en cours à annuler.' });
      return;
    }
    
    confirmDialog({
      message: 'Êtes-vous sûr de vouloir annuler cette vente ? Tous les articles seront supprimés du panier.',
      header: 'Annulation de vente',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Oui, annuler',
      rejectLabel: 'Non, continuer',
      accept: () => {
        resetVente();
        toast.current?.show({ severity: 'success', summary: 'Vente annulée', detail: 'La vente a été annulée.' });
      },
    });
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

  const newVente = () => {
    resetVente();
    toast.current?.show({ severity: 'info', summary: 'Nouvelle vente', detail: 'Nouvelle vente initialisée.' });
  };

  // --- Raccourcis clavier ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        finalizeVente();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (panier.length > 0) {
          cancelVente();
        }
      }
      if (e.key === 'F9') {
        e.preventDefault();
        newVente();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panier, finalizeVente]);

  // --- Rendus colonnes ---
  const quantiteBody = (row) => (
    <InputNumber
      value={row.quantite}
      onValueChange={(e) => updateQuantite(row, e.value)}
      min={1}
      max={row.stock}
      showButtons
      buttonLayout="horizontal"
      size="small"
      style={{ width: '100px' }}
    />
  );

  const prixBody = (row) => (
    <span style={{ fontWeight: 600, color: '#2563eb' }}>
      {row.prixUnitaire.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
    </span>
  );

  const sousTotalBody = (row) => (
    <span style={{ fontWeight: 700, color: '#059669' }}>
      {(row.quantite * row.prixUnitaire).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
    </span>
  );

  const actionsBody = (row) => (
    <Button
      icon="pi pi-trash"
      className="p-button-text p-button-danger p-button-sm"
      onClick={() => removeFromPanier(row)}
      tooltip="Supprimer (Suppr)"
      size="small"
    />
  );

  const stockBody = (med) => (
    <Tag 
      value={med.stock} 
      severity={med.stock === 0 ? 'danger' : med.stock < 10 ? 'warning' : 'success'}
      style={{ minWidth: '45px', justifyContent: 'center' }}
    />
  );

  // Interface toolbar
  const toolbarLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button 
        label="Nouvelle vente" 
        icon="pi pi-plus" 
        className="p-button-success" 
        size="small"
        onClick={newVente}
        tooltip="Nouvelle vente (F9)"
      />
      <Button 
        label="Suspendre" 
        icon="pi pi-pause" 
        className="p-button-warning" 
        size="small"
        disabled={panier.length === 0}
        tooltip="Suspendre la vente"
      />
    </div>
  );

  const toolbarRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        Vendeur: {vendeur?.nom}
      </span>
      <Tag value={venteStatut} severity={venteStatut === 'Finalisée' ? 'success' : 'info'} />
    </div>
  );

  return (
    <div style={{ 
      fontFamily: 'Inter, Segoe UI, system-ui', 
      background: '#e5e7eb', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '8px'
    }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Fenêtre application */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1600px',
        height: '95vh', 
        background: '#ffffff', 
        borderRadius: '8px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)', 
        display: 'grid', 
        gridTemplateRows: '40px auto 1fr 32px',
        border: '1px solid #d1d5db'
      }}>
        {/* Barre de titre */}
        <div style={{ 
          background: 'linear-gradient(180deg, #f9fafb, #f3f4f6)', 
          borderBottom: '1px solid #d1d5db',
          borderRadius: '8px 8px 0 0',
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '0 16px' 
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            MediFinder POS • Point de Vente
          </div>
          {venteId && (
            <Tag value={`Vente: ${venteId}`} severity="info" style={{ marginLeft: 'auto' }} />
          )}
        </div>

        {/* Toolbar */}
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <Toolbar left={toolbarLeft} right={toolbarRight} style={{ border: 'none', padding: '8px 16px' }} />
        </div>

        {/* Corps avec Sidebar + contenu */}
        <div style={{ display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ 
            width: '280px', 
            flexShrink: 0, 
            borderRight: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <Sidebar title="Modules" />
          </div>

          {/* Contenu principal avec splitter */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Splitter style={{ height: '100%' }}>
              <SplitterPanel size={35} minSize={30}>
                {/* Panneau recherche et produits */}
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
                  <Card 
                    title="Catalogue Produits"
                    style={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className="h-full"
                  >
                    {/* Filtres de recherche */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
                      <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                          ref={searchRef}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Rechercher... (Ctrl+F)"
                          style={{ width: '100%' }}
                          size="small"
                        />
                      </span>
                      <Dropdown
                        value={selectedFamille}
                        options={familles}
                        onChange={(e) => setSelectedFamille(e.value)}
                        placeholder="Famille"
                        style={{ minWidth: '140px' }}
                        size="small"
                      />
                    </div>

                    {/* Liste des produits */}
                    <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                      <DataTable
                        value={filteredMedicaments}
                        size="small"
                        scrollable
                        scrollHeight="flex"
                        rowHover
                        onRowDoubleClick={(e) => addToPanier(e.data)}
                        emptyMessage="Aucun médicament trouvé"
                        rowClassName={(med) => med.stock === 0 ? 'p-disabled' : ''}
                      >
                        <Column 
                          field="nom" 
                          header="Médicament" 
                          style={{ minWidth: '200px' }}
                          body={(med) => (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{med.nom}</div>
                              <small style={{ color: '#6b7280' }}>{med.dci} • {med.famille}</small>
                            </div>
                          )}
                        />
                        <Column 
                          header="Stock" 
                          style={{ width: '80px', textAlign: 'center' }}
                          body={stockBody}
                        />
                        <Column 
                          field="prixUnitaire" 
                          header="Prix" 
                          style={{ width: '100px' }}
                          body={prixBody}
                        />
                        <Column 
                          style={{ width: '60px' }}
                          body={(med) => (
                            <Button
                              icon="pi pi-plus"
                              className="p-button-text p-button-sm"
                              onClick={() => addToPanier(med)}
                              disabled={med.stock === 0}
                              tooltip="Ajouter (Double-clic)"
                            />
                          )}
                        />
                      </DataTable>
                    </div>
                  </Card>
                </div>
              </SplitterPanel>

              <SplitterPanel size={65} minSize={40}>
                {/* Panneau panier et paiement */}
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
                  <div style={{ 
                    height: '100%',
                    display: 'grid',
                    gridTemplateRows: '1fr 280px',
                    gap: 16
                  }}>
                    {/* Panier */}
                    <Card 
                      title={`Panier (${panier.length} article${panier.length > 1 ? 's' : ''})`}
                      style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0
                      }}
                    >
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <DataTable
                          value={panier}
                          size="small"
                          scrollable
                          scrollHeight="flex"
                          emptyMessage="Le panier est vide"
                          rowHover
                        >
                          <Column 
                            field="nom" 
                            header="Médicament" 
                            style={{ minWidth: '200px' }}
                            body={(item) => (
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.nom}</div>
                                <small style={{ color: '#6b7280' }}>Stock disponible: {item.stock}</small>
                              </div>
                            )}
                          />
                          <Column 
                            header="Quantité" 
                            style={{ width: '120px' }}
                            body={quantiteBody}
                          />
                          <Column 
                            header="Prix unit." 
                            style={{ width: '120px' }}
                            body={prixBody}
                          />
                          <Column 
                            header="Sous-total" 
                            style={{ width: '130px' }}
                            body={sousTotalBody}
                          />
                          <Column 
                            style={{ width: '60px' }}
                            body={actionsBody}
                          />
                        </DataTable>
                      </div>
                    </Card>

                    {/* Zone de paiement */}
                    <Card title="Finalisation et Paiement" style={{ minHeight: 0 }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: 16,
                        marginBottom: 20
                      }}>
                        <span className="p-float-label">
                          <InputText 
                            id="client" 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)} 
                            style={{ width: '100%' }} 
                            disabled={venteStatut === 'Finalisée'}
                          />
                          <label htmlFor="client">Client (optionnel)</label>
                        </span>
                        
                        <span className="p-float-label">
                          <Dropdown 
                            id="typePaiement" 
                            value={typePaiement} 
                            options={typesPaiement} 
                            onChange={(e) => setTypePaiement(e.value)}
                            style={{ width: '100%' }} 
                            disabled={venteStatut === 'Finalisée'}
                            optionTemplate={(option) => (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className={option.icon} />
                                {option.label}
                              </div>
                            )}
                          />
                          <label htmlFor="typePaiement">Mode de paiement *</label>
                        </span>
                        
                        <span className="p-float-label">
                          <InputNumber 
                            id="remise" 
                            value={remise} 
                            onValueChange={(e) => setRemise(e.value || 0)} 
                            min={0} 
                            max={50} 
                            suffix="%" 
                            style={{ width: '100%' }} 
                            disabled={venteStatut === 'Finalisée'}
                          />
                          <label htmlFor="remise">Remise (%)</label>
                        </span>
                      </div>

                      {/* Calculs et montants */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr auto', 
                        gap: 20,
                        alignItems: 'end'
                      }}>
                        <span className="p-float-label">
                          <InputNumber 
                            id="montantRecu" 
                            value={montantRecu} 
                            onValueChange={(e) => setMontantRecu(e.value || 0)} 
                            style={{ width: '100%' }} 
                            disabled={venteStatut === 'Finalisée'}
                          />
                          <label htmlFor="montantRecu">Montant reçu (Ar) *</label>
                        </span>
                        
                        <div style={{ 
                          background: '#f3f4f6', 
                          padding: '12px', 
                          borderRadius: '6px',
                          border: '1px solid #d1d5db'
                        }}>
                          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                            <strong>Total: </strong>
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              {total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            <strong>Monnaie: </strong>
                            {monnaieRendue.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button 
                            label="Annuler" 
                            icon="pi pi-times" 
                            className="p-button-danger p-button-outlined"
                            onClick={cancelVente}
                            disabled={venteStatut === 'Finalisée'}
                            tooltip="Annuler (Esc)"
                          />
                          <Button 
                            label="Finaliser" 
                            icon="pi pi-check" 
                            className="p-button-success"
                            onClick={finalizeVente}
                            disabled={panier.length === 0 || venteStatut === 'Finalisée'}
                            tooltip="Finaliser la vente (Ctrl+Enter)"
                            style={{ minWidth: '120px' }}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </SplitterPanel>
            </Splitter>
          </div>
        </div>

        {/* Barre d'état */}
        <footer style={{ 
          background: '#f9fafb', 
          borderTop: '1px solid #e5e7eb',
          borderRadius: '0 0 8px 8px',
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 16px', 
          fontSize: '12px', 
          color: '#6b7280',
          justifyContent: 'space-between'
        }}>
          <div>
            Prêt • {filteredMedicaments.length} produit(s) disponible(s)
          </div>
          <div>
            Total panier: {total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} • 
            {panier.length} article(s) • 
            Raccourcis: F9(Nouveau) Ctrl+F(Recherche) Ctrl+Enter(Finaliser) Esc(Annuler)
          </div>
        </footer>
      </div>

      <style>{`
        .p-card .p-card-body {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .p-card .p-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .p-datatable .p-disabled {
          opacity: 0.5;
          background-color: #f9fafb;
        }
        .p-datatable .p-datatable-tbody > tr:hover .p-disabled {
          background-color: #f3f4f6 !important;
        }
        .p-splitter .p-splitter-panel {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}