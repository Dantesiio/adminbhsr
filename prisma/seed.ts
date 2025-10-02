import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  // Users by role.  These are sample accounts to test the UI.
  const hashedPassword = await hash('prueba123', 10)
  const users = [
     { email: 'prueba@solicitante.com', name: 'Usuario Solicitante', role: Role.SOLICITANTE },
     { email: 'prueba@compras.com', name: 'Usuario Compras', role: Role.COMPRAS },
     { email: 'prueba@autorizador.com', name: 'Usuario Autorizador', role: Role.AUTORIZADOR },
     { email: 'prueba@admin.com', name: 'Usuario Admin', role: Role.ADMIN },
   ]
   for (const user of users) {
     await prisma.user.upsert({
       where: { email: user.email },
       update: {},
       create: { ...user, passwordHash: hashedPassword },
     })
   }

  // Projects and cost centres used in the demonstration.  The `client`
  // field is optional and illustrates how projects might belong to
  // different clients.
  await prisma.project.createMany({
    data: [
      { code: 'PRJ-001', name: 'ECHO Bolsas 06/2025', client: 'ECHO' },
      { code: 'PRJ-002', name: 'ECHO 731', client: 'ECHO' },
      { code: 'PRJ-003', name: 'Mensajería Agosto 2025', client: 'MdM' },
    ],
    skipDuplicates: true,
  })
  await prisma.costCenter.createMany({
    data: [
      { code: 'CC-001', name: 'Operaciones' },
      { code: 'CC-002', name: 'Logística' },
      { code: 'CC-003', name: 'Administración' },
    ],
    skipDuplicates: true,
  })

  // Create a sample RQ so the dashboard isn't empty.  We look up the
  // requester and project by email and code, respectively.
  const requester = await prisma.user.findFirst({ where: { email: 'prueba@solicitante.com' } })
  const prj = await prisma.project.findFirst({ where: { code: 'PRJ-001' } })
  if (requester && prj) {
    await prisma.rQ.create({
      data: {
        code: 'RQ-0001',
        title: 'Compra de bolsas',
        description: 'Bolsas para proyecto ECHO',
        projectId: prj.id,
        requesterId: requester.id,
        status: 'ENVIADA_COMPRAS',
        items: {
          create: [
            { name: 'Bolsa 20x30', spec: 'Polietileno', qty: 1000 as any, uom: 'unidad' },
            { name: 'Bolsa 30x40', spec: 'Polietileno', qty: 500 as any, uom: 'unidad' },
          ],
        },
      },
    })
  }
}

main()
  .then(() => console.log('Seed OK ✅'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })