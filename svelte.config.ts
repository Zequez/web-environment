import { mdsvex } from 'mdsvex'
export default {
  preprocess: [mdsvex({ extensions: ['.svx', '.md'] })],
  extensions: ['.svelte', '.svx', '.md'],
}
