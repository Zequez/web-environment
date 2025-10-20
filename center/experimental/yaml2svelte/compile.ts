type YamlSvelte = {
  /** Import declarations */
  $imports: {
    [source: string]: (string | [string, string])[]
  }

  /** Module-scoped script (<script context="module">) */
  $module: string // raw code string

  /** Instance-scoped script (<script>) */
  $script: string // raw code string

  /** Component HTML/template structure */
  html: YamlSvelteNode[]
}

type YamlSvelteNode = YamlComponentNode | YamlTextNode | YamlCodeNode

type YamlComponentNode = {
  node: string
  attrs: { [key: string]: string }
  children: YamlSvelteNode[]
}
type YamlCodeNode = { node: '$'; $value: string; children?: YamlSvelteNode[] }
type YamlTextNode =
  | { node: 'text'; $value: string }
  | { node: 'text'; value: string }

export function compile(svelteInYaml: YamlSvelte): string {
  let code = `<script module lang="ts">
${compileImports(svelteInYaml.$imports)}
${svelteInYaml.$module}
</script>
<script lang="ts">
${svelteInYaml.$script}
</script>

${compileHtml(svelteInYaml.html)}
  `

  return code
}

function compileImports(imports: YamlSvelte['$imports']) {
  return Object.entries(imports)
    .map(([source, names]) => {
      const importDef = names
        .map((n) => {
          let nn = n === 'default' ? ['default', extractFileName(source)] : n
          if (typeof nn === 'string') {
            return nn
          } else if (Array.isArray(nn) && nn.length === 2) {
            return `${nn[0]} as ${nn[1]}`
          } else {
            throw 'Type error: Import name statement must be string or [string, string]'
          }
        })
        .join(', ')

      return `import {${importDef}} from '${source}'`
    })
    .join('\n')
}

function extractFileName(fullpath: string) {
  const parts = fullpath.split('/')
  const fileNameWithExt = parts[parts.length - 1]
  const fileName = fileNameWithExt.split('.')[0]
  return fileName
}

function validateHtml(html: YamlSvelteNode[]): boolean {
  return true
}

function compileHtml(html: YamlSvelteNode[]): string {
  if (!validateHtml(html)) {
    throw 'Invalid HTML nodes tree format'
  }

  if (!Array.isArray(html)) return ''

  return html
    .map((n) => {
      console.log('NODE', n.node)
      if (n.node === '$') {
        const nn = n as YamlCodeNode
        if (nn.$value.startsWith('#if')) {
          return `{${nn.$value}}\n${compileHtml(nn.children!)}\n{/if}`
        } else if (nn.$value.startsWith('#each')) {
          return `{${nn.$value}}\n${compileHtml(nn.children!)}\n{/each}`
        } else if (nn.$value.startsWith('#snippet')) {
          return `{${nn.$value}}\n${compileHtml(nn.children!)}\n{/snippet}`
        } else {
          return `{${nn.$value}}`
        }
      } else if (n.node === 'text') {
        const nn = n as YamlTextNode
        if ('value' in nn) {
          return nn.value
        } else if ('$value' in nn) {
          return `{${nn.$value}}`
        }
      } else {
        const nn = n as YamlComponentNode
        if (SELF_CLOSING_TAGS.includes(nn.node)) {
          return `<${nn.node} ${compileAttributes(nn.attrs)} />`
        } else {
          return `<${nn.node} ${compileAttributes(nn.attrs)}>${compileHtml(nn.children)}</${nn.node}>`
        }
      }
    })
    .join('\n')
}

function compileAttributes(attrs: { [key: string]: string }) {
  if (!attrs) return ''
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (key.startsWith('$')) {
        return `${key.slice(1)}={${value}}`
      } else {
        return `${key}="${value}"`
      }
    })
    .join(' ')
}

const SELF_CLOSING_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]
