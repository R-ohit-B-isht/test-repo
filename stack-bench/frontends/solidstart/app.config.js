import {defineConfig} from '@solidjs/start/config';
export default defineConfig({ssr:false,server:{baseURL:'/fe/solidstart',static:true,prerender:{routes:['/']}}});