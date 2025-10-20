#!/bin/bash

# Script para detener PostgreSQL en Docker para AdminBHSR
# Uso: ./scripts/stop-db.sh

CONTAINER_NAME="adminbhsr-postgres"

echo "🛑 Deteniendo PostgreSQL..."

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME
    echo "✅ PostgreSQL detenido"
else
    echo "⚠️  El contenedor no está corriendo"
fi
