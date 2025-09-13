import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { jsPDF } from "jspdf";
import "chart.js/auto";
import Sidebar from "../components/Sidebar";

/**
 * ReportsAnalyticsPage – Style "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ● + barre d'état)
 * - Panneaux scrollables, toolbar compacte, exports (CSV/PDF)
 * - Harmonisé avec tes autres pages "client lourd"
 */
export default function ReportsAnalyticsPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const salaires = [
    { id: "SAL-2025-001", id_personne: 1, nom: "Jean Rakoto", periode: "2025-07", salaireNet: 1030000, statut: "Payé" },
    { id: "SAL-2025-002", id_personne: 2, nom: "Marie Raso", periode: "2025-07", salaireNet: 790000, statut: "Payé" },
    { id: "SAL-2025-003", id_personne: 1, nom: "Jean Rakoto", periode: "2025-08", salaireNet: 1061250, statut: "En attente" },
  ];

  const depenses = [
    {
      id: "DEP-2025-001",
      montant: 450000,
      description: "Facture électricité juillet",
      date: "2025-07-15",
      categorie: "Électricité",
      fournisseur: { id: 1, nom: "ElectroMad" },
      statut: "Payé",
      budgetPrevu: 500000,
      budgetRealise: 450000,
    },
    {
      id: "DEP-2025-002",
      montant: 180000,
      description: "Abonnement internet août",
      date: "2025-08-01",
      categorie: "Téléphone/Internet",
      fournisseur: null,
      statut: "En attente",
      budgetPrevu: 150000,
      budgetRealise: 180000,
    },
    {
      id: "DEP-2025-003",
      montant: 1100000,
      description: "Loyer pharmacie septembre",
      date: "2025-09-01",
      categorie: "Loyer",
      fournisseur: null,
      statut: "En attente",
      budgetPrevu: 1000000,
      budgetRealise: 1100000,
    },
  ];

  const ventes = [
    { id: "VTE-2025-001", date: "2025-07-12", montant: 15000, periode: "2025-07" },
    { id: "VTE-2025-002", date: "2025-08-01", montant: 24000, periode: "2025-08" },
    { id: "VTE-2025-003", date: "2025-09-01", montant: 9000, periode: "2025-09" },
  ];

  const periodes = ["2025-07", "2025-08", "2025-09"].map((p) => ({ label: p, value: p }));
  const [selectedPeriode, setSelectedPeriode] = useState(periodes[0].value);
  const [rapportType, setRapportType] = useState("Masse Salariale");

  // --- Calculs pour les rapports ---
  const masseSalariale = useMemo(
    () => ({
      details: salaires.filter((s) => s.periode === selectedPeriode),
      totalParEmploye: salaires
        .filter((s) => s.periode === selectedPeriode)
        .reduce((acc, s) => {
          acc[s.nom] = (acc[s.nom] || 0) + s.salaireNet;
          return acc;
        }, {}),
      chargesSociales: salaires
        .filter((s) => s.periode === selectedPeriode)
        .reduce((sum, s) => sum + s.salaireNet * 0.2, 0), // 20%
      evolution: periodes.map((p) => ({
        periode: p.value,
        total: salaires.filter((s) => s.periode === p.value).reduce((sum, s) => sum + s.salaireNet, 0),
      })),
      coutMoyen:
        salaires.reduce((sum, s) => sum + s.salaireNet, 0) / salaires.length / periodes.length,
    }),
    [selectedPeriode]
  );

  const autresDepenses = useMemo(
    () => ({
      parCategorie: depenses
        .filter((d) => d.date.startsWith(selectedPeriode))
        .reduce((acc, d) => {
          acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
          return acc;
        }, {}),
      parFournisseur: depenses
        .filter((d) => d.date.startsWith(selectedPeriode))
        .reduce((acc, d) => {
          const key = d.fournisseur ? d.fournisseur.nom : "N/A";
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
        .filter((d) => d.date.startsWith(selectedPeriode) && d.montant > 500000)
        .map((d) => ({ id: d.id, description: d.description, montant: d.montant, categorie: d.categorie })),
      tendances: periodes.map((p) => ({
        periode: p.value,
        total: depenses.filter((d) => d.date.startsWith(p.value)).reduce((sum, d) => sum + d.montant, 0),
      })),
    }),
    [selectedPeriode]
  );

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
      repartition: { salaires: totalSalaires, autres: totalDepenses },
      ratios: { salairesCA: salairesCA.toFixed(2) },
      rentabilite: chiffreAffaires - (totalSalaires + totalDepenses),
      recommandations: [
        masseSalariale.chargesSociales > 500000
          ? "Optimiser la gestion des heures supplémentaires pour réduire les charges sociales."
          : "",
        autresDepenses.exceptionnelles.length > 0
          ? "Examiner les dépenses exceptionnelles pour identifier des économies potentielles."
          : "",
        salairesCA > 50 ? "Réduire les coûts salariaux ou augmenter le chiffre d’affaires." : "",
      ].filter((r) => r),
    };
  }, [selectedPeriode, masseSalariale, autresDepenses]);

  // --- Prévisions ---
  const previsions = useMemo(() => {
    const moyenneSalaires = salaires.reduce((sum, s) => sum + s.salaireNet, 0) / periodes.length;
    const moyenneDepenses = depenses.reduce((sum, d) => sum + d.montant, 0) / periodes.length;
    const [y, m] = selectedPeriode.split("-").map(Number);
    const next = new Date(y, m - 1, 1);
    next.setMonth(next.getMonth() + 1);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    return { prochainePeriode: nextStr, salaireEstime: moyenneSalaires * 1.05, depensesEstime: moyenneDepenses * 1.05 };
  }, [selectedPeriode]);

  // --- Graphiques ---
  const chartData = {
    evolutionSalariale: {
      labels: periodes.map((p) => p.label),
      datasets: [
        { label: "Masse salariale", data: masseSalariale.evolution.map((e) => e.total), fill: false, borderColor: "#3498db", tension: 0.4 },
      ],
    },
    tendancesDepenses: {
      labels: periodes.map((p) => p.label),
      datasets: [
        { label: "Autres dépenses", data: autresDepenses.tendances.map((t) => t.total), fill: false, borderColor: "#16a085", tension: 0.4 },
      ],
    },
    repartitionCouts: {
      labels: ["Salaires", "Autres dépenses"],
      datasets: [
        { data: [globalRapport.repartition.salaires, globalRapport.repartition.autres], backgroundColor: ["#3498db", "#16a085"] },
      ],
    },
  };

  const chartOptions = {
    evolutionSalariale: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: "MGA" } } } },
    tendancesDepenses: { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: "MGA" } } } },
    repartitionCouts: { plugins: { legend: { position: "right" } } },
  };

  // --- Actions d'export ---
  const exportRapport = (format) => {
    if (format === "Excel") {
      const csvContent = [
        ["Rapport", rapportType, "Période", selectedPeriode],
        [""],
        rapportType === "Masse Salariale"
          ? [
              ["ID", "Employé", "Salaire Net", "Statut"].join(","),
              ...masseSalariale.details.map((s) => [s.id, s.nom, s.salaireNet.toLocaleString("fr-FR"), s.statut].join(",")),
              [""],
              ["Total par employé"],
              ...Object.entries(masseSalariale.totalParEmploye).map(([nom, total]) => [nom, total.toLocaleString("fr-FR")].join(",")),
              [""],
              ["Charges sociales", masseSalariale.chargesSociales.toLocaleString("fr-FR")],
              ["Coût moyen par employé", masseSalariale.coutMoyen.toLocaleString("fr-FR")],
            ]
          : rapportType === "Autres Dépenses"
          ? [
              ["ID", "Description", "Montant", "Catégorie"].join(","),
              ...autresDepenses.exceptionnelles.map((d) => [d.id, d.description, d.montant.toLocaleString("fr-FR"), d.categorie].join(",")),
              [""],
              ["Dépenses par catégorie"],
              ...Object.entries(autresDepenses.parCategorie).map(([cat, montant]) => [cat, montant.toLocaleString("fr-FR")].join(",")),
              [""],
              ["Dépenses par fournisseur"],
              ...Object.entries(autresDepenses.parFournisseur).map(([f, montant]) => [f, montant.toLocaleString("fr-FR")].join(",")),
            ]
          : [
              ["Total des dépenses", globalRapport.totalDepenses.toLocaleString("fr-FR")],
              ["Salaires", globalRapport.repartition.salaires.toLocaleString("fr-FR")],
              ["Autres dépenses", globalRapport.repartition.autres.toLocaleString("fr-FR")],
              [""],
              ["Ratios financiers"],
              ["Salaires/CA", `${globalRapport.ratios.salairesCA}%`],
              ["Rentabilité", globalRapport.rentabilite.toLocaleString("fr-FR")],
              [""],
              ["Recommandations"],
              ...globalRapport.recommandations,
            ],
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_${rapportType}_${selectedPeriode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: "success", summary: "Export", detail: `Rapport ${rapportType} exporté en CSV.` });
    } else if (format === "PDF") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Rapport ${rapportType} - ${selectedPeriode}`, 20, 20);
      doc.setFontSize(12);
      let y = 30;
      if (rapportType === "Masse Salariale") {
        doc.text("Détails des salaires", 20, y); y += 10;
        masseSalariale.details.forEach((s) => { doc.text(`${s.id}: ${s.nom} - ${s.salaireNet.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (${s.statut})`, 20, y); y += 10; });
        doc.text(`Charges sociales: ${masseSalariale.chargesSociales.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10;
        doc.text(`Coût moyen par employé: ${masseSalariale.coutMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y);
      } else if (rapportType === "Autres Dépenses") {
        doc.text("Dépenses exceptionnelles", 20, y); y += 10;
        autresDepenses.exceptionnelles.forEach((d) => { doc.text(`${d.id}: ${d.description} - ${d.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (${d.categorie})`, 20, y); y += 10; });
        doc.text("Dépenses par catégorie", 20, y); y += 10;
        Object.entries(autresDepenses.parCategorie).forEach(([cat, montant]) => { doc.text(`${cat}: ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10; });
      } else {
        doc.text(`Total des dépenses: ${globalRapport.totalDepenses.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10;
        doc.text(`Salaires: ${globalRapport.repartition.salaires.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10;
        doc.text(`Autres dépenses: ${globalRapport.repartition.autres.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10;
        doc.text(`Rentabilité: ${globalRapport.rentabilite.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`, 20, y); y += 10;
        doc.text('Recommandations:', 20, y); y += 10;
        globalRapport.recommandations.forEach((r) => { doc.text(r, 20, y); y += 10; });
      }
      doc.save(`rapport_${rapportType}_${selectedPeriode}.pdf`);
      toast.current?.show({ severity: "success", summary: "Export", detail: `Rapport ${rapportType} exporté en PDF.` });
    }
  };

  // --- Render ---
  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Rapports & Analytique</span>
      <Dropdown value={rapportType} options={["Masse Salariale", "Autres Dépenses", "Global"].map((t) => ({ label: t, value: t }))} onChange={(e) => setRapportType(e.value)} style={{ width: 200 }} />
      <Dropdown value={selectedPeriode} options={periodes} onChange={(e) => setSelectedPeriode(e.value)} style={{ width: 140 }} />
      <Tag value={selectedPeriode} />
    </div>
  );

  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exportRapport("Excel")} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exportRapport("PDF")} className="p-button-outlined" />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter,Segoe UI", background: "#e6e9ef", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Toast ref={toast} />
      <div className="app-window" style={{ width: "min(1400px,100vw)", height: "min(920px,100vh)", background: "#f7f8fb", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.18)", display: "grid", gridTemplateRows: "44px 1fr 28px" }}>
        {/* Title bar */}
        <div style={{ background: "linear-gradient(180deg,#fdfdfd,#f1f3f7)", borderBottom: "1px solid #e3e6ee", display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff605c" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ffbd44" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#00ca4e" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Rapports & Analytique</div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", minHeight: 0 }}>
          <Sidebar title="Modules" />
          <main style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
            <Card style={{ background: "#fff", border: "1px solid #d7d7d7", borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }} title={`Rapport ${rapportType} — ${selectedPeriode}`}>
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />

              {rapportType === "Masse Salariale" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <DataTable value={masseSalariale.details} responsiveLayout="scroll" emptyMessage="Aucun salaire pour cette période">
                    <Column field="id" header="ID" sortable />
                    <Column field="nom" header="Employé" sortable />
                    <Column field="salaireNet" header="Salaire Net" body={(r) => r.salaireNet.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} sortable />
                    <Column field="statut" header="Statut" sortable />
                  </DataTable>
                  <div>
                    <strong>Total par employé :</strong>
                    <ul>
                      {Object.entries(masseSalariale.totalParEmploye).map(([nom, total]) => (
                        <li key={nom}>{nom}: {total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                      ))}
                    </ul>
                    <p>Charges sociales : {masseSalariale.chargesSociales.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                    <p>Coût moyen par employé : {masseSalariale.coutMoyen.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                  </div>
                  <Chart type="line" data={chartData.evolutionSalariale} options={chartOptions.evolutionSalariale} style={{ maxWidth: 720 }} />
                </div>
              )}

              {rapportType === "Autres Dépenses" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <DataTable value={autresDepenses.exceptionnelles} responsiveLayout="scroll" emptyMessage="Aucune dépense exceptionnelle">
                    <Column field="id" header="ID" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="montant" header="Montant" body={(r) => r.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} sortable />
                    <Column field="categorie" header="Catégorie" sortable />
                  </DataTable>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Card title="Par catégorie">
                      <ul style={{ margin: 0 }}>
                        {Object.entries(autresDepenses.parCategorie).map(([cat, montant]) => (
                          <li key={cat}>{cat}: {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                        ))}
                      </ul>
                    </Card>
                    <Card title="Par fournisseur">
                      <ul style={{ margin: 0 }}>
                        {Object.entries(autresDepenses.parFournisseur).map(([f, montant]) => (
                          <li key={f}>{f}: {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  <Card title="Comparaison budgétaire">
                    <ul style={{ margin: 0 }}>
                      {Object.entries(autresDepenses.comparaisonBudget).map(([cat, stat]) => (
                        <li key={cat}>
                          {cat}: Prévu {stat.budgetPrevu.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}, Réalisé {stat.budgetRealise.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                          {stat.depassement > 0 ? ` (Dépassement: ${stat.depassement.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })})` : ''}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Chart type="line" data={chartData.tendancesDepenses} options={chartOptions.tendancesDepenses} style={{ maxWidth: 720 }} />
                </div>
              )}

              {rapportType === "Global" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
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
                  </div>
                  <Chart type="pie" data={chartData.repartitionCouts} options={chartOptions.repartitionCouts} style={{ maxWidth: 420 }} />
                </div>
              )}
            </Card>

            <Card title="Prévisions budgétaires" style={{ background: '#fff', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
              <p>Période estimée : {previsions.prochainePeriode}</p>
              <p>Salaires estimés : {previsions.salaireEstime.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
              <p>Dépenses estimées : {previsions.depensesEstime.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
            </Card>
          </main>
        </div>

        {/* Status bar */}
        <footer style={{ background: "#eef1f6", borderTop: "1px solid #e3e6ee", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, color: "#2f3b52" }}>
          <span>État: prêt</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
