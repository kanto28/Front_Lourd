import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";

/**
 * AuthPage – Look & feel "interface client lourd" (desktop app-like)
 * - Faux fenêtre avec barre de titre, boutons (● ● ●), zone de contenu et barre d'état.
 * - Layout 2 colonnes (branding à gauche, formulaire à droite) avec poignée de redimensionnement.
 * - Raccourcis clavier : Ctrl+L (focus email), Ctrl+Enter (soumettre), Ctrl+R (toggle inscription).
 * - Indicateur CapsLock, focus visible, grandes hit‑targets, contraste renforcé.
 * - Responsive < 900px : pile verticale.
 * - Conserve navigate('/dashboard') côté connexion.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsOn, setCapsOn] = useState(false);
  const [leftW, setLeftW] = useState(420); // largeur colonne branding (px)
  const resizingRef = useRef(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [values, setValues] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    nom_pharmacie: "",
  });

  const onChange = (field, val) => setValues((v) => ({ ...v, [field]: val }));

  const handleLogin = () => {
    navigate("/dashboard");
  };

  // Raccourcis clavier globaux (Ctrl+L, Ctrl+Enter, Ctrl+R)
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        emailRef.current?.focus();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        isRegister ? alert("Formulaire d'inscription (statique).") : handleLogin();
      }
      if (e.ctrlKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        setIsRegister((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRegister]);

  // Redimensionnement simple de la colonne de gauche (poignée verticale)
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return;
      setLeftW((w) => {
        const next = Math.min(Math.max(e.clientX, 280), 680); // clamp 280‑680px
        return next;
      });
    };
    const onUp = () => (resizingRef.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const leftStyle = useMemo(
    () => ({
      width: leftW,
      minWidth: 280,
      maxWidth: 680,
    }),
    [leftW]
  );

  // Détection CapsLock sur les champs
  const onKeyDetectCaps = (e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div style={{
      fontFamily: "Inter, Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif",
      backgroundColor: "#e6e9ef",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Fenêtre */}
      <div className="app-window" style={{
        width: "min(1280px, 100vw)",
        height: "min(820px, 100vh)",
        background: "#f7f8fb",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
        display: "grid",
        gridTemplateRows: "44px 1fr 28px",
        overflow: "hidden",
      }}>
        {/* Barre de titre */}
        <div style={{
          background: "linear-gradient(180deg,#fdfdfd,#f1f3f7)",
          borderBottom: "1px solid #e3e6ee",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 12px",
          userSelect: "none",
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span title="Close" style={{ width: 12, height: 12, borderRadius: 999, background: "#ff605c" }} />
            <span title="Minimize" style={{ width: 12, height: 12, borderRadius: 999, background: "#ffbd44" }} />
            <span title="Maximize" style={{ width: 12, height: 12, borderRadius: 999, background: "#00ca4e" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2f3b52" }}>MediFinder • Authentification</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <Tag severity="success" value="Ctrl+L Email" />
            <Tag severity="success" value="Ctrl+↵ Valider" />
            <Tag severity="info" value="Ctrl+R Inscription" />
          </div>
        </div>

        {/* Corps : 2 colonnes + poignée */}
        <div className="window-body" style={{ display: "grid", gridTemplateColumns: `minmax(280px, ${leftW}px) 6px 1fr`, minHeight: 0 }}>
          {/* Colonne gauche */}
          <aside style={{
            ...leftStyle,
            background: "linear-gradient(180deg,#16a085,#11967b)",
            color: "#ffffff",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo.svg" alt="MediFinder" onError={(e) => (e.currentTarget.style.display = 'none')} style={{ width: 34, height: 34 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 800 }}>
                <i className="pi pi-heart" style={{ fontSize: 18 }} /> MediFinder
              </span>
            </div>
            <p style={{ opacity: 0.95, lineHeight: 1.6, marginTop: 10 }}>
              Suite <strong>bureau</strong> — gestion pharmacies, stocks et gardes. Navigation 100% clavier.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 16 }}>
              <Tag icon="pi pi-bolt" value="Alt+↑/↓: Parcourir" style={{ background: "#0f8c72", border: 0 }} />
              <Tag icon="pi pi-check" value="Ctrl+↵: Valider" style={{ background: "#0f8c72", border: 0 }} />
              <Tag icon="pi pi-user-plus" value={isRegister ? "Mode: Inscription" : "Mode: Connexion"} style={{ background: "#0f8c72", border: 0 }} />
            </div>
            <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.9 }}>
              <p style={{ margin: 0 }}>Pas de compte ?</p>
              <Button
                label={isRegister ? "Aller à la connexion" : "Créer un compte"}
                icon={isRegister ? "pi pi-sign-in" : "pi pi-user-plus"}
                className="p-button-text p-button-sm"
                style={{ color: "#fff" }}
                onClick={() => setIsRegister((v) => !v)}
              />
            </div>
          </aside>

          {/* Poignée verticale */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Glisser pour redimensionner"
            onMouseDown={() => (resizingRef.current = true)}
            style={{ cursor: "col-resize", background: "#e3e6ee" }}
          />

          {/* Colonne droite : formulaire */}
          <main style={{
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            minWidth: 0,
          }}>
            <Card style={{
              width: "min(100%, 600px)",
              borderRadius: 10,
              padding: "16px 16px 10px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
              background: "#ffffff",
            }}>
              <h2 style={{ margin: 0, marginBottom: 6, color: "#16a085" }}>
                {isRegister ? "Inscription Pharmacien(ne)" : "Connexion"}
              </h2>
              <p style={{ marginTop: 0, color: "#6b7280" }}>
                {isRegister
                  ? "Renseignez les informations ci‑dessous pour créer un compte."
                  : "Entrez vos identifiants pour ouvrir la session."}
              </p>

              {isRegister && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <InputText
                    id="nom"
                    value={values.nom}
                    onChange={(e) => onChange("nom", e.target.value)}
                    style={{ width: "100%" }}
                    placeholder="Nom"
                    onKeyUp={onKeyDetectCaps}
                  />
                  <InputText
                    id="prenom"
                    value={values.prenom}
                    onChange={(e) => onChange("prenom", e.target.value)}
                    style={{ width: "100%" }}
                    placeholder="Prénom"
                    onKeyUp={onKeyDetectCaps}
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: "2rem", marginTop: isRegister ? "1rem" : 0 }}>
                <span style={{ marginBottom: "0.5rem" }}>
                  <InputText
                    id="email"
                    ref={emailRef}
                    value={values.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    style={{ width: "100%" }}
                    placeholder="Email"
                    onKeyUp={onKeyDetectCaps}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </span>

                <span>
                  <Password
                    id="password"
                    toggleMask
                    feedback={false}
                    inputRef={passwordRef}
                    value={values.password}
                    onChange={(e) => onChange("password", e.target.value)}
                    inputStyle={{ width: "100%" }}
                    style={{ width: "100%" }}
                    placeholder="Mot de passe"
                    onKeyUp={onKeyDetectCaps}
                  />
                </span>

                {isRegister && (
                  <InputText
                    id="nom_pharmacie"
                    value={values.nom_pharmacie}
                    onChange={(e) => onChange("nom_pharmacie", e.target.value)}
                    style={{ width: "100%" }}
                    placeholder="Nom de la pharmacie"
                    onKeyUp={onKeyDetectCaps}
                  />
                )}
              </div>

              {/* Infos clavier & Caps */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Checkbox inputId="remember" checked={remember} onChange={(e) => setRemember(e.checked)} />
                  <label htmlFor="remember" style={{ cursor: "pointer", color: "#374151" }}>Se souvenir de moi</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {capsOn && <Tag severity="warning" icon="pi pi-key" value="Caps Lock activé" />}
                  {!isRegister && (
                    <Button label="Mot de passe oublié ?" className="p-button-text p-button-sm" onClick={() => alert("Fenêtre de récupération.")} />
                  )}
                </div>
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
                    style={{ background: "transparent", border: 0, padding: 0, margin: 0, color: "#16a085", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
                  >
                    {isRegister ? "Se connecter" : "S'inscrire"}
                  </button>
                </p>
              </div>
            </Card>
          </main>
        </div>

        {/* Barre d'état */}
        <footer style={{
          background: "#eef1f6",
          borderTop: "1px solid #e3e6ee",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 12,
          fontSize: 12,
          color: "#2f3b52",
        }}>
          <span style={{ opacity: 0.9 }}>État: prêt</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span>Raccourcis: Ctrl+L • Ctrl+↵ • Ctrl+R</span>
          <span style={{ marginLeft: "auto", opacity: 0.8 }}>© 2025 MediFinder</span>
        </footer>
      </div>

      {/* Styles additionnels pour focus et responsive */}
      <style>{`
        .app-window input:focus, .app-window button:focus {
          outline: 2px solid #16a085 !important;
          outline-offset: 1px;
        }
        @media (max-width: 900px) {
          .window-body { grid-template-columns: 1fr 0 1fr !important; }
        }
      `}</style>
    </div>
  );
}
