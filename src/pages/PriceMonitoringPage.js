import React, { useState, useRef, useMemo, useEffect } from 'react';
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

/**
 * PriceMonitoringPage — Style "client lourd"
 * - Fenêtre desktop avec barre de titre ● ● ● et barre d’état.
 * - Panneaux scrollables, mise en page dense pour poste fixe.
 * - Raccourcis clavier: Ctrl+E (export Excel/CSV), Ctrl+P (export PDF).
 */
export default function PriceMonitoringPage() {
  const toast = useRef(null);

  // --- Données mockées (identiques au snippet utilisateur) ---
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000, ventesMensuelles: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500, ventesMensuelles: 800 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000, ventesMensuelles: 300 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000, ventesMensuelles: 50 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000, ventesMensuelles: 500 },
  ];

  const prixSpecifiques = [
    { id: 'SP-001', idMedicament: 'MED-001', prixSpecifique: 1500, statut: 'Actif', dateCreation: new Date('2025-07-01'), dateModification: new Date('2025-07-01'), raison: 'Promotion saisonnière' },
    { id: 'SP-002', idMedicament: 'MED-002', prixSpecifique: 2000, statut: 'Inactif', dateCreation: new Date('2025-08-01'), dateModification: new Date('2025-08-15'), raison: 'Ajustement concurrence' },
    { id: 'SP-003', idMedicament: 'MED-003', prixSpecifique: 4000, statut: 'Actif', dateCreation: new Date('2024-12-01'), dateModification: new Date('2024-12-01'), raison: 'Prix inférieur à la concurrence' },
  ];

  const concurrents = medicaments.map((m) => ({ id: m.id, prixConcurrent: m.prixAchat * (1 + (Math.random() * 0.4 + 0.8)) }));

  const historiquePrix = [
    { id: 'HIST-001', idMedicament: 'MED-001', ancienPrix: 1400, nouveauPrix: 1500, date: new Date('2025-07-01'), raison: 'Promotion saisonnière', utilisateur: 'Admin' },
    { id: 'HIST-002', idMedicament: 'MED-002', ancienPrix: 1800, nouveauPrix: 2000, date: new Date('2025-08-15'), raison: 'Ajustement concurrence', utilisateur: 'Admin' },
  ];

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

  // --- Filtres ---
  const periodes = [
    { label: '2025-07', value: '2025-07' },
    { label: '2025-08', value: '2025-08' },
    { label: '2025-09', value: '2025-09' },
  ];
  const [selectedPeriode, setSelectedPeriode] = useState(periodes[0].value);

  // --- Calculs prix & marges ---
  const calculerPrixVente = (medicament, prixSpecifique = null) => {
    const marge = configuration.margesParCategorie[medicament.categorie] || configuration.margeGlobale;
    const prixHT = (prixSpecifique || medicament.prixAchat * (1 + marge / 100));
    const prixTTC = prixHT * (1 + configuration.tvaDefaut / 100);
    const prixVente = configuration.regleArrondi === 'À l’euro près' ? Math.round(prixTTC) : prixTTC;
    return {
      prixHT: prixHT.toFixed(2),
      prixTTC: Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum)).toFixed(2),
      margeMGA: (prixHT - medicament.prixAchat).toFixed(2),
      margePourcentage: (((prixHT - medicament.prixAchat) / medicament.prixAchat) * 100).toFixed(2),
    };
  };

  // --- Stats globales ---
  const statsGlobales = useMemo(() => ({
    margeMoyenne: medicaments.reduce((sum, m) => {
      const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
      const r = calculerPrixVente(m, prixSpec?.prixSpecifique);
      return sum + parseFloat(r.margePourcentage);
    }, 0) / medicaments.length,
    prixSpecifiquesActifs: prixSpecifiques.filter((p) => p.statut === 'Actif').length,
    repartitionParCategorie: Object.keys(configuration.margesParCategorie).map((cat) => ({
      categorie: cat,
      count: medicaments.filter((m) => m.categorie === cat).length,
    })),
    evolutionMarges: periodes.map((p) => ({
      periode: p.value,
      margeMoyenne: medicaments.reduce((sum, m) => {
        const prixSpec = prixSpecifiques.find((ps) => ps.idMedicament === m.id && ps.dateModification.toISOString().startsWith(p.value));
        const r = calculerPrixVente(m, prixSpec?.prixSpecifique);
        return sum + parseFloat(r.margePourcentage);
      }, 0) / medicaments.length,
    })),
  }), [medicaments, prixSpecifiques, periodes]);

  // --- Alertes ---
  const alertes = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return medicaments
      .map((m) => {
        const prixSpec = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
        const r = calculerPrixVente(m, prixSpec?.prixSpecifique);
        const prixConcurrent = concurrents.find((c) => c.id === m.id)?.prixConcurrent || 0;
        const derniereModification = prixSpec?.dateModification || new Date('2024-12-01');

        const list = [];
        if (parseFloat(r.prixTTC) < m.prixAchat) list.push('Prix de vente < prix d’achat');
        const mp = parseFloat(r.margePourcentage);
        if (mp < 10) list.push('Marge trop faible (<10%)');
        else if (mp > 50) list.push('Marge trop élevée (>50%)');
        if (derniereModification < sixMonthsAgo) list.push('Prix non mis à jour (6 mois)');
        if (prixConcurrent && Math.abs(parseFloat(r.prixTTC) - prixConcurrent) / prixConcurrent > 0.2) list.push('Écart concurrence >20%');
        return list.length ? { ...m, alertes: list } : null;
      })
      .filter(Boolean);
  }, [medicaments, prixSpecifiques, concurrents]);

  // --- Analyses ---
  const analyse = useMemo(() => ({
    topRentables: medicaments
      .map((m) => {
        const ps = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
        const r = calculerPrixVente(m, ps?.prixSpecifique);
        return { ...m, rentabilite: (parseFloat(r.prixTTC) - m.prixAchat) * m.ventesMensuelles };
      })
      .sort((a, b) => b.rentabilite - a.rentabilite)
      .slice(0, 3),
    margeFaible: medicaments
      .map((m) => {
        const ps = prixSpecifiques.find((p) => p.idMedicament === m.id && p.statut === 'Actif');
        const r = calculerPrixVente(m, ps?.prixSpecifique);
        return { ...m, margePourcentage: parseFloat(r.margePourcentage) };
      })
      .filter((m) => m.margePourcentage < 15),
    impactPrixSpecifiques: prixSpecifiques
      .filter((p) => p.statut === 'Actif')
      .map((p) => {
        const med = medicaments.find((m) => m.id === p.idMedicament);
        const rNormal = calculerPrixVente(med);
        const rSpec = calculerPrixVente(med, p.prixSpecifique);
        return { ...med, impactMGA: (parseFloat(rSpec.prixTTC) - parseFloat(rNormal.prixTTC)) * med.ventesMensuelles };
      }),
    tendancesPrix: periodes.map((p) => ({
      periode: p.value,
      prixMoyen: medicaments.reduce((sum, m) => {
        const ps = prixSpecifiques.find((x) => x.idMedicament === m.id && x.dateModification.toISOString().startsWith(p.value));
        const r = calculerPrixVente(m, ps?.prixSpecifique);
        return sum + parseFloat(r.prixTTC);
      }, 0) / medicaments.length,
    })),
  }), [medicaments, prixSpecifiques, periodes]);

  // --- Graphiques ---
  const chartData = useMemo(() => ({
    evolutionMarges: {
      labels: periodes.map((p) => p.label),
      datasets: [{ label: 'Marge moyenne (%)', data: statsGlobales.evolutionMarges.map((e) => e.margeMoyenne), fill: false, borderColor: '#3498db', tension: 0.4 }],
    },
    repartitionCategorie: {
      labels: statsGlobales.repartitionParCategorie.map((c) => c.categorie),
      datasets: [{ data: statsGlobales.repartitionParCategorie.map((c) => c.count), backgroundColor: ['#3498db', '#16a085', '#e74c3c', '#f1c40f', '#2ecc71'] }],
    },
  }), [periodes, statsGlobales]);

  const chartOptions = {
    evolutionMarges: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Marge (%)' } } } },
    repartitionCategorie: { plugins: { legend: { position: 'right' } } },
  };

  // --- Export ---
  const exporterRapport = (type) => {
    if (type === 'Excel') {
      const rows = [
        ['Rapport', 'Période', selectedPeriode].join(','),
        [''],
        ['Statistiques globales'],
        ['Marge moyenne', `${statsGlobales.margeMoyenne.toFixed(2)}%`].join(','),
        ['Prix spécifiques actifs', statsGlobales.prixSpecifiquesActifs].join(','),
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
      ];
      const csvContent = rows.join('\n');
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
      const addLine = (t) => { doc.text(t, 20, y); y += 8; };
      addLine('Statistiques globales');
      addLine(`Marge moyenne: ${statsGlobales.margeMoyenne.toFixed(2)}%`);
      addLine(`Prix spécifiques actifs: ${statsGlobales.prixSpecifiquesActifs}`);
      addLine('Répartition par catégorie:');
      statsGlobales.repartitionParCategorie.forEach((c) => addLine(`${c.categorie}: ${c.count}`));
      addLine('Alertes:');
      alertes.forEach((a) => addLine(`${a.nom}: ${a.alertes.join(', ')}`));
      addLine('Top 3 médicaments rentables:');
      analyse.topRentables.forEach((m) => addLine(`${m.nom}: ${m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`));
      addLine('Produits à marge faible:');
      analyse.margeFaible.forEach((m) => addLine(`${m.nom}: ${m.margePourcentage}%`));
      addLine('Impact prix spécifiques:');
      analyse.impactPrixSpecifiques.forEach((m) => addLine(`${m.nom}: ${m.impactMGA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`));
      addLine('Historique des modifications:');
      historiquePrix.forEach((h) => addLine(`${h.id}: ${medicaments.find((m) => m.id === h.idMedicament)?.nom || 'N/A'} - ${h.ancienPrix.toLocaleString('fr-FR')} → ${h.nouveauPrix.toLocaleString('fr-FR')} (${h.raison})`));
      doc.save(`rapport_prix_${selectedPeriode}.pdf`);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Rapport exporté en PDF.' });
    }
  };

  // --- Raccourcis clavier ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); exporterRapport('Excel'); }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); exporterRapport('PDF'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPeriode, statsGlobales, alertes, analyse]);

  // --- Colonnes & helpers ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const dateBody = (row, field) => row[field].toLocaleDateString('fr-FR');
  const alertesBody = (row) => row.alertes.map((a, i) => <Tag key={i} value={a} severity="warning" style={{ marginRight: 4 }} />);

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Monitoring et Rapports de Prix</span>
      <Dropdown value={selectedPeriode} options={periodes} onChange={(e) => setSelectedPeriode(e.value)} style={{ width: 140 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterRapport('Excel')} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterRapport('PDF')} className="p-button-outlined" />
    </div>
  );

  // --- Rendu principal (fenêtre client lourd) ---
  return (
    <div style={{ fontFamily: 'Inter,Segoe UI', background: '#e6e9ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Toast ref={toast} />
      <div className="app-window" style={{ width: 'min(1400px,100vw)', height: 'min(900px,100vh)', background: '#f7f8fb', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,0.18)', display: 'grid', gridTemplateRows: '44px 1fr 28px' }}>
        {/* Barre de titre */}
        <div style={{ background: 'linear-gradient(180deg,#fdfdfd,#f1f3f7)', borderBottom: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Monitoring des prix</div>
        </div>

        {/* Contenu */}
        <div style={{ display: 'flex', minHeight: 0 }}>
          <Sidebar title="Modules" />
          <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
            {/* Dashboard */}
            <Card style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p><strong>Marge moyenne réalisée :</strong> {statsGlobales.margeMoyenne.toFixed(2)}%</p>
                  <p><strong>Prix spécifiques actifs :</strong> {statsGlobales.prixSpecifiquesActifs}</p>
                  <p><strong>Répartition par catégorie :</strong></p>
                  <ul style={{ marginTop: 6 }}>
                    {statsGlobales.repartitionParCategorie.map((c) => (
                      <li key={c.categorie}>{c.categorie}: {c.count}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Chart type="line" data={chartData.evolutionMarges} options={chartOptions.evolutionMarges} />
                </div>
                <div>
                  <Chart type="pie" data={chartData.repartitionCategorie} options={chartOptions.repartitionCategorie} />
                </div>
              </div>
            </Card>

            {/* Alertes */}
            <Card title="Alertes de Prix Anormaux" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
              <DataTable value={alertes} responsiveLayout="scroll" emptyMessage="Aucune alerte">
                <Column field="nom" header="Médicament" sortable />
                <Column field="categorie" header="Catégorie" sortable />
                <Column field="alertes" header="Alertes" body={alertesBody} />
              </DataTable>
            </Card>

            {/* Analyses */}
            <Card title="Analyses des Prix" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p><strong>Top 3 médicaments rentables :</strong></p>
                  <ul>
                    {analyse.topRentables.map((m) => (
                      <li key={m.id}>{m.nom}: {m.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                    ))}
                  </ul>
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
                  <p style={{ marginTop: 8 }}><strong>Tendances de prix (moyen par période) :</strong></p>
                  <DataTable value={analyse.tendancesPrix} responsiveLayout="scroll" emptyMessage="Aucune donnée" scrollable scrollHeight="200px">
                    <Column field="periode" header="Période" sortable />
                    <Column field="prixMoyen" header="Prix moyen" body={(row) => montantBody(row, 'prixMoyen')} sortable />
                  </DataTable>
                </div>
              </div>
            </Card>

            {/* Historique */}
            <Card title="Historique des Modifications" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
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

        {/* Barre d’état */}
        <footer style={{ background: '#eef1f6', borderTop: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: '#2f3b52' }}>
          <span>État: prêt — Raccourcis: Ctrl+E (CSV), Ctrl+P (PDF)</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
