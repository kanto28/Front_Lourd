import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import 'chart.js/auto';

export default function PriceMonitoringPage() {
  const toast = useRef(null);

  // --- Mocked data for medications and specific prices ---
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, ventesMensuelles: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, ventesMensuelles: 800 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, ventesMensuelles: 300 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, ventesMensuelles: 50 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, ventesMensuelles: 500 },
  ];

  const prixSpecifiques = [
    {
      id: 'SP-001',
      idMedicament: 'MED-001',
      prixSpecifique: 1500,
      statut: 'Actif',
      dateCreation: new Date('2025-07-01'),
      dateModification: new Date('2025-07-01'),
      raison: 'Promotion saisonnière',
    },
    {
      id: 'SP-002',
      idMedicament: 'MED-002',
      prixSpecifique: 2000,
      statut: 'Inactif',
      dateCreation: new Date('2025-08-01'),
      dateModification: new Date('2025-08-15'),
      raison: 'Ajustement concurrence',
    },
    {
      id: 'SP-003',
      idMedicament: 'MED-003',
      prixSpecifique: 4000,
      statut: 'Actif',
      dateCreation: new Date('2024-12-01'),
      dateModification: new Date('2024-12-01'),
      raison: 'Prix inférieur à la concurrence',
    },
  ];

  // --- Mocked competitor data ---
  const concurrents = medicaments.map((m) => ({
    id: m.id,
    prixConcurrent: m.prixAchat * (1 + (Math.random() * 0.4 + 0.8)), // Variation 80-120%
  }));

  // --- Mocked price history ---
  const historiquePrix = [
    {
      id: 'HIST-001',
      idMedicament: 'MED-001',
      ancienPrix: 1400,
      nouveauPrix: 1500,
      date: new Date('2025-07-01'),
      raison: 'Promotion saisonnière',
      utilisateur: 'Admin',
    },
    {
      id: 'HIST-002',
      idMedicament: 'MED-002',
      ancienPrix: 1800,
      nouveauPrix: 2000,
      date: new Date('2025-08-15'),
      raison: 'Ajustement concurrence',
      utilisateur: 'Admin',
    },
  ];

  // --- Default configuration from PriceConfigurationPage.js ---
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

  // --- State for filters ---
  const [selectedPeriode, setSelectedPeriode] = useState('2025-07');
  const periodes = [
    { label: '2025-07', value: '2025-07' },
    { label: '2025-08', value: '2025-08' },
    { label: '2025-09', value: '2025-09' },
  ];

  // --- Price and margin calculations ---
  const calculerPrixVente = (medicament, prixSpecifique = null) => {
    const marge = configuration.margesParCategorie[medicament.categorie] || configuration.margeGlobale;
    const prixHT = (prixSpecifique || medicament.prixAchat * (1 + marge / 100));
    const prixTTC = prixHT * (1 + configuration.tvaDefaut / 100);
    const prixVente = configuration.regleArrondi === 'À l’euro près' ? Math.round(prixTTC) : prixTTC;
    return {
      prixHT: prixHT.toFixed(2),
      prixTTC: Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum)).toFixed(2),
      margeMGA: (prixHT - medicament.prixAchat).toFixed(2),
      margePourcentage: ((prixHT - medicament.prixAchat) / medicament.prixAchat * 100).toFixed(2),
    };
  };

  // --- Dashboard statistics ---
  const statsGlobales = {
    margeMoyenne: medicaments.reduce((sum, m) => {
      const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
      const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
      return sum + parseFloat(resultat.margePourcentage);
    }, 0) / medicaments.length,
    prixSpecifiquesActifs: prixSpecifiques.filter((p) => p.statut === 'Actif').length,
    repartitionParCategorie: configuration.margesParCategorie
      ? Object.keys(configuration.margesParCategorie).map((cat) => ({
          categorie: cat,
          count: medicaments.filter((m) => m.categorie === cat).length,
        }))
      : [],
    evolutionMarges: periodes.map((p) => ({
      periode: p.value,
      margeMoyenne: medicaments.reduce((sum, m) => {
        const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.dateModification.toISOString().startsWith(p.value));
        const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
        return sum + parseFloat(resultat.margePourcentage);
      }, 0) / medicaments.length,
    })),
  };

  // --- Alerts for abnormal prices ---
  const alertes = medicaments
    .map((m) => {
      const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
      const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
      const prixConcurrent = concurrents.find((c) => c.id === m.id)?.prixConcurrent || 0;
      const derniereModification = prixSpec?.dateModification || new Date('2024-12-01');
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const alertesMedicament = [];
      if (parseFloat(resultat.prixTTC) < m.prixAchat) {
        alertesMedicament.push('Prix de vente inférieur au prix d’achat');
      }
      if (parseFloat(resultat.margePourcentage) < 10) {
        alertesMedicament.push('Marge trop faible (<10%)');
      } else if (parseFloat(resultat.margePourcentage) > 50) {
        alertesMedicament.push('Marge trop élevée (>50%)');
      }
      if (derniereModification < sixMonthsAgo) {
        alertesMedicament.push('Prix non mis à jour depuis 6 mois');
      }
      if (prixConcurrent && Math.abs(parseFloat(resultat.prixTTC) - prixConcurrent) / prixConcurrent > 0.2) {
        alertesMedicament.push('Écart important avec concurrence (>20%)');
      }

      return alertesMedicament.length > 0 ? { ...m, alertes: alertesMedicament } : null;
    })
    .filter((item) => item);

  // --- Analysis data ---
  const analyse = {
    topRentables: medicaments
      .map((m) => {
        const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
        const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
        return {
          ...m,
          rentabilite: (parseFloat(resultat.prixTTC) - m.prixAchat) * m.ventesMensuelles,
        };
      })
      .sort((a, b) => b.rentabilite - a.rentabilite)
      .slice(0, 3),
    margeFaible: medicaments
      .map((m) => {
        const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
        const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
        return { ...m, margePourcentage: parseFloat(resultat.margePourcentage) };
      })
      .filter((m) => m.margePourcentage < 15),
    impactPrixSpecifiques: prixSpecifiques
      .filter((p) => p.statut === 'Actif')
      .map((p) => {
        const medicament = medicaments.find((m) => m.id === p.idMedicament);
        const resultatNormal = calculerPrixVente(medicament);
        const resultatSpecifique = calculerPrixVente(medicament, p.prixSpecifique);
        return {
          ...medicament,
          impactMGA: (parseFloat(resultatSpecifique.prixTTC) - parseFloat(resultatNormal.prixTTC)) * medicament.ventesMensuelles,
        };
      }),
    tendancesPrix: periodes.map((p) => ({
      periode: p.value,
      prixMoyen: medicaments.reduce((sum, m) => {
        const prixSpec = prixSpecifiques.find((ps) => ps.idMedicament === m.id && ps.dateModification.toISOString().startsWith(p.value));
        const resultat = calculerPrixVente(m, prixSpec?.prixSpecifique);
        return sum + parseFloat(resultat.prixTTC);
      }, 0) / medicaments.length,
    })),
  };

  // --- Chart data ---
  const chartData = {
    evolutionMarges: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: 'Marge moyenne (%)',
          data: statsGlobales.evolutionMarges.map((e) => e.margeMoyenne),
          fill: false,
          borderColor: '#3498db',
          tension: 0.4,
        },
      ],
    },
    repartitionCategorie: {
      labels: statsGlobales.repartitionParCategorie.map((c) => c.categorie),
      datasets: [
        {
          data: statsGlobales.repartitionParCategorie.map((c) => c.count),
          backgroundColor: ['#3498db', '#16a085', '#e74c3c', '#f1c40f', '#2ecc71'],
        },
      ],
    },
  };

  const chartOptions = {
    evolutionMarges: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Marge (%)' } } },
    },
    repartitionCategorie: {
      plugins: { legend: { position: 'right' } },
    },
  };

  // --- Export reports ---
  const exporterRapport = (type) => {
    if (type === 'Excel') {
      let csvContent;
      switch (type) {
        case 'Excel':
          csvContent = [
            ['Rapport', 'Période', selectedPeriode],
            [''],
            ['Statistiques globales'],
            ['Marge moyenne', `${statsGlobales.margeMoyenne.toFixed(2)}%`],
            ['Prix spécifiques actifs', statsGlobales.prixSpecifiquesActifs],
            [''],
            ['Répartition par catégorie'],
            ...statsGlobales.repartitionParCategorie.map((c) => [c.categorie, c.count].join(',')),
            [''],
            ['Alertes'],
            ...alertes.map((a) => [a.nom, a.alertes.join('; ')].join(',')),
            [''],
            ['Top 3 médicaments rentables'],
            ...analyse.topRentables.map((m) => [m.nom, m.rentabilite.toLocaleString('fr-FR')].join(',')),
            [''],
            ['Produits à marge faible'],
            ...analyse.margeFaible.map((m) => [m.nom, `${m.margePourcentage}%`].join(',')),
            [''],
            ['Impact prix spécifiques'],
            ...analyse.impactPrixSpecifiques.map((m) => [m.nom, m.impactMGA.toLocaleString('fr-FR')].join(',')),
            [''],
            ['Historique des modifications'],
            ...historiquePrix.map((h) => [
              h.id,
              medicaments.find((m) => m.id === h.idMedicament)?.nom || 'N/A',
              h.ancienPrix.toLocaleString('fr-FR'),
              h.nouveauPrix.toLocaleString('fr-FR'),
              h.date.toLocaleDateString('fr-FR'),
              h.raison,
              h.utilisateur,
            ].join(',')),
          ].join('\n');
          break;
        default:
          return;
      }
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_prix_${selectedPeriode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Rapport exporté en CSV.' });
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Rapport de Monitoring des Prix - ${selectedPeriode}`, 20, 20);
      doc.setFontSize(12);
      let y = 30;
      doc.text('Statistiques globales', 20, y);
      y += 10;
      doc.text(`Marge moyenne: ${statsGlobales.margeMoyenne.toFixed(2)}%`, 20, y);
      y += 10;
      doc.text(`Prix spécifiques actifs: ${statsGlobales.prixSpecifiquesActifs}`, 20, y);
      y += 10;
      doc.text('Répartition par catégorie:', 20, y);
      y += 10;
      statsGlobales.repartitionParCategorie.forEach((c) => {
        doc.text(`${c.categorie}: ${c.count}`, 20, y);
        y += 10;
      });
      doc.text('Alertes:', 20, y);
      y += 10;
      alertes.forEach((a) => {
        doc.text(`${a.nom}: ${a.alertes.join(', ')}`, 20, y);
        y += 10;
      });
      doc.text('Top 3 médicaments rentables:', 20, y);
      y += 10;
      analyse.topRentables.forEach((m) => {
        doc.text(`${m.nom}: ${m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
      });
      doc.text('Produits à marge faible:', 20, y);
      y += 10;
      analyse.margeFaible.forEach((m) => {
        doc.text(`${m.nom}: ${m.margePourcentage}%`, 20, y);
        y += 10;
      });
      doc.text('Impact prix spécifiques:', 20, y);
      y += 10;
      analyse.impactPrixSpecifiques.forEach((m) => {
        doc.text(`${m.nom}: ${m.impactMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
      });
      doc.text('Historique des modifications:', 20, y);
      y += 10;
      historiquePrix.forEach((h) => {
        doc.text(
          `${h.id}: ${medicaments.find((m) => m.id === h.idMedicament)?.nom || 'N/A'} - ${h.ancienPrix.toLocaleString('fr-FR')} → ${h.nouveauPrix.toLocaleString('fr-FR')} (${h.raison})`,
          20,
          y
        );
        y += 10;
      });
      doc.save(`rapport_prix_${selectedPeriode}.pdf`);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Rapport exporté en PDF.' });
    }
  };

  // --- Render columns ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const pourcentageBody = (row, field) => `${row[field]}%`;
  const dateBody = (row, field) => row[field].toLocaleDateString('fr-FR');
  const alertesBody = (row) => row.alertes.map((a, i) => <Tag key={i} value={a} severity="warning" style={{ marginRight: 4 }} />);

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Monitoring et Rapports de Prix</span>
      <Dropdown
        value={selectedPeriode}
        options={periodes}
        onChange={(e) => setSelectedPeriode(e.value)}
        style={{ width: '140px' }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterRapport('Excel')} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterRapport('PDF')} className="p-button-outlined" />
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
          <i className="pi pi-chart-line" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Monitoring et Rapports de Prix</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dashboard */}
          <Card
            title={`Tableau de Bord - ${selectedPeriode}`}
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p><strong>Marge moyenne réalisée :</strong> {statsGlobales.margeMoyenne.toFixed(2)}%</p>
                <p><strong>Prix spécifiques actifs :</strong> {statsGlobales.prixSpecifiquesActifs}</p>
                <p><strong>Répartition par catégorie :</strong></p>
                <ul>
                  {statsGlobales.repartitionParCategorie.map((c) => (
                    <li key={c.categorie}>{c.categorie}: {c.count}</li>
                  ))}
                </ul>
              </div>
              <Chart type="line" data={chartData.evolutionMarges} options={chartOptions.evolutionMarges} style={{ maxWidth: 600 }} />
              <Chart type="pie" data={chartData.repartitionCategorie} options={chartOptions.repartitionCategorie} style={{ maxWidth: 400 }} />
            </div>
          </Card>

          {/* Alerts */}
          <Card
            title="Alertes de Prix Anormaux"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <DataTable value={alertes} responsiveLayout="scroll" emptyMessage="Aucune alerte">
              <Column field="nom" header="Médicament" sortable />
              <Column field="categorie" header="Catégorie" sortable />
              <Column field="alertes" header="Alertes" body={alertesBody} />
            </DataTable>
          </Card>

          {/* Analysis */}
          <Card
            title="Analyses des Prix"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p><strong>Top 3 médicaments rentables :</strong></p>
                <ul>
                  {analyse.topRentables.map((m) => (
                    <li key={m.id}>{m.nom}: {m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p><strong>Produits à marge faible :</strong></p>
                <ul>
                  {analyse.margeFaible.map((m) => (
                    <li key={m.id}>{m.nom}: {m.margePourcentage}%</li>
                  ))}
                </ul>
              </div>
              <div>
                <p><strong>Impact des prix spécifiques :</strong></p>
                <ul>
                  {analyse.impactPrixSpecifiques.map((m) => (
                    <li key={m.id}>{m.nom}: {m.impactMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                  ))}
                </ul>
              </div>
              <p><strong>Tendances de prix (moyen par période) :</strong></p>
              <DataTable value={analyse.tendancesPrix} responsiveLayout="scroll" emptyMessage="Aucune donnée">
                <Column field="periode" header="Période" sortable />
                <Column field="prixMoyen" header="Prix moyen" body={(row) => montantBody(row, 'prixMoyen')} sortable />
              </DataTable>
            </div>
          </Card>

          {/* Price history */}
          <Card
            title="Historique des Modifications"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <DataTable value={historiquePrix} responsiveLayout="scroll" emptyMessage="Aucun historique">
              <Column field="id" header="ID" sortable />
              <Column field="idMedicament" header="Médicament" body={(row) => medicaments.find((m) => m.id === row.idMedicament)?.nom || 'N/A'} sortable />
              <Column field="ancienPrix" header="Ancien prix" body={(row) => montantBody(row, 'ancienPrix')} sortable />
              <Column field="nouveauPrix" header="Nouveau prix" body={(row) => montantBody(row, 'nouveauPrix')} sortable />
              <Column field="date" header="Date" body={(row) => dateBody(row, 'date')} sortable />
              <Column field="raison" header="Raison" sortable />
              <Column field="utilisateur" header="Utilisateur" sortable />
            </DataTable>
          </Card>
        </main>
      </div>

      {/* Responsive inline styles */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}