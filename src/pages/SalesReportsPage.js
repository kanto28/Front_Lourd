import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import Sidebar from "../components/Sidebar";

/**
 * SalesReportsPage – Interface "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ●, barre d'état)
 * - Filtres avancés, stats, tendances, liste, détail
 * - Export / Impression / Email / Programmation (simulés)
 */
export default function SalesReportsPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const clients = [
    { id: 1, nom: "Jean Rakoto" },
    { id: 2, nom: "Marie Raso" },
  ];

  const vendeurs = [
    { id: 1, nom: "Jean Rakoto" },
    { id: 2, nom: "Marie Raso" },
  ];

  const medicamentsRef = [
    { id: 1, nom: "Paracétamol 500mg", stock: 150 },
    { id: 2, nom: "Amoxicilline 1g", stock: 30 },
    { id: 3, nom: "Ibuprofène 400mg", stock: 0 },
    { id: 4, nom: "Aspirine 100mg", stock: 300 },
  ];

  const ventes = [
    {
      id: "VTE-2025-001",
      date: "2025-07-12",
      client: clients[0],
      vendeur: vendeurs[0],
      montant: 15000,
      medicaments: [
        { id: 1, nom: "Paracétamol 500mg", quantite: 10, prixUnitaire: 500 },
        { id: 2, nom: "Amoxicilline 1g", quantite: 5, prixUnitaire: 1200 },
      ],
      typePaiement: "Espèces",
      statut: "Finalisée",
    },
    {
      id: "VTE-2025-002",
      date: "2025-08-01",
      client: null,
      vendeur: vendeurs[1],
      montant: 24000,
      medicaments: [{ id: 3, nom: "Ibuprofène 400mg", quantite: 30, prixUnitaire: 800 }],
      typePaiement: "Mobile Money",
      statut: "Finalisée",
    },
    {
      id: "VTE-2025-003",
      date: "2025-09-01",
      client: clients[1],
      vendeur: vendeurs[0],
      montant: 9000,
      medicaments: [{ id: 4, nom: "Aspirine 100mg", quantite: 30, prixUnitaire: 300 }],
      typePaiement: "Crédit client",
      statut: "Finalisée",
    },
  ];

  // --- États UI / filtres ---
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(null);
  const [vendeurFilter, setVendeurFilter] = useState(null);
  const [clientFilter, setClientFilter] = useState(null);
  const [rapportType, setRapportType] = useState("journalier");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);

  // --- Filtrage commun ---
  const filteredVentes = useMemo(() => {
    return ventes.filter((v) => {
      const matchesGlobal = globalFilter
        ? v.id.toLowerCase().includes(globalFilter.toLowerCase()) ||
          v.vendeur.nom.toLowerCase().includes(globalFilter.toLowerCase()) ||
          (v.client && v.client.nom.toLowerCase().includes(globalFilter.toLowerCase())) ||
          v.medicaments?.some?.((m) => m.nom.toLowerCase().includes(globalFilter.toLowerCase()))
        : true;
      const matchesDate = dateFilter
        ? new Date(v.date).toDateString() === new Date(dateFilter).toDateString()
        : true;
      const matchesVendeur = vendeurFilter ? v.vendeur.id === vendeurFilter.id : true;
      const matchesClient = clientFilter ? v.client?.id === clientFilter.id : true;
      return matchesGlobal && matchesDate && matchesVendeur && matchesClient;
    });
  }, [ventes, globalFilter, dateFilter, vendeurFilter, clientFilter]);

  // --- Statistiques globales ---
  const stats = useMemo(() => {
    const chiffreAffaires = filteredVentes.reduce((sum, v) => sum + v.montant, 0);
    const nombreVentes = filteredVentes.length;
    const panierMoyen = nombreVentes ? chiffreAffaires / nombreVentes : 0;

    const medicamentsVendus = filteredVentes
      .flatMap((v) => v.medicaments || [])
      .reduce((acc, m) => {
        acc[m.id] = acc[m.id] || { nom: m.nom, quantite: 0 };
        acc[m.id].quantite += m.quantite;
        return acc;
      }, {});
    const topMedicaments = Object.values(medicamentsVendus)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 3);

    const performanceVendeurs = vendeurs.map((v) => ({
      nom: v.nom,
      ventes: filteredVentes.filter((vente) => vente.vendeur.id === v.id).length,
      montant: filteredVentes
        .filter((vente) => vente.vendeur.id === v.id)
        .reduce((sum, vente) => sum + vente.montant, 0),
    }));

    return { chiffreAffaires, nombreVentes, panierMoyen, topMedicaments, performanceVendeurs };
  }, [filteredVentes]);

  // --- Tendances par mois ---
  const tendances = useMemo(() => {
    const groupedByMonth = filteredVentes.reduce((acc, v) => {
      const month = v.date.slice(0, 7); // YYYY-MM
      acc[month] = acc[month] || { montant: 0, ventes: 0 };
      acc[month].montant += v.montant;
      acc[month].ventes += 1;
      return acc;
    }, {});
    return Object.entries(groupedByMonth).map(([month, data]) => ({
      month,
      montant: data.montant,
      ventes: data.ventes,
    }));
  }, [filteredVentes]);

  // --- Export / actions ---
  const generateRapport = () => {
    const csvContent = [
      ["Rapport", rapportType.charAt(0).toUpperCase() + rapportType.slice(1)],
      ["Date", dateFilter ? new Date(dateFilter).toLocaleDateString("fr-FR") : "Toutes"],
      ["Vendeur", vendeurFilter ? vendeurFilter.nom : "Tous"],
      ["Client", clientFilter ? clientFilter.nom : "Tous"],
      [""],
      ["Chiffre d'affaires", stats.chiffreAffaires.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })],
      ["Nombre de ventes", stats.nombreVentes],
      ["Panier moyen", stats.panierMoyen.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })],
      [""],
      ["Top Médicaments", ""],
      ...stats.topMedicaments.map((m) => [m.nom, m.quantite]),
      [""],
      ["Performance Vendeurs", ""],
      ...stats.performanceVendeurs.map((v) => [v.nom, `${v.ventes} ventes, ${v.montant.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}`]),
      [""],
      ["Ventes", ""],
      ["ID", "Date", "Client", "Vendeur", "Montant", "Type Paiement", "Statut"],
      ...filteredVentes.map((v) => [
        v.id,
        v.date,
        v.client ? v.client.nom : "Anonyme",
        v.vendeur.nom,
        v.montant.toLocaleString("fr-FR", { style: "currency", currency: "MGA" }),
        v.typePaiement,
        v.statut,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_ventes_${rapportType}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.current?.show({ severity: "success", summary: "Rapport généré", detail: "Rapport exporté en CSV." });
  };

  const printRapport = () =>
    toast.current?.show({ severity: "info", summary: "Impression", detail: "Impression du rapport simulée." });
  const emailRapport = () =>
    toast.current?.show({ severity: "info", summary: "Envoi", detail: "Envoi du rapport par email simulé." });
  const scheduleRapport = () =>
    toast.current?.show({ severity: "info", summary: "Programmation", detail: "Programmation de rapport automatique simulée." });

  // --- Rendus colonnes ---
  const montantBody = (row) => row.montant.toLocaleString("fr-FR", { style: "currency", currency: "MGA" });
  const clientBody = (row) => (row.client ? row.client.nom : "Anonyme");
  const statutBody = (row) => (
    <Tag value={row.statut} severity={row.statut === "Finalisée" ? "success" : row.statut === "En cours" ? "warning" : "danger"} />
  );
  const actionsBody = (row) => (
    <Button
      icon="pi pi-eye"
      className="p-button-text p-button-sm"
      onClick={() => {
        setSelectedVente(row);
        setShowDetail(true);
      }}
      tooltip="Voir détails"
    />
  );

  // --- UI "client lourd" ---
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

      {/* Fenêtre style client lourd */}
      <div
        style={{
          width: "min(1500px, 100vw)",
          height: "min(950px, 100vh)",
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
            background: "linear-gradient(180deg, #fdfdfd, #f1f3f7)",
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Rapports et Historique des ventes</div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", minHeight: 0 }}>
          <Sidebar title="Modules" />
          <main style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
            {/* Filtres et actions */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Calendar value={dateFilter} onChange={(e) => setDateFilter(e.value)} placeholder="Date" style={{ maxWidth: 160 }} />
              <Dropdown
                value={vendeurFilter}
                options={[{ label: "Tous", value: null }, ...vendeurs.map((v) => ({ label: v.nom, value: v }))]}
                onChange={(e) => setVendeurFilter(e.value)}
                placeholder="Vendeur"
                style={{ maxWidth: 180 }}
                optionLabel="label"
              />
              <Dropdown
                value={clientFilter}
                options={[{ label: "Tous", value: null }, ...clients.map((c) => ({ label: c.nom, value: c }))]}
                onChange={(e) => setClientFilter(e.value)}
                placeholder="Client"
                style={{ maxWidth: 180 }}
                optionLabel="label"
              />
              <Dropdown
                value={rapportType}
                options={[
                  { label: "Journalier", value: "journalier" },
                  { label: "Hebdomadaire", value: "hebdomadaire" },
                  { label: "Mensuel", value: "mensuel" },
                ]}
                onChange={(e) => setRapportType(e.value)}
                placeholder="Type de rapport"
                style={{ maxWidth: 180 }}
              />
              <span className="p-input-icon-left" style={{ maxWidth: 260, marginLeft: "auto" }}>
                <i className="pi pi-search" />
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Rechercher (ID, client, vendeur, médicament)"
                  style={{ width: "100%" }}
                />
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button label="Exporter" icon="pi pi-file-export" className="p-button-outlined" onClick={generateRapport} />
                <Button label="Imprimer" icon="pi pi-print" className="p-button-outlined" onClick={printRapport} />
                <Button label="Envoyer" icon="pi pi-send" className="p-button-outlined" onClick={emailRapport} />
                <Button label="Programmer" icon="pi pi-clock" className="p-button-outlined" onClick={scheduleRapport} />
              </div>
            </div>

            {/* Statistiques globales */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: "#16a085" }}>Statistiques globales</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div>
                  <strong>Chiffre d'affaires</strong>
                  <p style={{ margin: 4 }}>
                    {stats.chiffreAffaires.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}
                  </p>
                </div>
                <div>
                  <strong>Nombre de ventes</strong>
                  <p style={{ margin: 4 }}>{stats.nombreVentes}</p>
                </div>
                <div>
                  <strong>Panier moyen</strong>
                  <p style={{ margin: 4 }}>
                    {stats.panierMoyen.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}
                  </p>
                </div>
                <div>
                  <strong>Top médicaments</strong>
                  <ul style={{ margin: 4, paddingLeft: 18 }}>
                    {stats.topMedicaments.map((m, i) => (
                      <li key={i}>
                        {m.nom}: {m.quantite} unités
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Performance vendeurs</strong>
                  <ul style={{ margin: 4, paddingLeft: 18 }}>
                    {stats.performanceVendeurs.map((v, i) => (
                      <li key={i}>
                        {v.nom}: {v.ventes} ventes
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Tendances */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: "#16a085" }}>Tendances mensuelles</h3>
              <DataTable value={tendances} responsiveLayout="scroll" emptyMessage="Aucune donnée">
                <Column field="month" header="Mois" />
                <Column
                  field="montant"
                  header="Chiffre d'affaires"
                  body={(row) => row.montant.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}
                />
                <Column field="ventes" header="Nombre de ventes" />
              </DataTable>
            </div>

            {/* Liste des ventes */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                flex: 1,
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontWeight: 700, color: "#16a085" }}>
                  Liste des ventes <Tag value={filteredVentes.length} />
                </span>
              </div>

              <DataTable
                value={filteredVentes}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                scrollable
                scrollHeight="flex"
                responsiveLayout="scroll"
                stripedRows
              >
                <Column field="id" header="ID Vente" sortable style={{ minWidth: 140 }} />
                <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
                <Column header="Client" body={clientBody} sortable style={{ minWidth: 160 }} />
                <Column header="Vendeur" body={(r) => r.vendeur.nom} sortable style={{ minWidth: 160 }} />
                <Column field="montant" header="Montant" body={montantBody} sortable style={{ minWidth: 140 }} />
                <Column field="typePaiement" header="Paiement" sortable style={{ minWidth: 140 }} />
                <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 140 }} />
                <Column header="Actions" body={actionsBody} style={{ width: 100 }} frozen alignFrozen="right" />
              </DataTable>
            </div>
          </main>
        </div>

        {/* Barre d'état */}
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

      {/* Dialog Détail vente */}
      <Dialog
        header={`Détail de la vente — ${selectedVente?.id ?? "Vente"}`}
        visible={showDetail}
        style={{ width: "600px", maxWidth: "95vw" }}
        modal
        onHide={() => setShowDetail(false)}
      >
        {selectedVente && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p>
              <strong>ID:</strong> {selectedVente.id}
            </p>
            <p>
              <strong>Date:</strong> {selectedVente.date}
            </p>
            <p>
              <strong>Client:</strong> {selectedVente.client ? selectedVente.client.nom : "Anonyme"}
            </p>
            <p>
              <strong>Vendeur:</strong> {selectedVente.vendeur.nom}
            </p>
            <p>
              <strong>Montant:</strong>{" "}
              {selectedVente.montant.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })}
            </p>
            <p>
              <strong>Type de paiement:</strong> {selectedVente.typePaiement}
            </p>
            <p>
              <strong>Statut:</strong> {selectedVente.statut}
            </p>

            <h4>Médicaments</h4>
            <DataTable value={selectedVente.medicaments} responsiveLayout="scroll">
              <Column field="nom" header="Médicament" />
              <Column field="quantite" header="Quantité" />
              <Column
                field="prixUnitaire"
                header="Prix unitaire"
                body={(row) =>
                  row.prixUnitaire.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })
                }
              />
              <Column
                header="Sous-total"
                body={(row) =>
                  (row.quantite * row.prixUnitaire).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "MGA",
                  })
                }
              />
            </DataTable>

            <Button label="Fermer" className="p-button-text" onClick={() => setShowDetail(false)} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
