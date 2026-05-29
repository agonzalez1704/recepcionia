# Entornos InsForge

Dos proyectos independientes en la misma org InsForge:

| Entorno | Project ID | App key | URL |
|---------|------------|---------|-----|
| **Producción** (`appointments`) | `b268bd95-6123-40be-8f1d-9bd572806a38` | `6qaidp2b` | `https://6qaidp2b.us-east.insforge.app` |
| **Staging / develop** (`staging`) | `9b2d7a95-44f3-43e1-8ca4-3eaad205536c` | `6qaidp2b-xya` | `https://6qaidp2b-xya.us-east.insforge.app` |

> Comparten el mismo `JWT_SECRET` (Clerk JWT template `insforge` funciona en ambos sin reconfigurar) y el mismo `ANON_KEY`. Tienen `API_KEY` y `oss_host` distintos.

## Workflow de schema

Migrations viven en `migrations/` y se commitean. Aplicalas en staging primero, validá, luego en producción.

```bash
# Linkear a staging y aplicar migraciones pendientes
pnpm db:link:staging
pnpm db:migrate
pnpm db:status        # verificá

# Probar en local apuntando a staging (ya está configurado en .env.local)
pnpm dev

# Cuando funcione: aplicar a producción
pnpm db:link:prod
pnpm db:migrate

# Volver a staging para seguir trabajando
pnpm db:link:staging
```

## Variables de entorno

- **Local (`.env.local`)** → apunta a staging.
- **Vercel (producción)** → variables del proyecto Vercel apuntan a producción. Setealas en Vercel Dashboard → Settings → Environment Variables.

Valores a setear en Vercel (production):

```
NEXT_PUBLIC_INSFORGE_BASE_URL=https://6qaidp2b.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<mismo anon key que staging>
INSFORGE_API_KEY=ik_d5156d66050ed7d0b9417d52aee21995
```

(El resto — Clerk, OpenAI, Google, encryption key — se copian igual de staging mientras compartas instancia Clerk. Cuando vayas a `pk_live`, regenerá todo.)

## CLI link state

`.insforge/project.json` está en `.gitignore` — cada dev linkea su propia copia. No commitear.
