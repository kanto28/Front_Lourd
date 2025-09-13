import React, { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import Sidebar from "../components/Sidebar";

/**
 * SortirPage – Interface "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ●, barre d’état)
 * - État des stocks + Sorties générées depuis ventes
 * - Export CSV
 */
export default function SortirPage() {
  const toast = useRef(null);

  // --- Données mockées (cohérentes avec les autres pages) ---
  const medicaments = useMemo(
    () => [
      { id: 1, nom: "Paracétamol 500mg", stock: 150 },
      { id: 2, nom: "Amoxicilline 1g", stock: 30 },
      { id: 3, nom: "Ibuprofène 400mg", stock: 0 },
      { id: 4, nom: "Aspirine 100mg", stock: 300 },
    ],
    []
  );

  const ventes = useMemo(
    () => [
      {
        id: "VTE-2025-001",
        date: "2025-07-12",
        medicaments: [
          { id: 1, nom: "Paracétamol 500mg", quantite: 10 },
          { id: 2, nom: "Amoxicilline 1g", quantite: 5 },
        ],
      },
      {
        id: "VTE-2025-002",
        date: "2025-08-01",
        medicaments: [{ id: 3, nom: "Ibuprofène 400mg", quantite: 30 }],
      },
      {
        id: "VTE-2025-003",
        date: "2025-09-01",
        medicaments: [{ id: 4, nom: "Aspirine 100mg", quantite: 30 }],
      },
    ],
    []
  );

  const [sorties, setSorties] = useState([]);
  const [stocks, setStocks] = useState(medicaments);

  // Générer automatiquement les sorties et recalculer les stocks (au montage)
  useEffect(() => {
    const newSorties = ventes.flatMap((vente) =>
      vente.medicaments.map((m) => ({
        id: `SOR-${vente.id}-${m.id}`,
        venteId: vente.id,
        date: vente.date,
        medicament: m.nom,
        quantite: m.quantite,
        statut: "Enregistrée",
      }))
    );
    setSorties(newSorties);

    const updatedStocks = medicaments.map((med) => {
      const totalSortie = newSorties
        .filter((s) => s.medicament === med.nom)
        .reduce((sum, s) => sum + s.quantite, 0);
      return { ...med, stock: med.stock - totalSortie };
    });
    setStocks(updatedStocks);
  }, [medicaments, ventes]);

  // --- Rendus colonnes ---
  const statutBody = (row) => <Tag value={row.statut} severity="success" />;

  // --- Header Toolbar ---
  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Sorties de stock</span>
      <Tag value={`${sorties.length}`} style={{ background: "#e6faf4", color: "#0b6b57", border: 0 }} />
    </div>
  );

  const headerRight = (
    <Button
      label="Exporter CSV"
      icon="pi pi-file-export"
      onClick={() => {
        const csvContent = [
          ["ID", "Vente", "Date", "Médicament", "Quantité", "Statut"].join(","),
          ...sorties.map((s) =>
            [s.id, s.venteId, s.date, s.medicament, s.quantite, s.statut].join(",")
          ),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sorties_stock.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.current?.show({
          severity: "success",
          summary: "Export",
          detail: "Sorties exportées en CSV.",
        });
      }}
      className="p-button-outlined"
    />
  );

  // --- Rendu principal (fenêtre style client lourd) ---
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
            MediFinder • Sorties de Stock
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
            {/* Tableau : État des stocks */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ margin: 0, color: "#16a085" }}>État des stocks</h3>
              <DataTable value={stocks} responsiveLayout="scroll" emptyMessage="Aucun article">
                <Column field="nom" header="Médicament" sortable />
                <Column field="stock" header="Stock actuel" sortable />
              </DataTable>
            </div>

            {/* Tableau : Sorties */}
            <div
              style={{
                flex: 1,
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />

              <DataTable
                value={sorties}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                scrollable
                scrollHeight="flex"
                responsiveLayout="scroll"
                stripedRows
                emptyMessage="Aucune sortie enregistrée"
              >
                <Column field="id" header="ID Sortie" sortable style={{ minWidth: 140 }} />
                <Column field="venteId" header="Vente" sortable style={{ minWidth: 120 }} />
                <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                <Column field="medicament" header="Médicament" sortable style={{ minWidth: 160 }} />
                <Column field="quantite" header="Quantité" sortable style={{ minWidth: 120 }} />
                <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 140 }} />
              </DataTable>
            </div>
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
          <span>État : prêt</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
