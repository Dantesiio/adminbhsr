#!/bin/bash

# Script para desplegar y configurar Prisma en Vercel
# Uso: ./scripts/deploy-vercel.sh

set -e

echo "🚀 Guía de Despliegue en Vercel"
echo "================================"
echo ""

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "📦 Instalando Vercel CLI..."
    npm i -g vercel
fi

echo "✅ Vercel CLI instalado"
echo ""

# Verificar si está conectado
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Conectando proyecto a Vercel..."
    vercel link
else
    echo "✅ Proyecto ya está conectado a Vercel"
fi

echo ""
echo "📥 Descargando variables de entorno de producción..."
vercel env pull .env.local.production

if [ ! -f ".env.local.production" ]; then
    echo "❌ Error: No se pudo descargar las variables de entorno"
    echo "💡 Asegúrate de que las variables estén configuradas en Vercel Dashboard"
    exit 1
fi

echo "✅ Variables de entorno descargadas"
echo ""

# Cargar variables de entorno
echo "📊 Cargando variables de entorno..."
export $(cat .env.local.production | grep -v '^#' | grep -v '^$' | xargs)

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

if [ -z "$DIRECT_DATABASE_URL" ]; then
    echo "❌ Error: DIRECT_DATABASE_URL no está configurada"
    exit 1
fi

echo "✅ Variables de entorno cargadas"
echo ""

# Preguntar qué hacer
echo "¿Qué deseas hacer?"
echo "1) Ejecutar migraciones (db:push)"
echo "2) Ejecutar seed (db:seed)"
echo "3) Ambos (migraciones + seed)"
echo "4) Solo desplegar (push a git)"
read -p "Selecciona una opción (1-4): " option

case $option in
    1)
        echo ""
        echo "🔄 Ejecutando migraciones..."
        pnpm db:push
        echo "✅ Migraciones completadas"
        ;;
    2)
        echo ""
        echo "🌱 Ejecutando seed..."
        pnpm db:seed
        echo "✅ Seed completado"
        ;;
    3)
        echo ""
        echo "🔄 Ejecutando migraciones..."
        pnpm db:push
        echo "✅ Migraciones completadas"
        echo ""
        echo "🌱 Ejecutando seed..."
        pnpm db:seed
        echo "✅ Seed completado"
        ;;
    4)
        echo ""
        echo "📤 Para desplegar, haz push a tu repositorio:"
        echo "   git push origin main"
        echo ""
        echo "💡 Vercel desplegará automáticamente"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Proceso completado"
echo ""
echo "🔗 Tu aplicación debería estar disponible en:"
vercel ls | grep -E "https://.*\.vercel\.app" | head -1 || echo "   (ejecuta 'vercel ls' para ver las URLs)"


