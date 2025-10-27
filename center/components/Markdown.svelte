<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Markdown } from 'svelte-rune-markdown'

  let slotContainer: HTMLDivElement | null = null
  let content = '' // texto Markdown final que pasaremos al componente

  // quitar indent común pero mantener indent relativo dentro de bloques
  function dedent(input: string): string {
    if (!input) return ''

    // Normalizar saltos de línea
    const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Dividir en líneas
    const rawLines = normalized.split('\n')

    // Eliminar primeras/últimas líneas vacías (comunes cuando el slot está en markup)
    let start = 0
    while (start < rawLines.length && rawLines[start].trim() === '') start++
    let end = rawLines.length - 1
    while (end >= 0 && rawLines[end].trim() === '') end--
    if (start > end) return ''

    const lines = rawLines.slice(start, end + 1)

    // Calcular indent mínimo en líneas no vacías.
    // Contamos tabs como 4 espacios para este cálculo (puedes ajustar).
    const leadingIndentLengths = lines
      .filter((l) => l.trim() !== '')
      .map((l) => {
        let count = 0
        for (const ch of l) {
          if (ch === ' ') count += 1
          else if (ch === '\t') count += 4
          else break
        }
        return count
      })

    const minIndent = leadingIndentLengths.length
      ? Math.min(...leadingIndentLengths)
      : 0

    // Función que elimina exactamente minIndent "columns" de la cabecera de una línea,
    // respetando tabs como 4 espacios.
    function removeColumns(line: string, cols: number) {
      let i = 0
      let removed = 0
      while (removed < cols && i < line.length) {
        const ch = line[i]
        if (ch === ' ') {
          removed += 1
          i += 1
        } else if (ch === '\t') {
          // tab cuenta como 4, pero si quitar 4 lo sobrepasa, lo igualamos aceptando sobre-remoción
          removed += 4
          i += 1
        } else break
      }
      return line.slice(i)
    }

    const dedented = lines.map((l) => {
      if (l.trim() === '') return ''
      return removeColumns(l, minIndent)
    })

    return dedented.join('\n')
  }

  // leer el texto del slot y actualizar `content`
  function updateFromSlot() {
    if (!slotContainer) return
    // textContent es lo más cercano a "children as plain text" — si hay componentes hijos,
    // se usa su texto renderizado. Evitamos innerHTML por seguridad/markup.
    const raw = slotContainer.textContent ?? ''
    content = dedent(raw)
  }

  let observer: MutationObserver | null = null

  onMount(() => {
    updateFromSlot()

    // Observamos cambios dentro del slot (útil para HMR o contenido dinámico)
    if (slotContainer) {
      observer = new MutationObserver(() => updateFromSlot())
      observer.observe(slotContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
  })

  onDestroy(() => {
    if (observer) observer.disconnect()
  })
</script>

<!-- Slot renderizado en un contenedor oculto (no afecta layout) -->
<div
  aria-hidden="true"
  style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;"
  bind:this={slotContainer}
>
  <slot />
</div>

{#if content}
  <!-- paseamos el string ya limpiado al Markdown -->
  <Markdown {content} />
{:else}
  <!-- opcional: cuando aún no hay contenido, puedes mostrar nada o un fallback -->
{/if}
