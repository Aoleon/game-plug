#!/bin/bash

# Script pour déployer la configuration Nginx de Game Plug
# Ce script nécessite les droits sudo/root

set -e

echo "📦 Déploiement de la configuration Nginx pour Game Plug..."

# Vérifier que le fichier de configuration existe
if [ ! -f "/home/workspace/game-plug/nginx-game-plug.conf" ]; then
    echo "❌ Erreur: Le fichier nginx-game-plug.conf n'existe pas"
    exit 1
fi

# Créer le répertoire includes si nécessaire
echo "📁 Création du répertoire includes..."
sudo mkdir -p /opt/ia-webdev/nginx/includes/

# Copier la configuration
echo "📄 Copie de la configuration game-plug.conf..."
sudo cp /home/workspace/game-plug/nginx-game-plug.conf /opt/ia-webdev/nginx/includes/game-plug.conf

# Vérifier les permissions
sudo chmod 644 /opt/ia-webdev/nginx/includes/game-plug.conf
sudo chown root:root /opt/ia-webdev/nginx/includes/game-plug.conf

# Tester la configuration Nginx
echo "🔍 Test de la configuration Nginx..."
docker exec rbw-nginx nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valide"

    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    docker exec rbw-nginx nginx -s reload

    echo ""
    echo "✅ Déploiement réussi !"
    echo ""
    echo "🌐 L'application est maintenant accessible sur :"
    echo "   https://work.robinswood.io/game-plug/"
    echo ""
    echo "📊 Vérification :"
    echo "   curl -sk https://work.robinswood.io/game-plug/api/health"
else
    echo "❌ Erreur dans la configuration Nginx"
    exit 1
fi
