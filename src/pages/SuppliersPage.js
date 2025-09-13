import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import Sidebar from "../components/Sidebar";

export default function SuppliersPage() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // --- Données démo ---
  const seed = [
    { id: 1, nom: "PharmaSup Madagascar", adresse: "Lot II H 45, Antananarivo", telephone: "+261 34 12 345 67", email: "contact@pharmasup.mg", contact: "Rasolo Andry", paiement: "30 jours fin de mois", delai: 5, statut: "Actif", createdAt: "2024-11-02", notes: "Fournisseur principal génériques" },
    { id: 2, nom: "MediDistrib Tana", adresse: "Rue Ravelojaona, Ankadifotsy", telephone: "+261 32 88 999 10", email: "sales@medidistrib.mg", contact: "Ralaivo Nomena", paiement: "Comptant", delai: 2, statut: "Inactif", createdAt: "2025-01-15", notes: "En renégociation des tarifs" },
    { id: 3, nom: "Océan Pharma", adresse: "Zone Franche, Tamatave", telephone: "+261 20 53 212 10", email: "hello@oceanpharma.mg", contact: "Harinirina Soa", paiement: "45 jours", delai: 7, statut: "Actif", createdAt: "2025-03-08", notes: "Spécialiste dispositifs médicaux" }
  ];

  const [rows, setRows] = useState(seed);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  // Formulaire (création/édition)
  const emptyForm = { id: null, nom: "", adresse: "", telephone: "", email: "", contact: "", paiement: "", delai: 3, statut: "Actif", createdAt: new Date().toISOString().slice(0, 10), notes: "" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  // Historique
  const [showHistory, setShowHistory] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);

  const statuts = [ { label: "Actif", value: "Actif" }, { label: "Inactif", value: "Inactif" } ];

  // Filtrage
  const filtered = useMemo(() => {
    let list = [...rows];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(r =>
        r.nom.toLowerCase().includes(q) ||
        r.adresse.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.telephone.toLowerCase().includes(q) ||
        r.contact.toLowerCase().includes(q)
      );
    }
    if (statutFilter) list = list.filter(r => r.statut === statutFilter);
    return list;
  }, [rows, globalFilter, statutFilter]);

  // --- Actions ---
  const openCreate = () => { setForm({ ...emptyForm, id: null }); setShowForm(true); };
  const openEdit = (row) => { setForm({ ...row }); setShowForm(true); };

  const saveForm = () => {
    if (!form.nom || !form.email) {
      toast.current?.show({ severity: "warn", summary: "Champs requis", detail: "Nom et Email sont requis." });
      return;
    }
    if (form.id == null) {
      const newId = Math.max(0, ...rows.map(r => r.id)) + 1;
      setRows(r => [{ ...form, id: newId }, ...r]);
      toast.current?.show({ severity: "success", summary: "Créé", detail: "Fournisseur ajouté." });
    } else {
      setRows(r => r.map(x => x.id === form.id ? form : x));
      toast.current?.show({ severity: "success", summary: "Modifié", detail: "Fournisseur mis à jour." });
    }
    setShowForm(false);
  };

  const askDelete = (row) => {
    confirmDialog({
      message: `Supprimer « ${row.nom} » ?`,
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        setRows(r => r.filter(x => x.id !== row.id));
        toast.current?.show({ severity: "success", summary: "Supprimé", detail: "Fournisseur supprimé." });
      }
    });
  };

  const toggleStatut = (row) => {
    const updated = { ...row, statut: row.statut === "Actif" ? "Inactif" : "Actif" };
    setRows(r => r.map(x => x.id === row.id ? updated : x));
  };

  const openHistory = (row) => { setHistoryFor(row); setShowHistory(true); };

