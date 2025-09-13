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
import { Calendar } from 'primereact/calendar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { PanelMenu } from 'primereact/panelmenu';
import { ContextMenu } from 'primereact/contextmenu';

export default function SalesReportsDesktop() {
  const toast = useRef(null);
  const searchRef = useRef(null);
  const cm = useRef(null);

  // --- Données mockées (inchangées) ---
  const clients = [
    { id: 1, nom: 'Jean Rakoto' },
    { id: 2, nom: 'Marie Raso' },
  ];
  const vendeurs = [
    { id: 1, nom: 'Jean Rakoto' },
    { id: 2, nom: 'Marie Raso' },
  ];
  const medicaments = [
    { id: 1, nom: 'Paracétamol 500mg', stock: 150 },
    { id: 2, nom: 'Amoxicilline 1g', stock: 30 },
    { id: 3, nom: 'Ibuprofène 400mg', stock: 0 },
    { id: 4, nom: 'Aspirine 100mg', stock: 300 },
  ];
  const ventes = [
    {
      id: 'VTE-2025-001',
      date: '2025-07-12',
      client: clients[0],
      vendeur: vendeurs[0],
      montant: 15000,
      medicaments: [
        { id: 1, nom: 'Paracétamol 500mg', quantite: 10, prixUnitaire: 500 },
        { id: 2, nom: 'Amoxicilline 1g', quantite: 5, prixUnitaire: 1200 },
      ],
      typePaiement: 'Espèces',
      statut: 'Finalisée',
    },
    {
      id: 'VTE-2025-002',
      date: '2025-08-01',
      client: null,
      vendeur: vendeurs[1],
      montant: 24000,
      medicaments: [{ id: 3, nom: 'Ibuprofène 400mg', quantite: 30, prixUnitaire: 800 }],
      typePaiement: 'Mobile Money',
      statut: 'Finalisée',
    },
    {
      id: 'VTE-2025-003',
      date: '2025-09-01',
      client: clients[1],
      vendeur: vendeurs[0],
      montant: 9000,
      medicaments: [{ id: 4, nom: 'Aspirine 100mg', quantite: 30, prixUnitaire: 300 }],
      typePaiement: 'Crédit client',
      statut: 'Finalisée',
    },
  ];

  // --- États UI ---
  const [globalFilter, setGlobalFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [vendeurFilter, setVendeurFilter] = useState(null);
  const [clientFilter, setClientFilter] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);
  const [rapportType, setRapportType] = useState('journalier');
  const [selection, setSelection] = useState(null);
  const [tableDensity, setTableDensity] = useState('compact'); // compact | normal

  // --- Menu contextuel (clic droit) ---
  const cmItems = [
    { label: 'Voir détails', icon: 'pi pi-eye', command: () => selectedVente && setShowDetail(true) },
    { separator: true },
    { label: 'Exporter', icon: 'pi pi-file-export', command: () => generateRapport() },
    { label: 'Imprimer', icon: 'pi pi-print', command: () => printRapport() },
    { label: 'Envoyer', icon: 'pi pi-send', command: () => emailRapport() },
  ];

  // --- Panneau gauche type "client lourd" ---
  const navItems = [
    {
      label: 'Modules',
      icon: 'pi pi-th-large',
      items: [
        { label: 'Tableau de bord', icon: 'pi pi-home' },
        { label: 'Ventes', icon: 'pi pi-shopping-cart' },
        { label: 'Achats', icon: 'pi pi-briefcase' },
        { label: 'Stock', icon: 'pi pi-box' },
        { label: 'Rapports', icon: 'pi pi-chart-bar', className: 'p-menuitem-active' },
      ],
    },
    {
      label: 'Paramètres',
      icon: 'pi pi-cog',
      items: [
        { label: 'Utilisateurs', icon: 'pi pi-users' },
        { label: 'Préférences', icon: 'pi pi-sliders-h' },
      ],
    },
  ];

  // --- Statistiques globales ---
  const stats = useMemo(() => {
    const filtered = ventes.filter((v) => {
      const matchesGlobal = globalFilter
        ? v.id.toLowerCase().includes(globalFilter.toLowerCase()) ||
          (v.client && v.client.nom.toLowerCase().includes(globalFilter.toLowerCase())) ||
          v.vendeur.nom.toLowerCase().includes(globalFilter.toLowerCase()) ||
          v.medicaments.some((m) => m.nom.toLowerCase().includes(globalFilter.toLowerCase()))
        : true;
      const matchesDate = dateFilter
        ? new Date(v.date).toDateString() === new Date(dateFilter).toDateString()
        : true;
      const matchesVendeur = vendeurFilter ? v.vendeur.id === vendeurFilter.id : true;
      const matchesClient = clientFilter ? v.client?.id === clientFilter?.id : true;
      return matchesGlobal && matchesDate && matchesVendeur && matchesClient;
    });

    const chiffreAffaires = filtered.reduce((sum, v) => sum + v.montant, 0);
    const nombreVentes = filtered.length;
    const panierMoyen = nombreVentes ? (chiffreAffaires / nombreVentes).toFixed(2) : 0;

    const medicamentsVendus = filtered
      .flatMap((v) => v.medicaments)
      .reduce((acc, m) => {
        acc[m.id] = acc[m.id] || { nom: m.nom, quantite: 0 };
        acc[m.id].quantite += m.quantite;
        return acc;
      }, {});
    const topMedicaments = Object.values(medicamentsVendus)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 3);

    const performanceVendeurs = vendeurs.map((v) => ({
      nom: v.nom,
      ventes: filtered.filter((vente) => vente.vendeur.id === v.id).length,
      montant: filtered
        .filter((vente) => vente.vendeur.id === v.id)
        .reduce((sum, vente) => sum + vente.montant, 0),
    }));

    return { chiffreAffaires, nombreVentes, panierMoyen, topMedicaments, performanceVendeurs, filtered };
  }, [ventes, globalFilter, dateFilter, vendeurFilter, clientFilter]);

  // --- Tendances ---
  const tendances = useMemo(() => {
    const byMonth = ventes.reduce((acc, v) => {
      const month = v.date.slice(0, 7);
      acc[month] = acc[month] || { montant: 0, ventes: 0 };
      acc[month].montant += v.montant;
      acc[month].ventes += 1;
      return acc;
    }, {});
    return Object.entries(byMonth).map(([month, data]) => ({ month, montant: data.montant, ventes: data.ventes }));
  }, [ventes]);

  // --- Rendus colonnes ---
  const montantBody = (row) => row.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const clientBody = (row) => (row.client ? row.client.nom : 'Anonyme');
  const statutBody = (row) => (
    <Tag value={row.statut} severity={row.statut === 'Finalisée' ? 'success' : row.statut === 'En cours' ? 'warning' : 'danger'} />
  );
  const actionsBody = (row) => (
    <Button
      icon="pi pi-eye"
      className="p-button-text p-button-sm"
      onClick={() => {
        setSelectedVente(row);
        setShowDetail(true);
      }}
      tooltip="Voir détails"
    />
  );

  // --- Ribbon actions ---
  const generateRapport = () => {
    const header = [
      ['Rapport', rapportType.charAt(0).toUpperCase() + rapportType.slice(1)],
      ['Date', dateFilter ? new Date(dateFilter).toLocaleDateString('fr-FR') : 'Toutes'],
      ['Vendeur', vendeurFilter ? vendeurFilter.nom : 'Tous'],
      ['Client', clientFilter ? clientFilter.nom : 'Tous'],
      [''],
      ["Chiffre d'affaires", stats.chiffreAffaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      ['Nombre de ventes', stats.nombreVentes],
      ['Panier moyen', Number(stats.panierMoyen).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })],
      [''],
      ['Top Médicaments', ''],
      ...stats.topMedicaments.map((m) => [m.nom, m.quantite]),
      [''],
      ['Performance Vendeurs', ''],
      ...stats.performanceVendeurs.map((v) => [v.nom, `${v.ventes} ventes, ${v.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`]),
      [''],
      ['Ventes', ''],
      ['ID', 'Date', 'Client', 'Vendeur', 'Montant', 'Type Paiement', 'Statut'],
    ];
    const rows = stats.filtered.map((v) => [
      v.id,
      v.date,
      v.client ? v.client.nom : 'Anonyme',
      v.vendeur.nom,
      v.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' }),
      v.typePaiement,
      v.statut,
    ]);
    const csvContent = [...header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_ventes_${rapportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Rapport généré', detail: 'Export CSV prêt.' });
  };
  const printRapport = () => toast.current?.show({ severity: 'info', summary: 'Impression', detail: 'Impression simulée.' });
  const emailRapport = () => toast.current?.show({ severity: 'info', summary: 'Envoi', detail: 'Envoi par email simulé.' });
  const scheduleRapport = () => toast.current?.show({ severity: 'info', summary: 'Programmation', detail: 'Programmation simulée.' });

  // --- Raccourcis clavier (client lourd) ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); generateRapport(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); printRapport(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F5') { e.preventDefault(); toast.current?.show({ severity: 'success', summary: 'Rafraîchi', detail: 'Données rechargées (mock).' }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --- En-tête style "barre de titre" ---
  const Titlebar = () => (
    <div style={{
      background: 'linear-gradient(180deg,#20262e,#1b2128)',
      color: '#cfd6dd',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #0d1117'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="pi pi-desktop" />
        <strong>MediFinder • Rapports de ventes</strong>
        <Tag value="Mode Client Lourd" style={{ background:'#263241', color:'#9ecbff', border:0 }} />
      </div>
      <div style={{ display:'flex', gap:4 }}>
        <Button icon="pi pi-minus" className="p-button-text p-button-sm" />
        <Button icon="pi pi-stop" className="p-button-text p-button-sm" />
        <Button icon="pi pi-times" className="p-button-text p-button-sm" />
      </div>
    </div>
  );

  // --- Ribbon d'actions ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#0e7490' }}>Rapports & Historique</span>
      <Tag value={`${stats.filtered.length} ventes`} style={{ background: '#e8f7fb', color: '#0e7490', border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems:'center' }}>
      <Dropdown
        value={rapportType}
        options={[
          { label: 'Journalier', value: 'journalier' },
          { label: 'Hebdomadaire', value: 'hebdomadaire' },
          { label: 'Mensuel', value: 'mensuel' },
        ]}
        onChange={(e) => setRapportType(e.value)}
        placeholder="Type"
        style={{ minWidth: 140 }}
      />
      <Calendar value={dateFilter} onChange={(e) => setDateFilter(e.value)} placeholder="Date" style={{ minWidth: 140 }} />
      <Dropdown
        value={vendeurFilter}
        options={[{ label: 'Tous', value: null }, ...vendeurs.map((v) => ({ label: v.nom, value: v }))]}
        onChange={(e) => setVendeurFilter(e.value)}
        placeholder="Vendeur"
        style={{ minWidth: 140 }}
        optionLabel="label"
      />
      <Dropdown
        value={clientFilter}
        options={[{ label: 'Tous', value: null }, ...clients.map((c) => ({ label: c.nom, value: c }))]}
        onChange={(e) => setClientFilter(e.value)}
        placeholder="Client"
        style={{ minWidth: 140 }}
        optionLabel="label"
      />
      <span className="p-input-icon-left" style={{ minWidth: 240 }}>
        <i className="pi pi-search" />
        <InputText
          ref={searchRef}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Ctrl+F Rechercher (ID, client, vendeur, médicament)"
        />
      </span>
      <div style={{ width:1, height:28, background:'#e5e7eb', margin:'0 4px' }} />
      <Button label="Exporter" icon="pi pi-file-export" onClick={generateRapport} className="p-button-outlined p-button-sm" />
      <Button label="Imprimer" icon="pi pi-print" onClick={printRapport} className="p-button-outlined p-button-sm" />
      <Button label="Envoyer" icon="pi pi-send" onClick={emailRapport} className="p-button-outlined p-button-sm" />
      <Button label="Programmer" icon="pi pi-clock" onClick={scheduleRapport} className="p-button-outlined p-button-sm" />
      <Dropdown
        value={tableDensity}
        options={[
          { label: 'Compact', value: 'compact' },
          { label: 'Normal', value: 'normal' },
        ]}
        onChange={(e) => setTableDensity(e.value)}
        style={{ minWidth: 120 }}
        placeholder="Densité"
      />
    </div>
  );

  // --- Filtrage list view ---
  const filteredRows = stats.filtered;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6' }}>
      <Toast ref={toast} />
      <ContextMenu model={cmItems} ref={cm} breakpoint="767px" />

      {/* Barre de titre type app desktop */}
      <Titlebar />

      {/* Bandeau module */}
      <div style={{
        background: 'linear-gradient(180deg,#0e7490,#0b5e74)',
        color: '#fff',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="pi pi-chart-bar" style={{ fontSize: 18 }} />
          <strong>Stock ▸ Vente ▸ Rapports et Historique</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Raccourcis : Ctrl+E, Ctrl+P, Ctrl+F, F5</div>
      </div>

      {/* Layout principal avec Splitter (panneau gauche redimensionnable) */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Splitter style={{ height: '100%' }} gutterSize={6}>
          {/* NAV GAUCHE */}
          <SplitterPanel size={22} minSize={16} style={{ background:'#ffffff', borderRight:'1px solid #e5e7eb' }}>
            <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:8 }}>
                <i className="pi pi-folder-open" />
                <strong>Navigation</strong>
              </div>
              <div style={{ padding: 8, overflow:'auto' }}>
                <PanelMenu model={navItems} style={{ border:0 }} />
              </div>

              {/* Encadré alertes / infos rapides */}
              <div style={{ margin: 8, padding: 12, border:'1px solid #e5e7eb', borderRadius:10, background:'#f9fafb' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <i className="pi pi-bell" />
                  <strong>Infos rapides</strong>
                </div>
                <ul style={{ margin:0, padding:'0 0 0 16px', fontSize:13, color:'#374151' }}>
                  <li>Rupture : {medicaments.filter(m => m.stock===0).length} article(s)</li>
                  <li>Top vendeur : {stats.performanceVendeurs.sort((a,b)=>b.montant-a.montant)[0]?.nom ?? '-'}</li>
                </ul>
              </div>
            </div>
          </SplitterPanel>

          {/* CONTENU */}
          <SplitterPanel size={78} minSize={40}>
            <div style={{ height:'100%', display:'flex', flexDirection:'column', gap:12, padding: 12 }}>
              {/* Ribbon */}
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', boxShadow:'0 6px 18px rgba(0,0,0,0.06)' }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border:0, padding:'8px 10px' }} />
              </div>

              {/* Statistiques */}
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:12, boxShadow:'0 6px 18px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin:'0 0 10px', color:'#0e7490' }}>Statistiques globales</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                  <div>
                    <strong>Chiffre d'affaires</strong>
                    <p style={{ margin:4 }}>{stats.chiffreAffaires.toLocaleString('fr-FR', { style:'currency', currency:'MGA' })}</p>
                  </div>
                  <div>
                    <strong>Nombre de ventes</strong>
                    <p style={{ margin:4 }}>{stats.nombreVentes}</p>
                  </div>
                  <div>
                    <strong>Panier moyen</strong>
                    <p style={{ margin:4 }}>{Number(stats.panierMoyen).toLocaleString('fr-FR', { style:'currency', currency:'MGA' })}</p>
                  </div>
                  <div>
                    <strong>Top médicaments</strong>
                    <ul style={{ margin:4, padding:'0 0 0 16px' }}>
                      {stats.topMedicaments.map((m, i) => <li key={i}>{m.nom}: {m.quantite} u.</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong>Performance vendeurs</strong>
                    <ul style={{ margin:4, padding:'0 0 0 16px' }}>
                      {stats.performanceVendeurs.map((v, i) => <li key={i}>{v.nom}: {v.ventes} ventes</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tendances */}
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:12, boxShadow:'0 6px 18px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin:'0 0 10px', color:'#0e7490' }}>Tendances de vente</h3>
                <DataTable value={tendances} responsiveLayout="scroll" size={tableDensity === 'compact' ? 'small' : undefined} showGridlines stripedRows>
                  <Column field="month" header="Mois" />
                  <Column field="montant" header="Chiffre d'affaires" body={(r)=>r.montant.toLocaleString('fr-FR',{ style:'currency', currency:'MGA' })} />
                  <Column field="ventes" header="Nombre de ventes" />
                </DataTable>
              </div>

              {/* Liste des ventes */}
              <div
                style={{
                  background:'#fff',
                  border:'1px solid #e5e7eb',
                  borderRadius:10,
                  boxShadow:'0 6px 18px rgba(0,0,0,0.06)',
                  flex:1,
                  minHeight:0,
                  display:'flex',
                  flexDirection:'column'
                }}
                onContextMenu={(e)=> {
                  if (selectedVente) cm.current?.show(e);
                }}
              >
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #eef2f4', display:'flex', alignItems:'center', gap:8 }}>
                  <i className="pi pi-database" />
                  <strong>Ventes</strong>
                  <span style={{ marginLeft:'auto', fontSize:12, color:'#6b7280' }}>
                    {selection?.length || 0} sélectionnée(s)
                  </span>
                </div>

                <div style={{ flex:1, minHeight:0 }}>
                  <DataTable
                    value={filteredRows}
                    paginator rows={10} rowsPerPageOptions={[10,20,50]}
                    scrollable scrollHeight="flex" responsiveLayout="scroll" stripedRows showGridlines
                    size={tableDensity === 'compact' ? 'small' : undefined}
                    selectionMode="multiple"
                    selection={selection}
                    onSelectionChange={(e)=> setSelection(e.value)}
                    metaKeySelection
                    resizableColumns columnResizeMode="fit"
                    reorderableColumns
                    stateStorage="local"
                    stateKey="medifinder-sales-table"
                    onRowContextMenu={(e)=> {
                      setSelectedVente(e.data);
                    }}
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} frozen />
                    <Column field="id" header="ID Vente" sortable style={{ minWidth: 140 }} frozen />
                    <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                    <Column header="Client" body={clientBody} sortable style={{ minWidth: 180 }} />
                    <Column field="vendeur.nom" header="Vendeur" sortable style={{ minWidth: 160 }} />
                    <Column field="montant" header="Montant" body={montantBody} sortable style={{ minWidth: 140, textAlign:'right' }} />
                    <Column field="typePaiement" header="Paiement" sortable style={{ minWidth: 160 }} />
                    <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 140 }} />
                    <Column header="Actions" body={actionsBody} style={{ width: 100 }} alignFrozen="right" frozen />
                  </DataTable>
                </div>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>

      {/* Barre d’état */}
      <div style={{
        height: 30,
        background:'#111827',
        color:'#c6d3e1',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        padding:'0 10px',
        borderTop:'1px solid #0b1220',
        fontSize:12
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span><i className="pi pi-info-circle" /> {filteredRows.length} lignes · {selection?.length || 0} sélection(s)</span>
          <span style={{ opacity:0.8 }}>Densité: {tableDensity}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span><i className="pi pi-keyboard" /> Ctrl+E | Ctrl+P | Ctrl+F | F5</span>
          <span style={{ opacity:0.8 }}><i className="pi pi-shield" /> Session sécurisée</span>
        </div>
      </div>

      {/* Détails vente */}
      <Dialog
        header={`Détail de la vente — ${selectedVente?.id ?? 'Vente'}`}
        visible={showDetail}
        style={{ width: '640px', maxWidth: '95vw' }}
        modal
        onHide={() => setShowDetail(false)}
      >
        {selectedVente && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p><strong>ID:</strong> {selectedVente.id}</p>
            <p><strong>Date:</strong> {selectedVente.date}</p>
            <p><strong>Client:</strong> {selectedVente.client ? selectedVente.client.nom : 'Anonyme'}</p>
            <p><strong>Vendeur:</strong> {selectedVente.vendeur.nom}</p>
            <p><strong>Montant:</strong> {selectedVente.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
            <p><strong>Type de paiement:</strong> {selectedVente.typePaiement}</p>
            <p><strong>Statut:</strong> {selectedVente.statut}</p>
            <h4>Médicaments</h4>
            <DataTable value={selectedVente.medicaments} responsiveLayout="scroll" size="small" showGridlines>
              <Column field="nom" header="Médicament" />
              <Column field="quantite" header="Quantité" />
              <Column field="prixUnitaire" header="Prix unitaire" body={(r)=>r.prixUnitaire.toLocaleString('fr-FR',{ style:'currency', currency:'MGA' })} />
              <Column header="Sous-total" body={(r)=>(r.quantite*r.prixUnitaire).toLocaleString('fr-FR',{ style:'currency', currency:'MGA' })} />
            </DataTable>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Button label="Exporter" icon="pi pi-file-export" className="p-button-text" onClick={generateRapport} />
              <Button label="Fermer" className="p-button" onClick={() => setShowDetail(false)} />
            </div>
          </div>
        )}
      </Dialog>

      {/* Styles supplémentaires pour le look “client lourd” */}
      <style>{`
        .p-toolbar { background: #ffffff; }
        .p-panelmenu .p-menuitem-active > .p-menuitem-content {
          background: rgba(14, 116, 144, 0.08);
        }
        .p-contextmenu { width: 220px; }
        @media (max-width: 1024px) {
          .p-toolbar { padding: 6px !important; }
        }
      `}</style>
    </div>
  );
}
