import React, { useState, useRef } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import Sidebar from '../components/Sidebar';

export default function PriceConfigurationPage() {
  const toast = useRef(null);

  // --- Données mockées pour les médicaments ---
  const medicamentsMock = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000 },
  ];

  // --- État initial pour la configuration des prix ---
  const [configuration, setConfiguration] = useState({
    margeGlobale: 30, // en %
    margesParCategorie: {
      'Médicaments sur ordonnance': 25,
      'Médicaments sans ordonnance': 35,
      'Produits de parapharmacie': 40,
      'Produits cosmétiques': 50,
      'Matériel médical': 20,
    },
    regleArrondi: 'À l’euro près',
    prixMinimum: 500,
    prixMaximum: 100000,
    tvaDefaut: 20, // en %
    dateApplication: new Date('2025-10-01'),
  });

  // --- État pour l'historique des modifications ---
  const [historique, setHistorique] = useState([
    {
      id: 'HIST-001',
      date: new Date('2025-07-01'),
      modifications: 'Marge globale définie à 30%, TVA à 20%',
      utilisateur: 'Admin',
    },
    {
      id: 'HIST-002',
      date: new Date('2025-08-15'),
      modifications: 'Marge cosmétiques augmentée à 50%',
      utilisateur: 'Admin',
    },
  ]);

  // --- Options pour les règles d'arrondi ---
  const reglesArrondi = [
    { label: 'Au centime près', value: 'Au centime près' },
    { label: 'À 5 centimes près', value: 'À 5 centimes près' },
    { label: 'À l’euro près', value: 'À l’euro près' },
  ];

  // --- Prévisualisation des prix ---
  const calculerPrixVente = (medicament) => {
    const marge = configuration.margesParCategorie[medicament.categorie] || configuration.margeGlobale;
    let prixVente = medicament.prixAchat * (1 + marge / 100) * (1 + configuration.tvaDefaut / 100);

    // Appliquer la règle d'arrondi
    switch (configuration.regleArrondi) {
      case 'Au centime près':
        prixVente = Math.round(prixVente * 100) / 100;
        break;
      case 'À 5 centimes près':
        prixVente = Math.round(prixVente * 20) / 20;
        break;
      case 'À l’euro près':
        prixVente = Math.round(prixVente);
        break;
      default:
        break;
    }

    // Appliquer les seuils
    prixVente = Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum));

    return prixVente;
  };

  const previewData = medicamentsMock.map((medicament) => ({
    ...medicament,
    prixVente: calculerPrixVente(medicament),
  }));

  // --- Actions ---
  const sauvegarderConfiguration = () => {
    const nouvelleModification = {
      id: `HIST-${(historique.length + 1).toString().padStart(3, '0')}`,
      date: new Date(),
      modifications: `Marge globale: ${configuration.margeGlobale}%, TVA: ${configuration.tvaDefaut}%, Arrondi: ${configuration.regleArrondi}, Marges par catégorie: ${JSON.stringify(
        configuration.margesParCategorie
      )}`,
      utilisateur: 'Admin',
    };
    setHistorique([...historique, nouvelleModification]);
    toast.current?.show({
      severity: 'success',
      summary: 'Sauvegarde',
      detail: 'Configuration des prix sauvegardée.',
    });
  };

  const appliquerTarifs = () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Application',
      detail: `Simulation : Nouveaux tarifs appliqués à partir du ${configuration.dateApplication.toLocaleDateString('fr-FR')}.`,
    });
  };

  const previsualiserImpact = () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Prévisualisation',
      detail: 'Prévisualisation des prix mise à jour.',
    });
  };

  // --- Gestion des changements ---
  const handleMargeGlobaleChange = (e) => {
    setConfiguration({ ...configuration, margeGlobale: e.value });
  };

  const handleMargeCategorieChange = (categorie, value) => {
    setConfiguration({
      ...configuration,
      margesParCategorie: { ...configuration.margesParCategorie, [categorie]: value },
    });
  };

  const handleRegleArrondiChange = (e) => {
    setConfiguration({ ...configuration, regleArrondi: e.value });
  };

  const handlePrixMinimumChange = (e) => {
    setConfiguration({ ...configuration, prixMinimum: e.value });
  };

  const handlePrixMaximumChange = (e) => {
    setConfiguration({ ...configuration, prixMaximum: e.value });
  };

  const handleTvaDefautChange = (e) => {
    setConfiguration({ ...configuration, tvaDefaut: e.value });
  };

  const handleDateApplicationChange = (e) => {
    setConfiguration({ ...configuration, dateApplication: e.value });
  };

  // --- Rendu colonnes ---
  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

  const dateBody = (row) => row.date.toLocaleDateString('fr-FR');

  // --- Toolbar ---
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Configuration des Prix</span>
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Prévisualiser" icon="pi pi-eye" onClick={previsualiserImpact} className="p-button-outlined" />
      <Button label="Sauvegarder" icon="pi pi-save" onClick={sauvegarderConfiguration} className="p-button-outlined" />
      <Button label="Appliquer" icon="pi pi-check" onClick={appliquerTarifs} className="p-button-outlined" />
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
          <i className="pi pi-cog" style={{ fontSize: 18 }} />
          <strong>Comptabilité ▸ Configuration des Prix</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title="Paramètres de Prix"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <Toolbar left={headerLeft} right={headerRight} style={{ border: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Marge globale */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Marge globale par défaut (%)</label>
                <InputNumber
                  value={configuration.margeGlobale}
                  onValueChange={handleMargeGlobaleChange}
                  min={0}
                  max={100}
                  suffix="%"
                  style={{ width: '200px' }}
                />
              </div>

              {/* Marges par catégorie */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Marges par catégorie (%)</label>
                {Object.keys(configuration.margesParCategorie).map((categorie) => (
                  <div key={categorie} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: '200px' }}>{categorie}</span>
                    <InputNumber
                      value={configuration.margesParCategorie[categorie]}
                      onValueChange={(e) => handleMargeCategorieChange(categorie, e.value)}
                      min={0}
                      max={100}
                      suffix="%"
                      style={{ width: '150px' }}
                    />
                  </div>
                ))}
              </div>

              {/* Règle d'arrondi */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Règle d’arrondi</label>
                <Dropdown
                  value={configuration.regleArrondi}
                  options={reglesArrondi}
                  onChange={handleRegleArrondiChange}
                  style={{ width: '200px' }}
                />
              </div>

              {/* Seuils de prix */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix minimum de vente (MGA)</label>
                <InputNumber
                  value={configuration.prixMinimum}
                  onValueChange={handlePrixMinimumChange}
                  min={0}
                  suffix=" MGA"
                  style={{ width: '200px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix maximum autorisé (MGA)</label>
                <InputNumber
                  value={configuration.prixMaximum}
                  onValueChange={handlePrixMaximumChange}
                  min={0}
                  suffix=" MGA"
                  style={{ width: '200px' }}
                />
              </div>

              {/* TVA */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>TVA par défaut (%)</label>
                <InputNumber
                  value={configuration.tvaDefaut}
                  onValueChange={handleTvaDefautChange}
                  min={0}
                  max={100}
                  suffix="%"
                  style={{ width: '200px' }}
                />
              </div>

              {/* Date d'application */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Date d’application</label>
                <Calendar
                  value={configuration.dateApplication}
                  onChange={handleDateApplicationChange}
                  dateFormat="dd/mm/yy"
                  style={{ width: '200px' }}
                />
              </div>
            </div>
          </Card>

          {/* Prévisualisation */}
          <Card
            title="Prévisualisation des Prix"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <DataTable value={previewData} responsiveLayout="scroll" emptyMessage="Aucun médicament à prévisualiser">
              <Column field="id" header="ID" sortable />
              <Column field="nom" header="Médicament" sortable />
              <Column field="categorie" header="Catégorie" sortable />
              <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable />
              <Column field="prixVente" header="Prix de vente" body={(row) => montantBody(row, 'prixVente')} sortable />
            </DataTable>
          </Card>

          {/* Historique des modifications */}
          <Card
            title="Historique des Modifications"
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <DataTable value={historique} responsiveLayout="scroll" emptyMessage="Aucun historique disponible">
              <Column field="id" header="ID" sortable />
              <Column field="date" header="Date" body={dateBody} sortable />
              <Column field="modifications" header="Modifications" sortable />
              <Column field="utilisateur" header="Utilisateur" sortable />
            </DataTable>
          </Card>
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