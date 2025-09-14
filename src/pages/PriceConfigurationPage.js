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
import { Tag } from 'primereact/tag';
import Sidebar from '../components/Sidebar';

/**
 * PriceConfigurationPage – Interface client lourd améliorée
 * - Fenêtre desktop (● ● ●), sidebar redimensionnable, contenu scrollable, barre d'état.
 * - Raccourcis : Ctrl+P (prévisualiser), Ctrl+S (sauvegarder), Ctrl+Entrée (appliquer).
 * - Panneau paramètres (scrollable), prévisualisation & historique (scrollables).
 * - Palette MediFinder : verts (#16a085/#0f8b6e), gris (#f0f2f6).
 * - Scroll global sur la zone principale + scrolls internes sur chaque section.
 */
export default function PriceConfigurationPage() {
  const toast = useRef(null);

  // Données mockées pour les médicaments
  const medicamentsMock = [
    { id: 'MED-001', nom: 'Paracétamol 500mg', categorie: 'Médicaments sur ordonnance', prixAchat: 1000 },
    { id: 'MED-002', nom: 'Ibuprofène 400mg', categorie: 'Médicaments sans ordonnance', prixAchat: 1500 },
    { id: 'MED-003', nom: 'Crème hydratante', categorie: 'Produits cosmétiques', prixAchat: 5000 },
    { id: 'MED-004', nom: 'Thermomètre', categorie: 'Matériel médical', prixAchat: 20000 },
    { id: 'MED-005', nom: 'Vitamine C', categorie: 'Produits de parapharmacie', prixAchat: 3000 },
  ];

  // État initial pour la configuration des prix
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

  // Historique
  const [historique, setHistorique] = useState([
    { id: 'HIST-001', date: new Date('2025-07-01'), modifications: 'Marge globale 30%, TVA 20%', utilisateur: 'Admin' },
    { id: 'HIST-002', date: new Date('2025-08-15'), modifications: 'Cosmétiques -> marge 50%', utilisateur: 'Admin' },
  ]);

  // Options
  const reglesArrondi = [
    { label: 'Au centime près', value: 'Au centime près' },
    { label: 'À 5 centimes près', value: 'À 5 centimes près' },
    { label: 'À l’euro près', value: 'À l’euro près' },
  ];

  // Prévisualisation
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

  // Actions
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

  // Handlers
  const setCfg = (patch) => setConfiguration((c) => ({ ...c, ...patch }));

  const montantBody = (row, field) => row[field]?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });
  const dateBody = (row) => new Date(row.date).toLocaleDateString('fr-FR');

  // Sidebar redimensionnable
  const [leftW, setLeftW] = useState(280);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => { if (resizingRef.current) setLeftW(Math.min(Math.max(e.clientX, 220), 520)); };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); previsualiserImpact(); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); sauvegarderConfiguration(); }
      if (e.ctrlKey && (e.key === 'Enter')) { e.preventDefault(); appliquerTarifs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [configuration, historique]);

  // Toolbar
  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <i className="pi pi-cog" style={{ fontSize: 20, color: '#16a085' }} />
      <strong style={{ fontSize: 16, color: '#fff' }}>Configuration des prix</strong>
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button label="Prévisualiser" icon="pi pi-eye" onClick={previsualiserImpact} className="p-button-outlined p-button-sm" />
      <Button label="Sauvegarder" icon="pi pi-save" onClick={sauvegarderConfiguration} className="p-button-outlined p-button-sm" />
      <Button label="Appliquer" icon="pi pi-check" onClick={appliquerTarifs} className="p-button-success p-button-sm" />
    </div>
  );

  // Layout client lourd
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
      background: '#e6e9ef',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <Toast ref={toast} position="top-right" />
      <div className="app-window" style={{
        width: 'min(1400px, 100vw)',
        height: 'min(900px, 100vh)',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'grid',
        gridTemplateRows: '48px 1fr 32px',
        overflow: 'hidden',
      }}>
        {/* Barre de titre */}
        <div style={{
          background: 'linear-gradient(180deg,#f8f9fb,#ebedf2)',
          borderBottom: '1px solid #d9dde5',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff605c', cursor: 'pointer' }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd44', cursor: 'pointer' }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#00ca4e', cursor: 'pointer' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2f3b52' }}>MediFinder • Configuration des prix</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag severity="info" value="Ctrl+P Prévisualiser" style={{ fontSize: 12 }} />
            <Tag severity="success" value="Ctrl+S Sauvegarder" style={{ fontSize: 12 }} />
            <Tag severity="warning" value="Ctrl+Entrée Appliquer" style={{ fontSize: 12 }} />
          </div>
        </div>

        {/* Corps : Sidebar + poignée + contenu */}
        <div className="window-body" style={{ display: 'grid', gridTemplateColumns: `${leftW}px 8px 1fr`, height: '100%' }}>
          {/* Sidebar */}
          <aside style={{ background: '#f8f9fb', borderRight: '1px solid #d9dde5', overflow: 'auto', padding: 16 }}>
            <Sidebar title="Modules" />
          </aside>

          {/* Poignée redimensionnable */}
          <div role="separator" aria-orientation="vertical" title="Glisser pour redimensionner" onMouseDown={() => (resizingRef.current = true)} style={{ cursor: 'col-resize', background: '#d9dde5', transition: 'background 0.2s' }} />

          {/* Contenu principal */}
          <main style={{ display: 'grid', gridTemplateRows: '48px 1fr', height: '100%' }}>
            {/* Bandeau module */}
            <div style={{
              background: 'linear-gradient(180deg,#16a085,#0f8b6e)',
              color: '#fff',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              {headerLeft}
              {headerRight}
            </div>

            {/* Contenu scrollable global */}
            <div style={{
              padding: 16,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 400px) 1fr',
              gap: 16,
              height: '100%',
              maxHeight: 'calc(100% - 48px)',
            }}>
              {/* Panneau paramètres */}
              <Card style={{
                maxHeight: '100%',
                overflowY: 'auto',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }} title="Paramètres">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Marge globale (%)</label>
                    <InputNumber value={configuration.margeGlobale} onValueChange={(e) => setCfg({ margeGlobale: e.value })} min={0} max={100} suffix="%" className="p-inputtext-sm" style={{ width: 160 }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Marges par catégorie (%)</label>
                    {Object.keys(configuration.margesParCategorie).map((categorie) => (
                      <div key={categorie} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 180, fontSize: 13 }}>{categorie}</span>
                        <InputNumber value={configuration.margesParCategorie[categorie]} onValueChange={(e) => setConfiguration((c) => ({ ...c, margesParCategorie: { ...c.margesParCategorie, [categorie]: e.value } }))} min={0} max={100} suffix="%" className="p-inputtext-sm" style={{ width: 120 }} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Règle d’arrondi</label>
                    <Dropdown value={configuration.regleArrondi} options={reglesArrondi} onChange={(e) => setCfg({ regleArrondi: e.value })} className="p-inputtext-sm" style={{ width: 200 }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Prix minimum (MGA)</label>
                    <InputNumber value={configuration.prixMinimum} onValueChange={(e) => setCfg({ prixMinimum: e.value })} min={0} className="p-inputtext-sm" style={{ width: 200 }} suffix=" MGA" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Prix maximum (MGA)</label>
                    <InputNumber value={configuration.prixMaximum} onValueChange={(e) => setCfg({ prixMaximum: e.value })} min={0} className="p-inputtext-sm" style={{ width: 200 }} suffix=" MGA" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>TVA par défaut (%)</label>
                    <InputNumber value={configuration.tvaDefaut} onValueChange={(e) => setCfg({ tvaDefaut: e.value })} min={0} max={100} suffix="%" className="p-inputtext-sm" style={{ width: 160 }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Date d’application</label>
                    <Calendar value={configuration.dateApplication} onChange={(e) => setCfg({ dateApplication: e.value })} dateFormat="dd/mm/yy" className="p-inputtext-sm" style={{ width: 200 }} />
                  </div>
                </div>
              </Card>

              {/* Panneau résultats */}
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
                <Card title="Prévisualisation des prix" style={{
                  maxHeight: '100%',
                  overflowY: 'auto',
                  border: '1px solid #d7d7d7',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}>
                  <DataTable value={previewData} scrollable scrollHeight="400px" responsiveLayout="scroll" emptyMessage="Aucun médicament">
                    <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
                    <Column field="nom" header="Médicament" sortable style={{ minWidth: 220 }} />
                    <Column field="categorie" header="Catégorie" sortable style={{ minWidth: 200 }} />
                    <Column field="prixAchat" header="Prix d’achat" body={(row) => montantBody(row, 'prixAchat')} sortable style={{ minWidth: 140 }} />
                    <Column field="prixVente" header="Prix de vente" body={(row) => montantBody(row, 'prixVente')} sortable style={{ minWidth: 140 }} />
                  </DataTable>
                </Card>

                <Card title="Historique des modifications" style={{
                  maxHeight: '100%',
                  overflowY: 'auto',
                  border: '1px solid #d7d7d7',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}>
                  <DataTable value={historique} scrollable scrollHeight="400px" responsiveLayout="scroll" emptyMessage="Aucun historique">
                    <Column field="id" header="ID" sortable style={{ minWidth: 120 }} />
                    <Column field="date" header="Date" body={dateBody} sortable style={{ minWidth: 160 }} />
                    <Column field="modifications" header="Modifications" sortable style={{ minWidth: 260 }} />
                    <Column field="utilisateur" header="Utilisateur" sortable style={{ minWidth: 160 }} />
                  </DataTable>
                </Card>
              </div>
            </div>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{ background: '#f0f2f6', borderTop: '1px solid #d9dde5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 13, color: '#2f3b52' }}>
          <span>État: prêt</span>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        .app-window { transition: all 0.2s ease; }
        .app-window input:focus, .app-window button:focus, .app-window .p-dropdown:focus, .app-window .p-calendar:focus { outline: 2px solid #16a085 !important; outline-offset: 2px; }
        .p-button-sm { padding: 4px 12px !important; }
        .p-inputtext-sm { font-size: 14px !important; }
        .window-body .separator:hover { background: #16a085; }
        .p-card-content { padding: 0 !important; }
        .p-datatable .p-datatable-tbody > tr > td { padding: 8px !important; }
        .p-datatable .p-datatable-thead > tr > th { padding: 8px !important; }
        @media (max-width: 1200px) { 
          .window-body { grid-template-columns: 0 0 1fr !important; } 
          .app-window { height: 100vh !important; border-radius: 0; width: 100vw !important; } 
        }
        @media (max-width: 768px) { 
          main { grid-template-columns: 1fr !important; }
          .p-card { max-height: 300px !important; }
          .p-datatable { font-size: 13px !important; }
          .p-datatable .p-datatable-tbody > tr > td, .p-datatable .p-datatable-thead > tr > th { font-size: 13px !important; }
        }
      `}</style>
    </div>
  );
}