# Do I Need Local AI?

Decide si te conviene correr modelos de IA localmente o pagar APIs en la nube.

Compara tu hardware, tus horas de uso, tus necesidades de privacidad y el costo de APIs contra el costo real de tener IA local: hardware, electricidad y amortizacion.

[Repositorio](https://github.com/raulprtech/Do-I-Need-Local-AI) | [Inspirado por CanIRun.ai](https://www.canirun.ai/) | [Referencia visual](https://dribbble.com/shots/25108413-Smart-Energy-Dashboard-Concept)

---

## Why

Usar IA en la nube es comodo, pero puede volverse caro, depender de limites de uso y enviar datos sensibles a terceros. Ejecutar modelos localmente puede dar privacidad, control y costo fijo, pero solo tiene sentido si tu equipo realmente puede mover los modelos que necesitas.

Do I Need Local AI? responde esa pregunta con una lectura practica: que modelos puedes correr, que tan bien podrian ir, cuanto costaria usar APIs y cuando se recuperaria la inversion local.

## How It Works

```txt
Hardware + uso esperado -> compatibilidad de modelos -> costo API vs local -> veredicto
```

1. Defines tu perfil de hardware: GPU, VRAM, RAM, sistema operativo y costo del equipo.
2. Defines tu uso esperado: frecuencia, horas activas al dia, objetivo principal, privacidad y offline.
3. La app estima compatibilidad con modelos locales usando reglas de memoria para cuantizaciones comunes.
4. El calculo economico compara costo mensual de API contra amortizacion de hardware y electricidad.
5. El dashboard muestra un veredicto, modelos recomendados, punto de equilibrio y software sugerido.

## Features

- Evaluacion de hardware con presets para RTX 3060, RTX 4070 Ti Super, RTX 4090, Mac mini M4, MacBook M3 Max y equipos sin GPU dedicada.
- Configuracion personalizada de GPU, VRAM, RAM, precio del equipo y costo electrico.
- Deteccion opcional de tarifa electrica por pais, siempre iniciada por el usuario.
- Perfil de uso para chat, programacion, RAG, agentes y embeddings.
- Reglas de privacidad estricta y uso 100% offline.
- Matriz de modelos con viabilidad, cuantizacion y rendimiento esperado.
- Proyeccion economica a 12 meses con costo API vs costo local.
- Punto de equilibrio para estimar cuando se recupera la inversion.
- Recomendaciones de software como Ollama, LM Studio y vLLM segun sistema operativo y uso.
- Persistencia local con `localStorage`.
- Soporte i18n en espanol e ingles.
- Enlace compartible con la configuracion del usuario.

## Model Catalog

El catalogo inicial cubre modelos representativos para decisiones practicas de IA local:

| Familia | Modelos incluidos |
| --- | --- |
| Small / efficient | Phi-3 Mini |
| General purpose | Llama 3 8B, Mistral 7B, Gemma 2 9B |
| Reasoning | DeepSeek R1 Distill 8B |
| Coding / mid-size | Qwen 2.5 14B, DeepSeek Coder V2 Lite |
| Large local | Llama 3.3 70B |

Las estimaciones usan reglas aproximadas para GGUF/llama.cpp y cuantizacion Q4. Son una guia inicial, no un benchmark exacto.


## Dataset

El proyecto ahora incluye una primera semilla de dataset en `dataset/`, pensada para migrarse despues a [`raulprtech/ai-infra-dataset`](https://github.com/raulprtech/ai-infra-dataset).

La idea es mantener GitHub como fuente publica auditable y usar Supabase como capa operacional para formularios, cola de revision, roles, dashboards y datos privados Enterprise.

```txt
Supabase = flujo de trabajo y producto
GitHub = dataset publico versionado
```

Puedes validar la estructura inicial con:

```bash
npm run dataset:validate
```
## Tech Stack

| Tecnologia | Uso |
| --- | --- |
| React 19 | Interfaz interactiva |
| Vite | Desarrollo y build |
| TypeScript | Tipos y seguridad basica |
| Tailwind CSS v4 | Sistema visual y estilos responsivos |
| Recharts | Grafica de costos a 12 meses |
| Lucide React | Iconografia |

## Getting Started

Prerequisitos: Node.js 18+ y npm.

```bash
# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev

# Construye para produccion
npm run build
```

Por defecto, Vite levanta la app en `http://localhost:3000`.

## Commands

| Comando | Accion |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Construye la app para produccion |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | Ejecuta TypeScript sin emitir archivos |
| `npm run clean` | Limpia artefactos generados |
| `npm run dataset:validate` | Valida los archivos JSON del dataset |

## Project Structure

```txt
src/
|-- main.tsx                  # Punto de entrada React
|-- App.tsx                   # Estado global, persistencia y layout principal
|-- index.css                 # Tema visual, shell, cards y controles
|-- components/
|   |-- Header.tsx            # Navegacion superior y acciones globales
|   |-- InputForms.tsx        # Formularios de hardware y uso
|   `-- ResultsDashboard.tsx  # Veredicto, modelos, grafica y software
`-- lib/
    |-- calculator.ts         # Motor de compatibilidad y calculo economico
    |-- i18n.tsx              # Traducciones ES/EN
    `-- types.ts              # Tipos de dominio
```

## Roadmap

- Separar el catalogo de modelos en un dataset versionado.
- Agregar mas proveedores de API y precios configurables.
- Implementar veredicto hibrido para combinar local y nube.
- Afinar estimaciones con tokens/segundo, ancho de banda y cuantizaciones multiples.
- Agregar tests unitarios para perfiles de hardware comunes.

## Inspiration

Este proyecto parte de la idea de decision rapida de [CanIRun.ai](https://github.com/midudev/canirun.ai): abrir una herramienta, entender tu hardware y obtener una respuesta accionable sin instalar nada. La direccion visual del dashboard toma inspiracion de [Smart Energy Dashboard Concept](https://dribbble.com/shots/25108413-Smart-Energy-Dashboard-Concept) de Bohdan Ratiiev para Zajno.

