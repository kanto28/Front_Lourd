import React, { useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Chart } from 'primereact/chart';
import { Card } from 'primereact/card';
import { jsPDF } from 'jspdf';
import 'chart.js/auto';
import Sidebar from '../components/Sidebar';

export default function ReportsAnalyticsPage() {
  const toast = useRef(null);

  // --- Données mockées (cohérentes avec PayrollPage.js, ExpensesPage.js, SalesReportsPage.js) ---
  const salaires = [
    { id: 'SAL-2025-001', id_personne: 1, nom: 'Jean Rakoto', periode: '2025-07', salaireNet: 1030000, statut: 'Payé' },
    { id: 'SAL-2025-002', id_personne: 2, nom: 'Marie Raso', periode: '2025-07', salaireNet: 790000, statut: 'Payé' },
    { id: 'SAL-2025-003', id_personne: 1, nom: 'Jean Rakoto', periode: '2025-08', salaireNet: 1061250, statut: 'En attente' },
  ];

  const depenses = [
    {
      id: 'DEP-2025-001',
      montant: 450000,
      description: 'Facture électricité juillet',
      date: '2025-07-15',
      categorie: 'Électricité',
      fournisseur: { id: 1, nom: 'ElectroMad' },
      statut: 'Payé',
      budgetPrevu: 500000,
      budgetRealise: 450000,
    },
    {
      id: 'DEP-2025-002',
      montant: 180000,
      description: 'Abonnement internet août',
      date: '2025-08-01',
      categorie: 'Téléphone/Internet',
      fournisseur: null,
      statut: 'En attente',
      budgetPrevu: 150000,
      budgetRealise: 180000,
    },
    {
      id: 'DEP-2025-003',
      montant: 1100000,
      description: 'Loyer pharmacie septembre',
      date: '2025-09-01',
      categorie: 'Loyer',
      fournisseur: null,
      statut: 'En attente',
      budgetPrevu: 1000000,
      budgetRealise: 1100000,
    },
  ];

  const ventes = [
    { id: 'VTE-2025-001', date: '2025-07-12', montant: 15000, periode: '2025-07' },
    { id: 'VTE-2025-002', date: '2025-08-01', montant: 24000, periode: '2025-08' },
    { id: 'VTE-2025-003', date: '2025-09-01', montant: 9000, periode: '2025-09' },
  ];

  const periodes = ['2025-07', '2025-08', '2025-09'].map((p) => ({ label: p, value: p }));
  const [selectedPeriode, setSelectedPeriode] = useState(periodes[0].value);
  const [rapportType, setRapportType] = useState('Masse Salariale');

  // --- Calculs pour les rapports ---
  const masseSalariale = useMemo(() => ({
    details: salaires.filter((s) => s.periode === selectedPeriode),
    totalParEmploye: salaires
      .filter((s) => s.periode === selectedPeriode)
      .reduce((acc, s) => {
        acc[s.nom] = (acc[s.nom] || 0) + s.salaireNet;
        return acc;
      }, {}),
    chargesSociales: salaires
      .filter((s) => s.periode === selectedPeriode)
      .reduce((sum, s) => sum + s.salaireNet * 0.2, 0), // 20% charges sociales
    evolution: periodes.map((p) => ({
      periode: p.value,
      total: salaires.filter((s) => s.periode === p.value).reduce((sum, s) => sum + s.salaireNet, 0),
    })),
    coutMoyen: salaires.reduce((sum, s) => sum + s.salaireNet, 0) / salaires.length / periodes.length,
  }), [selectedPeriode]);

  const autresDepenses = useMemo(() => ({
    parCategorie: depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((acc, d) => {
        acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
        return acc;
      }, {}),
    parFournisseur: depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((acc, d) => {
        const key = d.fournisseur ? d.fournisseur.nom : 'N/A';
        acc[key] = (acc[key] || 0) + d.montant;
        return acc;
      }, {}),
    comparaisonBudget: depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((acc, d) => {
        acc[d.categorie] = {
          budgetPrevu: d.budgetPrevu,
          budgetRealise: d.budgetRealise,
          depassement: d.budgetRealise > d.budgetPrevu ? d.budgetRealise - d.budgetPrevu : 0,
        };
        return acc;
      }, {}),
    exceptionnelles: depenses
      .filter((d) => d.date.startsWith(selectedPeriode) && d.montant > 500000) // Exemple seuil
      .map((d) => ({ id: d.id, description: d.description, montant: d.montant, categorie: d.categorie })),
    tendances: periodes.map((p) => ({
      periode: p.value,
      total: depenses.filter((d) => d.date.startsWith(p.value)).reduce((sum, d) => sum + d.montant, 0),
    })),
  }), [selectedPeriode]);

  const globalRapport = useMemo(() => {
    const totalSalaires = salaires
      .filter((s) => s.periode === selectedPeriode)
      .reduce((sum, s) => sum + s.salaireNet, 0);
    const totalDepenses = depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((sum, d) => sum + d.montant, 0);
    const chiffreAffaires = ventes
      .filter((v) => v.periode === selectedPeriode)
      .reduce((sum, v) => sum + v.montant, 0);
    const salairesCA = chiffreAffaires ? (totalSalaires / chiffreAffaires) * 100 : 0;

    return {
      totalDepenses: totalSalaires + totalDepenses,
      repartition: {
        salaires: totalSalaires,
        autres: totalDepenses,
      },
      ratios: {
        salairesCA: salairesCA.toFixed(2),
      },
      rentabilite: chiffreAffaires - (totalSalaires + totalDepenses),
      recommandations: [
        masseSalariale.chargesSociales > 500000
          ? 'Optimiser la gestion des heures supplémentaires pour réduire les charges sociales.'
          : '',
        autresDepenses.exceptionnelles.length > 0
          ? 'Examiner les dépenses exceptionnelles pour identifier des économies potentielles.'
          : '',
        salairesCA > 50 ? 'Réduire les coûts salariaux ou augmenter le chiffre d’affaires.' : '',
      ].filter((r) => r),
    };
  }, [selectedPeriode, masseSalariale, autresDepenses]);

  // --- Prévisions budgétaires ---
  const previsions = useMemo(() => {
    const moyenneSalaires = salaires.reduce((sum, s) => sum + s.salaireNet, 0) / periodes.length;
    const moyenneDepenses = depenses.reduce((sum, d) => sum + d.montant, 0) / periodes.length;
    return {
      prochainePeriode: `${parseInt(selectedPeriode.split('-')[0]) + (parseInt(selectedPeriode.split('-')[1]) === 12 ? 1 : 0)}-${String(
        (parseInt(selectedPeriode.split('-')[1]) % 12) + 1
      ).padStart(2, '0')}`,
      salaireEstime: moyenneSalaires * 1.05, // +5% inflation
      depensesEstime: moyenneDepenses * 1.05,
    };
  }, [selectedPeriode]);

  // --- Graphiques ---
  const chartData = {
    evolutionSalariale: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: 'Masse salariale',
          data: masseSalariale.evolution.map((e) => e.total),
          fill: false,
          borderColor: '#3498db',
          tension: 0.4,
        },
      ],
    },
    tendancesDepenses: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: 'Autres dépenses',
          data: autresDepenses.tendances.map((t) => t.total),
          fill: false,
          borderColor: '#16a085',
          tension: 0.4,
        },
      ],
    },
    repartitionCouts: {
      labels: ['Salaires', 'Autres dépenses'],
      datasets: [
        {
          data: [globalRapport.repartition.salaires, globalRapport.repartition.autres],
          backgroundColor: ['#3498db', '#16a085'],
        },
      ],
    },
  };

  const chartOptions = {
    evolutionSalariale: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
    tendancesDepenses: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
    repartitionCouts: {
      plugins: { legend: { position: 'right' } },
    },
  };

  // --- Actions ---
  const exportRapport = (format) => {
    if (format === 'Excel') {
      const csvContent = [
        ['Rapport', rapportType, 'Période', selectedPeriode],
        [''],
        rapportType === 'Masse Salariale'
          ? [
              ['ID', 'Employé', 'Salaire Net', 'Statut'].join(','),
              ...masseSalariale.details.map((s) =>
                [s.id, s.nom, s.salaireNet.toLocaleString('fr-FR'), s.statut].join(',')
              ),
              [''],
              ['Total par employé'],
              ...Object.entries(masseSalariale.totalParEmploye).map(([nom, total]) =>
                [nom, total.toLocaleString('fr-FR')].join(',')
              ),
              [''],
              ['Charges sociales', masseSalariale.chargesSociales.toLocaleString('fr-FR')],
              ['Coût moyen par employé', masseSalariale.coutMoyen.toLocaleString('fr-FR')],
            ]
          : rapportType === 'Autres Dépenses'
          ? [
              ['ID', 'Description', 'Montant', 'Catégorie', 'Fournisseur', 'Statut'].join(','),
              ...autresDepenses.exceptionnelles.map((d) =>
                [d.id, d.description, d.montant.toLocaleString('fr-FR'), d.categorie, d.fournisseur?.nom || 'N/A', d.statut].join(',')
              ),
              [''],
              ['Dépenses par catégorie'],
              ...Object.entries(autresDepenses.parCategorie).map(([cat, montant]) =>
                [cat, montant.toLocaleString('fr-FR')].join(',')
              ),
              [''],
              ['Dépenses par fournisseur'],
              ...Object.entries(autresDepenses.parFournisseur).map(([f, montant]) =>
                [f, montant.toLocaleString('fr-FR')].join(',')
              ),
            ]
          : [
              ['Total des dépenses', globalRapport.totalDepenses.toLocaleString('fr-FR')],
              ['Salaires', globalRapport.repartition.salaires.toLocaleString('fr-FR')],
              ['Autres dépenses', globalRapport.repartition.autres.toLocaleString('fr-FR')],
              [''],
              ['Ratios financiers'],
              ['Salaires/CA', `${globalRapport.ratios.salairesCA}%`],
              ['Rentabilité', globalRapport.rentabilite.toLocaleString('fr-FR')],
              [''],
              ['Recommandations'],
              ...globalRapport.recommandations,
            ],
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${rapportType}_${selectedPeriode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: `Rapport ${rapportType} exporté en CSV.` });
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Rapport ${rapportType} - ${selectedPeriode}`, 20, 20);
      doc.setFontSize(12);
      let y = 30;
      if (rapportType === 'Masse Salariale') {
        doc.text('Détails des salaires', 20, y);
        y += 10;
        masseSalariale.details.forEach((s) => {
          doc.text(`${s.id}: ${s.nom} - ${s.salaireNet.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (${s.statut})`, 20, y);
          y += 10;
        });
        doc.text(`Charges sociales: ${masseSalariale.chargesSociales.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
        doc.text(`Coût moyen par employé: ${masseSalariale.coutMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
      } else if (rapportType === 'Autres Dépenses') {
        doc.text('Dépenses exceptionnelles', 20, y);
        y += 10;
        autresDepenses.exceptionnelles.forEach((d) => {
          doc.text(`${d.id}: ${d.description} - ${d.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (${d.categorie})`, 20, y);
          y += 10;
        });
        doc.text('Dépenses par catégorie', 20, y);
        y += 10;
        Object.entries(autresDepenses.parCategorie).forEach(([cat, montant]) => {
          doc.text(`${cat}: ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
          y += 10;
        });
      } else {
        doc.text(`Total des dépenses: ${globalRapport.totalDepenses.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
        doc.text(`Salaires: ${globalRapport.repartition.salaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
        doc.text(`Autres dépenses: ${globalRapport.repartition.autres.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
        doc.text(`Rentabilité: ${globalRapport.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
        y += 10;
        doc.text('Recommandations:', 20, y);
        y += 10;
        globalRapport.recommandations.forEach((r) => {
          doc.text(r, 20, y);
          y += 10;
        });
      }
      doc.save(`rapport_${rapportType}_${selectedPeriode}.pdf`);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: `Rapport ${rapportType} exporté en PDF.` });
    }
  };

  const programmerRapport = () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Programmation',
      detail: `Simulation : Rapport ${rapportType} programmé pour ${selectedPeriode}.`,
    });
  };

  const envoyerEmail = () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Envoi',
      detail: `Simulation : Rapport ${rapportType} envoyé par email.`,
    });
  };

  const archiverRapport = () => {
    toast.current?.show({
      severity: 'success',
      summary: 'Archivage',
      detail: `Simulation : Rapport ${rapportType} archivé.`,
    });
  };

  // --- Rendu colonnes ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Rapports et Analytique</span>
      <Dropdown
        value={rapportType}
        options={['Masse Salariale', 'Autres Dépenses', 'Global'].map((t) => ({ label: t, value: t }))}
        onChange={(e) => setRapportType(e.value)}
        style={{ width: 200 }}
      />
      <Dropdown
        value={selectedPeriode}
        options={periodes}
        onChange={(e) => setSelectedPeriode(e.value)}
        style={{ width: 140 }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exportRapport('Excel')} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exportRapport('PDF')} className="p-button-outlined" />
      <Button label="Programmer" icon="pi pi-clock" onClick={programmerRapport} className="p-button-outlined" />
      <Button label="Envoyer par email" icon="pi pi-envelope" onClick={envoyerEmail} className="p-button-outlined" />
      <Button label="Archiver" icon="pi pi-folder" onClick={archiverRapport} className="p-button-outlined" />
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
          <i className="pi pi-chart-bar" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Rapports et Analytique</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title={`Rapport ${rapportType} - ${selectedPeriode}`}
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            {rapportType === 'Masse Salariale' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DataTable
                  value={masseSalariale.details}
                  responsiveLayout="scroll"
                  emptyMessage="Aucun salaire pour cette période"
                >
                  <Column field="id" header="ID" sortable />
                  <Column field="nom" header="Employé" sortable />
                  <Column field="salaireNet" header="Salaire Net" body={(row) => montantBody(row, 'salaireNet')} sortable />
                  <Column field="statut" header="Statut" sortable />
                </DataTable>
                <div>
                  <strong>Total par employé :</strong>
                  <ul>
                    {Object.entries(masseSalariale.totalParEmploye).map(([nom, total]) => (
                      <li key={nom}>
                        {nom}: {total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                      </li>
                    ))}
                  </ul>
                  <p>Charges sociales : {masseSalariale.chargesSociales.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                  <p>Coût moyen par employé : {masseSalariale.coutMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                </div>
                <Chart type="line" data={chartData.evolutionSalariale} options={chartOptions.evolutionSalariale} style={{ maxWidth: 600 }} />
              </div>
            )}
            {rapportType === 'Autres Dépenses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DataTable
                  value={autresDepenses.exceptionnelles}
                  responsiveLayout="scroll"
                  emptyMessage="Aucune dépense exceptionnelle pour cette période"
                >
                  <Column field="id" header="ID" sortable />
                  <Column field="description" header="Description" sortable />
                  <Column field="montant" header="Montant" body={(row) => montantBody(row, 'montant')} sortable />
                  <Column field="categorie" header="Catégorie" sortable />
                </DataTable>
                <div>
                  <strong>Dépenses par catégorie :</strong>
                  <ul>
                    {Object.entries(autresDepenses.parCategorie).map(([cat, montant]) => (
                      <li key={cat}>
                        {cat}: {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                      </li>
                    ))}
                  </ul>
                  <strong>Dépenses par fournisseur :</strong>
                  <ul>
                    {Object.entries(autresDepenses.parFournisseur).map(([f, montant]) => (
                      <li key={f}>
                        {f}: {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                      </li>
                    ))}
                  </ul>
                  <strong>Comparaison budgétaire :</strong>
                  <ul>
                    {Object.entries(autresDepenses.comparaisonBudget).map(([cat, stat]) => (
                      <li key={cat}>
                        {cat}: Prévu {stat.budgetPrevu.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}, Réalisé{' '}
                        {stat.budgetRealise.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                        {stat.depassement > 0 ? ` (Dépassement: ${stat.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <Chart type="line" data={chartData.tendancesDepenses} options={chartOptions.tendancesDepenses} style={{ maxWidth: 600 }} />
              </div>
            )}
            {rapportType === 'Global' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p>Total des dépenses : {globalRapport.totalDepenses.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                <p>Salaires : {globalRapport.repartition.salaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                <p>Autres dépenses : {globalRapport.repartition.autres.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                <p>Rentabilité : {globalRapport.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                <p>Ratios financiers : Salaires/CA = {globalRapport.ratios.salairesCA}%</p>
                <strong>Recommandations :</strong>
                <ul>
                  {globalRapport.recommandations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <Chart type="pie" data={chartData.repartitionCouts} options={chartOptions.repartitionCouts} style={{ maxWidth: 400 }} />
              </div>
            )}
          </Card>

          <Card
            title="Prévisions budgétaires"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <p>
              Période estimée : {previsions.prochainePeriode}
            </p>
            <p>Salaires estimés : {previsions.salaireEstime.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
            <p>Dépenses estimées : {previsions.depensesEstime.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
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