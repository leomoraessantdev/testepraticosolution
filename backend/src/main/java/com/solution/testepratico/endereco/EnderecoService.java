package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.AtualizarEnderecoRequest;
import com.solution.testepratico.endereco.dto.CriarEnderecoRequest;
import com.solution.testepratico.endereco.dto.EnderecoAdminResponse;
import com.solution.testepratico.endereco.dto.EnderecoResponse;
import com.solution.testepratico.seguranca.ControleAcesso;
import com.solution.testepratico.shared.CepUtils;
import com.solution.testepratico.shared.PaginaResponse;
import com.solution.testepratico.shared.exception.RecursoNaoEncontradoException;
import com.solution.testepratico.usuario.Usuario;
import com.solution.testepratico.usuario.UsuarioRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Onde vivem as tres regras de negocio de endereco.
 *
 * REGRA 1 - no maximo um endereco principal por usuario.
 *   Invariante. Nao mora em metodo nenhum: mora no indice unico parcial
 *   uk_enderecos_um_principal_por_usuario (migration V2). Os metodos daqui
 *   respeitam a invariante; o banco a garante, inclusive sob concorrencia e
 *   contra qualquer outro escritor.
 *
 * REGRA 2 - ao marcar um novo como principal, o anterior deixa de ser.
 *   Vive em definirPrincipal(), e tambem em criar() quando o endereco ja nasce
 *   principal.
 *
 * REGRA 3 - ao excluir o principal, outro endereco vira principal.
 *   Vive em excluir().
 */
@Service
public class EnderecoService {

    private final EnderecoRepository enderecoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ControleAcesso controleAcesso;

    public EnderecoService(EnderecoRepository enderecoRepository,
                           UsuarioRepository usuarioRepository,
                           ControleAcesso controleAcesso) {
        this.enderecoRepository = enderecoRepository;
        this.usuarioRepository = usuarioRepository;
        this.controleAcesso = controleAcesso;
    }

