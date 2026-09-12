# Frontend

React + TypeScript consumindo a API deste repositorio. Instrucoes de execucao e
decisoes tecnicas ficam no [README da raiz](../README.md).

```bash
cp .env.example .env    # VITE_API_URL aponta para a API
npm install
npm run dev             # http://localhost:5173
npm run build           # type-check (tsc -b) + bundle de producao
```

A porta 5173 e fixa (`strictPort`) porque o backend libera exatamente essa
origem no CORS (`app.cors.origens`).
