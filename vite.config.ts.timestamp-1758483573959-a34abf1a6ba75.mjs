// vite.config.ts
import { defineConfig } from "file:///C:/Users/lx03476/Dropbox/2025%20Fall/SpellingBee/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/lx03476/Dropbox/2025%20Fall/SpellingBee/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react()
    // Temporarily disabled PWA plugin for testing
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     navigateFallback: '/index.html'
    //   },
    //   manifest: {
    //     name: 'Spelling Bee Practice',
    //     short_name: 'SpellingBee',
    //     description: 'Practice spelling with audio pronunciation',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     start_url: '/',
    //     scope: '/'
    //   }
    // })
  ],
  server: {
    port: 3e3,
    open: true,
    historyApiFallback: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxseDAzNDc2XFxcXERyb3Bib3hcXFxcMjAyNSBGYWxsXFxcXFNwZWxsaW5nQmVlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxseDAzNDc2XFxcXERyb3Bib3hcXFxcMjAyNSBGYWxsXFxcXFNwZWxsaW5nQmVlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9seDAzNDc2L0Ryb3Bib3gvMjAyNSUyMEZhbGwvU3BlbGxpbmdCZWUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbi8vIGltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCBQV0EgcGx1Z2luIGZvciB0ZXN0aW5nXHJcbiAgICAvLyBWaXRlUFdBKHtcclxuICAgIC8vICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAvLyAgIHdvcmtib3g6IHtcclxuICAgIC8vICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmd9J10sXHJcbiAgICAvLyAgICAgbmF2aWdhdGVGYWxsYmFjazogJy9pbmRleC5odG1sJ1xyXG4gICAgLy8gICB9LFxyXG4gICAgLy8gICBtYW5pZmVzdDoge1xyXG4gICAgLy8gICAgIG5hbWU6ICdTcGVsbGluZyBCZWUgUHJhY3RpY2UnLFxyXG4gICAgLy8gICAgIHNob3J0X25hbWU6ICdTcGVsbGluZ0JlZScsXHJcbiAgICAvLyAgICAgZGVzY3JpcHRpb246ICdQcmFjdGljZSBzcGVsbGluZyB3aXRoIGF1ZGlvIHByb251bmNpYXRpb24nLFxyXG4gICAgLy8gICAgIHRoZW1lX2NvbG9yOiAnI2ZmZmZmZicsXHJcbiAgICAvLyAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgLy8gICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgIC8vICAgICBzdGFydF91cmw6ICcvJyxcclxuICAgIC8vICAgICBzY29wZTogJy8nXHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0pXHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gICAgaGlzdG9yeUFwaUZhbGxiYWNrOiB0cnVlXHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBVLFNBQVMsb0JBQW9CO0FBQ3ZXLE9BQU8sV0FBVztBQUlsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFtQlI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLG9CQUFvQjtBQUFBLEVBQ3RCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
