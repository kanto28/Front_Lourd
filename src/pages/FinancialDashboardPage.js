import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import 'chart.js/auto';

/**
 * FinancialDashboardPage – Look & feel "interface client lourd"
 * - Fenêtre type desktop (● ● ●), sidebar redimensionnable, barre d'état.
 * - Raccourcis : Ctrl+E (export PDF), Ctrl+1 (focus période), Ctrl+R (refresh mock), Esc (clear toasts).
 * - Résumé, indicateurs, alertes, 5 graphiques, filtres, export PDF avec synthèse.
 */
export default function FinancialDashboardPage() {
  const toast = useRef(null);
  const periodeRef = useRef(null);

  // ===== Données mockées (cohérentes avec d'autres modules) =====
  const salaires = [
    { id: 'SAL-2025-001', id_personne: 1, nom: 'Jean Rakoto',  periode: '2025-07', salaireNet: 1030000, statut: 'Payé' },
    { id: 'SAL-2025-002', id_personne: 2, nom: 'Marie Raso',   periode: '2025-07', salaireNet:  790000, statut: 'Payé' },
    { id: 'SAL-2025-003', id_personne: 1, nom: 'Jean Rakoto',  periode: '2025-08', salaireNet: 1061250, statut: 'En attente' },
  ];

  const depenses = [
    { id: 'DEP-2025-001', montant:  450000, description: 'Facture électricité juillet', date: '2025-07-15', categorie: 'Électricité',        statut: 'Payé',       budgetPrevu:  500000, budgetRealise:  450000 },
    { id: 'DEP-2025-002', montant:  180000, description: "Abonnement internet août",     date: '2025-08-01', categorie: 'Téléphone/Internet', statut: 'En attente', budgetPrevu:  150000, budgetRealise:  180000 },
    { id: 'DEP-2025-003', montant: 1100000, description: 'Loyer pharmacie septembre',    date: '2025-09-01', categorie: 'Loyer',              statut: 'En attente', budgetPrevu: 1000000, budgetRealise: 1100000 },
  ];

  const ventes = [
    { id: 'VTE-2025-001', date: '2025-07-12', montant: 15000, periode: '2025-07' },
    { id: 'VTE-2025-002', date: '2025-08-01', montant: 24000, periode: '2025-08' },
    { id: 'VTE-2025-003', date: '2025-09-01', montant:  9000, periode: '2025-09' },
  ];

  const periodes = ['2025-07', '2025-08', '2025-09'].map((p) => ({ label: p, value: p }));
  const [selectedPeriode, setSelectedPeriode] = useState(periodes[0].value);

  // ===== Résumé mensuel =====
  const resumeMensuel = useMemo(() => {
    const totalSalaires = salaires.filter((s) => s.periode === selectedPeriode).reduce((sum, s) => sum + s.salaireNet, 0);
    const depensesMois = depenses.filter((d) => d.date.startsWith(selectedPeriode));
    const totalDepenses = depensesMois.reduce((sum, d) => sum + d.montant, 0);
    const depensesParCategorie = depensesMois.reduce((acc, d) => ({ ...acc, [d.categorie]: (acc[d.categorie] || 0) + d.montant }), {});
    const comparaisonBudget = depensesMois.reduce((acc, d) => ({
      ...acc,
      [d.categorie]: {
        budgetPrevu: d.budgetPrevu,
        budgetRealise: d.budgetRealise,
        depassement: d.budgetRealise > d.budgetPrevu ? d.budgetRealise - d.budgetPrevu : 0,
      },
    }), {});
    const chiffreAffaires = ventes.filter((v) => v.periode === selectedPeriode).reduce((sum, v) => sum + v.montant, 0);
    return { totalSalaires, totalDepenses, depensesParCategorie, comparaisonBudget, chiffreAffaires };
  }, [selectedPeriode]);

  // ===== Indicateurs clés =====
  const indicateurs = useMemo(() => {
    const pourcentageSalairesCA = resumeMensuel.chiffreAffaires ? ((resumeMensuel.totalSalaires / resumeMensuel.chiffreAffaires) * 100).toFixed(2) : 0;
    const evolutionCouts = periodes.map((periode) => {
      const salairesP = salaires.filter((s) => s.periode === periode.value).reduce((sum, s) => sum + s.salaireNet, 0);
      const depensesP = depenses.filter((d) => d.date.startsWith(periode.value)).reduce((sum, d) => sum + d.montant, 0);
      return salairesP + depensesP;
    });
    const depensesMoyennes = evolutionCouts.reduce((sum, val) => sum + val, 0) / evolutionCouts.length;
    const topCategories = Object.entries(resumeMensuel.depensesParCategorie).sort(([, a], [, b]) => b - a).slice(0, 5).map(([categorie, montant]) => ({ categorie, montant }));
    return { pourcentageSalairesCA, evolutionCouts, depensesMoyennes, topCategories };
  }, [resumeMensuel]);

  // ===== Alertes budgétaires =====
  const alertes = useMemo(() => {
    const depassements = Object.entries(resumeMensuel.comparaisonBudget).filter(([_, s]) => s.depassement > 0).map(([cat, s]) => ({ type: 'Dépassement budget', message: `Dépassement de ${s.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} pour ${cat}` }));
    const paiementsEnRetard = [...salaires, ...depenses]
      .filter((i) => i.statut === 'En attente' && i.date?.startsWith?.(selectedPeriode))
      .map((i) => ({ type: 'Paiement en retard', message: `${i.id} (${i.description || i.nom}) en attente` }));
    const depensesInhabituelles = depenses
      .filter((d) => d.date.startsWith(selectedPeriode) && d.montant > (resumeMensuel.depensesParCategorie[d.categorie] || 0) * 1.5)
      .map((d) => ({ type: 'Dépense inhabituelle', message: `${d.description}: ${d.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (élevé pour ${d.categorie})` }));
    return [...depassements, ...paiementsEnRetard, ...depensesInhabituelles];
  }, [resumeMensuel, salaires, depenses, selectedPeriode]);

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

  // ===== Raccourcis clavier & refresh mock =====
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { toast.current?.clear(); }
      if (e.ctrlKey && (e.key === '1')) { e.preventDefault(); periodeRef.current?.focus(); }
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); exporterPDF(); }
      if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        // mock refresh de quelques indicateurs
        toast.current?.show({ severity: 'success', summary: 'Actualisé', detail: 'Données rafraîchies.' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPeriode]);

  // ===== Graphiques =====
  const palette = ['#16a085', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6'];
  const chartData = useMemo(() => ({
    evolutionDepenses: {
      labels: periodes.map((p) => p.label),
      datasets: [{ label: 'Dépenses totales', data: indicateurs.evolutionCouts, fill: false, borderColor: '#16a085', tension: 0.35 }],
    },
    repartitionCategories: {
      labels: Object.keys(resumeMensuel.depensesParCategorie),
      datasets: [{ data: Object.values(resumeMensuel.depensesParCategorie), backgroundColor: palette }],
    },
    budgetVsRealise: {
      labels: Object.keys(resumeMensuel.comparaisonBudget),
      datasets: [
        { label: 'Budget prévu', data: Object.values(resumeMensuel.comparaisonBudget).map((s) => s.budgetPrevu), backgroundColor: '#16a085' },
        { label: 'Budget réalisé', data: Object.values(resumeMensuel.comparaisonBudget).map((s) => s.budgetRealise), backgroundColor: '#e74c3c' },
      ],
    },
    tendanceMasseSalariale: {
      labels: periodes.map((p) => p.label),
      datasets: [{ label: 'Masse salariale', data: periodes.map((p) => salaires.filter((s) => s.periode === p.value).reduce((sum, s) => sum + s.salaireNet, 0)), fill: false, borderColor: '#3498db', tension: 0.35 }],
    },
    coutsFixesVsVariables: {
      labels: ['Coûts fixes', 'Coûts variables'],
      datasets: [{ data: [depenses.filter((d) => ['Loyer', 'Assurance', 'Taxes et impôts'].includes(d.categorie)).reduce((s, d) => s + d.montant, 0), depenses.filter((d) => !['Loyer', 'Assurance', 'Taxes et impôts'].includes(d.categorie)).reduce((s, d) => s + d.montant, 0)], backgroundColor: ['#16a085', '#f1c40f'] }],
    },
  }), [indicateurs, resumeMensuel]);

  const chartOptions = {
    evolutionDepenses: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } } },
    repartitionCategories: { plugins: { legend: { position: 'right' } } },
    budgetVsRealise: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } } },
    tendanceMasseSalariale: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'MGA' } } } },
    coutsFixesVsVariables: { plugins: { legend: { position: 'right' } } },
  };

  // ===== Export PDF =====
  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Tableau de bord financier — ${selectedPeriode}`, 20, 20);
    doc.setFontSize(12);
    let y = 30;
    const cur = (v) => (typeof v === 'number' ? v.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' }) : v);

    doc.text('Résumé', 20, y); y += 10;
    doc.text(`Total salaires: ${cur(resumeMensuel.totalSalaires)}`, 20, y); y += 8;
    doc.text(`Total autres dépenses: ${cur(resumeMensuel.totalDepenses)}`, 20, y); y += 8;
    doc.text(`Chiffre d'affaires: ${cur(resumeMensuel.chiffreAffaires)}`, 20, y); y += 8;

    doc.text('Comparaison budget', 20, y); y += 10;
    Object.entries(resumeMensuel.comparaisonBudget).forEach(([cat, s]) => { doc.text(`${cat}: prévus ${cur(s.budgetPrevu)} · réalisés ${cur(s.budgetRealise)} · ${s.depassement > 0 ? `+${cur(s.depassement)}` : 'OK'}`, 20, y); y += 8; });

    doc.text('Alertes', 20, y); y += 10;
    if (alertes.length === 0) { doc.text('Aucune alerte', 20, y); y += 8; }
    else { alertes.forEach((a) => { doc.text(`${a.type}: ${a.message}`, 20, y); y += 8; }); }

    doc.save(`dashboard_financier_${selectedPeriode}.pdf`);
    toast.current?.show({ severity: 'success', summary: 'Export', detail: 'PDF généré.' });
  };

  // ===== UI style client lourd =====
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: '#e6e9ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <Toast ref={toast} />

      {/* Fenêtre */}
      <div className="app-window" style={{
        width: 'min(1450px, 100vw)', height: 'min(920px, 100vh)', background: '#f7f8fb', borderRadius: 12,
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)', display: 'grid', gridTemplateRows: '44px 1fr 28px', overflow: 'hidden',
      }}>
        {/* Barre de titre */}
        <div style={{
          background: 'linear-gradient(180deg,#fdfdfd,#f1f3f7)', borderBottom: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', userSelect: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Tableau de bord financier</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag severity="success" value="Ctrl+E Export" />
            <Tag severity="info" value="Ctrl+1 Période" />
            <Tag severity="warning" value="Ctrl+R Refresh" />
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
              background: 'linear-gradient(180deg,#16a085,#11967b)', color: '#fff', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="pi pi-chart-line" style={{ fontSize: 18 }} />
                <strong>Comptabilité ▸ Tableau de bord financier</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Dropdown ref={periodeRef} value={selectedPeriode} options={periodes} onChange={(e) => setSelectedPeriode(e.value)} style={{ width: 140 }} />
                <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ padding: 12, minHeight: 0, overflow: 'auto', display: 'grid', gap: 16, gridTemplateRows: 'auto auto auto 1fr' }}>
              {/* Résumé mensuel */}
              <Card title="Résumé mensuel" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div><strong>Total salaires</strong><p>{resumeMensuel.totalSalaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p></div>
                  <div><strong>Total autres dépenses</strong><p>{resumeMensuel.totalDepenses.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p></div>
                  <div>
                    <strong>Dépenses par catégorie</strong>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {Object.entries(resumeMensuel.depensesParCategorie).map(([cat, m]) => (
                        <li key={cat}>{cat}: {m.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Comparaison budget</strong>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {Object.entries(resumeMensuel.comparaisonBudget).map(([cat, s]) => (
                        <li key={cat}>{cat}: {s.depassement > 0 ? `+${s.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}` : 'OK'}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button label="Exporter PDF" icon="pi pi-file-pdf" className="p-button-outlined" onClick={exporterPDF} />
                </div>
              </Card>

              {/* Indicateurs clés */}
              <Card title="Indicateurs clés" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div><strong>% Salaires / CA</strong><p>{indicateurs.pourcentageSalairesCA}%</p></div>
                  <div><strong>Dépenses moyennes mensuelles</strong><p>{indicateurs.depensesMoyennes.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p></div>
                  <div>
                    <strong>Top 5 catégories</strong>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {indicateurs.topCategories.map((cat, i) => (
                        <li key={i}>{cat.categorie}: {cat.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Alertes budgétaires */}
              <Card title="Alertes budgétaires" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alertes.length === 0 ? (
                    <p>Aucune alerte pour la période sélectionnée.</p>
                  ) : (
                    alertes.map((a, i) => (
                      <div key={i} style={{ padding: 8, background: a.type === 'Dépassement budget' ? '#ffe6e6' : '#fff3cd', borderRadius: 4 }}>
                        <strong>{a.type}</strong>: {a.message}
                      </div>
                    ))
                  )}
                  <Button label="Analyser alertes" icon="pi pi-bell" className="p-button-outlined" onClick={() => toast.current?.show({ severity: alertes.length > 0 ? 'warn' : 'success', summary: 'Alertes', detail: alertes.length > 0 ? `${alertes.length} alertes détectées.` : 'Aucune alerte.', life: 5000 })} />
                </div>
              </Card>

              {/* Graphiques */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <Card title="Évolution des dépenses"><Chart type="line" data={chartData.evolutionDepenses} options={chartOptions.evolutionDepenses} /></Card>
                <Card title="Répartition par catégories"><Chart type="pie" data={chartData.repartitionCategories} options={chartOptions.repartitionCategories} /></Card>
                <Card title="Budget vs Réalisé"><Chart type="bar" data={chartData.budgetVsRealise} options={chartOptions.budgetVsRealise} /></Card>
                <Card title="Tendance masse salariale"><Chart type="line" data={chartData.tendanceMasseSalariale} options={chartOptions.tendanceMasseSalariale} /></Card>
                <Card title="Coûts fixes vs variables"><Chart type="pie" data={chartData.coutsFixesVsVariables} options={chartOptions.coutsFixesVsVariables} /></Card>
              </div>
            </div>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{ background: '#eef1f6', borderTop: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12, fontSize: 12, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span>Raccourcis: Ctrl+E • Ctrl+1 • Ctrl+R • Esc</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Focus & responsive */}
      <style>{`
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus { outline: 2px solid #16a085 !important; outline-offset: 1px; }
        @media (max-width: 1200px) { .window-body { grid-template-columns: 0 0 1fr !important; } .app-window { height: 100vh !important; border-radius: 0; } }
      `}</style>
    </div>
  );
}
