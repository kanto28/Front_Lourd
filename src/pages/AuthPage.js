import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";

/**
 * AuthPage (Statique) – style "client lourd" PLEIN ÉCRAN
 * Palette conservée : vert #16a085, gris clair #f9f9f9.
 * - Mise en page 2 colonnes sur toute la largeur de l'écran (40% / 60%).
 * - Responsive : passe en pile verticale en < 900px.
 * - Redirects to /dashboard on login button click.
 * - Espacement accru entre email et mot de passe (gap: 2rem, marginBottom: 0.5rem).
 * - Étiquettes flottantes supprimées pour email et mot de passe, remplacées par placeholders.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [remember, setRemember] = useState(true);
  const [values, setValues] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    nom_pharmacie: "",
  });

  const onChange = (field, val) => setValues((v) => ({ ...v, [field]: val }));

  const handleLogin = () => {
    // Simule une connexion réussie (statique, sans validation backend)
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: "#eaeaea",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grille plein écran (hors Navbar/Footer) */}
      <section
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(300px, 40%) 1fr",
          minHeight: 0,
        }}
      >
        {/* Colonne branding */}
        <aside
          style={{
            background: "linear-gradient(180deg,#16a085,#11967b)",
            color: "#ffffff",
            padding: "3rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* Logo + Titre */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Remplace src par ton vrai logo si dispo */}
              <img
                src="/logo.svg"
                alt="MediFinder"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                style={{ width: 36, height: 36 }}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                <i className="pi pi-heart" style={{ fontSize: 22 }} /> MediFinder
              </span>
            </div>

            {/* Baseline */}
            <p style={{ opacity: 0.95, lineHeight: 1.6, marginTop: 10 }}>
              Interface de gestion <strong>client lourd</strong> : pharmacies, médicaments, gardes. Utilisable au clavier.
            </p>

            {/* Raccourcis clavier avec icônes */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Tag icon="pi pi-envelope" value="Ctrl+L : Email" style={{ background: "#0f8c72", border: 0 }} />
              <Tag icon="pi pi-check" value="Ctrl+↵ : Valider" style={{ background: "#0f8c72", border: 0 }} />
            </div>
          </div>

          <div style={{ opacity: 0.9, fontSize: 12 }}>
            <p style={{ margin: 0 }}>Besoin d'un compte ?</p>
            <Button
              label={isRegister ? "Aller à la connexion" : "Créer un compte"}
              icon={isRegister ? "pi pi-sign-in" : "pi pi-user-plus"}
              className="p-button-text p-button-sm"
              style={{ color: "#fff" }}
              onClick={() => setIsRegister((v) => !v)}
            />
          </div>
        </aside>

        {/* Colonne formulaire (plein écran, form centré) */}
        <div
          style={{
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1.25rem",
          }}
        >
          <Card
            style={{
              width: "min(100%, 560px)",
              borderRadius: 12,
              padding: "1.25rem 1.25rem 1rem",
              boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
              background: "#ffffff",
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 6, color: "#16a085" }}>
              {isRegister ? "Inscription Pharmacien(ne)" : "Connexion"}
            </h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              {isRegister ? "Renseignez les informations ci‑dessous pour créer un compte." : "Entrez vos identifiants pour ouvrir la session."}
            </p>

            {/* Champs */}
            {isRegister && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <span className="p-float-label">
                  <InputText id="nom" value={values.nom} onChange={(e) => onChange("nom", e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="nom">Nom</label>
                </span>

                <span className="p-float-label">
                  <InputText id="prenom" value={values.prenom} onChange={(e) => onChange("prenom", e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="prenom">Prénom</label>
                </span>
              </div>
            )}

            <div style={{ display: "grid", gap: "2rem", marginTop: isRegister ? "1rem" : 0 }}>
              <span style={{ marginBottom: "0.5rem" }}>
                <InputText
                  id="email"
                  value={values.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  style={{ width: "100%" }}
                  placeholder="Email"
                />
              </span>

              <span>
                <Password
                  id="password"
                  toggleMask
                  feedback={false}
                  value={values.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  inputStyle={{ width: "100%" }}
                  style={{ width: "100%" }}
                  placeholder="Mot de passe"
                />
              </span>

              {isRegister && (
                <span className="p-float-label">
                  <InputText
                    id="nom_pharmacie"
                    value={values.nom_pharmacie}
                    onChange={(e) => onChange("nom_pharmacie", e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="nom_pharmacie">Nom de la pharmacie</label>
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Checkbox inputId="remember" checked={remember} onChange={(e) => setRemember(e.checked)} />
                <label htmlFor="remember" style={{ cursor: "pointer", color: "#374151" }}>
                  Se souvenir de moi
                </label>
              </div>
              {!isRegister && (
                <Button
                  label="Mot de passe oublié ?"
                  className="p-button-text p-button-sm"
                  onClick={() => alert("Ouvrir la fenêtre de récupération.")}
                />
              )}
            </div>

            <Button
              type="button"
              label={isRegister ? "Créer le compte" : "Ouvrir la session"}
              icon={isRegister ? "pi pi-check" : "pi pi-sign-in"}
              className="p-button-success"
              style={{ width: "100%", marginTop: 14 }}
              onClick={isRegister ? () => alert("Formulaire d'inscription (statique).") : handleLogin}
            />

            <Divider />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <p style={{ margin: 0, color: "#4b5563" }}>
                {isRegister ? "Déjà inscrit ? " : "Pas encore de compte ? "}
                <button
                  type="button"
                  onClick={() => setIsRegister((v) => !v)}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    margin: 0,
                    color: "#16a085",
                    cursor: "pointer",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  {isRegister ? "Se connecter" : "S'inscrire"}
                </button>
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Responsive inline (évite un fichier CSS séparé) */}
      <style>{`
        @media (max-width: 900px) {
          section { grid-template-columns: 1fr !important; }
          section > aside { padding: 2rem 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}