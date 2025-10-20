#!/bin/bash

# Script para iniciar PostgreSQL en Docker para AdminBHSR
# Uso: ./scripts/start-db.sh

CONTAINER_NAME="adminbhsr-postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_USER="postgres"
POSTGRES_DB="dondiego"
POSTGRES_PORT="5433"

echo "🚀 Iniciando PostgreSQL para AdminBHSR..."

# Verificar si el contenedor ya existe
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    # El contenedor existe, verificar si está corriendo
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        echo "✅ PostgreSQL ya está corriendo en el puerto $POSTGRES_PORT"
    else
        echo "▶️  Iniciando contenedor existente..."
        docker start $CONTAINER_NAME
        echo "✅ PostgreSQL iniciado en el puerto $POSTGRES_PORT"
    fi
else
    # Crear nuevo contenedor
    echo "📦 Creando nuevo contenedor PostgreSQL..."
    docker run --name $CONTAINER_NAME \
        -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
        -e POSTGRES_USER=$POSTGRES_USER \
        -e POSTGRES_DB=$POSTGRES_DB \
        -p $POSTGRES_PORT:5432 \
        -d postgres:15-alpine
    
    echo "⏳ Esperando que PostgreSQL esté listo..."
    sleep 3
    
    echo "✅ PostgreSQL creado e iniciado en el puerto $POSTGRES_PORT"
fi

echo ""
echo "📊 Información de conexión:"
echo "   Host: localhost"
echo "   Puerto: $POSTGRES_PORT"
echo "   Usuario: $POSTGRES_USER"
echo "   Base de datos: $POSTGRES_DB"
echo ""
echo "🔗 Connection string:"
echo "   postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
echo ""
echo "Para detener: docker stop $CONTAINER_NAME"
echo "Para eliminar: docker rm $CONTAINER_NAME"
