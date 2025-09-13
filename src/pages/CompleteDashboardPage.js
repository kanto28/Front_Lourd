import React, { useState, useEffect, useRef } from 'react';
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

export default function CompleteDashboardPage() {
  const toast = useRef(null);

  // --- Mocked data ---
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, prixVente: 1500, stock: 50, ventesMensuelles: 1000, expiration: new Date('2025-10-01') },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, prixVente: 2000, stock: 200, ventesMensuelles: 800, expiration: new Date('2025-11-15') },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, prixVente: 7500, stock: 0, ventesMensuelles: 300, expiration: new Date('2025-09-20') },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, prixVente: 24000, stock: 10, ventesMensuelles: 50, expiration: null },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, prixVente: 4500, stock: 150, ventesMensuelles: 500, expiration: new Date('2025-12-01') },
  ];

  const [kpiData, setKpiData] = useState({
    chiffreAffaires: { jour: 50000, mois: 1500000, evolution: 5.2 },
    benefices: { mois: 450000, evolution: 3.8 }, // Simulated from your /benefits route
    stock: { valeur: 2500000, alertes: 3 },
    clients: { jour: 120, panierMoyen: 12500 },
  });

  const [alertes, setAlertes] = useState({
    ruptures: medicaments.filter((m) => m.stock === 0).length,
    stockFaible: medicaments.filter((m) => m.stock > 0 && m.stock <= 10).length,
    expirations: medicaments.filter((m) => m.expiration && m.expiration < new Date(new Date().setDate(new Date().getDate() + 60))).length,
    commandesEnAttente: 5, // Mocked
  });

  const clientsParMedicament = medicaments.map((m) => ({
    nom: m.nom,
    data: Array.from({ length: 12 }, () => Math.round(m.ventesMensuelles * (Math.random() * 0.4 + 0.8))),
  }));

  const topProduits = medicaments
    .map((m) => ({ ...m, ventesTotales: m.ventesMensuelles }))
    .sort((a, b) => b.ventesTotales - a.ventesTotales)
    .slice(0, 10);

  const medicamentsExpirant = medicaments
    .filter((m) => m.expiration)
    .map((m) => ({
      ...m,
      joursRestants: m.expiration ? Math.round((m.expiration - new Date()) / (1000 * 60 * 60 * 24)) : null,
    }));

  // --- Configuration from PriceConfigurationPage.js ---
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

  // --- State for filters ---
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

  // --- Auto-refresh every 5 minutes ---
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

  // --- Chart data ---
  const chartData = {
    clientsParMedicament: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: clientsParMedicament
        .filter((m) => !selectedCategorie || m.categorie === selectedCategorie)
        .map((m) => ({
          label: m.nom,
          data: m.data,
          fill: false,
          borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          tension: 0.4,
        })),
    },
    topProduits: {
      labels: topProduits.map((p) => p.nom),
      datasets: [
        {
          label: 'Ventes mensuelles',
          data: topProduits.map((p) => p.ventesTotales),
          backgroundColor: '#3498db',
        },
      ],
    },
  };

  const chartOptions = {
    clientsParMedicament: {
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Clients' } } },
    },
    topProduits: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Ventes' } } },
    },
  };

  // --- Export to PDF ---
  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Tableau de Bord Complet - ${selectedPeriode}`, 20, 20);
    doc.setFontSize(12);
    let y = 30;

    doc.text('KPIs', 20, y);
    y += 10;
    doc.text(`Chiffre d'affaires (Jour): ${kpiData.chiffreAffaires.jour.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
    y += 10;
    doc.text(`Chiffre d'affaires (Mois): ${kpiData.chiffreAffaires.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
    y += 10;
    doc.text(`Bénéfices (Mois): ${kpiData.benefices.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
    y += 10;
    doc.text(`Stock (Valeur): ${kpiData.stock.valeur.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
    y += 10;
    doc.text(`Clients (Jour): ${kpiData.clients.jour}, Panier moyen: ${kpiData.clients.panierMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
    y += 10;

    doc.text('Alertes', 20, y);
    y += 10;
    doc.text(`Ruptures de stock: ${alertes.ruptures}`, 20, y);
    y += 10;
    doc.text(`Stock faible: ${alertes.stockFaible}`, 20, y);
    y += 10;
    doc.text(`Expirations proches: ${alertes.expirations}`, 20, y);
    y += 10;
    doc.text(`Commandes en attente: ${alertes.commandesEnAttente}`, 20, y);
    y += 10;

    doc.text('Top 10 produits', 20, y);
    y += 10;
    topProduits.forEach((p) => {
      doc.text(`${p.nom}: ${p.ventesTotales} ventes`, 20, y);
      y += 10;
    });

    doc.text('Médicaments proches d’expiration', 20, y);
    y += 10;
    medicamentsExpirant.forEach((m) => {
      doc.text(`${m.nom}: Expire dans ${m.joursRestants} jours`, 20, y);
      y += 10;
    });

    doc.save(`tableau_de_bord_${selectedPeriode}.pdf`);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Tableau de bord exporté en PDF.' });
  };

  // --- Drill-down navigation (simulated) ---
  const handleDrillDown = (type, id) => {
    toast.current?.show({ severity: 'info', summary: 'Navigation', detail: `Redirection vers détails ${type}: ${id}` });
    // Example: window.location.href = `/comptabilite/prix-specifiques/${id}`;
  };

  // --- Render columns ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const expirationBody = (row) => (
    <Tag
      value={row.joursRestants <= 30 ? 'Urgent' : 'Attention'}
      severity={row.joursRestants <= 30 ? 'danger' : 'warning'}
    />
  );
  const actionBody = (row) => (
    <Button
      icon="pi pi-eye"
      className="p-button-text"
      onClick={() => handleDrillDown('médicament', row.id)}
    />
  );

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Tableau de Bord Complet</span>
      <Dropdown
        value={selectedPeriode}
        options={periodes}
        onChange={(e) => setSelectedPeriode(e.value)}
        style={{ width: '140px' }}
      />
      <Dropdown
        value={selectedCategorie}
        options={categories}
        onChange={(e) => setSelectedCategorie(e.value)}
        placeholder="Filtrer par catégorie"
        style={{ width: '200px' }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={exporterPDF} className="p-button-outlined" />
    </div>
  );

  // --- Main render ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#eef1f2' }}>
      <Toast ref={toast} />

      {/* Module header */}
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
          <i className="pi pi-chart-bar" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Tableau de Bord Complet</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Card
              title="Chiffre d'Affaires"
              subTitle={`Mois: ${kpiData.chiffreAffaires.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`}
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <p>Jour: {kpiData.chiffreAffaires.jour.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              <p>Évolution: {kpiData.chiffreAffaires.evolution.toFixed(1)}%</p>
            </Card>
            <Card
              title="Bénéfices"
              subTitle={`Mois: ${kpiData.benefices.mois.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`}
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <p>Évolution: {kpiData.benefices.evolution.toFixed(1)}%</p>
            </Card>
            <Card
              title="Stock"
              subTitle={`Valeur: ${kpiData.stock.valeur.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`}
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <p>Alertes: {kpiData.stock.alertes}</p>
            </Card>
            <Card
              title="Clients"
              subTitle={`Jour: ${kpiData.clients.jour}`}
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <p>Panier moyen: {kpiData.clients.panierMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
            </Card>
          </div>

          {/* Section 2: Alerts */}
          <Card
            title="Alertes Importantes"
            style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Badge value={`Ruptures: ${alertes.ruptures}`} severity="danger" onClick={() => handleDrillDown('alertes', 'ruptures')} />
              <Badge value={`Stock faible: ${alertes.stockFaible}`} severity="warning" onClick={() => handleDrillDown('alertes', 'stock-faible')} />
              <Badge value={`Expirations: ${alertes.expirations}`} severity="warning" onClick={() => handleDrillDown('alertes', 'expirations')} />
              <Badge value={`Commandes en attente: ${alertes.commandesEnAttente}`} severity="info" onClick={() => handleDrillDown('alertes', 'commandes')} />
            </div>
          </Card>

          {/* Section 3: Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card
              title="Clients par Médicament (12 mois)"
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <Chart type="line" data={chartData.clientsParMedicament} options={chartOptions.clientsParMedicament} />
            </Card>
            <Card
              title="Top 10 Produits les Plus Vendus"
              style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
            >
              <Chart type="bar" data={chartData.topProduits} options={chartOptions.topProduits} />
            </Card>
          </div>

          {/* Section 4: Expiring Medications */}
          <Card
            title="Médicaments Proches d’Expiration"
            style={{ borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            <DataTable
              value={medicamentsExpirant.filter((m) => !selectedCategorie || m.categorie === selectedCategorie)}
              responsiveLayout="scroll"
              emptyMessage="Aucun médicament expirant"
            >
              <Column field="nom" header="Médicament" sortable />
              <Column field="categorie" header="Catégorie" sortable />
              <Column field="joursRestants" header="Jours restants" sortable />
              <Column field="joursRestants" header="Statut" body={expirationBody} />
              <Column body={actionBody} header="Actions" />
            </DataTable>
          </Card>
        </main>
      </div>

      {/* Responsive inline styles */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}