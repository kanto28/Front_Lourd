import React, { useMemo, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import Sidebar from '../components/Sidebar';
import 'chart.js/auto'; // Ajouté pour garantir le chargement de Chart.js

export default function FinancialDashboardPage() {
  const toast = useRef(null);

  // --- Données mockées (cohérentes avec PayrollPage.js, ExpensesPage.js, SalesReportsPage.js) ---
  const salaires = [
    {
      id: 'SAL-2025-001',
      id_personne: 1,
      nom: 'Jean Rakoto',
      periode: '2025-07',
      salaireNet: 1030000,
      statut: 'Payé',
    },
    {
      id: 'SAL-2025-002',
      id_personne: 2,
      nom: 'Marie Raso',
      periode: '2025-07',
      salaireNet: 790000,
      statut: 'Payé',
    },
    {
      id: 'SAL-2025-003',
      id_personne: 1,
      nom: 'Jean Rakoto',
      periode: '2025-08',
      salaireNet: 1061250,
      statut: 'En attente',
    },
  ];

  const depenses = [
    {
      id: 'DEP-2025-001',
      montant: 450000,
      description: 'Facture électricité juillet',
      date: '2025-07-15',
      categorie: 'Électricité',
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
  const [selectedPeriode, setSelectedPeriode] = React.useState(periodes[0].value);

  // --- Calculs pour le résumé mensuel ---
  const resumeMensuel = useMemo(() => {
    const totalSalaires = salaires
      .filter((s) => s.periode === selectedPeriode)
      .reduce((sum, s) => sum + s.salaireNet, 0);
    const totalDepenses = depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((sum, d) => sum + d.montant, 0);
    const depensesParCategorie = depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((acc, d) => {
        acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
        return acc;
      }, {});
    const comparaisonBudget = depenses
      .filter((d) => d.date.startsWith(selectedPeriode))
      .reduce((acc, d) => {
        acc[d.categorie] = {
          budgetPrevu: d.budgetPrevu,
          budgetRealise: d.budgetRealise,
          depassement: d.budgetRealise > d.budgetPrevu ? d.budgetRealise - d.budgetPrevu : 0,
        };
        return acc;
      }, {});
    const chiffreAffaires = ventes
      .filter((v) => v.periode === selectedPeriode)
      .reduce((sum, v) => sum + v.montant, 0);
    return { totalSalaires, totalDepenses, depensesParCategorie, comparaisonBudget, chiffreAffaires };
  }, [selectedPeriode]);

  // --- Indicateurs clés ---
  const indicateurs = useMemo(() => {
    const pourcentageSalairesCA = resumeMensuel.chiffreAffaires
      ? ((resumeMensuel.totalSalaires / resumeMensuel.chiffreAffaires) * 100).toFixed(2)
      : 0;
    const evolutionCouts = periodes.map((periode) => {
      const salairesPeriode = salaires
        .filter((s) => s.periode === periode.value)
        .reduce((sum, s) => sum + s.salaireNet, 0);
      const depensesPeriode = depenses
        .filter((d) => d.date.startsWith(periode.value))
        .reduce((sum, d) => sum + d.montant, 0);
      return salairesPeriode + depensesPeriode;
    });
    const depensesMoyennes = evolutionCouts.reduce((sum, val) => sum + val, 0) / evolutionCouts.length;
    const topCategories = Object.entries(resumeMensuel.depensesParCategorie)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, montant]) => ({ categorie: cat, montant }));
    return { pourcentageSalairesCA, evolutionCouts, depensesMoyennes, topCategories };
  }, [resumeMensuel]);

  // --- Alertes budgétaires ---
  const alertes = useMemo(() => {
    const depassements = Object.entries(resumeMensuel.comparaisonBudget)
      .filter(([_, stat]) => stat.depassement > 0)
      .map(([cat, stat]) => ({
        type: 'Dépassement budget',
        message: `Dépassement de ${stat.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} pour ${cat}`,
      }));
    const paiementsEnRetard = [...salaires, ...depenses]
      .filter((item) => item.statut === 'En attente' && item.date?.startsWith(selectedPeriode))
      .map((item) => ({
        type: 'Paiement en retard',
        message: `${item.id} (${item.description || item.nom}) en attente`,
      }));
    const depensesInhabituelles = depenses
      .filter((d) => d.date.startsWith(selectedPeriode) && d.montant > resumeMensuel.depensesParCategorie[d.categorie] * 1.5)
      .map((d) => ({
        type: 'Dépense inhabituelle',
        message: `${d.description}: ${d.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (élevé pour ${d.categorie})`,
      }));
    return [...depassements, ...paiementsEnRetard, ...depensesInhabituelles];
  }, [resumeMensuel, salaires, depenses, selectedPeriode]);

  // --- Données pour les graphiques ---
  const chartData = {
    evolutionDepenses: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: 'Dépenses totales',
          data: indicateurs.evolutionCouts,
          fill: false,
          borderColor: '#16a085',
          tension: 0.4,
        },
      ],
    },
    repartitionCategories: {
      labels: Object.keys(resumeMensuel.depensesParCategorie),
      datasets: [
        {
          data: Object.values(resumeMensuel.depensesParCategorie),
          backgroundColor: ['#16a085', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6'],
        },
      ],
    },
    budgetVsRealise: {
      labels: Object.keys(resumeMensuel.comparaisonBudget),
      datasets: [
        {
          label: 'Budget prévu',
          data: Object.values(resumeMensuel.comparaisonBudget).map((stat) => stat.budgetPrevu),
          backgroundColor: '#16a085',
        },
        {
          label: 'Budget réalisé',
          data: Object.values(resumeMensuel.comparaisonBudget).map((stat) => stat.budgetRealise),
          backgroundColor: '#e74c3c',
        },
      ],
    },
    tendanceMasseSalariale: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: 'Masse salariale',
          data: periodes.map((periode) =>
            salaires.filter((s) => s.periode === periode.value).reduce((sum, s) => sum + s.salaireNet, 0)
          ),
          fill: false,
          borderColor: '#3498db',
          tension: 0.4,
        },
      ],
    },
    coutsFixesVsVariables: {
      labels: ['Coûts fixes', 'Coûts variables'],
      datasets: [
        {
          data: [
            depenses
              .filter((d) => ['Loyer', 'Assurance', 'Taxes et impôts'].includes(d.categorie))
              .reduce((sum, d) => sum + d.montant, 0),
            depenses
              .filter((d) => !['Loyer', 'Assurance', 'Taxes et impôts'].includes(d.categorie))
              .reduce((sum, d) => sum + d.montant, 0),
          ],
          backgroundColor: ['#16a085', '#f1c40f'],
        },
      ],
    },
  };

  const chartOptions = {
    evolutionDepenses: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
    repartitionCategories: {
      plugins: { legend: { position: 'right' } },
    },
    budgetVsRealise: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
    tendanceMasseSalariale: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } },
    },
    coutsFixesVsVariables: {
      plugins: { legend: { position: 'right' } },
    },
  };

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
          <i className="pi pi-chart-line" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Tableau de bord financier</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dropdown
            value={selectedPeriode}
            options={periodes}
            onChange={(e) => setSelectedPeriode(e.value)}
            style={{ width: 140 }}
          />
          <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
        </div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Résumé mensuel */}
          <Card
            title="Résumé mensuel"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <strong>Total salaires</strong>
                <p>{resumeMensuel.totalSalaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              </div>
              <div>
                <strong>Total autres dépenses</strong>
                <p>{resumeMensuel.totalDepenses.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              </div>
              <div>
                <strong>Dépenses par catégorie</strong>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {Object.entries(resumeMensuel.depensesParCategorie).map(([cat, montant]) => (
                    <li key={cat}>
                      {cat}: {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Comparaison budget</strong>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {Object.entries(resumeMensuel.comparaisonBudget).map(([cat, stat]) => (
                    <li key={cat}>
                      {cat}: {stat.depassement > 0 ? `+${stat.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}` : 'OK'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Indicateurs clés */}
          <Card
            title="Indicateurs clés"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <strong>% Salaires / CA</strong>
                <p>{indicateurs.pourcentageSalairesCA}%</p>
              </div>
              <div>
                <strong>Dépenses moyennes mensuelles</strong>
                <p>{indicateurs.depensesMoyennes.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              </div>
              <div>
                <strong>Top 5 catégories</strong>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {indicateurs.topCategories.map((cat, i) => (
                    <li key={i}>
                      {cat.categorie}: {cat.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Alertes budgétaires */}
          <Card
            title="Alertes budgétaires"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertes.length === 0 ? (
                <p>Aucune alerte pour la période sélectionnée.</p>
              ) : (
                alertes.map((alerte, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 8,
                      background: alerte.type === 'Dépassement budget' ? '#ffe6e6' : '#fff3cd',
                      borderRadius: 4,
                    }}
                  >
                    <strong>{alerte.type}</strong>: {alerte.message}
                  </div>
                ))
              )}
              <Button
                label="Analyser alertes"
                icon="pi pi-bell"
                className="p-button-outlined"
                onClick={() =>
                  toast.current?.show({
                    severity: alertes.length > 0 ? 'warn' : 'success',
                    summary: 'Alertes',
                    detail: alertes.length > 0 ? `${alertes.length} alertes détectées.` : 'Aucune alerte.',
                    life: 5000,
                  })
                }
              />
            </div>
          </Card>

          {/* Graphiques */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            <Card title="Évolution des dépenses">
              <Chart type="line" data={chartData.evolutionDepenses} options={chartOptions.evolutionDepenses} />
            </Card>
            <Card title="Répartition par catégories">
              <Chart type="pie" data={chartData.repartitionCategories} options={chartOptions.repartitionCategories} />
            </Card>
            <Card title="Budget vs Réalisé">
              <Chart type="bar" data={chartData.budgetVsRealise} options={chartOptions.budgetVsRealise} />
            </Card>
            <Card title="Tendance masse salariale">
              <Chart type="line" data={chartData.tendanceMasseSalariale} options={chartOptions.tendanceMasseSalariale} />
            </Card>
            <Card title="Coûts fixes vs variables">
              <Chart type="pie" data={chartData.coutsFixesVsVariables} options={chartOptions.coutsFixesVsVariables} />
            </Card>
          </div>
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