import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import 'chart.js/auto';

/**
 * CompleteDashboardPage – Look & feel "interface client lourd" (desktop app) 
 * - Fenêtre avec barre de titre (● ● ●), sidebar redimensionnable, barre d'état.
 * - Raccourcis : Ctrl+E (export PDF), Ctrl+1 (focus période), Ctrl+2 (focus catégorie), F5 (refresh mock), Esc (fermer dialogs futurs).
 * - Charts + tableau flex-height, palette cohérente (#16a085).
 */
export default function CompleteDashboardPage() {
  const toast = useRef(null);
  const searchRef = useRef(null);

  // ===== Données mockées =====
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, prixVente: 1500, stock: 50, ventesMensuelles: 1000, expiration: new Date('2025-10-01') },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, prixVente: 2000, stock: 200, ventesMensuelles: 800, expiration: new Date('2025-11-15') },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, prixVente: 7500, stock: 0, ventesMensuelles: 300, expiration: new Date('2025-09-20') },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, prixVente: 24000, stock: 10, ventesMensuelles: 50, expiration: null },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, prixVente: 4500, stock: 150, ventesMensuelles: 500, expiration: new Date('2025-12-01') },
  ];

  const [kpiData, setKpiData] = useState({
    chiffreAffaires: { jour: 50000, mois: 1500000, evolution: 5.2 },
    benefices: { mois: 450000, evolution: 3.8 },
    stock: { valeur: 2500000, alertes: 3 },
    clients: { jour: 120, panierMoyen: 12500 },
  });

  const [alertes, setAlertes] = useState({
    ruptures: medicaments.filter((m) => m.stock === 0).length,
    stockFaible: medicaments.filter((m) => m.stock > 0 && m.stock <= 10).length,
    expirations: medicaments.filter((m) => m.expiration && m.expiration < new Date(new Date().setDate(new Date().getDate() + 60))).length,
    commandesEnAttente: 5,
  });

  const clientsParMedicament = useMemo(() =>
    medicaments.map((m) => ({
      id: m.id,
      nom: m.nom,
      categorie: m.categorie,
      data: Array.from({ length: 12 }, () => Math.round(m.ventesMensuelles * (Math.random() * 0.4 + 0.8))),
    })),
    []
  );

  const topProduits = useMemo(() =>
    medicaments
      .map((m) => ({ ...m, ventesTotales: m.ventesMensuelles }))
      .sort((a, b) => b.ventesTotales - a.ventesTotales)
      .slice(0, 10),
    []
  );

  const medicamentsExpirant = useMemo(() =>
    medicaments
      .filter((m) => m.expiration)
      .map((m) => ({
        ...m,
        joursRestants: m.expiration ? Math.round((m.expiration - new Date()) / (1000 * 60 * 60 * 24)) : null,
      })),
    []
  );

  // ===== Configuration (ex. issue d'une page de paramètres) =====
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
  };

  // ===== Filtres =====
  const [selectedPeriode, setSelectedPeriode] = useState('2025-09');
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const periodes = [
    { label: '2025-07', value: '2025-07' },
    { label: '2025-08', value: '2025-08' },
    { label: '2025-09', value: '2025-09' },
  ];
  const categories = [
    { label: 'Toutes', value: null },
    { label: 'Médicaments sur ordonnance', value: 'Médicaments sur ordonnance' },
    { label: 'Médicaments sans ordonnance', value: 'Médicaments sans ordonnance' },
    { label: 'Produits de parapharmacie', value: 'Produits de parapharmacie' },
    { label: 'Produits cosmétiques', value: 'Produits cosmétiques' },
    { label: 'Matériel médical', value: 'Matériel médical' },
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

  // ===== Auto-refresh (mock) toutes les 5 min =====
  useEffect(() => {
    const interval = setInterval(() => {
      setKpiData((prev) => ({
        ...prev,
        chiffreAffaires: { ...prev.chiffreAffaires, jour: prev.chiffreAffaires.jour * (1 + (Math.random() * 0.1 - 0.05)) },
        benefices: { ...prev.benefices, mois: prev.benefices.mois * (1 + (Math.random() * 0.1 - 0.05)) },
        clients: { ...prev.clients, jour: prev.clients.jour * (1 + (Math.random() * 0.1 - 0.05)) },
      }));
      toast.current?.show({ severity: 'info', summary: 'Actualisation', detail: 'Données mises à jour.' });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ===== Raccourcis clavier =====
  const periodeRef = useRef(null);
  const categorieRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Placeholder: fermer d'éventuels dialogs
      }
      if (e.key === 'F5') {
        e.preventDefault();
        setKpiData((prev) => ({
          ...prev,
          chiffreAffaires: { ...prev.chiffreAffaires, jour: Math.round(prev.chiffreAffaires.jour * (1 + (Math.random() * 0.08 - 0.04))) },
        }));
        toast.current?.show({ severity: 'success', summary: 'Rafraîchi', detail: 'KPIs actualisés.' });
      }
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); exporterPDF(); }
      if (e.ctrlKey && e.key === '1') { e.preventDefault(); periodeRef.current?.focus(); }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); categorieRef.current?.focus(); }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const idx = periodes.findIndex((p) => p.value === selectedPeriode);
        const next = periodes[(idx + 1) % periodes.length];
        setSelectedPeriode(next.value);
      }
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const idx = periodes.findIndex((p) => p.value === selectedPeriode);
        const next = periodes[(idx - 1 + periodes.length) % periodes.length];
        setSelectedPeriode(next.value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPeriode]);

  // ===== Charts =====
  const palette = ['#16a085', '#3498db', '#9b59b6', '#e67e22', '#e74c3c', '#2ecc71', '#1abc9c', '#34495e', '#f1c40f', '#7f8c8d'];
  const chartData = useMemo(() => ({
    clientsParMedicament: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: clientsParMedicament
        .filter((m) => !selectedCategorie || m.categorie === selectedCategorie)
        .map((m, i) => ({
          label: m.nom,
          data: m.data,
          borderColor: palette[i % palette.length],
          backgroundColor: palette[i % palette.length] + '33',
          fill: false,
          tension: 0.35,
        })),
    },
    topProduits: {
      labels: topProduits.map((p) => p.nom),
      datasets: [
        { label: 'Ventes mensuelles', data: topProduits.map((p) => p.ventesTotales), backgroundColor: palette.map((c) => c + 'cc') },
      ],
    },
  }), [clientsParMedicament, topProduits, selectedCategorie]);

  const chartOptions = {
    clientsParMedicament: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Clients' } } } },
    topProduits: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Ventes' } } } },
  };

  // ===== Export PDF =====
  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Tableau de Bord Complet - ${selectedPeriode}`, 20, 20);
    doc.setFontSize(12);
    let y = 30;

    const cur = (v) => (typeof v === 'number' ? v.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' }) : v);

    doc.text('KPIs', 20, y); y += 10;
    doc.text(`CA (Jour): ${cur(kpiData.chiffreAffaires.jour)}`, 20, y); y += 10;
    doc.text(`CA (Mois): ${cur(kpiData.chiffreAffaires.mois)}`, 20, y); y += 10;
    doc.text(`Bénéfices (Mois): ${cur(kpiData.benefices.mois)}`, 20, y); y += 10;
    doc.text(`Stock (Valeur): ${cur(kpiData.stock.valeur)}`, 20, y); y += 10;
    doc.text(`Clients (Jour): ${kpiData.clients.jour}, Panier moyen: ${cur(kpiData.clients.panierMoyen)}`, 20, y); y += 10;

    doc.text('Alertes', 20, y); y += 10;
    doc.text(`Ruptures de stock: ${alertes.ruptures}`, 20, y); y += 10;
    doc.text(`Stock faible: ${alertes.stockFaible}`, 20, y); y += 10;
    doc.text(`Expirations proches: ${alertes.expirations}`, 20, y); y += 10;
    doc.text(`Commandes en attente: ${alertes.commandesEnAttente}`, 20, y); y += 10;

    doc.text('Top 10 produits', 20, y); y += 10;
    topProduits.forEach((p) => { doc.text(`${p.nom}: ${p.ventesTotales} ventes`, 20, y); y += 8; });

    doc.text('Médicaments proches d\'expiration', 20, y); y += 10;
    medicamentsExpirant.forEach((m) => { doc.text(`${m.nom}: ${m.joursRestants} jours restants`, 20, y); y += 8; });

    doc.save(`tableau_de_bord_${selectedPeriode}.pdf`);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Tableau de bord exporté en PDF.' });
  };

  // ===== Drill-down (simulé) =====
  const handleDrillDown = (type, id) => {
    toast.current?.show({ severity: 'info', summary: 'Navigation', detail: `Redirection vers détails ${type}: ${id}` });
  };

  // ===== Colonnes =====
  const expirationTag = (row) => (
    <Tag value={row.joursRestants <= 30 ? 'Urgent' : 'Attention'} severity={row.joursRestants <= 30 ? 'danger' : 'warning'} />
  );
  const actionBody = (row) => (
    <Button icon="pi pi-eye" className="p-button-text" onClick={() => handleDrillDown('médicament', row.id)} />
  );

  // ===== Entête tableau expirations =====
  const tableHeaderLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 800, color: '#16a085' }}>Médicaments proches d'expiration</span>
      <Tag value={`${medicamentsExpirant.filter((m) => !selectedCategorie || m.categorie === selectedCategorie).length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );
  const tableHeaderRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Dropdown ref={periodeRef} value={selectedPeriode} options={periodes} onChange={(e) => setSelectedPeriode(e.value)} style={{ width: 140 }} />
      <Dropdown ref={categorieRef} value={selectedCategorie} options={categories} onChange={(e) => setSelectedCategorie(e.value)} placeholder="Catégorie" style={{ width: 220 }} />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={exporterPDF} className="p-button-outlined" />
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
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Tableau de Bord</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag severity="success" value="Ctrl+E Export" />
            <Tag severity="success" value="Ctrl+1 Période" />
            <Tag severity="info" value="Ctrl+2 Catégorie" />
            <Tag severity="warning" value="F5 Rafraîchir" />
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
                <i className="pi pi-chart-bar" style={{ fontSize: 18 }} />
                <strong>Comptabilité ▸ Tableau de Bord Complet</strong>
              </div>
              <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ padding: 12, minHeight: 0, overflow: 'auto', display: 'grid', gap: 16, gridTemplateRows: 'auto auto auto 1fr' }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <Card title="Chiffre d'Affaires" subTitle={`Mois: ${kpiData.chiffreAffaires.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`} style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <p>Jour: {kpiData.chiffreAffaires.jour.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                  <p>Évolution: {kpiData.chiffreAffaires.evolution.toFixed(1)}%</p>
                </Card>
                <Card title="Bénéfices" subTitle={`Mois: ${kpiData.benefices.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`} style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <p>Évolution: {kpiData.benefices.evolution.toFixed(1)}%</p>
                </Card>
                <Card title="Stock" subTitle={`Valeur: ${kpiData.stock.valeur.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`} style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <p>Alertes: {kpiData.stock.alertes}</p>
                </Card>
                <Card title="Clients" subTitle={`Jour: ${kpiData.clients.jour}`} style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <p>Panier moyen: {kpiData.clients.panierMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                </Card>
              </div>

              {/* Alertes */}
              <Card title="Alertes Importantes" style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Badge value={`Ruptures: ${alertes.ruptures}`} severity="danger" onClick={() => handleDrillDown('alertes', 'ruptures')} />
                  <Badge value={`Stock faible: ${alertes.stockFaible}`} severity="warning" onClick={() => handleDrillDown('alertes', 'stock-faible')} />
                  <Badge value={`Expirations: ${alertes.expirations}`} severity="warning" onClick={() => handleDrillDown('alertes', 'expirations')} />
                  <Badge value={`Commandes en attente: ${alertes.commandesEnAttente}`} severity="info" onClick={() => handleDrillDown('alertes', 'commandes')} />
                </div>
              </Card>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card title="Clients par Médicament (12 mois)" style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <Chart type="line" data={chartData.clientsParMedicament} options={chartOptions.clientsParMedicament} />
                </Card>
                <Card title="Top 10 Produits les Plus Vendus" style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                  <Chart type="bar" data={chartData.topProduits} options={chartOptions.topProduits} />
                </Card>
              </div>

              {/* Tableau Expirations */}
              <Card title="Médicaments Proches d’Expiration" style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
                <Toolbar left={tableHeaderLeft} right={tableHeaderRight} style={{ border: 0 }} />
                <div style={{ minHeight: 0 }}>
                  <DataTable
                    value={medicamentsExpirant.filter((m) => !selectedCategorie || m.categorie === selectedCategorie)}
                    responsiveLayout="scroll"
                    emptyMessage="Aucun médicament expirant"
                    scrollable
                    scrollHeight="flex"
                  >
                    <Column field="nom" header="Médicament" sortable style={{ minWidth: 200 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 200 }} />
                    <Column field="joursRestants" header="Jours restants" sortable style={{ width: 160 }} />
                    <Column field="joursRestants" header="Statut" body={expirationTag} style={{ width: 140 }} />
                    <Column body={actionBody} header="Actions" style={{ width: 120 }} />
                  </DataTable>
                </div>
              </Card>
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
          <span>Raccourcis: Ctrl+E • Ctrl+1 • Ctrl+2 • F5 • Esc</span>
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
        @media (max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
