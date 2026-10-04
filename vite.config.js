import {defineConfig} from 'vite'

export default defineConfig({

  optimizeDeps:{
    exclude:['@tracear/sdk']
  },

  server:{
    allowedHosts:['.trycloudflare.com']
  }

})
