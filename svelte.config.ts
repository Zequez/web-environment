console.log('SVELTE')

import { mdsvex } from 'mdsvex'
export default {
  preprocess: [mdsvex({ extensions: ['.svx'] })],
  extensions: ['.svelte', '.svx', '.md'],
}
