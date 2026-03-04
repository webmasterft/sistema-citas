# Sistema de Citas (Next.js + Gemini + Supabase)

Proyecto de alta performance y accesibilidad (WCAG 2.2 AA).

## 🚀 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

```bash
npm run dev
```

## 🔍 Calidad y Auditoría

- **Lint Completo**: `npm run lint`
- **Formateo**: `npm run format`
- **Accesibilidad (Pa11y)**: `npm run audit:a11y` (Requiere servidor corriendo)
- **Performance (Lighthouse)**: `npm run audit:perf` (Requiere servidor corriendo)

## 🌐 Despliegue (Netlify + Git)

1. **Git**:
   ```bash
   git remote add origin https://github.com/webmasterft/sistema-citas.git
   git add .
   git commit -m "feat: initial next.js scaffold with oshyn standards"
   git push -u origin main
   ```
2. **Netlify**:
   - Conecta tu repositorio de GitHub en el panel de Netlify.
   - Build Command: `npm run build`
   - Publish Directory: `.next`
   - **Environment Variables**: Asegúrate de configurar `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Netlify.

## 🧠 Integración Legacy

Los archivos del proyecto anterior se encuentran en `backup_legacy/`. El script de integración original está en `src/legacy_integration_example.js` para referencia.