    // ------------------------------------------------------------------
    // Leitura
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listarDoUsuario(Long usuarioId) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);
        exigirUsuarioExistente(usuarioId);

        // Defesa em profundidade: a consulta ja filtra por dono. Mesmo que a
        // checagem acima fosse removida por engano, esta query nunca devolveria
        // endereco de outro usuario, no maximo uma lista vazia.
        return enderecoRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId)
                .stream().map(EnderecoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public EnderecoResponse buscar(Long usuarioId, Long enderecoId) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);
        return EnderecoResponse.de(carregarDoUsuario(usuarioId, enderecoId));
    }

    /**
     * Quantos enderecos cada usuario tem, para a listagem do administrador.
     *
     * Sem checagem de acesso propria: e composicao interna, e quem chama
     * (UsuarioService.listarTodos) ja exigiu ADMIN antes. Nao ha endpoint que
     * alcance este metodo diretamente.
     *
     * Usuario sem endereco nao vem na consulta agregada, entao o mapa nao tem a
     * chave dele - por isso quem le usa getOrDefault com zero.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> contarEnderecosPorUsuario() {
        return enderecoRepository.contarPorUsuario().stream()
                .collect(Collectors.toMap(
                        EnderecoRepository.ContagemDeEnderecos::getUsuarioId,
                        EnderecoRepository.ContagemDeEnderecos::getTotal));
    }

    /** Listagem global de enderecos do sistema. Restrita a ADMIN. */
    @Transactional(readOnly = true)
    public PaginaResponse<EnderecoAdminResponse> listarTodos(Pageable pageable) {
        controleAcesso.exigirAdmin();
        return PaginaResponse.de(
                enderecoRepository.buscarTodosComUsuario(pageable),
                EnderecoAdminResponse::de);
    }

    // ------------------------------------------------------------------
    // Escrita
    // ------------------------------------------------------------------

    /**
     * Cria endereco para o usuario informado na URL.
     *
     * O admin cria para qualquer usuario sem nenhum tratamento especial: quem
     * autoriza e exigirAcessoAoUsuario, que libera ADMIN antes de comparar os
     * ids. Nao existe endpoint separado nem flag de admin no corpo da
     * requisicao.
     *
     * Decisao registrada no PLAN.md: o PRIMEIRO endereco de um usuario vira
     * principal automaticamente, independente do que veio no campo principal.
     * Sem isso, o usuario com um unico endereco ficaria sem principal, estado
     * que obrigaria todo consumidor a tratar ausencia.
     *
     * Transacional porque sao dois passos que precisam valer juntos: rebaixar o
     * principal antigo e inserir o novo ja principal. Se o insert falhasse
     * depois do rebaixamento, o usuario ficaria sem principal nenhum.
     */
    @Transactional
    public EnderecoResponse criar(Long usuarioId, CriarEnderecoRequest request) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);
        exigirUsuarioExistente(usuarioId);

        boolean primeiroEndereco = !enderecoRepository.existsByUsuarioId(usuarioId);
        boolean nasceComoPrincipal =
                primeiroEndereco || Boolean.TRUE.equals(request.principal());

        // REGRA 2, no caminho da criacao.
        if (nasceComoPrincipal && !primeiroEndereco) {
            enderecoRepository.rebaixarPrincipalAtual(usuarioId);
        }

        // getReferenceById devolve um proxy sem consultar o banco: para gravar
        // a FK basta o id. E e obtido DEPOIS do bulk update acima, que limpa o
        // contexto de persistencia e destacaria qualquer entidade carregada
        // antes dele.
        Usuario usuario = usuarioRepository.getReferenceById(usuarioId);

        Endereco endereco = new Endereco(
                usuario,
                CepUtils.normalizar(request.cep()),
                request.logradouro().trim(),
                request.numero().trim(),
                normalizarComplemento(request.complemento()),
                request.bairro().trim(),
                request.cidade().trim(),
                request.uf().trim().toUpperCase());

        endereco.setPrincipal(nasceComoPrincipal);

        return EnderecoResponse.de(enderecoRepository.save(endereco));
    }

    /**
     * Atualiza os dados do endereco. Nao mexe em principal: para isso existe
     * definirPrincipal, que carrega a regra de rebaixamento.
     *
     * Nao ha chamada a save(). Dentro da transacao a entidade esta gerenciada,
     * e o Hibernate detecta a alteracao (dirty checking) e emite o UPDATE no
     * commit. Chamar save() aqui seria redundante.
     */
    @Transactional
    public EnderecoResponse atualizar(Long usuarioId, Long enderecoId,
                                      AtualizarEnderecoRequest request) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);
        Endereco endereco = carregarDoUsuario(usuarioId, enderecoId);

        endereco.setCep(CepUtils.normalizar(request.cep()));
        endereco.setLogradouro(request.logradouro().trim());
        endereco.setNumero(request.numero().trim());
        endereco.setComplemento(normalizarComplemento(request.complemento()));
        endereco.setBairro(request.bairro().trim());
        endereco.setCidade(request.cidade().trim());
        endereco.setUf(request.uf().trim().toUpperCase());

        return EnderecoResponse.de(endereco);
    }

    /**
     * REGRA 2 - ao marcar um novo como principal, o anterior deixa de ser.
     *
     * A ordem importa: rebaixa primeiro, promove depois. Invertido, existiria
     * um instante com dois principais e o indice unico abortaria a transacao.
     *
     * Transacional porque os dois passos formam uma unidade. Se a promocao
     * falhasse apos o rebaixamento, o usuario terminaria sem principal algum.
     *
     * Idempotente: marcar como principal quem ja e principal nao faz nada.
     * Evita um UPDATE inutil e, principalmente, evita rebaixar e repromover o
     * mesmo registro, o que abriria uma janela desnecessaria de conflito.
     */
    @Transactional
    public EnderecoResponse definirPrincipal(Long usuarioId, Long enderecoId) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);

        Endereco atual = carregarDoUsuario(usuarioId, enderecoId);
        if (atual.isPrincipal()) {
            return EnderecoResponse.de(atual);
        }

        // Rebaixa ANTES de recarregar o alvo: o bulk update limpa o contexto de
        // persistencia, e a entidade carregada acima fica destacada. Um
        // setPrincipal(true) nela seria silenciosamente ignorado no commit.
        enderecoRepository.rebaixarPrincipalAtual(usuarioId);

        Endereco alvo = carregarDoUsuario(usuarioId, enderecoId);
        alvo.setPrincipal(true);

        return EnderecoResponse.de(alvo);
    }

    /**
     * REGRA 3 - ao excluir o principal, outro endereco vira principal.
     *
     * Decisao registrada no PLAN.md: se nao sobrar nenhum, o usuario fica com
     * zero enderecos e sem principal. A regra e "no maximo um principal", nunca
     * "no minimo um endereco" - bloquear a exclusao prenderia o usuario com um
     * endereco digitado errado.
     *
     * Sobre o flush() explicito, verificado com log de SQL:
     *
     * A remocao PRECISA chegar ao banco antes da promocao do sucessor. Se as
     * duas fossem para o mesmo flush, o Hibernate ordenaria os comandos por
     * tipo e executaria o UPDATE antes do DELETE: existiriam dois principais no
     * mesmo instante e o indice unico parcial abortaria a transacao.
     *
     * Na pratica isso nao acontece nem sem o flush, porque a consulta do
     * sucessor logo abaixo e JPQL, e o FlushMode.AUTO descarrega as alteracoes
     * pendentes sobre a tabela antes de executar qualquer query. Ou seja: a
     * ordem correta hoje depende de um efeito colateral implicito.
     *
     * O flush() fica por isso mesmo. Torna a ordem explicita e deixa de
     * depender do modo de flush e da presenca de uma consulta entre as duas
     * operacoes - trocar a busca do sucessor por uma lista ja em memoria
     * quebraria a invariante silenciosamente.
     */
    @Transactional
    public void excluir(Long usuarioId, Long enderecoId) {
        controleAcesso.exigirAcessoAoUsuario(usuarioId);

        Endereco endereco = carregarDoUsuario(usuarioId, enderecoId);
        boolean eraPrincipal = endereco.isPrincipal();

        enderecoRepository.delete(endereco);
        enderecoRepository.flush();

        if (eraPrincipal) {
            enderecoRepository.findFirstByUsuarioIdOrderByIdAsc(usuarioId)
                    .ifPresent(sucessor -> sucessor.setPrincipal(true));
        }
    }

    // ------------------------------------------------------------------
    // Apoio
    // ------------------------------------------------------------------

    private Endereco carregarDoUsuario(Long usuarioId, Long enderecoId) {
        return enderecoRepository.findByIdAndUsuarioId(enderecoId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Endereco " + enderecoId + " nao encontrado para este usuario."));
    }

    private void exigirUsuarioExistente(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new RecursoNaoEncontradoException(
                    "Usuario " + usuarioId + " nao encontrado.");
        }
    }

    /** Complemento vazio vira nulo: no banco "nao existe" e NULL, nao string vazia. */
    private String normalizarComplemento(String complemento) {
        if (complemento == null || complemento.isBlank()) {
            return null;
        }
        return complemento.trim();
    }
}
