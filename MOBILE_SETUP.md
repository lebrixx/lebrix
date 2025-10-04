# Guide complet App Store - Lucky Stop

## ✅ Configuration actuelle

### Capacitor configuré
- ✅ Dependencies installées (@capacitor/core, ios, android, cli)
- ✅ capacitor.config.ts créé
- ✅ StatusBar et SplashScreen configurés
- ✅ Navigation HashRouter (compatible mobile)
- ✅ Icône et splash screen créés

## 📋 Checklist avant soumission App Store

### 1. ⚠️ Modifier le Bundle ID
**IMPORTANT** : Changez `appId` dans `capacitor.config.ts`
- Actuel : `com.luckystop.app` 
- Vous devez créer un identifiant unique sur [Apple Developer](https://developer.apple.com/account/resources/identifiers/list)
- Format : `com.votredomaine.luckystop`

### 2. Configuration Production vs Développement

**Pour le développement** (configuration actuelle) :
```typescript
server: {
  cleartext: true,
  androidScheme: 'https'
}
```

**⚠️ Pour la production App Store** : SUPPRIMER la section `server`
```typescript
const config: CapacitorConfig = {
  appId: 'com.votredomaine.luckystop',
  appName: 'Lucky Stop',
  webDir: 'dist',
  // Pas de section server pour production
  plugins: { ... }
};
```

### 3. Assets requis
- [x] Icône 512x512 : `public/icon-512.png` ✅
- [x] Splash screen : `public/splash-1024x1920.png` ✅
- [ ] **À FAIRE dans Xcode** : Générer toutes les tailles d'icônes
  - Ouvrir : `npx cap open ios`
  - Assets.xcassets > AppIcon
  - Ajouter votre icône dans toutes les tailles

### 4. Informations App Store Connect (à préparer)

**Informations de base** :
- Nom : Lucky Stop
- Sous-titre (30 caractères max)
- Description détaillée
- Mots-clés (100 caractères max)
- Catégorie : Jeux > Action

**Médias requis** :
- Captures d'écran iPhone 6.7" (3-10 images)
- Captures d'écran iPhone 6.5" (3-10 images)  
- Captures d'écran iPhone 5.5" (optionnel)
- Icône App Store 1024x1024px

**Légal (OBLIGATOIRE)** :
- URL Politique de confidentialité (publique)
- Email de support
- URL du site web (optionnel)

### 5. Permissions iOS

Si vous utilisez ces fonctionnalités, ajouter dans `ios/App/App/Info.plist` :

```xml
<!-- Notifications (récompenses quotidiennes) -->
<key>NSUserNotificationUsageDescription</key>
<string>Recevoir des notifications pour vos récompenses quotidiennes</string>

<!-- Si utilisation future de la caméra -->
<key>NSCameraUsageDescription</key>
<string>L'app a besoin d'accéder à la caméra</string>
```

## 🚀 Étapes de soumission

### Étape 1 : Préparer le projet

```bash
# 1. Exporter vers GitHub (bouton Lovable)
# 2. Git pull sur votre machine

# 3. Installer les dépendances
npm install

# 4. Ajouter iOS (si pas déjà fait)
npx cap add ios

# 5. ⚠️ Modifier capacitor.config.ts pour PRODUCTION (retirer server)

# 6. Builder le projet
npm run build

# 7. Synchroniser
npx cap sync ios

# 8. Ouvrir Xcode
npx cap open ios
```

### Étape 2 : Configuration Xcode

1. **Signing & Capabilities** :
   - ☑️ "Automatically manage signing"
   - Sélectionner votre Team (compte développeur)
   - Vérifier Bundle Identifier = appId du config

2. **General** :
   - Display Name : Lucky Stop
   - Version : 1.0.0
   - Build : 1
   - Deployment Target : iOS 13.0 minimum

3. **Assets.xcassets** :
   - Ajouter toutes les tailles d'icônes
   - Ajouter splash screen si nécessaire

### Étape 3 : Tester sur appareil réel

```bash
# Connecter iPhone via USB
# Dans Xcode, sélectionner votre appareil en haut
# Cliquer Play (▶️) pour installer et tester
```

**Tests recommandés** :
- [ ] Connexion Supabase (authentification)
- [ ] Classement en ligne  
- [ ] Achats boutique (pièces)
- [ ] Récompenses quotidiennes
- [ ] Rotation d'écran
- [ ] Mode avion (fonctionnalités offline)
- [ ] Performance (pas de lag)

### Étape 4 : Créer l'archive

1. Dans Xcode : **Product > Archive**
2. Attendre la création de l'archive
3. **Window > Organizer**
4. Sélectionner votre archive
5. **Distribute App** > **App Store Connect**
6. Suivre l'assistant (cocher "Upload" puis Next)

### Étape 5 : App Store Connect

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** > **+** > **New App**
3. Remplir :
   - Platform : iOS
   - Name : Lucky Stop
   - Language : French
   - Bundle ID : celui configuré
   - SKU : identifiant unique (ex: LUCKYSTOP2025)

4. **App Information** :
   - Catégorie principale : Jeux
   - Sous-catégorie : Action
   - URL politique confidentialité ⚠️ OBLIGATOIRE

5. **Pricing** : Gratuit ou Payant

6. **Prepare for Submission** :
   - Uploader captures d'écran
   - Description, mots-clés
   - Contact info
   - Age rating (Classification)
   - Sélectionner le build uploadé

7. **Submit for Review** 🚀

## ⏱️ Délais de review

- Review initiale : 24-48h généralement
- Corrections : 24h après soumission
- Si rejeté : corriger et re-soumettre

## ⚠️ Erreurs courantes à éviter

1. **Bundle ID différent** entre capacitor.config.ts et Xcode
2. **Section server oubliée** en production
3. **Politique de confidentialité manquante** (obligatoire)
4. **Icônes incomplètes** dans Assets.xcassets
5. **Permissions non justifiées** dans Info.plist
6. **Tests insuffisants** sur appareil réel

## 🔄 Mises à jour futures

Après modifications dans Lovable :

```bash
# 1. Git pull
git pull

# 2. Installer nouvelles deps si besoin
npm install

# 3. ⚠️ Vérifier capacitor.config.ts (mode production)

# 4. Rebuild
npm run build

# 5. Sync
npx cap sync ios

# 6. Ouvrir Xcode et créer nouvelle archive
npx cap open ios
# Product > Archive
```

**Incrémenter les versions** :
- Version : 1.0.0 → 1.0.1 (correction bugs)
- Version : 1.0.0 → 1.1.0 (nouvelles fonctionnalités)
- Build : toujours incrémenter (+1)

## 📚 Ressources

- [Apple Developer](https://developer.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [Blog Lovable Mobile](https://lovable.dev/blogs/mobile-development)

## 💡 Conseils

1. **Testez TOUT** avant de soumettre
2. **Préparez les captures d'écran** à l'avance
3. **Rédigez bien la description** (mots-clés importants)
4. **Politique de confidentialité** : utilisez un générateur si besoin
5. **Soyez patient** : la review peut prendre du temps
6. **Répondez rapidement** si Apple demande des clarifications

---

**✅ Checklist finale avant soumission** :
- [ ] Bundle ID unique configuré
- [ ] capacitor.config.ts en mode production (pas de server)
- [ ] Testé sur iPhone réel
- [ ] Toutes les icônes dans Xcode
- [ ] Politique de confidentialité créée et URL publique
- [ ] Captures d'écran préparées
- [ ] Description et mots-clés rédigés
- [ ] Archive créée et uploadée
- [ ] App Store Connect configuré complètement

**Bon courage pour la soumission ! 🚀**