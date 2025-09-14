import React, { useState, useRef, useMemo, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import Sidebar from '../components/Sidebar';
import { jsPDF } from 'jspdf';
import 'chart.js/auto';

/**
 * PriceSimulationPage – Interface client lourd améliorée
 * - Fenêtre desktop (● ● ●), sidebar redimensionnable, contenu scrollable, barre d'état.
 * - Raccourcis : Ctrl+E (CSV), Ctrl+P (PDF).
 * - Panneaux scrollables, logique de calcul/simulation.
 * - Palette MediFinder : verts (#16a085/#0f8b6e), gris (#f0f2f6).
 * - Scroll global sur la zone principale + scrolls internes sur chaque section (calcul individuel, simulation globale, analyse comparative).
 * - Correction : section Analyse comparative entièrement visible avec défilement interne et hauteur fixe des graphiques.
 */
export default function PriceSimulationPage() {
  const toast = useRef(null);

  // Données mockées
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, ventesMensuelles: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, ventesMensuelles: 800 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, ventesMensuelles: 300 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, ventesMensuelles: 50 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, ventesMensuelles: 500 },
  ];

  const concurrents = useMemo(
    () =>
      medicaments.map((m) => ({
        id: m.id,
        prixConcurrent: m.prixAchat * (1 + (Math.random() * 0.4 + 0.8)), // 80% - 120%
        margeMarche: (Math.random() * 10 + 20).toFixed(2), // 20% - 30%
      })),
    []
  );

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

  // État – calculateur individuel
  const [calculIndividuel, setCalculIndividuel] = useState({ idMedicament: '', prixAchat: 0, prixConcurrent: 0 });

  // État – simulation globale
  const [margeGlobaleSimulee, setMargeGlobaleSimulee] = useState(configuration.margeGlobale);

  // Sidebar redimensionnable
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); exporterCSV(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); exporterPDF(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Helpers
  const calculerPrixVente = (prixAchat, categorie) => {
    const marge = configuration.margesParCategorie[categorie] || configuration.margeGlobale;
    const prixHT = prixAchat * (1 + marge / 100);
    const prixTTC = prixHT * (1 + configuration.tvaDefaut / 100);
    const prixVente = configuration.regleArrondi === 'À l’euro près' ? Math.round(prixTTC) : prixTTC;
    return {
      prixHT: Number(prixHT.toFixed(2)),
      prixTTC: Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum)),
      margeMGA: Number((prixHT - prixAchat).toFixed(2)),
      margePourcentage: Number((((prixHT - prixAchat) / prixAchat) * 100).toFixed(2)),
    };
  };

  const resultatCalculIndividuel = useMemo(() => {
    if (!calculIndividuel.idMedicament) return null;
    const med = medicaments.find((m) => m.id === calculIndividuel.idMedicament);
    return calculerPrixVente(calculIndividuel.prixAchat, med?.categorie || '');
  }, [calculIndividuel]);

  // Simulation globale
  const simulationGlobale = useMemo(() => {
    return medicaments.map((m) => {
      const prixActuel = calculerPrixVente(m.prixAchat, m.categorie);
      const prixSimule = calculerPrixVente(m.prixAchat * (1 + margeGlobaleSimulee / 100), m.categorie);
      const c = concurrents.find((x) => x.id === m.id) || { prixConcurrent: 0, margeMarche: 0 };
      const rentabilite = (prixSimule.prixTTC - m.prixAchat) * m.ventesMensuelles;
      const positionConcurrentielle =
        prixSimule.prixTTC < c.prixConcurrent * 0.9
          ? 'Compétitif'
          : prixSimule.prixTTC > c.prixConcurrent * 1.1
          ? 'Non compétitif'
          : 'Moyen';
      return {
        ...m,
        prixVenteActuel: prixActuel.prixTTC,
        prixVenteSimule: prixSimule.prixTTC,
        margeActuelle: prixActuel.margePourcentage,
        margeSimulee: prixSimule.margePourcentage,
        rentabilite,
        prixConcurrent: Number(c.prixConcurrent.toFixed(2)),
        margeMarche: c.margeMarche,
        positionConcurrentielle,
      };
    });
  }, [medicaments, concurrents, margeGlobaleSimulee]);

  const impactCA = useMemo(() => simulationGlobale.reduce((sum, m) => sum + (m.prixVenteSimule - m.prixVenteActuel) * m.ventesMensuelles, 0), [simulationGlobale]);

  // Chart data/options
  const chartData = useMemo(() => ({
    rentabiliteParCategorie: {
      labels: Object.keys(configuration.margesParCategorie),
      datasets: [
        {
          label: 'Rentabilité estimée (MGA)',
          data: Object.keys(configuration.margesParCategorie).map((cat) =>
            simulationGlobale.filter((m) => m.categorie === cat).reduce((sum, m) => sum + m.rentabilite, 0)
          ),
          backgroundColor: ['#3498db', '#16a085', '#e74c3c', '#f1c40f', '#2ecc71'],
        },
      ],
    },
    comparaisonPrix: {
      labels: medicaments.map((m) => m.nom),
      datasets: [
        { label: 'Prix actuel', data: simulationGlobale.map((m) => m.prixVenteActuel), backgroundColor: '#3498db' },
        { label: 'Prix simulé', data: simulationGlobale.map((m) => m.prixVenteSimule), backgroundColor: '#16a085' },
        { label: 'Prix concurrent', data: simulationGlobale.map((m) => m.prixConcurrent), backgroundColor: '#e74c3c' },
      ],
    },
  }), [simulationGlobale]);

  const chartOptions = {
    rentabiliteParCategorie: { plugins: { legend: { position: 'right' } } },
    comparaisonPrix: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } } },
  };

  // Export CSV
  const exporterCSV = () => {
    const csvContent = [
      ['Médicament', 'Catégorie', 'Prix d’achat', 'Prix actuel', 'Prix simulé', 'Prix concurrent', 'Marge actuelle (%)', 'Marge simulée (%)', 'Rentabilité (MGA)', 'Position concurrentielle'].join(','),
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
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_prix.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Simulation exportée en CSV.' });
  };

  // Export PDF
  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Simulation des Prix', 20, 20);
    let y = 30;
    simulationGlobale.forEach((m) => {
      doc.setFontSize(12);
      doc.text(`${m.nom} (${m.categorie})`, 20, y); y += 8;
      doc.text(`Prix d’achat: ${m.prixAchat.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
      doc.text(`Prix actuel: ${m.prixVenteActuel.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
      doc.text(`Prix simulé: ${m.prixVenteSimule.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
      doc.text(`Prix concurrent: ${m.prixConcurrent.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
      doc.text(`Marge actuelle: ${m.margeActuelle}%`, 20, y); y += 8;
      doc.text(`Marge simulée: ${m.margeSimulee}%`, 20, y); y += 8;
      doc.text(`Rentabilité: ${m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 8;
      doc.text(`Position: ${m.positionConcurrentielle}`, 20, y); y += 12;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('simulation_prix.pdf');
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Simulation exportée en PDF.' });
  };

  // Montant body
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

  // Layout client lourd
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: '#e6e9ef',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <Toast ref={toast} position="top-right" />
      <div className="app-window" style={{
        width: 'min(1500px, 100vw)',
        height: 'min(950px, 100vh)',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'grid',
        gridTemplateRows: '48px 1fr 32px',
        overflow: 'hidden',
      }}>
        {/* Barre de titre */}
        <div style={{
          background: 'linear-gradient(180deg,#f8f9fb,#ebedf2)',
          borderBottom: '1px solid #d9dde5',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff605c', cursor: 'pointer' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd44', cursor: 'pointer' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ca4e', cursor: 'pointer' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Simulation des prix</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag severity="info" value="Ctrl+E CSV" style={{ fontSize: 12 }} />
            <Tag severity="warning" value="Ctrl+P PDF" style={{ fontSize: 12 }} />
          </div>
        </div>

        {/* Corps : Sidebar + poignée + contenu */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 8px 1fr`, height: '100%' }}>
          {/* Sidebar */}
          <aside style={{ background: '#f8f9fb', borderRight: '1px solid #d9dde5', overflow: 'auto', padding: 16 }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Poignée redimensionnable */}
          <div role="separator" aria-orientation="vertical" title="Glisser pour redimensionner" onMouseDown={() => (resizingRef.current = true)} style={{ cursor: 'col-resize', background: '#d9dde5', transition: 'background 0.2s' }} />

          {/* Contenu principal */}
          <main style={{ display: 'grid', gridTemplateRows: '48px 1fr', height: '100%' }}>
            {/* Bandeau module */}
            <div style={{
              background: 'linear-gradient(180deg,#16a085,#0f8b6e)',
              color: '#fff',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="pi pi-calculator" style={{ fontSize: 20 }} />
                <strong style={{ fontSize: 16 }}>Simulation des prix</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Plein écran • Optimisé clavier</div>
            </div>

            {/* Contenu scrollable global */}
            <div style={{ padding: 16, overflowY: 'auto', display: 'grid', gap: 16, height: '100%', maxHeight: 'calc(100% - 48px)' }}>
              {/* Calcul individuel */}
              <Card title="Calcul individuel" style={{
                background: '#fff',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                maxHeight: '250px',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Médicament</label>
                    <Dropdown value={calculIndividuel.idMedicament} options={medicaments.map((m) => ({ label: m.nom, value: m.id }))} onChange={(e) => setCalculIndividuel((s) => ({ ...s, idMedicament: e.value }))} placeholder="Sélectionner" className="p-inputtext-sm" style={{ width: 260 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Prix d’achat (MGA)</label>
                    <InputNumber value={calculIndividuel.prixAchat} onValueChange={(e) => setCalculIndividuel((s) => ({ ...s, prixAchat: e.value || 0 }))} min={0} suffix=" MGA" className="p-inputtext-sm" style={{ width: 260 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Prix concurrent (MGA)</label>
                    <InputNumber value={calculIndividuel.prixConcurrent} onValueChange={(e) => setCalculIndividuel((s) => ({ ...s, prixConcurrent: e.value || 0 }))} min={0} suffix=" MGA" className="p-inputtext-sm" style={{ width: 260 }} />
                  </div>

                  {resultatCalculIndividuel && (
                    <div style={{ marginTop: 8, background: '#f8fafb', border: '1px dashed #d9e0ea', borderRadius: 8, padding: 10, fontSize: 14 }}>
                      <div>Prix HT : <strong>{resultatCalculIndividuel.prixHT.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</strong></div>
                      <div>Prix TTC : <strong>{resultatCalculIndividuel.prixTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</strong></div>
                      <div>Marge : <strong>{resultatCalculIndividuel.margeMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</strong> ({resultatCalculIndividuel.margePourcentage}%)</div>
                      {calculIndividuel.prixConcurrent ? (
                        <div>Position : {resultatCalculIndividuel.prixTTC < calculIndividuel.prixConcurrent * 0.9 ? <Tag value="Compétitif" severity="success" /> : resultatCalculIndividuel.prixTTC > calculIndividuel.prixConcurrent * 1.1 ? <Tag value="Non compétitif" severity="danger" /> : <Tag value="Moyen" severity="warning" />}</div>
                      ) : (
                        <div>Position : <Tag value="N/A" /></div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Simulation globale */}
              <Card title="Simulation globale" style={{
                background: '#fff',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, padding: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Marge globale simulée (%)</label>
                    <InputNumber value={margeGlobaleSimulee} onValueChange={(e) => setMargeGlobaleSimulee(e.value || 0)} min={0} max={100} suffix="%" className="p-inputtext-sm" style={{ width: 180 }} />
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <Tag value={`Impact CA: ${impactCA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`} severity={impactCA >= 0 ? 'success' : 'warning'} />
                  </div>
                </div>
                <div style={{ minHeight: 0 }}>
                  <DataTable value={simulationGlobale} paginator rows={10} rowsPerPageOptions={[10, 20, 50]} scrollable scrollHeight="300px" responsiveLayout="scroll" stripedRows tableStyle={{ fontSize: 14 }} emptyMessage="Aucune donnée disponible">
                    <Column field="nom" header="Médicament" sortable style={{ minWidth: 180 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 180 }} />
                    <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable style={{ minWidth: 140 }} />
                    <Column field="prixVenteActuel" header="Prix actuel" body={(row) => montantBody(row, 'prixVenteActuel')} sortable style={{ minWidth: 140 }} />
                    <Column field="prixVenteSimule" header="Prix simulé" body={(row) => montantBody(row, 'prixVenteSimule')} sortable style={{ minWidth: 140 }} />
                    <Column field="prixConcurrent" header="Prix concurrent" body={(row) => montantBody(row, 'prixConcurrent')} sortable style={{ minWidth: 140 }} />
                    <Column field="margeActuelle" header="Marge actuelle (%)" body={(row) => `${row.margeActuelle}%`} sortable style={{ minWidth: 160 }} />
                    <Column field="margeSimulee" header="Marge simulée (%)" body={(row) => `${row.margeSimulee}%`} sortable style={{ minWidth: 160 }} />
                    <Column field="rentabilite" header="Rentabilité (MGA)" body={(row) => montantBody(row, 'rentabilite')} sortable style={{ minWidth: 160 }} />
                    <Column field="positionConcurrentielle" header="Position" sortable style={{ minWidth: 140 }} />
                  </DataTable>
                </div>
              </Card>

              {/* Analyse comparative */}
              <Card title="Analyse comparative" style={{
                background: '#fff',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                <div style={{ padding: 12 }}>
                  <div className="chart-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ height: '250px' }}>
                      <Chart type="bar" data={chartData.comparaisonPrix} options={chartOptions.comparaisonPrix} style={{ height: '250px', width: '100%' }} />
                    </div>
                    <div style={{ height: '250px' }}>
                      <Chart type="pie" data={chartData.rentabiliteParCategorie} options={chartOptions.rentabiliteParCategorie} style={{ height: '250px', maxWidth: '420px', margin: '0 auto' }} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{ background: '#f0f2f6', borderTop: '1px solid #d9dde5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 13, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Impact CA: {impactCA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        .app-window { transition: all 0.2s ease; }
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus { outline: 2px solid #16a085 !important; outline-offset: 2px; }
        .p-button-sm { padding: 4px 12px !important; }
        .p-inputtext-sm { font-size: 14px !important; }
        .window-body .separator:hover { background: #16a085; }
        .p-card-content { padding: 0 !important; }
        .p-datatable .p-datatable-thead > tr > th, .p-datatable .p-datatable-tbody > tr > td { padding: 8px !important; font-size: 14px !important; }
        .chart-container { grid-template-columns: 1fr 1fr; }
        .p-chart { max-height: 250px !important; width: 100% !important; }
        @media (max-width: 1200px) { 
          .window-body { grid-template-columns: 0 0 1fr !important; } 
          .app-window { height: 100vh !important; border-radius: 0; width: 100vw !important; } 
        }
        @media (max-width: 768px) { 
          .p-datatable .p-datatable-thead > tr > th, .p-datatable .p-datatable-tbody > tr > td { font-size: 13px !important; }
          .p-card { max-height: 300px !important; }
          .p-chart { max-height: 200px !important; }
          .chart-container { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}