# Recepción IA — SaaS multi-tenant de agente WhatsApp para clínicas

Plataforma para profesionales de la salud (médicos, dentistas, kinesiólogos, psicólogos, veterinarios, etc.) que convierte WhatsApp en una recepcionista virtual con IA: atiende a pacientes 24/7, agenda turnos, los confirma/reprograma/cancela y sincroniza el calendario del profesional — automáticamente.

## Stack

- **Next.js 16** (App Router, Turbopack, RSC) en TypeScript estricto
- **InsForge** (Postgres + Auth JWT + Edge Functions) como backend
- **Clerk** Organizations API para multi-tenancy
- **OpenAI GPT-4o** con function calling (5 tools)
- **Twilio** WhatsApp (sandbox dev → BSP en prod)
- **Google Calendar** OAuth + sync bidireccional
- **Tailwind 3.4** + shadcn-style + lucide-react
- **TanStack Query v5** + sonner toasts
- **Vitest** para tests
- **Zod** en todos los boundaries
- **date-fns + date-fns-tz** para fechas en español

## Arquitectura

Capas explícitas, ports/adapters (hexagonal):

```
src/
├── app/                  # Next.js routes (UI + API)
├── core/                 # Dominio puro (sin deps de framework)
│   ├── entities/         # Tipos Zod-validados
│   ├── ports/            # Interfaces (TurnoRepo, CalendarProvider, IAProvider, ToolRegistry)
│   └── services/         # Casos de uso (AgendarTurnoService, ProcesarMensajeService, etc.)
├── infra/                # Implementaciones de ports
│   ├── insforge/repos/   # Postgres via @insforge/sdk
│   ├── openai/           # Agente IA + tools
│   ├── twilio/           # Inbound/outbound TwiML
│   ├── google/           # OAuth + Calendar API
│   └── ics/              # Generador RFC 5545
├── lib/                  # Utilidades (env, crypto, fechas, tenant, api)
└── components/           # UI compartida
```

**Principios aplicados**:
- Services dependen de interfaces, no de implementaciones (Dependency Inversion).
- ToolRegistry pattern: agregar nuevas tools no requiere tocar el switch (Open/Closed).
- Cualquier `CalendarProvider` (Google hoy, Outlook mañana) es sustituible (Liskov).
- Un único `getActiveContextOrThrow()` para tenant + RBAC. Un único `formatearFecha()` para locale es.
- RLS en Postgres + wrapper admin client + Clerk JWT template como defensas en profundidad.

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo> appointment-tracking
cd appointment-tracking
pnpm install
```

### 2. InsForge

```bash
# Login con tu user API key (obtenela en https://insforge.dev/dashboard)
npx @insforge/cli login --user-api-key uak_xxx

# Linkear proyecto existente (recomendado: tener 1 para staging + 1 para prod)
npx @insforge/cli link --project-id <staging-project-id>

# Aplicar migraciones
pnpm db:migrate

# Verificar
pnpm db:status
```

Los proyectos staging/prod se manejan con scripts en `package.json` (`db:link:staging`, `db:link:prod`). Ver [`docs/environments.md`](docs/environments.md).

### 3. Variables de entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completar:

| Variable | Cómo obtenerla |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Dashboard → Webhooks → tu endpoint |
| `NEXT_PUBLIC_INSFORGE_BASE_URL` + `NEXT_PUBLIC_INSFORGE_ANON_KEY` | `npx @insforge/cli secrets get ANON_KEY` + `.insforge/project.json` |
| `INSFORGE_API_KEY` + `INSFORGE_JWT_SECRET` | `.insforge/project.json` + `secrets get JWT_SECRET` |
| `INSFORGE_ENCRYPTION_KEY` | Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client |
| `APP_BASE_URL` | URL pública (en dev: ngrok / tunnelmole / cloudflared) |

### 4. Clerk Organizations + JWT Template

1. Clerk Dashboard → **Configure → Organizations Settings** → habilitar Organizations en modo "Users must belong to org".
2. Clerk Dashboard → **Configure → JWT Templates → New (Blank)**:
   - Name: `insforge` (exactamente)
   - Algorithm: `HS256`
   - Signing key: el `INSFORGE_JWT_SECRET` que sacaste arriba
   - Claims:
     ```json
     { "role": "authenticated", "aud": "insforge-api", "org_id": "{{org.id}}" }
     ```
3. Webhook → Add endpoint:
   - URL: `https://<tu-dominio>/api/webhooks/clerk`
   - Events: `organization.created`, `organization.updated`, `organization.deleted`
   - Copiar Signing Secret → `CLERK_WEBHOOK_SIGNING_SECRET`

### 5. Twilio WhatsApp Sandbox

1. Twilio Console → Messaging → Try it out → Send a WhatsApp message.
2. Anotar tu número sandbox (ej. `+14155238886`) y el código `join xxx-yyy`.
3. Desde tu WhatsApp real, mandá `join xxx-yyy` al sandbox para conectarte.
4. Twilio Console → Sandbox Settings → **"When a message comes in"**:
   - URL: `https://<tu-dominio>/api/webhooks/twilio`
   - Método: `HTTP POST` → Save.
