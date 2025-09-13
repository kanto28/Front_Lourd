import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PanelMenu } from 'primereact/panelmenu';
import { Button } from 'primereact/button';

const Sidebar = ({ title, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Définition des sections (menu)
  const sections = [
    {
      label: 'Stock',
      items: [
        {
          label: 'Tableau de bord',
          icon: 'pi pi-chart-bar',
          active: location.pathname === '/dashboard',
          onClick: (navigate) => () => navigate('/dashboard'),
        },
        {
          label: 'Achat – Fournisseurs',
          icon: 'pi pi-truck',
          active: location.pathname === '/fournisseur',
          onClick: (navigate) => () => navigate('/fournisseur'),
        },
        {
          label: 'Achat – Commandes',
          icon: 'pi pi-shopping-cart',
          active: location.pathname === '/commande',
          onClick: (navigate) => () => navigate('/commande'),
        },
        {
          label: 'Inventaire',
          icon: 'pi pi-box',
          active: location.pathname === '/stock',
          onClick: (navigate) => () => navigate('/stock'),
        },
      ],
    },
    {
      label: 'Ventes',
      items: [
        {
          label: 'Point de Vente',
          icon: 'pi pi-shopping-bag',
          active: location.pathname === '/pointVente',
          onClick: (navigate) => () => navigate('/pointVente'),
        },
        {
          label: 'Clients',
          icon: 'pi pi-users',
          active: location.pathname === '/client',
          onClick: (navigate) => () => navigate('/client'),
        },
        {
          label: 'Paiements',
          icon: 'pi pi-money-bill',
          active: location.pathname === '/paiement',
          onClick: (navigate) => () => navigate('/paiement'),
        },
        {
          label: 'Historique des Ventes',
          icon: 'pi pi-history',
          active: location.pathname === '/historique_vente',
          onClick: (navigate) => () => navigate('/historique_vente'),
        },
      ],
    },
    {
      label: 'Comptabilité',
      items: [
        {
          label: 'Gestion des Salaires',
          icon: 'pi pi-wallet',
          active: location.pathname === '/gestionSalaire',
          onClick: (navigate) => () => navigate('/gestionSalaire'),
        },
        {
          label: 'Dépenses',
          icon: 'pi pi-credit-card',
          active: location.pathname === '/depense',
          onClick: (navigate) => () => navigate('/depense'),
        },
        {
          label: 'Tableau de Bord Financier',
          icon: 'pi pi-chart-line',
          active: location.pathname === '/finance',
          onClick: (navigate) => () => navigate('/finance'),
        },
        {
          label: 'Rapports et Analyses',
          icon: 'pi pi-file',
          active: location.pathname === '/rapportFinance',
          onClick: (navigate) => () => navigate('/rapportFinance'),
        },
        {
          label: 'Configuration des Prix',
          icon: 'pi pi-tags',
          active: location.pathname === '/prixMed',
          onClick: (navigate) => () => navigate('/prixMed'),
        },
        {
          label: 'Gestion des Prix Spécifiques',
          icon: 'pi pi-dollar',
          active: location.pathname === '/prixMedSpecifique',
          onClick: (navigate) => () => navigate('/prixMedSpecifique'),
        },
        {
          label: 'Simulation des Prix',
          icon: 'pi pi-calculator',
          active: location.pathname === '/simulationPrixMed',
          onClick: (navigate) => () => navigate('/simulationPrixMed'),
        },
        {
          label: 'Monitoring des Prix',
          icon: 'pi pi-search',
          active: location.pathname === '/monotoringPrixMed',
          onClick: (navigate) => () => navigate('/monotoringPrixMed'),
        },
      ],
    },
    {
      label: 'Assistant IA',
      items: [
        {
          label: 'Conseils Stratégiques',
          icon: 'pi pi-lightbulb',
          active: location.pathname === '/strategic-assistant',
          onClick: (navigate) => () => navigate('/strategic-assistant'),
        },
      ],
    },
  ];

  // Map sections to PrimeReact PanelMenu items
  const menuItems = sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      label: item.label,
      icon: item.icon,
      className: item.active ? 'p-menuitem-active' : '',
      command: () => item.onClick(navigate)(),
    })),
  }));

  // Gestion du toggle
  const handleToggle = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      if (onToggle) onToggle(newState);
      return newState;
    });
  };

  if (!sidebarOpen) return null;

  return (
    <div
      style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid #d7d7d7',
        padding: '16px 8px',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          fontSize: 18,
          fontWeight: 600,
          color: '#16a085',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {title}
        <Button
          icon="pi pi-bars"
          className="p-button-text p-button-sm"
          onClick={handleToggle}
          tooltip={sidebarOpen ? 'Fermer' : 'Ouvrir'}
        />
      </div>
      <PanelMenu model={menuItems} style={{ flex: 1 }} />
    </div>
  );
};

export default Sidebar;