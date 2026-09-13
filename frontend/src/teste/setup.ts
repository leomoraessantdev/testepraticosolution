import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Desmonta o que o teste anterior renderizou. Sem isso, dois testes que buscam
// o mesmo rotulo encontram dois elementos e falham por ambiguidade, nao pela
// regra que estao verificando.
afterEach(() => cleanup())

// O jsdom nao implementa estas APIs, e os componentes do Radix (Dialog,
// AlertDialog) as usam para posicionamento e foco. Sem os stubs o teste falha
// no render, antes de chegar na regra que interessa.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.matchMedia) {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

window.HTMLElement.prototype.scrollIntoView ??= vi.fn()
window.HTMLElement.prototype.hasPointerCapture ??= vi.fn(() => false)
window.HTMLElement.prototype.setPointerCapture ??= vi.fn()
window.HTMLElement.prototype.releasePointerCapture ??= vi.fn()
