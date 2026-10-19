# OpenSpec

## TLDR

- Flujo: `/opsx-propose` → (revisión) → `/opsx-apply` → `/opsx-archive`.
- Specs vigentes: `openspec/specs/`. Cambios activos: `openspec/changes/`. Cambios terminados: `openspec/changes/archive/`.
- Esquema configurado en `openspec/config.yaml`: `spec-driven`.

## Comandos

| Comando | Propósito |
|---|---|
| `/opsx-propose` | Crea un cambio y genera sus artefactos (propuesta, diseño, specs, tareas) |
| `/opsx-apply` | Implementa las tareas de un cambio aprobado |
| `/opsx-archive` | Archiva un cambio terminado |

Otros disponibles: `/opsx-explore`, `/opsx-sync`, `/opsx-update` (definidos en `.agents/workflows/`; las habilidades en `.agents/skills/`).

## Estructura real del repositorio

```
openspec/
├── config.yaml        # schema: spec-driven
├── specs/             # specs principales (actualmente solo .gitkeep)
└── changes/
    └── archive/       # cambios archivados (actualmente solo .gitkeep)
```

Los cambios activos se crean como `openspec/changes/<nombre>/`. Verifica la estructura con `list_dir` antes de asumir contenido: hoy no hay specs ni cambios registrados.

## Reglas

- No implementes cambios de comportamiento sin propuesta cuando la tarea sea no trivial.
- No edites código al proponer o actualizar artefactos.
- Archiva solo cuando las tres suites de pruebas pasen (ver [pruebas.md](pruebas.md)).
