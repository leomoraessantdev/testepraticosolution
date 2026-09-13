import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnderecoFormDialog } from './EnderecoFormDialog'

// O cliente HTTP e substituido: o teste verifica a REGRA da tela, nao a rede.
vi.mock('@/lib/api', () => ({
  EVENTO_SESSAO_EXPIRADA: 'teste:sessao-expirada',
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const { api } = await import('@/lib/api')
const get = vi.mocked(api.get)

function montar() {
  // retry desligado: com retry, um teste de erro esperaria as tentativas antes
  // de a mensagem aparecer, e o teste ficaria lento e intermitente.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EnderecoFormDialog usuarioId={1} aberto onFechar={() => {}} />
    </QueryClientProvider>,
  )
}

const RESPOSTA_VIACEP = {
  data: {
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
}

describe('EnderecoFormDialog: preenchimento automatico pelo CEP', () => {
  beforeEach(() => vi.clearAllMocks())

  it('preenche logradouro, bairro, cidade e estado ao sair do campo CEP', async () => {
    get.mockResolvedValue(RESPOSTA_VIACEP as AxiosResponse)
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText('CEP'), '01310100')
    // Tab dispara o blur, que e o gatilho escolhido.
    await usuario.tab()

    await waitFor(() => {
      expect(screen.getByLabelText('Logradouro')).toHaveValue('Avenida Paulista')
    })
    expect(screen.getByLabelText('Bairro')).toHaveValue('Bela Vista')
    expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo')
    expect(screen.getByLabelText('Estado')).toHaveValue('SP')
    expect(get).toHaveBeenCalledWith('/api/cep/01310100')
  })

  it('manda o CEP sem mascara para a API, mesmo digitado com mascara', async () => {
    get.mockResolvedValue(RESPOSTA_VIACEP as AxiosResponse)
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText('CEP'), '01310-100')
    await usuario.tab()

    await waitFor(() => expect(get).toHaveBeenCalledWith('/api/cep/01310100'))
  })

  it('NAO chama a API com CEP incompleto', async () => {
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText('CEP'), '013')
    await usuario.tab()

    // Disparar por tecla, e nao por blur com CEP valido, geraria uma requisicao
    // por digito - sendo que so o oitavo produz um CEP consultavel.
    expect(get).not.toHaveBeenCalled()
  })

  it('consulta UMA vez quando o mesmo CEP e conferido duas vezes', async () => {
    get.mockResolvedValue(RESPOSTA_VIACEP as AxiosResponse)
    const usuario = userEvent.setup()
    montar()

    const campoCep = screen.getByLabelText('CEP')
    await usuario.type(campoCep, '01310100')
    await usuario.tab()
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1))

    // Volta ao campo e sai de novo, sem alterar o valor.
    await usuario.click(campoCep)
    await usuario.tab()

    // O cache do React Query (staleTime infinito) absorve a segunda consulta.
    // E a camada de cliente do requisito "evitar consultas repetidas".
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1))
  })

  it('CEP inexistente avisa e deixa preencher a mao, em vez de travar', async () => {
    const resposta = { status: 404, data: { status: 404, mensagem: 'CEP nao encontrado' } } as AxiosResponse
    get.mockRejectedValue(new AxiosError('Not Found', '404', undefined, undefined, resposta))
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText('CEP'), '99999999')
    await usuario.tab()

    await waitFor(() => {
      expect(screen.getByText(/CEP não encontrado/i)).toBeInTheDocument()
    })
    // Os campos continuam editaveis: o ViaCEP fora do ar nao pode impedir o
    // cadastro de um endereco que a pessoa sabe de cor.
    expect(screen.getByLabelText('Logradouro')).not.toBeDisabled()
  })
})
