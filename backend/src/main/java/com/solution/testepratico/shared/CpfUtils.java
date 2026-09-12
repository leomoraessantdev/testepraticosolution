package com.solution.testepratico.shared;

/** Normalizacao e validacao de CPF. */
public final class CpfUtils {

    private CpfUtils() {
    }

    /** Remove mascara e qualquer nao-digito. "529.982.247-25" -> "52998224725". */
    public static String normalizar(String cpf) {
        return cpf == null ? null : cpf.replaceAll("[^0-9]", "");
    }

    /**
     * Valida os dois digitos verificadores.
     *
     * Existe para o CPF ser rejeitado no cadastro, nao no login: validar
     * formato no login so diria ao atacante quais strings valem a pena tentar.
     */
    public static boolean valido(String cpfComOuSemMascara) {
        String cpf = normalizar(cpfComOuSemMascara);

        if (cpf == null || cpf.length() != 11) {
            return false;
        }
        // Sequencias repetidas (00000000000, 11111111111...) passam no calculo
        // dos digitos mas nao sao CPFs validos.
        if (cpf.chars().distinct().count() == 1) {
            return false;
        }

        int primeiro = digitoVerificador(cpf, 9, 10);
        int segundo = digitoVerificador(cpf, 10, 11);

        return primeiro == Character.getNumericValue(cpf.charAt(9))
                && segundo == Character.getNumericValue(cpf.charAt(10));
    }

    private static int digitoVerificador(String cpf, int quantidadeDigitos, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < quantidadeDigitos; i++) {
            soma += Character.getNumericValue(cpf.charAt(i)) * (pesoInicial - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }
}
