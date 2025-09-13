import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { jsPDF } from "jspdf";
import Sidebar from "../components/Sidebar";
import "chart.js/auto";

/**
 * StrategicAssistantPage — style "client lourd" (fenêtre desktop)
 * - Recos IA, alertes, graphiques, assistant conversationnel
 * - Exports PDF
 */
export default function StrategicAssistantPage() {
  const toast = useRef(null);

  // --- Données mock ---
  const medicaments = [
    {
      id: "MED-001",
      nom: "Paracétamol 500mg",
      categorie: "Médicaments sur ordonnance",
      prixAchat: 1000,
      prixVente: 1500,
      stock: 50,
      ventesMensuelles: 1000,
      rotation: 20,
      saisonnalite: 1.2,
    },
    {
      id: "MED-002",
      nom: "Ibuprofène 400mg",
      categorie: "Médicaments sans ordonnance",
      prixAchat: 1500,
      prixVente: 2000,
      stock: 200,
      ventesMensuelles: 800,
      rotation: 16,
      saisonnalite: 1.0,
    },
    {
      id: "MED-003",
      nom: "Crème hydratante",
      categorie: "Produits cosmétiques",
      prixAchat: 5000,
      prixVente: 7500,
      stock: 0,
      ventesMensuelles: 300,
      rotation: 6,
      saisonnalite: 0.8,
    },
    {
      id: "MED-004",
      nom: "Thermomètre",
      categorie: "Matériel médical",
      prixAchat: 20000,
      prixVente: 24000,
      stock: 10,
      ventesMensuelles: 50,
      rotation: 2,
      saisonnalite: 1.0,
    },
    {
      id: "MED-005",
      nom: "Vitamine C",
      categorie: "Produits de parapharmacie",
      prixAchat: 3000,
      prixVente: 4500,
      stock: 150,
      ventesMensuelles: 500,
      rotation: 10,
      saisonnalite: 1.5,
    },
  ];

  // Prix concurrents mock (variation ±20%)
  const concurrents = medicaments.map((m, idx) => ({
    id: m.id,
    // seed simple pour rester "stable"
    prixConcurrent: m.prixVente * (1 + (((idx + 1) * 7) % 41 / 100 - 0.2)),
  }));

  // Configuration (marges/tva)
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
  };

  // --- États
  const [selectedPeriode, setSelectedPeriode] = useState("2025-09");
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatResponses, setChatResponses] = useState([]);

  const periodes = [
    { label: "2025-07", value: "2025-07" },
    { label: "2025-08", value: "2025-08" },
    { label: "2025-09", value: "2025-09" },
  ];

  const categories = [
    { label: "Toutes", value: null },
    { label: "Médicaments sur ordonnance", value: "Médicaments sur ordonnance" },
    { label: "Médicaments sans ordonnance", value: "Médicaments sans ordonnance" },
    { label: "Produits de parapharmacie", value: "Produits de parapharmacie" },
    { label: "Produits cosmétiques", value: "Produits cosmétiques" },
    { label: "Matériel médical", value: "Matériel médical" },
  ];

  // --- Recommandations (mock)
  const recommandations = {
    aPromouvoir: medicaments
      .filter((m) => m.ventesMensuelles > 700 && m.rotation > 15 && m.saisonnalite > 1.0)
      .map((m) => ({
        ...m,
        impact: (m.prixVente - m.prixAchat) * m.ventesMensuelles * 0.1,
        facilite: "Élevée",
      })),
    enCroissance: medicaments
      .filter((m) => m.ventesMensuelles > 500 && m.saisonnalite > 1.2)
      .map((m) => ({
        ...m,
        impact: (m.prixVente - m.prixAchat) * m.ventesMensuelles * 0.15,
        facilite: "Moyenne",
      })),
    aEcouler: medicaments
      .filter((m) => m.rotation < 10 && m.stock > 0)
      .map((m) => ({
        ...m,
        impact: (m.prixVente - m.prixAchat) * m.stock * 0.5,
        facilite: "Moyenne",
      })),
    alternatives: medicaments
      .filter((m) => m.stock === 0)
      .map((m) => ({
        ...m,
        alternative: medicaments.find((alt) => alt.categorie === m.categorie && alt.stock > 0)?.nom || "N/A",
        impact: 0,
        facilite: "Basse",
      })),
    nouveaux: [
      {
        id: "MED-006",
        nom: "Aspirine 100mg",
        categorie: "Médicaments sans ordonnance",
        prixAchat: 1200,
        prixVente: 1800,
        stock: 100,
        ventesMensuelles: 0,
        impact: 10000,
        facilite: "Élevée",
      },
    ],
  };

  // --- Optimisation des bénéfices (mock)
  const optimisationBenefices = {
    ajustementsPrix: medicaments
      .map((m) => {
        const prixConcurrent = concurrents.find((c) => c.id === m.id)?.prixConcurrent || m.prixVente;
        const marge = (((m.prixVente - m.prixAchat) / m.prixAchat) * 100).toFixed(2);
        return {
          ...m,
          prixSuggere: Math.round(prixConcurrent * 0.95),
          impact: Math.round((prixConcurrent * 0.95 - m.prixVente) * m.ventesMensuelles),
          margeActuelle: marge,
        };
      })
      .filter((m) => Math.abs(m.prixSuggere - m.prixVente) > 100),
    reallocationStock: medicaments
      .filter((m) => m.stock > 100 && m.rotation < 10)
      .map((m) => ({
        ...m,
        suggestion: `Réduire le stock à ${Math.round(m.stock / 2)} unités`,
        impact: Math.round(m.prixAchat * m.stock * 0.2),
      })),
    optimisationMarges: Object.keys(configuration.margesParCategorie).map((cat) => ({
      categorie: cat,
      margeActuelle: configuration.margesParCategorie[cat],
      margeSuggeree: configuration.margesParCategorie[cat] + 5,
      impact: medicaments
        .filter((m) => m.categorie === cat)
        .reduce((sum, m) => sum + (m.prixVente - m.prixAchat) * m.ventesMensuelles * 0.05, 0),
    })),
    equilibreStock: medicaments
      .filter((m) => m.rotation < 5 && m.stock > 50)
      .map((m) => ({
        ...m,
        suggestion: `Lancer une promotion de -20%`,
        impact: Math.round(m.prixVente * m.ventesMensuelles * 0.2),
      })),
    fidelisation: [
      { strategie: "Programme de points pour clients réguliers", impact: 50000, facilite: "Moyenne" },
      { strategie: "Remise sur achats groupés", impact: 30000, facilite: "Élevée" },
    ],
  };

  // --- Suggestions stratégiques (mock)
  const suggestionsStrategiques = {
    opportunitesCroissance: [
      { suggestion: "Élargir la gamme de produits cosmétiques", impact: 100000, facilite: "Moyenne" },
      { suggestion: "Cibler les jeunes parents avec produits pour bébés", impact: 80000, facilite: "Élevée" },
    ],
    risques: [
      { risque: "Rupture de stock sur Paracétamol", impact: -50000, mitigation: "Commander 1000 unités" },
      { risque: "Concurrence accrue sur Ibuprofène", impact: -30000, mitigation: "Ajuster prix à 95% du concurrent" },
    ],
    planificationCommandes: medicaments
      .filter((m) => m.stock < 50 && m.ventesMensuelles > 500)
      .map((m) => ({
        ...m,
        suggestion: `Commander ${m.ventesMensuelles * 2} unités`,
        impact: m.prixAchat * m.ventesMensuelles,
      })),
    segmentsClients: [
      { segment: "Clients réguliers", suggestion: "Offrir 10% de remise", impact: 40000 },
      { segment: "Nouveaux clients", suggestion: "Campagne publicitaire ciblée", impact: 60000 },
    ],
    predictionsSaison: [{ periode: "Hiver 2025", suggestion: "Augmenter stock de Vitamine C", impact: 70000 }],
  };

  // --- Alertes (mock)
  const alertesIntelligentes = [
    { type: "Tendance", message: "Hausse des ventes de Vitamine C (+20%)", severite: "info" },
    { type: "Anomalie", message: "Crème hydratante en rupture", severite: "danger" },
    { type: "Opportunité", message: "Demande croissante pour produits bébés", severite: "success" },
  ];

  // Palette prédéfinie pour éviter couleurs aléatoires
  const palette = [
    "#2563eb",
    "#16a085",
    "#eab308",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#f97316",
    "#0ea5e9",
  ];

  // --- Charts
  const chartData = {
    previsionsVentes: {
      labels: periodes.map((p) => p.label),
      datasets: medicaments
        .filter((m) => !selectedCategorie || m.categorie === selectedCategorie)
        .map((m, i) => ({
          label: m.nom,
          data: periodes.map((_, j) =>
            Math.round(m.ventesMensuelles * (1 + (((i + 1) * (j + 2)) % 5 - 2) / 100))
          ),
          fill: false,
          borderColor: palette[i % palette.length],
          tension: 0.35,
        })),
    },
    tendancesMarges: {
      labels: periodes.map((p) => p.label),
      datasets: [
        {
          label: "Marge moyenne (%)",
          data: periodes.map((_, i) => (25 + ((i + 1) * 3) % 10).toFixed(2)),
          backgroundColor: palette[0],
        },
      ],
    },
    evolutionStocks: {
      labels: medicaments.map((m) => m.nom),
      datasets: [
        { label: "Stock actuel", data: medicaments.map((m) => m.stock), backgroundColor: palette[1] },
      ],
    },
  };

  const chartOptions = {
    previsionsVentes: {
      plugins: { legend: { position: "top" } },
      scales: { y: { beginAtZero: true, title: { display: true, text: "Ventes" } } },
    },
    tendancesMarges: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, title: { display: true, text: "Marge (%)" } } },
    },
    evolutionStocks: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, title: { display: true, text: "Stock" } } },
    },
  };

  // --- Chatbot (simulation)
  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    let response = "Désolé, je ne comprends pas votre demande.";
    const q = chatInput.toLowerCase();
    if (q.includes("prix")) {
      response =
        "Je suggère d’ajuster les prix des produits à faible rotation (ex: Crème hydratante) avec une remise de 20%.";
    } else if (q.includes("stock")) {
      response = "Priorisez la commande de Paracétamol (1000 unités) pour éviter une rupture.";
    } else if (q.includes("client")) {
      response = "Ciblez les clients réguliers avec un programme de fidélité (+10% ventes).";
    }
    setChatResponses((prev) => [...prev, { question: chatInput, response }]);
    setChatInput("");
    toast.current?.show({ severity: "info", summary: "Assistant IA", detail: "Réponse générée." });
  };

  // --- Actions
  const appliquerAction = (type, id, suggestion) => {
    toast.current?.show({ severity: "success", summary: "Action appliquée", detail: `${type}: ${suggestion}` });
  };

  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Assistant IA - Conseils Stratégiques - ${selectedPeriode}`, 20, 20);
    doc.setFontSize(12);
    let y = 30;

    doc.text("Recommandations du jour", 20, y);
    y += 8;
    recommandations.aPromouvoir.forEach((r) => {
      doc.text(
        `${r.nom}: Promouvoir (Impact: ${r.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })})`,
        20,
        y
      );
      y += 6;
    });
    recommandations.enCroissance.forEach((r) => {
      doc.text(
        `${r.nom}: Capitaliser (Impact: ${r.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })})`,
        20,
        y
      );
      y += 6;
    });
    recommandations.aEcouler.forEach((r) => {
      doc.text(
        `${r.nom}: Écouler (Impact: ${r.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })})`,
        20,
        y
      );
      y += 6;
    });

    y += 4;
    doc.text("Conseils d’optimisation des bénéfices", 20, y);
    y += 8;
    optimisationBenefices.ajustementsPrix.forEach((r) => {
      doc.text(
        `${r.nom}: Prix suggéré ${r.prixSuggere.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`,
        20,
        y
      );
      y += 6;
    });

    y += 4;
    doc.text("Suggestions stratégiques", 20, y);
    y += 8;
    suggestionsStrategiques.opportunitesCroissance.forEach((s) => {
      doc.text(
        `${s.suggestion}: Impact ${s.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`,
        20,
        y
      );
      y += 6;
    });

    y += 4;
    doc.text("Alertes intelligentes", 20, y);
    y += 8;
    alertesIntelligentes.forEach((a) => {
      doc.text(`${a.type}: ${a.message}`, 20, y);
      y += 6;
    });

    doc.save(`conseils_strategiques_${selectedPeriode}.pdf`);
    toast.current?.show({ severity: "success", summary: "Export", detail: "Conseils exportés en PDF." });
  };

  // --- Rendus colonnes
  const montantBody = (row, field) =>
    row[field] != null ? row[field].toLocaleString("fr-FR", { style: "currency", currency: "MGA" }) : "-";
  const actionBody = (row, type, suggestionField) => (
    <Button
      label="Appliquer"
      className="p-button-sm p-button-outlined"
      onClick={() => appliquerAction(type, row.id, row[suggestionField] || row.nom)}
    />
  );

  // --- Toolbar
  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Assistant IA — Conseils Stratégiques</span>
      <Dropdown value={selectedPeriode} options={periodes} onChange={(e) => setSelectedPeriode(e.value)} style={{ width: 140 }} />
      <Dropdown
        value={selectedCategorie}
        options={categories}
        onChange={(e) => setSelectedCategorie(e.value)}
        placeholder="Filtrer par catégorie"
        style={{ width: 220 }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={exporterPDF} className="p-button-outlined" />
    </div>
  );

  // --- UI style "client lourd"
  return (
    <div
      style={{
        fontFamily: "Inter, Segoe UI, system-ui, -apple-system, Arial",
        background: "#e6e9ef",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Toast ref={toast} />

      <div
        className="app-window"
        style={{
          width: "min(1400px,100vw)",
          height: "min(900px,100vh)",
          background: "#f7f8fb",
          borderRadius: 12,
          boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
          display: "grid",
          gridTemplateRows: "44px 1fr 28px",
          overflow: "hidden",
        }}
      >
        {/* Barre de titre */}
        <div
          style={{
            background: "linear-gradient(180deg,#fdfdfd,#f1f3f7)",
            borderBottom: "1px solid #e3e6ee",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 12px",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff605c" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ffbd44" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#00ca4e" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>
            MediFinder • Assistant IA — Conseils
          </div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", minHeight: 0 }}>
          <Sidebar title="Modules" />

          <main
            style={{
              flex: 1,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflow: "auto",
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />

            {/* Recommandations du jour */}
            <Card
              title="Recommandations du Jour"
              style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {recommandations.aPromouvoir.slice(0, 3).map((r) => (
                  <Card key={r.id} subTitle={r.nom} style={{ borderLeft: "4px solid #2563eb" }}>
                    <p>Promouvoir</p>
                    <p>Impact: {r.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}</p>
                    <p>Facilité: {r.facilite}</p>
                    <Button
                      label="Appliquer"
                      className="p-button-sm"
                      onClick={() => appliquerAction("Promotion", r.id, r.nom)}
                    />
                  </Card>
                ))}
                {recommandations.enCroissance.slice(0, 3).map((r) => (
                  <Card key={r.id} subTitle={r.nom} style={{ borderLeft: "4px solid #16a085" }}>
                    <p>Capitaliser</p>
                    <p>Impact: {r.impact.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}</p>
                    <p>Facilité: {r.facilite}</p>
                    <Button
                      label="Appliquer"
                      className="p-button-sm"
                      onClick={() => appliquerAction("Capitalisation", r.id, r.nom)}
                    />
                  </Card>
                ))}
              </div>
            </Card>

            {/* Alertes */}
            <Card title="Alertes Intelligentes" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {alertesIntelligentes.map((a, i) => (
                  <Tag key={i} value={`${a.type}: ${a.message}`} severity={a.severite} />
                ))}
              </div>
            </Card>

            {/* Graphiques */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              <Card title="Prévisions de Ventes" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
                <Chart type="line" data={chartData.previsionsVentes} options={chartOptions.previsionsVentes} />
              </Card>
              <Card title="Tendances de Marge" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
                <Chart type="bar" data={chartData.tendancesMarges} options={chartOptions.tendancesMarges} />
              </Card>
              <Card title="Évolution des Stocks" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
                <Chart type="bar" data={chartData.evolutionStocks} options={chartOptions.evolutionStocks} />
              </Card>
            </div>

            {/* Assistant conversationnel */}
            <Card title="Assistant Conversationnel" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <InputText
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Posez une question à l’IA..."
                    style={{ flex: 1 }}
                  />
                  <Button label="Envoyer" icon="pi pi-send" onClick={handleChatSubmit} />
                </div>
                <Panel header="Historique des réponses">
                  {chatResponses.length === 0 && <div style={{ color: "#6b7280" }}>Aucune interaction pour l’instant.</div>}
                  {chatResponses.map((r, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <p style={{ margin: 0 }}>
                        <strong>Question:</strong> {r.question}
                      </p>
                      <p style={{ margin: "4px 0 0 0" }}>
                        <strong>Réponse:</strong> {r.response}
                      </p>
                    </div>
                  ))}
                </Panel>
              </div>
            </Card>

            {/* Détails des recommandations */}
            <Card title="Détails des Recommandations" style={{ borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)" }}>
              <DataTable
                value={recommandations
                  .aPromouvoir.concat(
                    recommandations.enCroissance,
                    recommandations.aEcouler,
                    recommandations.alternatives,
                    recommandations.nouveaux
                  )
                  .filter((r) => !selectedCategorie || r.categorie === selectedCategorie)}
                responsiveLayout="scroll"
                emptyMessage="Aucune recommandation"
                paginator
                rows={8}
              >
                <Column field="nom" header="Produit" sortable />
                <Column field="categorie" header="Catégorie" sortable />
                <Column field="impact" header="Impact" body={(row) => montantBody(row, "impact")} sortable />
                <Column field="facilite" header="Facilité" sortable />
                <Column body={(row) => actionBody(row, "Recommandation", "nom")} header="Action" />
              </DataTable>
            </Card>
          </main>
        </div>

        {/* Barre d’état */}
        <footer
          style={{
            background: "#eef1f6",
            borderTop: "1px solid #e3e6ee",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            fontSize: 12,
            color: "#2f3b52",
          }}
        >
          <span>Assistant IA actif</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
