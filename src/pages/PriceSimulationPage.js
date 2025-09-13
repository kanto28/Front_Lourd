import React, { useState, useRef, useMemo, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Chart } from "primereact/chart";
import Sidebar from "../components/Sidebar";
import { jsPDF } from "jspdf";
import "chart.js/auto";

/**
 * PriceSimulationPage – Style "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ●, zone centrale, barre d’état).
 * - Panneaux scrollables, raccourcis clavier (Ctrl+E CSV / Ctrl+P PDF).
 * - Reprend la logique de calcul / simulation et ajout d'un look app bureau.
 */
export default function PriceSimulationPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const medicaments = [
    { id: "MED-001", nom: "Paracétamol 500mg", categorie: "Médicaments sur ordonnance", prixAchat: 1000, ventesMensuelles: 1000 },
    { id: "MED-002", nom: "Ibuprofène 400mg", categorie: "Médicaments sans ordonnance", prixAchat: 1500, ventesMensuelles: 800 },
    { id: "MED-003", nom: "Crème hydratante", categorie: "Produits cosmétiques", prixAchat: 5000, ventesMensuelles: 300 },
    { id: "MED-004", nom: "Thermomètre", categorie: "Matériel médical", prixAchat: 20000, ventesMensuelles: 50 },
    { id: "MED-005", nom: "Vitamine C", categorie: "Produits de parapharmacie", prixAchat: 3000, ventesMensuelles: 500 },
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
      "Médicaments sur ordonnance": 25,
      "Médicaments sans ordonnance": 35,
      "Produits de parapharmacie": 40,
      "Produits cosmétiques": 50,
      "Matériel médical": 20,
    },
    tvaDefaut: 20,
    regleArrondi: "À l’euro près",
    prixMinimum: 500,
    prixMaximum: 100000,
  };

  // --- État – calculateur individuel ---
  const [calculIndividuel, setCalculIndividuel] = useState({ idMedicament: "", prixAchat: 0, prixConcurrent: 0 });

  // --- État – simulation globale ---
  const [margeGlobaleSimulee, setMargeGlobaleSimulee] = useState(configuration.margeGlobale);

  // --- Helpers ---
  const calculerPrixVente = (prixAchat, categorie) => {
    const marge = configuration.margesParCategorie[categorie] || configuration.margeGlobale;
    const prixHT = prixAchat * (1 + marge / 100);
    const prixTTC = prixHT * (1 + configuration.tvaDefaut / 100);
    const prixVente = configuration.regleArrondi === "À l’euro près" ? Math.round(prixTTC) : prixTTC;
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
    return calculerPrixVente(calculIndividuel.prixAchat, med?.categorie || "");
  }, [calculIndividuel]);

  // --- Simulation globale ---
  const simulationGlobale = useMemo(() => {
    return medicaments.map((m) => {
      const prixActuel = calculerPrixVente(m.prixAchat, m.categorie);
      // On simule ici un impact en modifiant le coût d'achat selon la marge globale simulée (approche simple)
      const prixSimule = calculerPrixVente(m.prixAchat * (1 + margeGlobaleSimulee / 100), m.categorie);
      const c = concurrents.find((x) => x.id === m.id) || { prixConcurrent: 0, margeMarche: 0 };
      const rentabilite = (prixSimule.prixTTC - m.prixAchat) * m.ventesMensuelles;
      const positionConcurrentielle =
        prixSimule.prixTTC < c.prixConcurrent * 0.9
          ? "Compétitif"
          : prixSimule.prixTTC > c.prixConcurrent * 1.1
          ? "Non compétitif"
          : "Moyen";
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

  // --- Chart data/options ---
  const chartData = useMemo(() => ({
    rentabiliteParCategorie: {
      labels: Object.keys(configuration.margesParCategorie),
      datasets: [
        {
          label: "Rentabilité estimée (MGA)",
          data: Object.keys(configuration.margesParCategorie).map((cat) =>
            simulationGlobale.filter((m) => m.categorie === cat).reduce((sum, m) => sum + m.rentabilite, 0)
          ),
          backgroundColor: ["#3498db", "#16a085", "#e74c3c", "#f1c40f", "#2ecc71"],
        },
      ],
    },
    comparaisonPrix: {
      labels: medicaments.map((m) => m.nom),
      datasets: [
        { label: "Prix actuel", data: simulationGlobale.map((m) => m.prixVenteActuel), backgroundColor: "#3498db" },
        { label: "Prix simulé", data: simulationGlobale.map((m) => m.prixVenteSimule), backgroundColor: "#16a085" },
        { label: "Prix concurrent", data: simulationGlobale.map((m) => m.prixConcurrent), backgroundColor: "#e74c3c" },
      ],
    },
  }), [simulationGlobale]);

  const chartOptions = {
    rentabiliteParCategorie: { plugins: { legend: { position: "right" } } },
    comparaisonPrix: { plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true, title: { display: true, text: "MGA" } } } },
  };

  // --- Export ---
  const exporterResultats = (format) => {
    if (format === "Excel") {
      const csvContent = [
        ["Médicament","Catégorie","Prix d’achat","Prix vente actuel","Prix vente simulé","Prix concurrent","Marge actuelle (%)","Marge simulée (%)","Rentabilité (MGA)","Position"].join(","),
        ...simulationGlobale.map((m) => [
          m.nom,
          m.categorie,
          m.prixAchat.toLocaleString("fr-FR"),
          m.prixVenteActuel.toLocaleString("fr-FR"),
          m.prixVenteSimule.toLocaleString("fr-FR"),
          m.prixConcurrent.toLocaleString("fr-FR"),
          m.margeActuelle,
          m.margeSimulee,
          m.rentabilite.toLocaleString("fr-FR"),
          m.positionConcurrentielle,
        ].join(",")),
        ["","Impact CA", impactCA.toLocaleString("fr-FR")],
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simulation_prix.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: "success", summary: "Export", detail: "Résultats exportés en CSV." });
    } else if (format === "PDF") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Simulation des Prix", 20, 20);
      doc.setFontSize(12);
      let y = 30;
      simulationGlobale.forEach((m) => {
        doc.text(
          `${m.nom}: Actuel ${m.prixVenteActuel.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}, Simulé ${m.prixVenteSimule.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`,
          20,
          y
        );
        y += 10;
        doc.text(`Concurrent: ${m.prixConcurrent.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}, Rentabilité: ${m.rentabilite.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`, 20, y);
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      doc.text(`Impact CA: ${impactCA.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`, 20, y);
      doc.save("simulation_prix.pdf");
      toast.current?.show({ severity: "success", summary: "Export", detail: "Résultats exportés en PDF." });
    }
  };

  // --- Raccourcis clavier (Ctrl+E / Ctrl+P) ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && (e.key === "e" || e.key === "E")) { e.preventDefault(); exporterResultats("Excel"); }
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) { e.preventDefault(); exporterResultats("PDF"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exporterResultats]);

  // --- Colonnes helpers ---
  const montantBody = (row, field) => row[field]?.toLocaleString("fr-FR", { style: "currency", currency: "MGA" });
  const pourcentageBody = (row, field) => `${row[field]}%`;

  return (
    <div style={{ fontFamily: "Inter,Segoe UI", background: "#e6e9ef", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Toast ref={toast} />
      <div className="app-window" style={{ width: "min(1400px,100vw)", height: "min(900px,100vh)", background: "#f7f8fb", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.18)", display: "grid", gridTemplateRows: "44px 1fr 28px" }}>
        {/* Barre de titre */}
        <div style={{ background: "linear-gradient(180deg,#fdfdfd,#f1f3f7)", borderBottom: "1px solid #e3e6ee", display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff605c" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ffbd44" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#00ca4e" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Simulation des prix</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button label="Exporter CSV" icon="pi pi-file-excel" className="p-button-text p-button-sm" onClick={() => exporterResultats("Excel")} />
            <Button label="Exporter PDF" icon="pi pi-file-pdf" className="p-button-text p-button-sm" onClick={() => exporterResultats("PDF")} />
          </div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", minHeight: 0 }}>
          <Sidebar title="Modules" />
          <main style={{ flex: 1, padding: 16, display: "grid", gap: 16, gridTemplateColumns: "360px 1fr", gridTemplateRows: "1fr 1fr", gridAutoRows: "minmax(0,1fr)", overflow: "auto" }}>
            {/* Panneau gauche – Calculateur individuel */}
            <Card title="Calculateur individuel" style={{ gridRow: "1 / span 2", minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Médicament</label>
                  <Dropdown value={calculIndividuel.idMedicament} options={medicaments.map((m) => ({ label: m.nom, value: m.id }))} onChange={(e) => setCalculIndividuel((s) => ({ ...s, idMedicament: e.value }))} placeholder="Sélectionner" style={{ width: 260 }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Prix d’achat (MGA)</label>
                  <InputNumber value={calculIndividuel.prixAchat} onValueChange={(e) => setCalculIndividuel((s) => ({ ...s, prixAchat: e.value || 0 }))} min={0} suffix=" MGA" style={{ width: 260 }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Prix concurrent (MGA)</label>
                  <InputNumber value={calculIndividuel.prixConcurrent} onValueChange={(e) => setCalculIndividuel((s) => ({ ...s, prixConcurrent: e.value || 0 }))} min={0} suffix=" MGA" style={{ width: 260 }} />
                </div>

                {resultatCalculIndividuel && (
                  <div style={{ marginTop: 8, background: "#f8fafb", border: "1px dashed #d9e0ea", borderRadius: 8, padding: 10 }}>
                    <div>Prix HT : <strong>{resultatCalculIndividuel.prixHT.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}</strong></div>
                    <div>Prix TTC : <strong>{resultatCalculIndividuel.prixTTC.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}</strong></div>
                    <div>Marge : <strong>{resultatCalculIndividuel.margeMGA.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}</strong> ({resultatCalculIndividuel.margePourcentage}%)</div>
                    {calculIndividuel.prixConcurrent ? (
                      <div>Position : {resultatCalculIndividuel.prixTTC < calculIndividuel.prixConcurrent * 0.9 ? <Tag value="Compétitif" severity="success" /> : resultatCalculIndividuel.prixTTC > calculIndividuel.prixConcurrent * 1.1 ? <Tag value="Non compétitif" severity="danger" /> : <Tag value="Moyen" severity="warning" />}</div>
                    ) : (
                      <div>Position : <Tag value="N/A" /></div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Panneau droit – Simulation globale */}
            <Card title="Simulation globale" style={{ minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Marge globale simulée (%)</label>
                  <InputNumber value={margeGlobaleSimulee} onValueChange={(e) => setMargeGlobaleSimulee(e.value || 0)} min={0} max={100} suffix="%" style={{ width: 180 }} />
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Tag value={`Impact CA: ${impactCA.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}`} severity={impactCA >= 0 ? "success" : "warning"} />
                </div>
              </div>
              <div style={{ minHeight: 0 }}>
                <DataTable value={simulationGlobale} responsiveLayout="scroll" scrollable scrollHeight="300px" emptyMessage="Aucune donnée disponible">
                  <Column field="nom" header="Médicament" sortable style={{ minWidth: 180 }} />
                  <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 180 }} />
                  <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable style={{ minWidth: 140 }} />
                  <Column field="prixVenteActuel" header="Prix actuel" body={(row) => montantBody(row, 'prixVenteActuel')} sortable style={{ minWidth: 140 }} />
                  <Column field="prixVenteSimule" header="Prix simulé" body={(row) => montantBody(row, 'prixVenteSimule')} sortable style={{ minWidth: 140 }} />
                  <Column field="prixConcurrent" header="Prix concurrent" body={(row) => montantBody(row, 'prixConcurrent')} sortable style={{ minWidth: 140 }} />
                  <Column field="margeActuelle" header="Marge actuelle (%)" body={(row) => pourcentageBody(row, 'margeActuelle')} sortable style={{ minWidth: 160 }} />
                  <Column field="margeSimulee" header="Marge simulée (%)" body={(row) => pourcentageBody(row, 'margeSimulee')} sortable style={{ minWidth: 160 }} />
                  <Column field="rentabilite" header="Rentabilité (MGA)" body={(row) => montantBody(row, 'rentabilite')} sortable style={{ minWidth: 160 }} />
                  <Column field="positionConcurrentielle" header="Position" sortable style={{ minWidth: 140 }} />
                </DataTable>
              </div>
            </Card>

            {/* Panneau droit bas – Analyse comparative */}
            <Card title="Analyse comparative" style={{ minHeight: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Chart type="bar" data={chartData.comparaisonPrix} options={chartOptions.comparaisonPrix} style={{ maxWidth: "100%" }} />
                <Chart type="pie" data={chartData.rentabiliteParCategorie} options={chartOptions.rentabiliteParCategorie} style={{ maxWidth: 420, margin: "0 auto" }} />
              </div>
            </Card>
          </main>
        </div>

        {/* Barre d’état */}
        <footer style={{ background: "#eef1f6", borderTop: "1px solid #e3e6ee", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, color: "#2f3b52", gap: 12 }}>
          <span>État: prêt</span>
          <span>Raccourcis: Ctrl+E (CSV), Ctrl+P (PDF)</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