const exportList = () => {
  const header = [
    "Nom", "Adresse", "Téléphone", "Email", "Contact", "Conditions de paiement", "Délai moyen (j)", "Statut", "Créé le", "Notes"
  ];
  const lines = filtered.map(r => [
    r.nom, r.adresse, r.telephone, r.email, r.contact, r.paiement, r.delai, r.statut, r.createdAt, (r.notes || "").replace(/[\r\n]+/g, " ")
  ].map(x => `"${String(x ?? '').replace(/"/g, "'")}"`).join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fournisseurs.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.current?.show({ severity: "success", summary: "Exporté", detail: "Liste exportée en CSV." });
};

  // --- Rendus colonnes ---
  const statutBody = (row) => <Tag value={row.statut} severity={row.statut === "Actif" ? "success" : "danger"} />;
  const actionsBody = (row) => (
    <div style={{ display: "flex", gap: 6 }}>
      <Button icon="pi pi-eye" className="p-button-text p-button-sm" onClick={() => openHistory(row)} tooltip="Historique" />
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} tooltip="Modifier" />
      <Button icon={row.statut === "Actif" ? "pi pi-ban" : "pi pi-check"} className="p-button-text p-button-sm" onClick={() => toggleStatut(row)} tooltip={row.statut === "Actif" ? "Désactiver" : "Activer"} />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => askDelete(row)} tooltip="Supprimer" />
    </div>
  );
  const addressBody = (row) => (<span>{row.adresse}<br/><small style={{ color: "#6b7280" }}>{row.telephone}</small></span>);

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 700, color: "#16a085" }}>Fournisseurs</span>
      <Tag value={`${filtered.length}`} style={{ background: "#e6faf4", color: "#0b6b57", border: 0 }} />
    </div>
  );
  const headerRight = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Dropdown value={statutFilter} options={[{ label: "Tous", value: null }, ...statuts]} onChange={(e) => setStatutFilter(e.value)} placeholder="Statut" style={{ minWidth: 140 }} />
      <span className="p-input-icon-left" style={{ minWidth: 220 }}>
        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher (nom, email, tel, ville)" />
      </span>
      <Button label="Exporter" icon="pi pi-download" onClick={exportList} className="p-button-outlined" />
      <Button label="Ajouter" icon="pi pi-plus" onClick={openCreate} className="p-button-success" />
    </div>
  );

  // --- UI client lourd ---
  return (
    <div style={{ fontFamily: "Inter, Segoe UI, system-ui, -apple-system, Arial", background: "#e6e9ef", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Gestion des Fournisseurs</div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", minHeight: 0 }}>
          <Sidebar title="Modules" />

          <main style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />

            <div style={{ flex: 1, minHeight: 0 }}>
              <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10,20,50]} scrollable scrollHeight="flex" selection={selected} onSelectionChange={(e) => setSelected(e.value)} dataKey="id" responsiveLayout="scroll" stripedRows>
                <Column field="nom" header="Nom du fournisseur" sortable style={{ minWidth: 240 }} />
                <Column header="Adresse / Téléphone" body={addressBody} style={{ minWidth: 260 }} />
                <Column field="email" header="Email" style={{ minWidth: 220 }} />
                <Column field="contact" header="Contact principal" style={{ minWidth: 200 }} />
                <Column field="paiement" header="Conditions de paiement" style={{ minWidth: 200 }} />
                <Column field="delai" header="Délai (j)" sortable style={{ width: 110, textAlign: "right" }} />
                <Column field="statut" header="Statut" body={statutBody} style={{ width: 140 }} />
                <Column field="createdAt" header="Créé le" sortable style={{ width: 140 }} />
                <Column header="Actions" body={actionsBody} style={{ width: 220 }} frozen alignFrozen="right" />
              </DataTable>
            </div>
          </main>
        </div>

        {/* Barre d’état */}
        <footer style={{ background: "#eef1f6", borderTop: "1px solid #e3e6ee", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, color: "#2f3b52" }}>
          <span>Module Fournisseurs</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Dialog — Ajout / Édition */}
      <Dialog header={form.id ? "Modifier le fournisseur" : "Nouveau fournisseur"} visible={showForm} style={{ width: "720px", maxWidth: "95vw" }} modal onHide={() => setShowForm(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <span className="p-float-label">
            <InputText id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="nom">Nom du fournisseur</label>
          </span>
          <span className="p-float-label">
            <InputText id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="contact">Contact principal</label>
          </span>
          <span className="p-float-label" style={{ gridColumn: "1 / -1" }}>
            <InputText id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="adresse">Adresse complète</label>
          </span>
          <span className="p-float-label">
            <InputText id="telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="telephone">Téléphone</label>
          </span>
          <span className="p-float-label">
            <InputText id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="email">Email</label>
          </span>
          <span className="p-float-label">
            <InputText id="paiement" value={form.paiement} onChange={(e) => setForm({ ...form, paiement: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="paiement">Conditions de paiement</label>
          </span>
          <span className="p-float-label">
            <InputText id="delai" type="number" value={form.delai} onChange={(e) => setForm({ ...form, delai: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="delai">Délai moyen (jours)</label>
          </span>
          <span className="p-float-label">
            <Dropdown id="statut" value={form.statut} options={statuts} onChange={(e) => setForm({ ...form, statut: e.value })} style={{ width: "100%" }} />
            <label htmlFor="statut">Statut</label>
          </span>
          <span className="p-float-label">
            <InputText id="createdAt" value={form.createdAt} onChange={(e) => setForm({ ...form, createdAt: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="createdAt">Date de création (YYYY-MM-DD)</label>
          </span>
          <span className="p-float-label" style={{ gridColumn: "1 / -1" }}>
            <InputText id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: "100%" }} />
            <label htmlFor="notes">Notes / Commentaires</label>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button label="Annuler" className="p-button-text" onClick={() => setShowForm(false)} />
          <Button label="Enregistrer" icon="pi pi-save" className="p-button-success" onClick={saveForm} />
        </div>
      </Dialog>

      {/* Dialog — Historique (mock) */}
      <Dialog header={`Historique — ${historyFor?.nom ?? 'Fournisseur'}`} visible={showHistory} style={{ width: "760px", maxWidth: "95vw" }} modal onHide={() => setShowHistory(false)}>
        <div style={{ marginBottom: 8, color: "#6b7280" }}>Données fictives pour la maquette.</div>
        <DataTable value={[
          { id: 'CMD-2025-001', date: '2025-07-12', articles: 18, montant: 1450000, statut: 'Reçue' },
          { id: 'CMD-2025-006', date: '2025-08-02', articles: 9,  montant: 520000,  statut: 'En cours' },
          { id: 'CMD-2025-010', date: '2025-09-01', articles: 27, montant: 2380000, statut: 'Partielle' },
        ]} paginator rows={5} responsiveLayout="scroll">
          <Column field="id" header="N° Commande" style={{ minWidth: 160 }} />
          <Column field="date" header="Date" style={{ minWidth: 120 }} />
          <Column field="articles" header="Articles" style={{ width: 120 }} />
          <Column field="montant" header="Montant (Ar)" body={(r) => r.montant.toLocaleString()} style={{ minWidth: 160 }} />
          <Column field="statut" header="Statut" body={(r) => <Tag value={r.statut} severity={r.statut === 'Reçue' ? 'success' : r.statut === 'En cours' ? 'warning' : 'info'} />} style={{ width: 140 }} />
        </DataTable>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button label="Fermer" className="p-button-text" onClick={() => setShowHistory(false)} />
        </div>
      </Dialog>

      {/* Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}
