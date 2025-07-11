import { watch } from 'fs'
import { start } from './uplink'

export function startWatch() {
  let uplinkServer = start()

  async function restartUplink() {
    console.log('🔄 Reiniciando o servidor de uplink...')

    // Para o servidor antigo (se necessário)
    if (uplinkServer) {
      uplinkServer.stop()
    }

    // Importa os módulos novamente (limpa o cache)
    delete require.cache[require.resolve('./uplink')]
    const { start } = await import(`./uplink`)

    // Inicia um novo servidor
    uplinkServer = start()
  }

  watch('./back/uplink', { recursive: true }, (eventType, fileName) => {
    console.log('FILE', fileName)
    if (fileName) {
      delete require.cache[require.resolve(`./${fileName}`)]
      console.log(`📝 Arquivo modificado: ${fileName}`)
      restartUplink()
    }
  })

  return {
    get server() {
      return uplinkServer
    },
    stop() {
      uplinkServer.stop()
    },
    reload() {
      restartUplink()
    },
  }
}
