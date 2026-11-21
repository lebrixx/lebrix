#!/bin/sh
# Prépare la version iOS de Lucky Stop et ouvre Xcode — sans Lovable.
# Le code vient directement de ce dossier (branche Git en cours), plus de récupération depuis Lovable.
# Usage : sh scripts/preparer-ios.sh

cd "$(dirname "$0")/.." || exit 1

# CocoaPods plante si le terminal n'est pas en UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "▶ Branche : $(git rev-parse --abbrev-ref HEAD)"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠️  Des modifications ne sont pas enregistrées dans Git (elles seront quand même incluses)."
fi

# Sauvegarde de sécurité du projet natif
BACKUP="$HOME/Documents/lebrix-sauvegarde-ios-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
cp -R ios/App/App.xcodeproj "$BACKUP/" 2>/dev/null
cp ios/App/App/Info.plist "$BACKUP/" 2>/dev/null
cp ios/App/Podfile "$BACKUP/" 2>/dev/null
cp android/variables.gradle "$BACKUP/" 2>/dev/null
echo "▶ Sauvegarde : $BACKUP"

# Vérification Capacitor v7
node -e "
const p = require('./package.json');
for (const name of ['@capacitor/core','@capacitor/ios','@capacitor/android']) {
  const v = p.dependencies?.[name] || p.devDependencies?.[name];
  console.log(name + ': ' + v);
  if (!v || !v.startsWith('^7.')) process.exitCode = 1;
}
" || { echo "ERREUR : Capacitor n'est plus en version 7. Arrêt."; exit 1; }

# Version affichée dans le code (doit correspondre à MARKETING_VERSION dans Xcode)
grep -o "CURRENT_APP_VERSION = '[^']*'" src/components/ForceUpdate.tsx

# Dépendances, tests, compilation
npm install --no-audit --no-fund || exit 1
npx vitest run || { echo "ERREUR : des tests échouent. Arrêt."; exit 1; }
npm run build || exit 1

# Synchronisation iOS (copie du jeu + plugins natifs) puis ouverture de Xcode
npx cap sync ios || exit 1
npx cap open ios
