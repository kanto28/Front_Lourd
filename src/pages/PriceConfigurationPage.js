import React, { useState, useMemo, useRef, useEffect } from 'react';
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

/**
 * PriceConfigurationPage – Style "client lourd"
 * - Fenêtre desktop (barre de titre ● ● ● + barre d'état)
 * - Panneau paramètres à gauche, prévisualisation & historique à droite
 * - Raccourcis: Ctrl+P (prévisualiser), Ctrl+S (sauvegarder), Ctrl+Entrée (appliquer)
 * - Zones scrollables pour les tableaux
 */
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

  // --- Historique ---
  const [historique, setHistorique] = useState([
    { id: 'HIST-001', date: new Date('2025-07-01'), modifications: 'Marge globale 30%, TVA 20%', utilisateur: 'Admin' },
    { id: 'HIST-002', date: new Date('2025-08-15'), modifications: 'Cosmétiques -> marge 50%', utilisateur: 'Admin' },
  ]);

  // --- Options ---
  const reglesArrondi = [
    { label: 'Au centime près', value: 'Au centime près' },
    { label: 'À 5 centimes près', value: 'À 5 centimes près' },
    { label: 'À l’euro près', value: 'À l’euro près' },
  ];

  // --- Prévisualisation ---
  const calculerPrixVente = (m) => {
    const marge = configuration.margesParCategorie[m.categorie] ?? configuration.margeGlobale;
    let prixVente = m.prixAchat * (1 + marge / 100) * (1 + configuration.tvaDefaut / 100);

    // Arrondi
    switch (configuration.regleArrondi) {
      case 'Au centime près':
        prixVente = Math.round(prixVente * 100) / 100;
        break;
      case 'À 5 centimes près':
        prixVente = Math.round(prixVente * 20) / 20;
        break;
      case 'À l’euro près':
      default:
        prixVente = Math.round(prixVente);
        break;
    }

    // Seuils
    prixVente = Math.max(configuration.prixMinimum, Math.min(prixVente, configuration.prixMaximum));
    return prixVente;
  };

  const previewData = useMemo(
    () => medicamentsMock.map((m) => ({ ...m, prixVente: calculerPrixVente(m) })),
    [configuration]
  );

  // --- Actions ---
  const previsualiserImpact = () =>
    toast.current?.show({ severity: 'info', summary: 'Prévisualisation', detail: 'Aperçu des prix actualisé.' });

  const sauvegarderConfiguration = () => {
    const nouvelleModification = {
      id: `HIST-${String(historique.length + 1).padStart(3, '0')}`,
      date: new Date(),
      modifications: `Marge: ${configuration.margeGlobale}%, TVA: ${configuration.tvaDefaut}%, Arrondi: ${configuration.regleArrondi}`,
      utilisateur: 'Admin',
    };
    setHistorique((h) => [...h, nouvelleModification]);
    toast.current?.show({ severity: 'success', summary: 'Sauvegardé', detail: 'Configuration enregistrée.' });
  };

  const appliquerTarifs = () =>
    toast.current?.show({ severity: 'success', summary: 'Appliqué', detail: `Tarifs appliqués au ${configuration.dateApplication.toLocaleDateString('fr-FR')}.` });

  // --- Handlers ---
  const setCfg = (patch) => setConfiguration((c) => ({ ...c, ...patch }));

  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const dateBody = (row) => new Date(row.date).toLocaleDateString('fr-FR');

  // --- Raccourcis clavier ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); previsualiserImpact(); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); sauvegarderConfiguration(); }
      if (e.ctrlKey && (e.key === 'Enter')) { e.preventDefault(); appliquerTarifs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [configuration, historique]);

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
      <Button label="Appliquer" icon="pi pi-check" onClick={appliquerTarifs} className="p-button-success" />
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, system-ui', background: '#e6e9ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Toast ref={toast} />

      {/* Fenêtre app */}
      <div className="app-window" style={{ width: 'min(1400px,100vw)', height: 'min(900px,100vh)', background: '#f7f8fb', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,0.18)', display: 'grid', gridTemplateRows: '44px 1fr 28px' }}>
        {/* Barre de titre */}
        <div style={{ background: 'linear-gradient(180deg,#fdfdfd,#f1f3f7)', borderBottom: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Configuration des prix</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, opacity: 0.8, fontSize: 12 }}>
            <span>Ctrl+P: Prévisualiser</span>
            <span>Ctrl+S: Sauvegarder</span>
            <span>Ctrl+Entrée: Appliquer</span>
          </div>
        </div>

        {/* Corps */}
        <div style={{ display: 'flex', minHeight: 0 }}>
          <Sidebar title="Modules" />

          <main style={{ flex: 1, padding: 16, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, minHeight: 0, overflow: 'hidden' }}>
            {/* Panneau paramètres */}
            <Card style={{ height: '100%', overflow: 'auto', border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }} title="Paramètres">
              <Toolbar left={headerLeft} right={headerRight} style={{ border: 0, paddingLeft: 0, paddingRight: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Marge globale (%)</label>
                  <InputNumber value={configuration.margeGlobale} onValueChange={(e) => setCfg({ margeGlobale: e.value })} min={0} max={100} suffix="%" style={{ width: 180 }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Marges par catégorie (%)</label>
                  {Object.keys(configuration.margesParCategorie).map((categorie) => (
                    <div key={categorie} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 210 }}>{categorie}</span>
                      <InputNumber value={configuration.margesParCategorie[categorie]} onValueChange={(e) => setConfiguration((c) => ({ ...c, margesParCategorie: { ...c.margesParCategorie, [categorie]: e.value } }))} min={0} max={100} suffix="%" style={{ width: 140 }} />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Règle d’arrondi</label>
                  <Dropdown value={configuration.regleArrondi} options={reglesArrondi} onChange={(e) => setCfg({ regleArrondi: e.value })} style={{ width: 220 }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix minimum (MGA)</label>
                  <InputNumber value={configuration.prixMinimum} onValueChange={(e) => setCfg({ prixMinimum: e.value })} min={0} style={{ width: 220 }} suffix=" MGA" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Prix maximum (MGA)</label>
                  <InputNumber value={configuration.prixMaximum} onValueChange={(e) => setCfg({ prixMaximum: e.value })} min={0} style={{ width: 220 }} suffix=" MGA" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>TVA par défaut (%)</label>
                  <InputNumber value={configuration.tvaDefaut} onValueChange={(e) => setCfg({ tvaDefaut: e.value })} min={0} max={100} suffix="%" style={{ width: 180 }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Date d’application</label>
                  <Calendar value={configuration.dateApplication} onChange={(e) => setCfg({ dateApplication: e.value })} dateFormat="dd/mm/yy" style={{ width: 220 }} />
                </div>
              </div>
            </Card>

            {/* Panneau résultats */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16, minHeight: 0 }}>
              <Card title="Prévisualisation des prix" style={{ border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <DataTable value={previewData} scrollable scrollHeight="flex" responsiveLayout="scroll" emptyMessage="Aucun médicament">
                    <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
                    <Column field="nom" header="Médicament" sortable style={{ minWidth: 220 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 200 }} />
                    <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable style={{ minWidth: 140 }} />
                    <Column field="prixVente" header="Prix de vente" body={(row) => montantBody(row, 'prixVente')} sortable style={{ minWidth: 140 }} />
                  </DataTable>
                </div>
              </Card>

              <Card title="Historique des modifications" style={{ border: '1px solid #d7d7d7', borderRadius: 12, boxShadow: '0 12px 26px rgba(0,0,0,0.06)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <DataTable value={historique} scrollable scrollHeight="flex" responsiveLayout="scroll" emptyMessage="Aucun historique">
                    <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
                    <Column field="date" header="Date" body={dateBody} sortable style={{ minWidth: 160 }} />
                    <Column field="modifications" header="Modifications" sortable style={{ minWidth: 260 }} />
                    <Column field="utilisateur" header="Utilisateur" sortable style={{ minWidth: 160 }} />
                  </DataTable>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{ background: '#eef1f6', borderTop: '1px solid #e3e6ee', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>
    </div>
  );
}
