import React, { useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import Sidebar from '../components/Sidebar';
import { Button } from 'primereact/button';

export default function SortirPage() {
  const toast = useRef(null);

  // --- Données mockées (cohérentes avec les autres pages) ---
  const medicaments = [
    { id: 1, nom: 'Paracétamol 500mg', stock: 150 },
    { id: 2, nom: 'Amoxicilline 1g', stock: 30 },
    { id: 3, nom: 'Ibuprofène 400mg', stock: 0 },
    { id: 4, nom: 'Aspirine 100mg', stock: 300 },
  ];

  const ventes = [
    {
      id: 'VTE-2025-001',
      date: '2025-07-12',
      medicaments: [
        { id: 1, nom: 'Paracétamol 500mg', quantite: 10 },
        { id: 2, nom: 'Amoxicilline 1g', quantite: 5 },
      ],
    },
    {
      id: 'VTE-2025-002',
      date: '2025-08-01',
      medicaments: [{ id: 3, nom: 'Ibuprofène 400mg', quantite: 30 }],
    },
    {
      id: 'VTE-2025-003',
      date: '2025-09-01',
      medicaments: [{ id: 4, nom: 'Aspirine 100mg', quantite: 30 }],
    },
  ];

  const [sorties, setSorties] = useState([]);
  const [stocks, setStocks] = useState(medicaments);

  // Générer automatiquement les sorties à partir des ventes
  useMemo(() => {
    const newSorties = ventes.flatMap((vente) =>
      vente.medicaments.map((m) => ({
        id: `SOR-${vente.id}-${m.id}`,
        venteId: vente.id,
        date: vente.date,
        medicament: m.nom,
        quantite: m.quantite,
        statut: 'Enregistrée',
      }))
    );
    setSorties(newSorties);

    // Mise à jour des stocks
    const updatedStocks = medicaments.map((med) => {
      const totalSortie = newSorties
        .filter((s) => s.medicament === med.nom)
        .reduce((sum, s) => sum + s.quantite, 0);
      return { ...med, stock: med.stock - totalSortie };
    });
    setStocks(updatedStocks);
  }, []);

  // --- Rendus colonnes ---
  const statutBody = (row) => <Tag value={row.statut} severity="success" />;

  const headerLeft = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, color: '#16a085' }}>Sorties de stock</span>
      <Tag value={`${sorties.length}`} style={{ background: '#e6faf4', color: '#0b6b57', border: 0 }} />
    </div>
  );

  const headerRight = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button
        label="Exporter CSV"
        icon="pi pi-file-export"
        onClick={() => {
          const csvContent = [
            ['ID', 'Vente', 'Date', 'Médicament', 'Quantité', 'Statut'].join(','),
            ...sorties.map((s) => [s.id, s.venteId, s.date, s.medicament, s.quantite, s.statut].join(',')),
          ].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'sorties_stock.csv';
          a.click();
          URL.revokeObjectURL(url);
          toast.current?.show({ severity: 'success', summary: 'Export', detail: 'Sorties exportées en CSV.' });
        }}
        className="p-button-outlined"
      />
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
          <i className="pi pi-arrow-right" style={{ fontSize: 18 }} />
          <strong>Stock ▸ Sorties</strong>
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Plein écran · Optimisé clavier</div>
      </div>

      {/* Layout principal : Sidebar + Contenu */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar title="Modules" />

        <main style={{ flex: 1, padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tableau des stocks */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#16a085' }}>État des stocks</h3>
            <DataTable value={stocks} responsiveLayout="scroll">
              <Column field="nom" header="Médicament" sortable />
              <Column field="stock" header="Stock actuel" sortable />
            </DataTable>
          </div>

          {/* Tableau des sorties */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #d7d7d7',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
              flex: 1,
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
            >
              <Column field="id" header="ID Sortie" sortable style={{ minWidth: 120 }} />
              <Column field="venteId" header="Vente" sortable style={{ minWidth: 120 }} />
              <Column field="date" header="Date" sortable style={{ minWidth: 120 }} />
              <Column field="medicament" header="Médicament" sortable style={{ minWidth: 160 }} />
              <Column field="quantite" header="Quantité" sortable style={{ minWidth: 100 }} />
              <Column field="statut" header="Statut" body={statutBody} sortable style={{ minWidth: 120 }} />
            </DataTable>
          </div>
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