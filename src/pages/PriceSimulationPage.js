import React, { useState, useRef } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Chart } from 'primereact/chart';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import 'chart.js/auto';

export default function PriceSimulationPage() {
  const toast = useRef(null);

  // --- Données mockées pour les médicaments ---
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, ventesMensuelles: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, ventesMensuelles: 800 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, ventesMensuelles: 300 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, ventesMensuelles: 50 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, ventesMensuelles: 500 },
  ];

  // --- Données concurrentielles mockées ---
  const concurrents = medicaments.map((m) => ({
    id: m.id,
    prixConcurrent: m.prixAchat * (1 + (Math.random() * 0.4 + 0.8)), // Variation aléatoire entre 80% et 120%
    margeMarche: (Math.random() * 10 + 20).toFixed(2), // Marge marché entre 20% et 30%
  }));

  // --- Configuration par défaut (tirée de PriceConfigurationPage.js) ---
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
    regleArrondi: 'À l’euro près',
    prixMinimum: 500,
    prixMaximum: 100000,
  };

  // --- État pour le calculateur individuel ---
  const [calculIndividuel, setCalculIndividuel] = useState({
    idMedicament: '',
    prixAchat: 0,
    prixConcurrent: 0,
  });

  // --- État pour la simulation globale ---
  const [margeGlobaleSimulee, setMargeGlobaleSimulee] = useState(configuration.margeGlobale);

  // --- Calculs pour le calculateur individuel ---
  const calculerPrixVente = (prixAchat, categorie) => {
    const marge = configuration.margesParCategorie[categorie] || configuration.margeGlobale;
    const prixHT = prixAchat * (1 + marge / 100);
    const prixTTC = prixHT * (1 + configuration.tvaDefaut / 100);
    const prixVente = configuration.regleArrondi === 'À l’euro près' ? Math.round(prixTTC) : prixTTC;
    return {
      prixHT: prixHT.toFixed(2),
      prixTTC: Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum)).toFixed(2),
      margeMGA: (prixHT - prixAchat).toFixed(2),
      margePourcentage: ((prixHT - prixAchat) / prixAchat * 100).toFixed(2),
    };
  };

  const resultatCalculIndividuel = calculIndividuel.idMedicament
    ? calculerPrixVente(
        calculIndividuel.prixAchat,
        medicaments.find((m) => m.id === calculIndividuel.idMedicament)?.categorie || ''
      )
    : null;

  // --- Calculs pour la simulation globale ---
  const simulationGlobale = medicaments.map((m) => {
    const prixVenteActuel = calculerPrixVente(m.prixAchat, m.categorie);
    const prixVenteSimule = calculerPrixVente(m.prixAchat * (1 + margeGlobaleSimulee / 100), m.categorie);
    const concurrent = concurrents.find((c) => c.id === m.id);
    const rentabilite = (prixVenteSimule.prixTTC - m.prixAchat) * m.ventesMensuelles;
    return {
      ...m,
      prixVenteActuel: prixVenteActuel.prixTTC,
      prixVenteSimule: prixVenteSimule.prixTTC,
      margeActuelle: prixVenteActuel.margePourcentage,
      margeSimulee: prixVenteSimule.margePourcentage,
      rentabilite,
      prixConcurrent: concurrent.prixConcurrent.toFixed(2),
      margeMarche: concurrent.margeMarche,
      positionConcurrentielle:
        prixVenteSimule.prixTTC < concurrent.prixConcurrent * 0.9
          ? 'Compétitif'
          : prixVenteSimule.prixTTC > concurrent.prixConcurrent * 1.1
          ? 'Non compétitif'
          : 'Moyen',
    };
  });

  const impactCA = simulationGlobale.reduce((sum, m) => sum + (m.prixVenteSimule - m.prixVenteActuel) * m.ventesMensuelles, 0);

  // --- Données pour les graphiques ---
  const chartData = {
    rentabiliteParCategorie: {
      labels: Object.keys(configuration.margesParCategorie),
      datasets: [
        {
          label: 'Rentabilité estimée (MGA)',
          data: Object.keys(configuration.margesParCategorie).map((cat) =>
            simulationGlobale
              .filter((m) => m.categorie === cat)
              .reduce((sum, m) => sum + m.rentabilite, 0)
          ),
          backgroundColor: ['#3498db', '#16a085', '#e74c3c', '#f1c40f', '#2ecc71'],
        },
      ],
    },
    comparaisonPrix: {
      labels: medicaments.map((m) => m.nom),
      datasets: [
        {
          label: 'Prix actuel',
          data: simulationGlobale.map((m) => m.prixVenteActuel),
          backgroundColor: '#3498db',
        },
        {
          label: 'Prix simulé',
          data: simulationGlobale.map((m) => m.prixVenteSimule),
          backgroundColor: '#16a085',
        },
        {
          label: 'Prix concurrent',
          data: simulationGlobale.map((m) => m.prixConcurrent),
          backgroundColor: '#e74c3c',
        },
      ],
    },
  };

  const chartOptions = {
    rentabiliteParCategorie: {
      plugins: { legend: { position: 'right' } },
    },
    comparaisonPrix: {
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
  };

  // --- Actions ---
  const exporterResultats = (format) => {
    if (format === 'Excel') {
      const csvContent = [
        ['Médicament', 'Catégorie', 'Prix d’achat', 'Prix vente actuel', 'Prix vente simulé', 'Prix concurrent', 'Marge actuelle (%)', 'Marge simulée (%)', 'Rentabilité (MGA)', 'Position concurrentielle'].join(','),
        ...simulationGlobale.map((m) =>
          [
            m.nom,
            m.categorie,
            m.prixAchat.toLocaleString('fr-FR'),
            m.prixVenteActuel.toLocaleString('fr-FR'),
            m.prixVenteSimule.toLocaleString('fr-FR'),
            m.prixConcurrent.toLocaleString('fr-FR'),
            m.margeActuelle,
            m.margeSimulee,
            m.rentabilite.toLocaleString('fr-FR'),
            m.positionConcurrentielle,
          ].join(',')
        ),
        ['', 'Impact CA', impactCA.toLocaleString('fr-FR')],
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simulation_prix.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Résultats exportés en CSV.' });
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Simulation des Prix', 20, 20);
      doc.setFontSize(12);
      let y = 30;
      simulationGlobale.forEach((m) => {
        doc.text(
          `${m.nom}: Actuel ${m.prixVenteActuel.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}, Simulé ${m.prixVenteSimule.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`,
          20,
          y
        );
        y += 10;
        doc.text(`Concurrent: ${m.prixConcurrent.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}, Rentabilité: ${m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
      });
      doc.text(`Impact CA: ${impactCA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
      doc.save('simulation_prix.pdf');
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Résultats exportés en PDF.' });
    }
  };

  // --- Rendu colonnes ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const pourcentageBody = (row, field) => `${row[field]}%`;

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Calcul et Simulation des Prix</span>
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterResultats('Excel')} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterResultats('PDF')} className="p-button-outlined" />
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
          <i className="pi pi-calculator" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Calcul et Simulation des Prix</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Calculateur individuel */}
          <Card
            title="Calculateur Individuel"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Médicament</label>
                <Dropdown
                  value={calculIndividuel.idMedicament}
                  options={medicaments.map((m) => ({ label: m.nom, value: m.id }))}
                  onChange={(e) => setCalculIndividuel({ ...calculIndividuel, idMedicament: e.value })}
                  placeholder="Sélectionner un médicament"
                  style={{ width: '200px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix d’achat (MGA)</label>
                <InputNumber
                  value={calculIndividuel.prixAchat}
                  onValueChange={(e) => setCalculIndividuel({ ...calculIndividuel, prixAchat: e.value })}
                  min={0}
                  suffix=" MGA"
                  style={{ width: '200px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix concurrent (MGA)</label>
                <InputNumber
                  value={calculIndividuel.prixConcurrent}
                  onValueChange={(e) => setCalculIndividuel({ ...calculIndividuel, prixConcurrent: e.value })}
                  min={0}
                  suffix=" MGA"
                  style={{ width: '200px' }}
                />
              </div>
              {resultatCalculIndividuel && (
                <div>
                  <p>Prix de vente HT : {resultatCalculIndividuel.prixHT.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                  <p>Prix de vente TTC : {resultatCalculIndividuel.prixTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                  <p>Marge : {resultatCalculIndividuel.margeMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} ({resultatCalculIndividuel.margePourcentage}%)</p>
                  <p>
                    Position concurrentielle :{' '}
                    {calculIndividuel.prixConcurrent
                      ? resultatCalculIndividuel.prixTTC < calculIndividuel.prixConcurrent * 0.9
                        ? 'Compétitif'
                        : resultatCalculIndividuel.prixTTC > calculIndividuel.prixConcurrent * 1.1
                        ? 'Non compétitif'
                        : 'Moyen'
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Simulation globale */}
          <Card
            title="Simulation Globale"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Marge globale simulée (%)</label>
                <InputNumber
                  value={margeGlobaleSimulee}
                  onValueChange={(e) => setMargeGlobaleSimulee(e.value)}
                  min={0}
                  max={100}
                  suffix="%"
                  style={{ width: '200px' }}
                />
              </div>
              <p>Impact sur le chiffre d’affaires : {impactCA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              <DataTable value={simulationGlobale} responsiveLayout="scroll" emptyMessage="Aucune donnée disponible">
                <Column field="nom" header="Médicament" sortable />
                <Column field="categorie" header="Catégorie" sortable />
                <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable />
                <Column field="prixVenteActuel" header="Prix actuel" body={(row) => montantBody(row, 'prixVenteActuel')} sortable />
                <Column field="prixVenteSimule" header="Prix simulé" body={(row) => montantBody(row, 'prixVenteSimule')} sortable />
                <Column field="prixConcurrent" header="Prix concurrent" body={(row) => montantBody(row, 'prixConcurrent')} sortable />
                <Column field="margeActuelle" header="Marge actuelle (%)" body={(row) => pourcentageBody(row, 'margeActuelle')} sortable />
                <Column field="margeSimulee" header="Marge simulée (%)" body={(row) => pourcentageBody(row, 'margeSimulee')} sortable />
                <Column field="rentabilite" header="Rentabilité (MGA)" body={(row) => montantBody(row, 'rentabilite')} sortable />
                <Column field="positionConcurrentielle" header="Position concurrentielle" sortable />
              </DataTable>
            </div>
          </Card>

          {/* Analyse comparative */}
          <Card
            title="Analyse Comparative"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Chart type="bar" data={chartData.comparaisonPrix} options={chartOptions.comparaisonPrix} style={{ maxWidth: 600 }} />
              <Chart type="pie" data={chartData.rentabiliteParCategorie} options={chartOptions.rentabiliteParCategorie} style={{ maxWidth: 400 }} />
            </div>
          </Card>
        </main>
      </div>

      {/* Styles inline responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}