#!/bin/bash

# Script para generar diagrama de la base de datos
# Uso: ./scripts/generate-diagram.sh

echo "📊 Generando diagrama de la base de datos..."

# Verificar que Prisma esté instalado
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está instalado"
    exit 1
fi

# Opción 1: Abrir Prisma Studio (interfaz visual)
echo ""
echo "Opción 1: Abriendo Prisma Studio..."
echo "Esto abrirá una interfaz web en http://localhost:5555"
echo "Presiona Ctrl+C para detener cuando termines"
echo ""
read -p "¿Abrir Prisma Studio? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    npx prisma studio
fi

# Opción 2: Generar schema en formato legible
echo ""
echo "Opción 2: Generando schema en formato Markdown..."
npx prisma format
echo "✅ Schema formateado en prisma/schema.prisma"

# Opción 3: Exportar a formato DBML para dbdiagram.io
echo ""
echo "Opción 3: Para generar diagrama en dbdiagram.io:"
echo "1. Ve a https://dbdiagram.io/d"
echo "2. Copia el contenido de prisma/schema.prisma"
echo "3. O usa una herramienta de conversión Prisma → DBML"
echo ""

# Mostrar información de conexión
echo "📋 Información de la base de datos:"
echo ""
if [ -f .env.local ]; then
    echo "✅ Archivo .env.local encontrado"
    DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')
    if [ ! -z "$DATABASE_URL" ]; then
        echo "   DATABASE_URL configurada"
    else
        echo "   ⚠️  DATABASE_URL no encontrada en .env.local"
    fi
else
    echo "⚠️  Archivo .env.local no encontrado"
    echo "   Crea .env.local con tu DATABASE_URL"
fi

echo ""
echo "💡 Tip: Usa 'npx prisma studio' para ver la base de datos visualmente"
echo "💡 Tip: Usa dbdiagram.io para crear diagramas ERD profesionales"