5. En la app, ir a `/integraciones` y cargar Account SID + Auth Token + el número sandbox `+14155238886`.

### 6. Google Cloud Console (Calendar OAuth)

1. APIs & Services → Library → habilitar **Google Calendar API**.
2. Credentials → OAuth client ID → **Web application**.
3. Authorized redirect URIs: `http://localhost:3000/api/oauth/google/callback` (y tu URL de tunnel/prod).
4. OAuth consent screen → Test users → agregar tu email para usar mientras estás en Testing.
5. Pegar `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` en `.env.local`.

### 7. Levantar

```bash
pnpm dev
```

En otra terminal, para WhatsApp/webhooks:

```bash
# Opción A: tunnelmole (URL random cada vez)
npx tunnelmole 3000

# Opción B: cloudflared con named tunnel (URL persistente — recomendado)
cloudflared tunnel --url http://localhost:3000
```

Actualizá `APP_BASE_URL` y `GOOGLE_REDIRECT_URI` en `.env.local` cuando cambie la URL.

## Flujo end-to-end

1. **Sign up** en `/sign-up` → Clerk crea cuenta + organización.
2. **Onboarding** auto-redirige a `/onboarding` → activa la org, popula fila en InsForge (lazy provisioning si webhook tarda).
3. **`/configuracion`** → completar nombre, dirección, horarios, servicios + zona horaria. Botón **"Importar desde tu sitio web"** popula todo desde una URL via GPT-4o.
4. **`/equipo`** → agregar profesionales (nombre, rol, color, horarios opcionales por miembro).
5. **`/integraciones`** → cargar credenciales Twilio + conectar Google Calendar (unificado o por miembro).
6. Paciente manda WhatsApp → **`/api/webhooks/twilio`** valida firma + ruta por tenant + procesa con `ProcesarMensajeService` → agente IA con 5 tools (`consultar_disponibilidad`, `ver_turnos_paciente`, `listar_miembros`, `agendar_turno`, `cancelar_turno`, `reprogramar_turno`).
7. IA respeta agenda Google de cada miembro + sus horarios + turnos existentes en DB.
8. **`/turnos`** → calendario + lista con filtro por miembro, muestra turnos del sistema **y** bloques grises "Ocupado" de eventos externos de Google.
9. **`/mensajes`** → conversaciones live con polling 5s.
10. **`/calendario/<slug>/<token>`** → feed `.ics` público (suscribir desde iPhone / Mac / Outlook).

## Comandos útiles

```bash
pnpm dev               # Next.js dev server (Turbopack)
pnpm build             # Build prod
pnpm typecheck         # tsc --noEmit
pnpm lint              # ESLint
pnpm test              # Vitest

# InsForge
pnpm db:link:staging   # Switch CLI a staging
pnpm db:link:prod      # Switch CLI a producción
pnpm db:migrate        # Aplicar migraciones pendientes
pnpm db:status         # Mostrar proyecto + migraciones aplicadas
```

## Cómo agregar una tool nueva al agente

1. Definí la tool en `src/infra/openai/tools/index.ts` siguiendo el contrato `ToolDef<Input, Output>`:

```ts
export function miNuevaTool(deps: DepsTools): ToolDef<{ foo: string }, { ok: boolean }> {
  return {
    nombre: "mi_nueva_tool",
    descripcion: "Hace tal cosa",
    parametros: {
      type: "object",
      properties: { foo: { type: "string" } },
      required: ["foo"],
      additionalProperties: false,
    },
    async ejecutar({ foo }, ctx) {
      // ... usar deps + ctx.organizacion + ctx.numeroPaciente
      return { ok: true };
    },
  };
}
```

2. Registrala en `src/app/api/webhooks/twilio/route.ts`:

```ts
registry.registrar(miNuevaTool(depsTools));
```

3. Si la tool depende de algo nuevo (un repo, servicio externo), agregalo a `DepsTools` type.

4. Tests recomendados: agregar caso en `tool-registry.test.ts` o crear test específico.

## Deploy

**Vercel** (recomendado):

1. Importá el repo en Vercel.
2. Settings → Environment Variables → cargar todas las vars de `.env.example` con valores de producción.
3. Apuntá `APP_BASE_URL` y `GOOGLE_REDIRECT_URI` al dominio Vercel.
4. Webhooks Twilio + Clerk + Google deben apuntar al dominio Vercel.
5. Para schema en prod: linkear CLI a prod (`pnpm db:link:prod`) y `pnpm db:migrate`.

Detalles en [`docs/environments.md`](docs/environments.md).

## Limitaciones conocidas

- **Sandbox Twilio**: límite 9 mensajes/día. Para prod migrar a número WhatsApp Business propio (Twilio o 360dialog).
- **Google OAuth en Testing**: refresh tokens expiran cada 7 días. Pasar a Production requiere verificación Meta (varios días/semanas).
- **Rate limit in-memory**: no funciona con múltiples instancias. Para horizontal scale usar Redis/Upstash.
- **Tunnel dev**: si usás tunnelmole, la URL cambia cada vez. Considerá cloudflared named tunnel para URL persistente.

## Licencia

Privado / propietario.
