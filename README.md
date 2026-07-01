# Do I Need Local AI?

Una herramienta interactiva diseñada para ayudar a los desarrolladores y entusiastas de la tecnología a decidir si les conviene ejecutar modelos de Inteligencia Artificial localmente (en su propio hardware) o si es más rentable y eficiente pagar por APIs en la nube (como OpenAI, Anthropic, Gemini, etc.).

## 🚀 Características Principales

1.  **Evaluación de Hardware:**
    *   Soporte para perfiles predefinidos actualizados a precios de mercado actuales (RTX 3060, RTX 4070 Ti Super, RTX 4090, Mac mini M4, MacBook M3 Max).
    *   Configuración personalizada de VRAM, RAM total, fabricante de GPU y costo del equipo (referencia de mercado).
    *   **Consumo Energético:** Costo eléctrico configurable (USD/kWh) con detección automática del país para establecer el precio base más preciso por región.

2.  **Perfil de Uso Esperado:**
    *   Definición de frecuencia de uso (ocasional, diario, intensivo, producción) y horas al día.
    *   Casos de uso específicos (chat general, programación, RAG, agentes, embeddings).
    *   Filtros estrictos de privacidad y requerimientos de funcionamiento 100% offline.

3.  **Diagnóstico y Veredicto:**
    *   **Veredicto Final:** Recomendación clara sobre si conviene la vía local, la vía API (nube) o un enfoque híbrido, basado en las horas de uso y el costo.
    *   **Matriz de Modelos (Catálogo Expandido):** Análisis de modelos actuales (ej. Llama 3 8B, Phi-3 Mini, Gemma 2 9B, DeepSeek R1, Llama 3.3 70B, Qwen 2.5, DeepSeek Coder V2 Lite) evaluando viabilidad, requisitos de memoria y la velocidad esperada.
    *   **Proyección Económica (12 Meses):** Gráfico comparativo interactivo que cruza el gasto acumulado en API versus el costo total local (amortización de hardware + costo eléctrico mensual), mostrando el punto de retorno de inversión (Break-even).

4.  **Mejoras de Experiencia (UX/Tech):**
    *   **Persistencia Local (localStorage):** Los valores ingresados se guardan automáticamente para no perder la configuración al recargar la página.
    *   **Soporte Multilingüe (i18n):** Interfaz traducible entre Inglés y Español con selector instantáneo, ideal para expandir el alcance global (ej. foros de Reddit).
    *   **Software Automático:** Sugerencias automáticas de herramientas (como Ollama, LM Studio o vLLM) según el sistema operativo detectado y el caso de uso.
    *   **Compartir URL:** Capacidad de compartir tu configuración de hardware exacta generando un enlace copiado en el portapapeles.
    
## 🛠️ Stack Tecnológico

*   **Framework:** React 19 con Vite.
*   **Lenguaje:** TypeScript para tipado estático y seguridad.
*   **Estilos:** Tailwind CSS v4 para diseño responsivo y estética "High Density" (Slate/Emerald).
*   **Gráficos:** Recharts para la proyección de costos a 12 meses.
*   **Iconos:** Lucide React.

## 📂 Estructura del Proyecto

```
/
├── index.html              # Punto de entrada HTML
├── package.json            # Dependencias y scripts
├── tailwind.config.js      # (Integrado vía vite/tailwindcss v4)
├── src/
│   ├── main.tsx            # Punto de entrada React
│   ├── App.tsx             # Componente principal y estado global
│   ├── index.css           # Estilos globales y configuración @theme
│   ├── components/
│   │   ├── Header.tsx           # Barra de navegación superior
│   │   ├── InputForms.tsx       # Formularios de hardware y uso
│   │   ├── ResultsDashboard.tsx # Panel de resultados, veredicto y gráficas
│   │
│   └── lib/
│       ├── types.ts             # Interfaces y tipos TypeScript
│       └── calculator.ts        # Lógica de cálculo económico y evaluación de hardware
```

## 🧠 Lógica de Cálculo (`src/lib/calculator.ts`)

El núcleo de la aplicación reside en el archivo `calculator.ts`, el cual ejecuta las siguientes estimaciones:

*   **Costo de API:** Estima el consumo de tokens mensual basado en el tipo de tarea y la frecuencia, multiplicándolo por el costo promedio por millón de tokens.
*   **Costo Local:** Calcula la depreciación del hardware a 24 meses y estima el costo de electricidad mensual basado en el TDP promedio de la GPU (ej. 300W para NVIDIA, 50W para Apple Silicon) y las horas de inferencia.
*   **Punto de Equilibrio:** Compara el costo acumulado de la API con el costo local (hardware + luz) para encontrar el mes exacto donde la inversión local se paga sola.

## 🏃‍♂️ Cómo Ejecutar en Desarrollo

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Construye para producción:
   ```bash
   npm run build
   ```
## Inspiracion visual

El rediseño visual del dashboard toma inspiracion de [Smart Energy Dashboard Concept](https://dribbble.com/shots/25108413-Smart-Energy-Dashboard-Concept), un concepto de Bohdan Ratiiev para Zajno publicado en Dribbble.
