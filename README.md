# 🔧 SuiviRéparation — Suivi SAV en Temps Réel

Application web **mobile-first** conçue par **TechLab** (*Un problème concret → Une solution IT*) pour éliminer les appels clients répétitifs dans les ateliers de réparation (smartphones, PC, tablettes, électroménager).

À la réception d'un appareil, l'atelier génère un ticket en quelques secondes. Le client suit l'avancement en direct depuis son téléphone via un **QR Code**, un **lien WhatsApp** ou son **code à 4 chiffres** — sans aucun rechargement de page.

🔗 **Démo en ligne :** `https://NOM_TECHLAB.github.io/suivi-reparation/`

---

## ✨ Fonctionnalités

### 👤 Espace Client (`/` et `/#/suivi/:code`)
- **Recherche rapide** par code ticket à 4 chiffres.
- **Suivi en temps réel** (Supabase Realtime) : la barre de progression et les couleurs se mettent à jour instantanément dès que l'atelier change le statut.
- **Gestion complète des états** : `En attente`, `En réparation`, `Prêt à récupérer`, `Récupéré` et `Annulé` (avec affichage du motif éventuel).
- **Contact atelier** : adresse, horaires et bouton d'appel direct (copie automatique du numéro sur PC).

### 🛠️ Espace Atelier (`/#/admin`)
- **Accès sécurisé** par authentification Supabase.
- **Pilotage KPIs** : compteurs en direct (*En attente*, *En cours*, *Prêts*, *Annulés*), onglets de filtrage et barre de recherche instantanée (code, nom, téléphone, modèle).
- **Réception rapide** : création d'un ticket en moins de 15 secondes avec sélection du type d'appareil en 1 clic.
- **Notifications WhatsApp gratuites (`wa.me`)** : messages pré-remplis adaptés au contexte (envoi du lien de suivi, notification *Prêt*, notification *Annulation*).
- **QR Code & Impression thermique** : modale QR Code et impression d'un reçu dédié au format 80 mm.
- **Personnalisation centralisée** : nom de l'atelier, téléphone, adresse et horaires configurables dans un seul fichier (`src/config.js`).

---

## 🧱 Stack Technique

- **Frontend :** React (Vite), Tailwind CSS, React Router (`HashRouter`)
- **Icônes & QR Code :** `lucide-react`, `qrcode.react`
- **Backend & Temps réel :** Supabase (PostgreSQL sur schéma dédié `suivi_reparation`, Auth, RLS, Realtime)
- **CI/CD & Hébergement :** GitHub Actions + GitHub Pages

---

## 🚀 Installation locale

1. **Cloner le dépôt**
   ```bash
   git clone [https://github.com/NOM_TECHLAB/suivi-reparation.git](https://github.com/NOM_TECHLAB/suivi-reparation.git)
   cd suivi-reparation
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine du projet :
   ```env
   VITE_SUPABASE_URL=[https://votre-projet.supabase.co](https://votre-projet.supabase.co)
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

---

## ⚙️ Personnalisation & Déploiement

- **Adapter à un nouvel atelier :** modifiez uniquement `src/config.js` (`name`, `tagline`, `phone`, `address`, `hours`).
- **Base de données Supabase :** la table `tickets` est isolée dans le schéma `suivi_reparation` avec Realtime activé et des politiques RLS (lecture publique par code, écriture réservée aux utilisateurs authentifiés).
- **Déploiement automatique :** chaque `push` sur la branche `main` déclenche `.github/workflows/deploy.yml` qui compile et publie sur GitHub Pages en utilisant les secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

---

## 👥 Projet TechLab

Développé par **TechLab**
Contacter pour plus d'info