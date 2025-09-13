import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';

export default function SpecificPriceManagementPage() {
  const toast = useRef(null);

  // --- Données mockées pour les médicaments et prix spécifiques ---
  const medicaments = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000 },
  ];

  const [prixSpecifiques, setPrixSpecifiques] = useState([
    {
      id: 'SP-001',
      idMedicament: 'MED-001',
      prixSpecifique: 1500,
      statut: 'Actif',
      dateCreation: new Date('2025-07-01'),
      dateModification: new Date('2025-07-01'),
      raison: 'Promotion saisonnière',
    },
    {
      id: 'SP-002',
      idMedicament: 'MED-002',
      prixSpecifique: 2000,
      statut: 'Inactif',
      dateCreation: new Date('2025-08-01'),
      dateModification: new Date('2025-08-15'),
      raison: 'Ajustement concurrence',
    },
  ]);

  // --- Configuration par défaut (tirée de PriceConfigurationPage.js) ---
  const configuration = {
    margeGlobale: 30,
    margesParCategorie: {
      'Médicaments sur ordonnance': 25,
      'Médicaments sans ordonnance': 35,
      'Produits de parapharmacie': 40,
      'Produits cosmétiques': 50,
      'Matériel médical': 20,
    },
    tvaDefaut: 20,
    regleArrondi: 'À l’euro près',
    prixMinimum: 500,
    prixMaximum: 100000,
  };

  // --- État pour filtres et recherche ---
  const [filtreStatut, setFiltreStatut] = useState(null);
  const [filtreCategorie, setFiltreCategorie] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPrix, setSelectedPrix] = useState(null);

  // --- Options pour filtres ---
  const statuts = [
    { label: 'Tous', value: null },
    { label: 'Actif', value: 'Actif' },
    { label: 'Inactif', value: 'Inactif' },
    { label: 'Archivé', value: 'Archivé' },
  ];

  const categories = [
    { label: 'Toutes', value: null },
    { label: 'Médicaments sur ordonnance', value: 'Médicaments sur ordonnance' },
    { label: 'Médicaments sans ordonnance', value: 'Médicaments sans ordonnance' },
    { label: 'Produits de parapharmacie', value: 'Produits de parapharmacie' },
    { label: 'Produits cosmétiques', value: 'Produits cosmétiques' },
    { label: 'Matériel médical', value: 'Matériel médical' },
  ];

  // --- Calcul du prix calculé ---
  const calculerPrixCalcule = (medicament) => {
    const marge = configuration.margesParCategorie[medicament.categorie] || configuration.margeGlobale;
    let prix = medicament.prixAchat * (1 + marge / 100) * (1 + configuration.tvaDefaut / 100);
    if (configuration.regleArrondi === 'À l’euro près') {
      prix = Math.round(prix);
    }
    return Math.max(configuration.prixMinimum, Math.min(prix, configuration.prixMaximum));
  };

  // --- Données pour le DataTable ---
  const tableData = prixSpecifiques
    .map((prix) => {
      const medicament = medicaments.find((m) => m.id === prix.idMedicament);
      if (!medicament) return null;
      const prixCalcule = calculerPrixCalcule(medicament);
      return {
        ...prix,
        nomMedicament: medicament.nom,
        categorie: medicament.categorie,
        prixAchat: medicament.prixAchat,
        prixCalcule,
        differenceMGA: prix.prixSpecifique - prixCalcule,
        differencePourcentage: prixCalcule ? ((prix.prixSpecifique - prixCalcule) / prixCalcule * 100).toFixed(2) : 0,
      };
    })
    .filter((item) => item)
    .filter((item) => !filtreStatut || item.statut === filtreStatut)
    .filter((item) => !filtreCategorie || item.categorie === filtreCategorie)
    .filter((item) => !recherche || item.nomMedicament.toLowerCase().includes(recherche.toLowerCase()));

  // --- Gestion du dialogue ---
  const [formData, setFormData] = useState({
    idMedicament: '',
    prixSpecifique: 0,
    statut: 'Actif',
    raison: '',
  });

  const openDialog = (prix = null) => {
    setSelectedPrix(prix);
    setFormData(
      prix
        ? { idMedicament: prix.idMedicament, prixSpecifique: prix.prixSpecifique, statut: prix.statut, raison: prix.raison }
        : { idMedicament: '', prixSpecifique: 0, statut: 'Actif', raison: '' }
    );
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setSelectedPrix(null);
    setFormData({ idMedicament: '', prixSpecifique: 0, statut: 'Actif', raison: '' });
  };

  // --- Actions ---
  const ajouterPrix = () => {
    // Simulation POST /specific-prices
    const nouveauPrix = {
      id: `SP-${(prixSpecifiques.length + 1).toString().padStart(3, '0')}`,
      idMedicament: formData.idMedicament,
      prixSpecifique: formData.prixSpecifique,
      statut: formData.statut,
      dateCreation: new Date(),
      dateModification: new Date(),
      raison: formData.raison,
    };
    setPrixSpecifiques([...prixSpecifiques, nouveauPrix]);
    toast.current?.show({ severity: 'success', summary: 'Ajout', detail: 'Prix spécifique ajouté.' });
    closeDialog();

    // Remplacer par un appel API réel, par exemple :
    /*
    import axios from 'axios';
    axios.post('/specific-prices', nouveauPrix)
      .then(() => {
        setPrixSpecifiques([...prixSpecifiques, nouveauPrix]);
        toast.current?.show({ severity: 'success', summary: 'Ajout', detail: 'Prix spécifique ajouté.' });
      })
      .catch((error) => {
        toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l’ajout.' });
      });
    */
  };

  const modifierPrix = () => {
    // Simulation modification
    setPrixSpecifiques(
      prixSpecifiques.map((prix) =>
        prix.id === selectedPrix.id
          ? { ...prix, ...formData, dateModification: new Date() }
          : prix
      )
    );
    toast.current?.show({ severity: 'success', summary: 'Modification', detail: 'Prix spécifique modifié.' });
    closeDialog();

    // Remplacer par un appel API réel si nécessaire
  };

  const changerStatut = (prix, nouveauStatut) => {
    // Simulation PUT /specific-prices/:id/statut
    setPrixSpecifiques(
      prixSpecifiques.map((p) =>
        p.id === prix.id ? { ...p, statut: nouveauStatut, dateModification: new Date() } : p
      )
    );
    toast.current?.show({ severity: 'success', summary: 'Statut', detail: `Statut changé à ${nouveauStatut}.` });

    // Remplacer par un appel API réel, par exemple :
    /*
    import axios from 'axios';
    axios.put(`/specific-prices/${prix.id}/statut`, { statut: nouveauStatut })
      .then(() => {
        setPrixSpecifiques(
          prixSpecifiques.map((p) =>
            p.id === prix.id ? { ...p, statut: nouveauStatut, dateModification: new Date() } : p
          )
        );
        toast.current?.show({ severity: 'success', summary: 'Statut', detail: `Statut changé à ${nouveauStatut}.` });
      })
      .catch((error) => {
        toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du changement de statut.' });
      });
    */
  };

  const supprimerPrix = (prix) => {
    setPrixSpecifiques(prixSpecifiques.filter((p) => p.id !== prix.id));
    toast.current?.show({ severity: 'success', summary: 'Suppression', detail: 'Prix spécifique supprimé.' });

    // Remplacer par un appel API réel si nécessaire
  };

  const exporterListe = (format) => {
    if (format === 'Excel') {
      const csvContent = [
        ['ID', 'Médicament', 'Catégorie', 'Prix d’achat', 'Prix calculé', 'Prix spécifique', 'Différence (MGA)', 'Différence (%)', 'Statut', 'Date création', 'Date modification', 'Raison'].join(','),
        ...tableData.map((item) =>
          [
            item.id,
            item.nomMedicament,
            item.categorie,
            item.prixAchat.toLocaleString('fr-FR'),
            item.prixCalcule.toLocaleString('fr-FR'),
            item.prixSpecifique.toLocaleString('fr-FR'),
            item.differenceMGA.toLocaleString('fr-FR'),
            `${item.differencePourcentage}%`,
            item.statut,
            item.dateCreation.toLocaleDateString('fr-FR'),
            item.dateModification.toLocaleDateString('fr-FR'),
            `"${item.raison}"`,
          ].join(',')
        ),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prix_specifiques.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste exportée en CSV.' });
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Liste des Prix Spécifiques', 20, 20);
      doc.setFontSize(12);
      let y = 30;
      tableData.forEach((item) => {
        doc.text(
          `${item.id}: ${item.nomMedicament} - ${item.prixSpecifique.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })} (Calculé: ${item.prixCalcule.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })})`,
          20,
          y
        );
        y += 10;
        doc.text(`Catégorie: ${item.categorie}, Statut: ${item.statut}, Raison: ${item.raison}`, 20, y);
        y += 10;
      });
      doc.save('prix_specifiques.pdf');
      toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Liste exportée en PDF.' });
    }
  };

  // --- Rendu colonnes ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const pourcentageBody = (row) => `${row.differencePourcentage}%`;
  const dateBody = (row, field) => row[field].toLocaleDateString('fr-FR');

  const actionBody = (row) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button icon="pi pi-pencil" className="p-button-text" onClick={() => openDialog(row)} />
      <Dropdown
        value={row.statut}
        options={statuts.slice(1)} // Exclut "Tous"
        onChange={(e) => changerStatut(row, e.value)}
        style={{ width: '120px' }}
      />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => supprimerPrix(row)} />
    </div>
  );

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Gestion des Prix Spécifiques</span>
      <InputText
        placeholder="Rechercher un médicament"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ width: '200px' }}
      />
      <Dropdown
        value={filtreStatut}
        options={statuts}
        onChange={(e) => setFiltreStatut(e.value)}
        placeholder="Filtrer par statut"
        style={{ width: '150px' }}
      />
      <Dropdown
        value={filtreCategorie}
        options={categories}
        onChange={(e) => setFiltreCategorie(e.value)}
        placeholder="Filtrer par catégorie"
        style={{ width: '200px' }}
      />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Ajouter Prix" icon="pi pi-plus" onClick={() => openDialog()} className="p-button-outlined" />
      <Button label="Exporter Excel" icon="pi pi-file-excel" onClick={() => exporterListe('Excel')} className="p-button-outlined" />
      <Button label="Exporter PDF" icon="pi pi-file-pdf" onClick={() => exporterListe('PDF')} className="p-button-outlined" />
    </div>
  );

  // --- Rendu principal ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#eef1f2' }}>
      <Toast ref={toast} />

      {/* Bandeau module */}
      <div
        style={{
          background: 'linear-gradient(180deg,#16a085,#11967b)',
          color: '#fff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="pi pi-tags" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Gestion des Prix Spécifiques</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title="Liste des Prix Spécifiques"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            <DataTable value={tableData} responsiveLayout="scroll" emptyMessage="Aucun prix spécifique trouvé">
              <Column field="id" header="ID" sortable />
              <Column field="nomMedicament" header="Médicament" sortable />
              <Column field="categorie" header="Catégorie" sortable />
              <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable />
              <Column field="prixCalcule" header="Prix calculé" body={(row) => montantBody(row, 'prixCalcule')} sortable />
              <Column field="prixSpecifique" header="Prix spécifique" body={(row) => montantBody(row, 'prixSpecifique')} sortable />
              <Column field="differenceMGA" header="Différence (MGA)" body={(row) => montantBody(row, 'differenceMGA')} sortable />
              <Column field="differencePourcentage" header="Différence (%)" body={pourcentageBody} sortable />
              <Column field="statut" header="Statut" sortable />
              <Column field="dateCreation" header="Date création" body={(row) => dateBody(row, 'dateCreation')} sortable />
              <Column field="dateModification" header="Date modification" body={(row) => dateBody(row, 'dateModification')} sortable />
              <Column field="raison" header="Raison" sortable />
              <Column body={actionBody} header="Actions" />
            </DataTable>
          </Card>

          {/* Dialogue pour ajout/modification */}
          <Dialog
            header={selectedPrix ? 'Modifier Prix Spécifique' : 'Ajouter Prix Spécifique'}
            visible={dialogVisible}
            style={{ width: '400px' }}
            onHide={closeDialog}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Médicament</label>
                <Dropdown
                  value={formData.idMedicament}
                  options={medicaments.map((m) => ({ label: m.nom, value: m.id }))}
                  onChange={(e) => setFormData({ ...formData, idMedicament: e.value })}
                  placeholder="Sélectionner un médicament"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix spécifique (MGA)</label>
                <InputNumber
                  value={formData.prixSpecifique}
                  onValueChange={(e) => setFormData({ ...formData, prixSpecifique: e.value })}
                  min={0}
                  suffix=" MGA"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Statut</label>
                <Dropdown
                  value={formData.statut}
                  options={statuts.slice(1)}
                  onChange={(e) => setFormData({ ...formData, statut: e.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Raison</label>
                <InputTextarea
                  value={formData.raison}
                  onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
                  rows={4}
                  style={{ width: '100%' }}
                />
              </div>
              <Button
                label={selectedPrix ? 'Modifier' : 'Ajouter'}
                icon="pi pi-check"
                onClick={selectedPrix ? modifierPrix : ajouterPrix}
                disabled={!formData.idMedicament || !formData.prixSpecifique}
              />
            </div>
          </Dialog>
        </main>
      </div>

      {/* Styles inline responsive */}
      <style>{`
        @media (max-width: 1024px) {
          main { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}