import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { jsPDF } from "jspdf";
import Sidebar from "../components/Sidebar";

/**
 * SpecificPriceManagementPage – Interface "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ●, barre d’état)
 * - Gestion des prix spécifiques (CRUD, changement statut)
 * - Filtres + recherche, exports CSV/PDF
 */
export default function SpecificPriceManagementPage() {
  const toast = useRef(null);

  // --- Données mockées ---
  const medicaments = useMemo(
    () => [
      { id: "MED-001", nom: "Paracétamol 500mg", categorie: "Médicaments sur ordonnance", prixAchat: 1000 },
      { id: "MED-002", nom: "Ibuprofène 400mg", categorie: "Médicaments sans ordonnance", prixAchat: 1500 },
      { id: "MED-003", nom: "Crème hydratante", categorie: "Produits cosmétiques", prixAchat: 5000 },
      { id: "MED-004", nom: "Thermomètre", categorie: "Matériel médical", prixAchat: 20000 },
      { id: "MED-005", nom: "Vitamine C", categorie: "Produits de parapharmacie", prixAchat: 3000 },
    ],
    []
  );

  const [prixSpecifiques, setPrixSpecifiques] = useState([
    {
      id: "SP-001",
      idMedicament: "MED-001",
      prixSpecifique: 1500,
      statut: "Actif",
      dateCreation: new Date("2025-07-01"),
      dateModification: new Date("2025-07-01"),
      raison: "Promotion saisonnière",
    },
    {
      id: "SP-002",
      idMedicament: "MED-002",
      prixSpecifique: 2000,
      statut: "Inactif",
      dateCreation: new Date("2025-08-01"),
      dateModification: new Date("2025-08-15"),
      raison: "Ajustement concurrence",
    },
  ]);

  // --- Configuration par défaut ---
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

  // --- États UI ---
  const [filtreStatut, setFiltreStatut] = useState(null);
  const [filtreCategorie, setFiltreCategorie] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPrix, setSelectedPrix] = useState(null);
  const [formData, setFormData] = useState({
    idMedicament: "",
    prixSpecifique: 0,
    statut: "Actif",
    raison: "",
  });

  const statuts = [
    { label: "Tous", value: null },
    { label: "Actif", value: "Actif" },
    { label: "Inactif", value: "Inactif" },
    { label: "Archivé", value: "Archivé" },
  ];

  const categories = [
    { label: "Toutes", value: null },
    { label: "Médicaments sur ordonnance", value: "Médicaments sur ordonnance" },
    { label: "Médicaments sans ordonnance", value: "Médicaments sans ordonnance" },
    { label: "Produits de parapharmacie", value: "Produits de parapharmacie" },
    { label: "Produits cosmétiques", value: "Produits cosmétiques" },
    { label: "Matériel médical", value: "Matériel médical" },
  ];

  // --- Helpers ---
  const calculerPrixCalcule = (medicament) => {
    const marge = configuration.margesParCategorie[medicament.categorie] ?? configuration.margeGlobale;
    let prix = medicament.prixAchat * (1 + marge / 100) * (1 + configuration.tvaDefaut / 100);
    if (configuration.regleArrondi === "À l’euro près") prix = Math.round(prix);
    return Math.max(configuration.prixMinimum, Math.min(prix, configuration.prixMaximum));
  };

  const tableData = useMemo(() => {
    return prixSpecifiques
      .map((p) => {
        const m = medicaments.find((x) => x.id === p.idMedicament);
        if (!m) return null;
        const prixCalcule = calculerPrixCalcule(m);
        return {
          ...p,
          nomMedicament: m.nom,
          categorie: m.categorie,
          prixAchat: m.prixAchat,
          prixCalcule,
          differenceMGA: p.prixSpecifique - prixCalcule,
          differencePourcentage: prixCalcule
            ? (((p.prixSpecifique - prixCalcule) / prixCalcule) * 100).toFixed(2)
            : "0.00",
        };
      })
      .filter(Boolean)
      .filter((i) => !filtreStatut || i.statut === filtreStatut)
      .filter((i) => !filtreCategorie || i.categorie === filtreCategorie)
      .filter((i) => !recherche || i.nomMedicament.toLowerCase().includes(recherche.toLowerCase()));
  }, [prixSpecifiques, medicaments, filtreStatut, filtreCategorie, recherche]);

  // --- Dialog ---
  const openDialog = (row = null) => {
    setSelectedPrix(row);
    setFormData(
      row
        ? {
            idMedicament: row.idMedicament,
            prixSpecifique: row.prixSpecifique,
            statut: row.statut,
            raison: row.raison,
          }
        : { idMedicament: "", prixSpecifique: 0, statut: "Actif", raison: "" }
    );
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setSelectedPrix(null);
    setFormData({ idMedicament: "", prixSpecifique: 0, statut: "Actif", raison: "" });
  };

  // --- Actions CRUD ---
  const ajouterPrix = () => {
    const nouveau = {
      id: `SP-${(prixSpecifiques.length + 1).toString().padStart(3, "0")}`,
      idMedicament: formData.idMedicament,
      prixSpecifique: formData.prixSpecifique,
      statut: formData.statut,
      dateCreation: new Date(),
      dateModification: new Date(),
      raison: formData.raison,
    };
    setPrixSpecifiques((prev) => [...prev, nouveau]);
    toast.current?.show({ severity: "success", summary: "Ajout", detail: "Prix spécifique ajouté." });
    closeDialog();
  };

  const modifierPrix = () => {
    setPrixSpecifiques((prev) =>
      prev.map((p) => (p.id === selectedPrix.id ? { ...p, ...formData, dateModification: new Date() } : p))
    );
    toast.current?.show({ severity: "success", summary: "Modification", detail: "Prix spécifique modifié." });
    closeDialog();
  };

  const changerStatut = (row, nouveauStatut) => {
    setPrixSpecifiques((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, statut: nouveauStatut, dateModification: new Date() } : p))
    );
    toast.current?.show({ severity: "success", summary: "Statut", detail: `Statut changé à ${nouveauStatut}.` });
  };

  const supprimerPrix = (row) => {
    setPrixSpecifiques((prev) => prev.filter((p) => p.id !== row.id));
    toast.current?.show({ severity: "success", summary: "Suppression", detail: "Prix spécifique supprimé." });
  };

  // --- Export ---
  const exporterListe = (format) => {
    if (format === "Excel") {
      const csvContent = [
        [
          "ID",
          "Médicament",
          "Catégorie",
          "Prix d’achat",
          "Prix calculé",
          "Prix spécifique",
          "Différence (MGA)",
          "Différence (%)",
          "Statut",
          "Date création",
          "Date modification",
          "Raison",
        ].join(","),
        ...tableData.map((item) =>
          [
            item.id,
            `"${item.nomMedicament}"`,
            item.categorie,
            item.prixAchat.toLocaleString("fr-FR"),
            item.prixCalcule.toLocaleString("fr-FR"),
            item.prixSpecifique.toLocaleString("fr-FR"),
            item.differenceMGA.toLocaleString("fr-FR"),
            `${item.differencePourcentage}%`,
            item.statut,
            item.dateCreation.toLocaleDateString("fr-FR"),
            item.dateModification.toLocaleDateString("fr-FR"),
            `"${(item.raison || "").replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prix_specifiques.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: "success", summary: "Export", detail: "Liste exportée en CSV." });
    } else if (format === "PDF") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Liste des Prix Spécifiques", 20, 20);
      doc.setFontSize(12);
      let y = 30;
      tableData.forEach((item) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${item.id}: ${item.nomMedicament} — Spécifique ${item.prixSpecifique.toLocaleString("fr-FR", {
            style: "currency",
            currency: "MGA",
          })} (Calculé: ${item.prixCalcule.toLocaleString("fr-FR", { style: "currency", currency: "MGA" })})`,
          20,
          y
        );
        y += 8;
        doc.text(`Catégorie: ${item.categorie} · Statut: ${item.statut}`, 20, y);
        y += 8;
        doc.text(`Raison: ${item.raison || "-"}`, 20, y);
        y += 10;
      });
      doc.save("prix_specifiques.pdf");
      toast.current?.show({ severity: "success", summary: "Export", detail: "Liste exportée en PDF." });
    }
  };

  // --- Colonnes ---
  const montantBody = (row, field) =>
    row[field]?.toLocaleString("fr-FR", { style: "currency", currency: "MGA" });
  const pourcentageBody = (row) => `${row.differencePourcentage}%`;
  const dateBody = (row, field) => row[field].toLocaleDateString("fr-FR");

  const actionsBody = (row) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Button icon="pi pi-pencil" className="p-button-text" onClick={() => openDialog(row)} />
      <Dropdown
        value={row.statut}
        options={statuts.slice(1)}
        onChange={(e) => changerStatut(row, e.value)}
        style={{ width: 120 }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        onClick={() => supprimerPrix(row)}
      />
    </div>
  );

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Gestion des Prix Spécifiques</span>
      <InputText
        placeholder="Rechercher un médicament"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ width: 220 }}
      />
      <Dropdown
        value={filtreStatut}
        options={statuts}
        onChange={(e) => setFiltreStatut(e.value)}
        placeholder="Filtrer par statut"
        style={{ width: 160 }}
      />
      <Dropdown
        value={filtreCategorie}
        options={categories}
        onChange={(e) => setFiltreCategorie(e.value)}
        placeholder="Filtrer par catégorie"
        style={{ width: 260 }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button label="Ajouter Prix" icon="pi pi-plus" onClick={() => openDialog()} className="p-button-outlined" />
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterListe("Excel")} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterListe("PDF")} className="p-button-outlined" />
    </div>
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

      <div
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
            MediFinder • Prix spécifiques
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
            <Card
              title="Liste des Prix Spécifiques"
              style={{
                background: "#fff",
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
              }}
            >
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
              <DataTable value={tableData} responsiveLayout="scroll" emptyMessage="Aucun prix spécifique trouvé">
                <Column field="id" header="ID" sortable />
                <Column field="nomMedicament" header="Médicament" sortable />
                <Column field="categorie" header="Catégorie" sortable />
                <Column field="prixAchat" header="Prix d’achat" body={(r) => montantBody(r, "prixAchat")} sortable />
                <Column field="prixCalcule" header="Prix calculé" body={(r) => montantBody(r, "prixCalcule")} sortable />
                <Column field="prixSpecifique" header="Prix spécifique" body={(r) => montantBody(r, "prixSpecifique")} sortable />
                <Column field="differenceMGA" header="Différence (MGA)" body={(r) => montantBody(r, "differenceMGA")} sortable />
                <Column field="differencePourcentage" header="Différence (%)" body={pourcentageBody} sortable />
                <Column field="statut" header="Statut" sortable />
                <Column field="dateCreation" header="Date création" body={(r) => dateBody(r, "dateCreation")} sortable />
                <Column field="dateModification" header="Date modification" body={(r) => dateBody(r, "dateModification")} sortable />
                <Column field="raison" header="Raison" sortable />
                <Column header="Actions" body={actionsBody} />
              </DataTable>
            </Card>

            {/* Dialog: Ajouter/Modifier */}
            <Dialog
              header={selectedPrix ? "Modifier Prix Spécifique" : "Ajouter Prix Spécifique"}
              visible={dialogVisible}
              style={{ width: 480, maxWidth: "95vw" }}
              modal
              onHide={closeDialog}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Médicament</label>
                  <Dropdown
                    value={formData.idMedicament}
                    options={medicaments.map((m) => ({ label: m.nom, value: m.id }))}
                    onChange={(e) => setFormData({ ...formData, idMedicament: e.value })}
                    placeholder="Sélectionner un médicament"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Prix spécifique (MGA)</label>
                  <InputNumber
                    value={formData.prixSpecifique}
                    onValueChange={(e) => setFormData({ ...formData, prixSpecifique: e.value })}
                    min={0}
                    suffix=" MGA"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Statut</label>
                  <Dropdown
                    value={formData.statut}
                    options={statuts.slice(1)}
                    onChange={(e) => setFormData({ ...formData, statut: e.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Raison</label>
                  <InputTextarea
                    value={formData.raison}
                    onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
                    rows={4}
                    style={{ width: "100%" }}
                  />
                </div>
                <Button
                  label={selectedPrix ? "Modifier" : "Ajouter"}
                  icon="pi pi-check"
                  onClick={selectedPrix ? modifierPrix : ajouterPrix}
                  disabled={!formData.idMedicament || !formData.prixSpecifique}
                />
              </div>
            </Dialog>
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
          <span>{tableData.length} élément(s)</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
