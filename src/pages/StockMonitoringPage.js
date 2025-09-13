import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import Sidebar from "../components/Sidebar";

/**
 * StockMonitoringPage – style "client lourd"
 * - Fenêtre desktop (barre de titre + barre d’état)
 * - Filtres, recherche, exports CSV
 * - Actions: config seuils, générer commande, historique, tendances, planifier réappro
 */
export default function StockMonitoringPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const suppliers = [
    { id: 1, nom: "PharmaSup Madagascar" },
    { id: 2, nom: "MediDistrib Tana" },
    { id: 3, nom: "Océan Pharma" },
  ];

  const seed = [
    {
      id: 1,
      nom: "Paracétamol 500mg",
      stockActuel: 150,
      seuilMinimum: 100,
      seuilCritique: 50,
      consommationMoyenne: 200,
      stockSecurite: 150,
      derniereAchat: "2025-07-12",
      fournisseurHabituel: suppliers[0],
      prixUnitaire: 500,
      statut: "Faible",
    },
    {
      id: 2,
      nom: "Amoxicilline 1g",
      stockActuel: 30,
      seuilMinimum: 80,
      seuilCritique: 40,
      consommationMoyenne: 150,
      stockSecurite: 120,
      derniereAchat: "2025-08-02",
      fournisseurHabituel: suppliers[1],
      prixUnitaire: 1200,
      statut: "Critique",
    },
    {
      id: 3,
      nom: "Ibuprofène 400mg",
      stockActuel: 0,
      seuilMinimum: 100,
      seuilCritique: 50,
      consommationMoyenne: 180,
      stockSecurite: 140,
      derniereAchat: "2025-06-15",
      fournisseurHabituel: suppliers[2],
      prixUnitaire: 800,
      statut: "Rupture",
    },
    {
      id: 4,
      nom: "Aspirine 100mg",
      stockActuel: 300,
      seuilMinimum: 100,
      seuilCritique: 50,
      consommationMoyenne: 400,
      stockSecurite: 150,
      derniereAchat: "2025-09-01",
      fournisseurHabituel: suppliers[0],
      prixUnitaire: 300,
      statut: "Surconsommation",
    },
  ];

  const [stocks, setStocks] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  // Dialog Configuration seuils
  const emptySeuilForm = { id: null, nom: "", seuilMinimum: 0, seuilCritique: 0, stockSecurite: 0 };
  const [seuilForm, setSeuilForm] = useState(emptySeuilForm);
  const [showSeuilForm, setShowSeuilForm] = useState(false);

  // Dialog Historique
  const [showHistory, setShowHistory] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);

  const statuts = [
    { label: "Tous", value: null },
    { label: "Normal", value: "Normal" },
    { label: "Faible", value: "Faible" },
    { label: "Critique", value: "Critique" },
    { label: "Rupture", value: "Rupture" },
    { label: "Surconsommation", value: "Surconsommation" },
  ];

  // Filtrage
  const filtered = useMemo(() => {
    let list = [...stocks];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(
        (r) => r.nom.toLowerCase().includes(q) || r.fournisseurHabituel.nom.toLowerCase().includes(q)
      );
    }
    if (statutFilter) list = list.filter((r) => r.statut === statutFilter);
    return list;
  }, [stocks, globalFilter, statutFilter]);

  // --- Actions ---
  const configureSeuils = (row) => {
    setSeuilForm({
      id: row.id,
      nom: row.nom,
      seuilMinimum: row.seuilMinimum,
      seuilCritique: row.seuilCritique,
      stockSecurite: row.stockSecurite,
    });
    setShowSeuilForm(true);
  };

  const saveSeuilForm = () => {
    if (seuilForm.seuilMinimum < seuilForm.seuilCritique) {
      toast.current?.show({
        severity: "warn",
        summary: "Erreur",
        detail: "Le seuil minimum doit être supérieur au seuil critique.",
      });
      return;
    }
    setStocks((s) =>
      s.map((x) =>
        x.id === seuilForm.id
          ? {
              ...x,
              seuilMinimum: seuilForm.seuilMinimum,
              seuilCritique: seuilForm.seuilCritique,
              stockSecurite: seuilForm.stockSecurite,
            }
          : x
      )
    );
    toast.current?.show({ severity: "success", summary: "Mis à jour", detail: "Seuils configurés." });
    setShowSeuilForm(false);
  };

  const generateOrder = (row) => {
    confirmDialog({
      message: `Générer une commande pour ${row.nom} ?`,
      header: "Confirmation",
      icon: "pi pi-shopping-cart",
      accept: () => {
        const qty = Math.max(0, (row.stockSecurite || 0) - (row.stockActuel || 0));
        toast.current?.show({
          severity: "success",
          summary: "Commande générée",
          detail: `Commande simulée pour ${row.nom} (${qty} unités).`,
        });
      },
    });
  };

  const exportReport = (type) => {
    let csvContent;
    let filename;
    switch (type) {
      case "stockValorise":
        csvContent = [
          ["Nom", "Stock Actuel", "Prix Unitaire", "Valeur Totale"].join(","),
          ...filtered.map((r) =>
            [r.nom, r.stockActuel, r.prixUnitaire, (r.stockActuel * r.prixUnitaire).toLocaleString()].join(",")
          ),
        ].join("\n");
        filename = "stock_valorise.csv";
        break;
      case "rotation":
        csvContent = [
          ["Nom", "Stock Actuel", "Consommation Moyenne", "Rotation (mois)"].join(","),
          ...filtered.map((r) =>
            [r.nom, r.stockActuel, r.consommationMoyenne, (r.stockActuel / r.consommationMoyenne).toFixed(2)].join(",")
          ),
        ].join("\n");
        filename = "rotation_stock.csv";
        break;
      case "aCommander":
        csvContent = [
          ["Nom", "Stock Actuel", "Seuil Minimum", "Quantité à commander"].join(","),
          ...filtered
            .filter((r) => r.stockActuel < r.seuilMinimum)
            .map((r) => [r.nom, r.stockActuel, r.seuilMinimum, (r.stockSecurite || 0) - r.stockActuel].join(",")),
        ].join("\n");
        filename = "medicaments_a_commander.csv";
        break;
      case "previsions":
        csvContent = [
          ["Nom", "Stock Actuel", "Consommation Moyenne", "Stock Prévu (1 mois)"].join(","),
          ...filtered.map((r) =>
            [r.nom, r.stockActuel, r.consommationMoyenne, Math.max(0, r.stockActuel - r.consommationMoyenne)].join(",")
          ),
        ].join("\n");
        filename = "previsions_besoin.csv";
        break;
      case "abc":
        csvContent = [
          ["Nom", "Valeur Totale", "Catégorie"].join(","),
          ...filtered
            .map((r) => ({
              nom: r.nom,
              valeur: r.stockActuel * r.prixUnitaire,
              categorie: r.stockActuel * r.prixUnitaire > 100000 ? "A" : r.stockActuel * r.prixUnitaire > 50000 ? "B" : "C",
            }))
            .sort((a, b) => b.valeur - a.valeur)
            .map((r) => [r.nom, r.valeur.toLocaleString(), r.categorie].join(",")),
        ].join("\n");
        filename = "analyse_abc.csv";
        break;
      default:
        return;
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: "success", summary: "Exporté", detail: `Rapport ${type} exporté.` });
  };

  const planReappro = (row) => {
    toast.current?.show({
      severity: "info",
      summary: "Planification",
      detail: `Réapprovisionnement simulé pour ${row.nom} prévu.`,
    });
  };

  const viewHistory = (row) => {
    setHistoryFor(row);
    setShowHistory(true);
  };

  const analyzeTrends = (row) => {
    toast.current?.show({
      severity: "info",
      summary: "Analyse",
      detail: `Analyse des tendances simulée pour ${row.nom}.`,
    });
  };

  // --- Rendus colonnes ---
  const statutBody = (row) => (
    <Tag
      value={row.statut}
      icon={
        row.statut === "Faible"
          ? "pi pi-exclamation-circle"
          : row.statut === "Critique"
          ? "pi pi-exclamation-triangle"
          : row.statut === "Rupture"
          ? "pi pi-times-circle"
          : row.statut === "Surconsommation"
          ? "pi pi-chart-line"
          : ""
      }
      severity={
        row.statut === "Normal"
          ? "success"
          : row.statut === "Faible"
          ? "warning"
          : row.statut === "Critique" || row.statut === "Rupture"
          ? "danger"
          : "info"
      }
    />
  );

  const valeurBody = (row) =>
    (row.stockActuel * row.prixUnitaire).toLocaleString("fr-FR", { style: "currency", currency: "MGA" });

  const actionsBody = (row) => (
    <div style={{ display: "flex", gap: 6 }}>
      <Button
        icon="pi pi-cog"
        className="p-button-text p-button-sm"
        onClick={() => configureSeuils(row)}
        tooltip="Configurer seuils"
      />
      <Button
        icon="pi pi-shopping-cart"
        className="p-button-text p-button-sm"
        onClick={() => generateOrder(row)}
        tooltip="Générer commande"
      />
      <Button
        icon="pi pi-history"
        className="p-button-text p-button-sm"
        onClick={() => viewHistory(row)}
        tooltip="Historique"
      />
      <Button
        icon="pi pi-chart-line"
        className="p-button-text p-button-sm"
        onClick={() => analyzeTrends(row)}
        tooltip="Analyser tendances"
      />
      <Button
        icon="pi pi-calendar-plus"
        className="p-button-text p-button-sm"
        onClick={() => planReappro(row)}
        tooltip="Planifier réappro"
      />
    </div>
  );

  // --- Tableau de bord (petit résumé) ---
  const dashboardData = useMemo(
    () => ({
      totalMedicaments: stocks.length,
      stockFaible: stocks.filter((s) => s.statut === "Faible").length,
      stockCritique: stocks.filter((s) => s.statut === "Critique").length,
      stockRupture: stocks.filter((s) => s.statut === "Rupture").length,
      stockSurconsommation: stocks.filter((s) => s.statut === "Surconsommation").length,
      valeurTotale: stocks.reduce((sum, s) => sum + s.stockActuel * s.prixUnitaire, 0),
    }),
    [stocks]
  );

  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Stocks</span>
      <Tag value={`${filtered.length}`} style={{ background: "#e6faf4", color: "#0b6b57", border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Dropdown
        value={statutFilter}
        options={statuts}
        onChange={(e) => setStatutFilter(e.value)}
        placeholder="Statut"
        style={{ minWidth: 140 }}
      />
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (médicament, fournisseur)"
        />
      </span>
      <Dropdown
        options={[
          { label: "Stock valorisé", value: "stockValorise" },
          { label: "Rotation des stocks", value: "rotation" },
          { label: "Médicaments à commander", value: "aCommander" },
          { label: "Prévisions de besoin", value: "previsions" },
          { label: "Analyse ABC", value: "abc" },
        ]}
        onChange={(e) => exportReport(e.value)}
        placeholder="Exporter rapport"
        style={{ minWidth: 200 }}
      />
    </div>
  );

  // --- UI style "client lourd" ---
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
      <ConfirmDialog />

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
            MediFinder • Monitoring Stock
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
            {/* Dashboard mini-cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Card title="Médicaments totaux" subTitle={dashboardData.totalMedicaments} />
              <Card title="Stock faible" subTitle={dashboardData.stockFaible} style={{ color: "#f59e0b" }} />
              <Card title="Stock critique" subTitle={dashboardData.stockCritique} style={{ color: "#dc2626" }} />
              <Card title="Ruptures" subTitle={dashboardData.stockRupture} />
              <Card title="Surconsommation" subTitle={dashboardData.stockSurconsommation} />
              <Card
                title="Valeur totale"
                subTitle={dashboardData.valeurTotale.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}
              />
            </div>

            {/* Liste */}
            <Card
              title="Liste des Stocks"
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
              }}
            >
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
              <div style={{ minHeight: 0 }}>
                <DataTable
                  value={filtered}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  scrollable
                  scrollHeight="flex"
                  selection={selected}
                  onSelectionChange={(e) => setSelected(e.value)}
                  dataKey="id"
                  responsiveLayout="scroll"
                  stripedRows
                >
                  <Column field="nom" header="Médicament" sortable style={{ minWidth: 200 }} />
                  <Column field="stockActuel" header="Stock actuel" sortable style={{ width: 120 }} />
                  <Column field="seuilMinimum" header="Seuil minimum" sortable style={{ width: 120 }} />
                  <Column field="seuilCritique" header="Seuil critique" sortable style={{ width: 120 }} />
                  <Column field="consommationMoyenne" header="Conso. moyenne" sortable style={{ width: 140 }} />
                  <Column field="stockSecurite" header="Stock sécurité" sortable style={{ width: 120 }} />
                  <Column field="derniereAchat" header="Dernier achat" sortable style={{ width: 140 }} />
                  <Column field="fournisseurHabituel.nom" header="Fournisseur" sortable style={{ minWidth: 160 }} />
                  <Column header="Valeur" body={valeurBody} style={{ minWidth: 140, textAlign: "right" }} />
                  <Column field="statut" header="Statut" body={statutBody} style={{ width: 160 }} />
                  <Column header="Actions" body={actionsBody} style={{ width: 300 }} frozen alignFrozen="right" />
                </DataTable>
              </div>
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
          <span>{filtered.length} élément(s)</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Dialog Configuration seuils */}
      <Dialog
        header={`Configurer seuils — ${seuilForm.nom || ""}`}
        visible={showSeuilForm}
        style={{ width: "500px", maxWidth: "95vw" }}
        modal
        onHide={() => setShowSeuilForm(false)}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <span className="p-float-label">
            <InputText
              id="seuilMinimum"
              type="number"
              value={seuilForm.seuilMinimum}
              onChange={(e) =>
                setSeuilForm({ ...seuilForm, seuilMinimum: parseInt(e.target.value || "0", 10) })
              }
              style={{ width: "100%" }}
            />
            <label htmlFor="seuilMinimum">Seuil minimum</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="seuilCritique"
              type="number"
              value={seuilForm.seuilCritique}
              onChange={(e) =>
                setSeuilForm({ ...seuilForm, seuilCritique: parseInt(e.target.value || "0", 10) })
              }
              style={{ width: "100%" }}
            />
            <label htmlFor="seuilCritique">Seuil critique</label>
          </span>
          <span className="p-float-label">
            <InputText
              id="stockSecurite"
              type="number"
              value={seuilForm.stockSecurite}
              onChange={(e) =>
                setSeuilForm({ ...seuilForm, stockSecurite: parseInt(e.target.value || "0", 10) })
              }
              style={{ width: "100%" }}
            />
            <label htmlFor="stockSecurite">Stock de sécurité</label>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowSeuilForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveSeuilForm} />
        </div>
      </Dialog>

      {/* Dialog Historique des mouvements (mock) */}
      <Dialog
        header={`Historique — ${historyFor?.nom ?? "Médicament"}`}
        visible={showHistory}
        style={{ width: "760px", maxWidth: "95vw" }}
        modal
        onHide={() => setShowHistory(false)}
      >
        <div style={{ marginBottom: 8, color: "#6b7280" }}>Données fictives pour la maquette.</div>
        <DataTable
          value={[
            { date: "2025-07-12", type: "Entrée", quantite: 200, source: "Commande CMD-2025-001" },
            { date: "2025-08-01", type: "Sortie", quantite: 50, source: "Vente" },
            { date: "2025-09-01", type: "Sortie", quantite: 30, source: "Vente" },
          ]}
          paginator
          rows={5}
          responsiveLayout="scroll"
        >
          <Column field="date" header="Date" style={{ minWidth: 120 }} />
          <Column field="type" header="Type" style={{ minWidth: 100 }} />
          <Column field="quantite" header="Quantité" style={{ width: 120 }} />
          <Column field="source" header="Source" style={{ minWidth: 200 }} />
        </DataTable>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Button label="Fermer" className="p-button-text" onClick={() => setShowHistory(false)} />
        </div>
      </Dialog>
    </div>
  );
}
