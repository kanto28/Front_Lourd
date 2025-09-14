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

export default function StockMonitoringPage() {
  const toast = useRef(null);

  // --- Données mock ---
  const suppliers = [
    { id: 1, nom: "PharmaSup Madagascar" },
    { id: 2, nom: "MediDistrib Tana" },
    { id: 3, nom: "Océan Pharma" },
  ];

  const seed = [
    { id: 1, nom: "Paracétamol 500mg", stockActuel: 150, seuilMinimum: 100, seuilCritique: 50, consommationMoyenne: 200, stockSecurite: 150, derniereAchat: "2025-07-12", fournisseurHabituel: suppliers[0], prixUnitaire: 500,  statut: "Faible" },
    { id: 2, nom: "Amoxicilline 1g",  stockActuel: 30,  seuilMinimum: 80,  seuilCritique: 40, consommationMoyenne: 150, stockSecurite: 120, derniereAchat: "2025-08-02", fournisseurHabituel: suppliers[1], prixUnitaire: 1200, statut: "Critique" },
    { id: 3, nom: "Ibuprofène 400mg", stockActuel: 0,   seuilMinimum: 100, seuilCritique: 50, consommationMoyenne: 180, stockSecurite: 140, derniereAchat: "2025-06-15", fournisseurHabituel: suppliers[2], prixUnitaire: 800,  statut: "Rupture" },
    { id: 4, nom: "Aspirine 100mg",    stockActuel: 300, seuilMinimum: 100, seuilCritique: 50, consommationMoyenne: 400, stockSecurite: 150, derniereAchat: "2025-09-01", fournisseurHabituel: suppliers[0], prixUnitaire: 300,  statut: "Surconsommation" },
  ];

  const [stocks, setStocks] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  // Dialogs (config seuils / historique)
  const emptySeuilForm = { id: null, nom: "", seuilMinimum: 0, seuilCritique: 0, stockSecurite: 0 };
  const [seuilForm, setSeuilForm] = useState(emptySeuilForm);
  const [showSeuilForm, setShowSeuilForm] = useState(false);
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

  // Actions
  const configureSeuils = (row) => {
    setSeuilForm({ id: row.id, nom: row.nom, seuilMinimum: row.seuilMinimum, seuilCritique: row.seuilCritique, stockSecurite: row.stockSecurite });
    setShowSeuilForm(true);
  };
  const saveSeuilForm = () => {
    if (seuilForm.seuilMinimum < seuilForm.seuilCritique) {
      toast.current?.show({ severity: "warn", summary: "Erreur", detail: "Le seuil minimum doit être supérieur au seuil critique." });
      return;
    }
    setStocks((s) => s.map((x) => x.id === seuilForm.id ? { ...x, ...seuilForm } : x));
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
        toast.current?.show({ severity: "success", summary: "Commande générée", detail: `Commande simulée pour ${row.nom} (${qty} unités).` });
      },
    });
  };
  const viewHistory = (row) => { setHistoryFor(row); setShowHistory(true); };
  const analyzeTrends = (row) => { toast.current?.show({ severity: "info", summary: "Analyse", detail: `Analyse des tendances simulée pour ${row.nom}.` }); };
  const planReappro = (row) => { toast.current?.show({ severity: "info", summary: "Planification", detail: `Réapprovisionnement simulé pour ${row.nom} prévu.` }); };

  // Rendus colonnes
  const STATUT_UI = {
    Normal:          { label: "Normal",   severity: "success", icon: "" },
    Faible:          { label: "Faible",   severity: "warning", icon: "pi pi-exclamation-circle" },
    Critique:        { label: "Crit.",    severity: "danger",  icon: "pi pi-exclamation-triangle" },
    Rupture:         { label: "Rupt.",    severity: "danger",  icon: "pi pi-times-circle" },
    Surconsommation: { label: "Surconso", severity: "info",    icon: "pi pi-chart-line" },
  };
  const statutBody = (row) => {
    const ui = STATUT_UI[row.statut] ?? { label: row.statut, severity: "secondary", icon: "" };
    return (
      <Tag
        value={ui.label}
        icon={ui.icon}
        severity={ui.severity}
        className="status-tag"
        style={{ lineHeight: 1, padding: "0.2rem 0.5rem", fontSize: 12, whiteSpace: "nowrap" }}
      />
    );
  };
  const valeurBody = (row) => (row.stockActuel * row.prixUnitaire).toLocaleString("fr-FR", { style: "currency", currency: "MGA" });
  const actionsBody = (row) => (
    <div style={{ display: "flex", gap: 6 }}>
      <Button icon="pi pi-cog" className="p-button-text p-button-sm" onClick={() => configureSeuils(row)} tooltip="Configurer seuils" />
      <Button icon="pi pi-shopping-cart" className="p-button-text p-button-sm" onClick={() => generateOrder(row)} tooltip="Générer commande" />
      <Button icon="pi pi-history" className="p-button-text p-button-sm" onClick={() => viewHistory(row)} tooltip="Historique" />
      <Button icon="pi pi-chart-line" className="p-button-text p-button-sm" onClick={() => analyzeTrends(row)} tooltip="Analyser tendances" />
      <Button icon="pi pi-calendar-plus" className="p-button-text p-button-sm" onClick={() => planReappro(row)} tooltip="Planifier réappro" />
    </div>
  );

  // Dashboard
  const dashboardData = useMemo(() => ({
    totalMedicaments: stocks.length,
    stockFaible: stocks.filter((s) => s.statut === "Faible").length,
    stockCritique: stocks.filter((s) => s.statut === "Critique").length,
    stockRupture: stocks.filter((s) => s.statut === "Rupture").length,
    stockSurconsommation: stocks.filter((s) => s.statut === "Surconsommation").length,
    valeurTotale: stocks.reduce((sum, s) => sum + s.stockActuel * s.prixUnitaire, 0),
  }), [stocks]);

  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Stocks</span>
      <Tag value={`${filtered.length}`} style={{ background: "#e6faf4", color: "#0b6b57", border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Dropdown value={statutFilter} options={statuts} onChange={(e) => setStatutFilter(e.value)} placeholder="Statut" style={{ minWidth: 140 }} />
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (médicament, fournisseur)" />
      </span>
      <Dropdown
        options={[
          { label: "Stock valorisé", value: "stockValorise" },
          { label: "Rotation des stocks", value: "rotation" },
          { label: "Médicaments à commander", value: "aCommander" },
          { label: "Prévisions de besoin", value: "previsions" },
          { label: "Analyse ABC", value: "abc" },
        ]}
        onChange={(e) => {/* export handled ailleurs si besoin */}}
        placeholder="Exporter rapport"
        style={{ minWidth: 200 }}
      />
    </div>
  );

  // UI
  return (
    <div style={{ fontFamily: "Inter, Segoe UI, system-ui, -apple-system, Arial", background: "#e6e9ef", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="app-window" style={{ width: "min(1400px,100vw)", height: "min(900px,100vh)", background: "#f7f8fb", borderRadius: 12, boxShadow: "0 18px 40px rgba(0,0,0,0.18)", display: "grid", gridTemplateRows: "44px 1fr 28px", overflow: "hidden" }}>
        {/* Barre de titre */}
        <div style={{ background: "linear-gradient(180deg,#fdfdfd,#f1f3f7)", borderBottom: "1px solid #e3e6ee", display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff605c" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ffbd44" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#00ca4e" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Monitoring Stock</div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", minHeight: 0, overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 280, flexShrink: 0, height: "100%", overflowY: "auto", background: "#fff", borderRight: "1px solid #e3e6ee" }}>
            <Sidebar title="Modules" />
          </div>

          {/* Contenu */}
          <main style={{ flex: 1, minWidth: 0, padding: 16, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
            {/* Dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, flexShrink: 0 }}>
              <Card title="Médicaments totaux" subTitle={dashboardData.totalMedicaments} />
              <Card title="Stock faible" subTitle={dashboardData.stockFaible} style={{ color: "#f59e0b" }} />
              <Card title="Stock critique" subTitle={dashboardData.stockCritique} style={{ color: "#dc2626" }} />
              <Card title="Ruptures" subTitle={dashboardData.stockRupture} />
              <Card title="Surconsommation" subTitle={dashboardData.stockSurconsommation} />
              <Card title="Valeur totale" subTitle={dashboardData.valeurTotale.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })} />
            </div>

            {/* Liste scrollable */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <Card title="Liste des Stocks" style={{ background: "#fff", border: "1px solid #d7d7d7", borderRadius: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.06)", display: "grid", gridTemplateRows: "auto 1fr", minHeight: 0 }}>
                <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
                <div style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <DataTable
                    value={filtered}
                    paginator rows={10} rowsPerPageOptions={[10, 20, 50]}
                    scrollable scrollHeight="flex"
                    size="small"
                    resizableColumns columnResizeMode="fit" reorderableColumns
                    tableStyle={{ tableLayout: "fixed", minWidth: "1050px" }}
                    rowHover stripedRows
                    selection={selected} onSelectionChange={(e) => setSelected(e.value)} dataKey="id"
                    responsiveLayout="scroll"
                    rowClassName={(r) => ({
                      "row-low":  r.statut === "Faible",
                      "row-crit": ["Critique","Rupture"].includes(r.statut),
                      "row-over": r.statut === "Surconsommation",
                    })}
                  >
                    {/* >>> Nom visible et gelé à gauche */}
                    <Column field="nom" header="Nom" sortable bodyClassName="cell-ellipsis" style={{ minWidth: 220 }} frozen alignFrozen="left" />

                    <Column field="stockActuel" header="Stock" sortable bodyClassName="cell-ellipsis" style={{ width: 110 }} />
                    <Column field="seuilMinimum" header="Seuil min." sortable bodyClassName="cell-ellipsis" style={{ width: 120 }} />
                    <Column field="seuilCritique" header="Seuil crit." sortable bodyClassName="cell-ellipsis" style={{ width: 120 }} />
                    <Column field="consommationMoyenne" header="Conso/m." sortable bodyClassName="cell-ellipsis" style={{ width: 130 }} />
                    <Column field="stockSecurite" header="Stock séc." sortable bodyClassName="cell-ellipsis" style={{ width: 120 }} />
                    <Column field="derniereAchat" header="Dernier achat" sortable bodyClassName="cell-ellipsis" style={{ width: 140 }} />
                    <Column header="Fournisseur" sortable body={(r)=>r.fournisseurHabituel?.nom ?? ""} bodyClassName="cell-ellipsis" style={{ minWidth: 160 }} />
                    <Column header="Valeur" body={valeurBody} bodyClassName="cell-ellipsis align-right" style={{ minWidth: 140 }} />

                    {/* Tag statut compact + ellipsis */}
                    <Column field="statut" header="Statut" body={statutBody} style={{ width: 130 }} />

                    {/* Actions (défigées en <1200px via CSS) */}
                    <Column header="Actions" body={actionsBody} style={{ width: 260 }} frozen alignFrozen="right" />
                  </DataTable>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Barre d’état */}
        <footer style={{ background: "#eef1f6", borderTop: "1px solid #e3e6ee", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, color: "#2f3b52" }}>
          <span>{filtered.length} élément(s)</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Dialogs */}
      <Dialog header={`Configurer seuils — ${seuilForm.nom || ""}`} visible={showSeuilForm} style={{ width: "500px", maxWidth: "95vw" }} modal onHide={() => setShowSeuilForm(false)}>
        <div style={{ display: "grid", gap: 16 }}>
          <span className="p-float-label">
            <InputText id="seuilMinimum" type="number" value={seuilForm.seuilMinimum} onChange={(e) => setSeuilForm({ ...seuilForm, seuilMinimum: parseInt(e.target.value || "0", 10) })} style={{ width: "100%" }} />
            <label htmlFor="seuilMinimum">Seuil minimum</label>
          </span>
          <span className="p-float-label">
            <InputText id="seuilCritique" type="number" value={seuilForm.seuilCritique} onChange={(e) => setSeuilForm({ ...seuilForm, seuilCritique: parseInt(e.target.value || "0", 10) })} style={{ width: "100%" }} />
            <label htmlFor="seuilCritique">Seuil critique</label>
          </span>
          <span className="p-float-label">
            <InputText id="stockSecurite" type="number" value={seuilForm.stockSecurite} onChange={(e) => setSeuilForm({ ...seuilForm, stockSecurite: parseInt(e.target.value || "0", 10) })} style={{ width: "100%" }} />
            <label htmlFor="stockSecurite">Stock de sécurité</label>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowSeuilForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveSeuilForm} />
        </div>
      </Dialog>

      <Dialog header={`Historique — ${historyFor?.nom ?? "Médicament"}`} visible={showHistory} style={{ width: "760px", maxWidth: "95vw" }} modal onHide={() => setShowHistory(false)}>
        <div style={{ marginBottom: 8, color: "#6b7280" }}>Données fictives pour la maquette.</div>
        <DataTable value={[
          { date: "2025-07-12", type: "Entrée", quantite: 200, source: "Commande CMD-2025-001" },
          { date: "2025-08-01", type: "Sortie",  quantite: 50,  source: "Vente" },
          { date: "2025-09-01", type: "Sortie",  quantite: 30,  source: "Vente" },
        ]} paginator rows={5} responsiveLayout="scroll">
          <Column field="date" header="Date" style={{ minWidth: 120 }} />
          <Column field="type" header="Type" style={{ minWidth: 100 }} />
          <Column field="quantite" header="Quantité" style={{ width: 120 }} />
          <Column field="source" header="Source" style={{ minWidth: 200 }} />
        </DataTable>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Button label="Fermer" className="p-button-text" onClick={() => setShowHistory(false)} />
        </div>
      </Dialog>

      {/* Styles */}
      <style>{`
        .cell-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .align-right { text-align: right; }

        /* Tag statut compact + ellipsis anti-débordement */
        .status-tag { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-flex; align-items: center; gap: .35rem; }

        /* Lignes teintées selon statut */
        .p-datatable .row-low  > td { background: linear-gradient(to right, #fff8e1, #ffffff) }
        .p-datatable .row-crit > td { background: linear-gradient(to right, #ffe5e5, #ffffff) }
        .p-datatable .row-over > td { background: linear-gradient(to right, #e8f4ff, #ffffff) }

        /* Sur petits écrans : on évite le gel qui gêne le scroll horizontal */
        @media (max-width: 1200px) {
          .p-datatable .p-frozen-column { position: static !important; }
        }
      `}</style>
    </div>
  );
}
