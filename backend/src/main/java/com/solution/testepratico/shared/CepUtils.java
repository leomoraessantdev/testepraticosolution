package com.solution.testepratico.shared;

/** Normalizacao de CEP. Espelha CpfUtils: o banco guarda so digitos. */
public final class CepUtils {

    private CepUtils() {
    }

    /** "01310-100" -> "01310100". */
    public static String normalizar(String cep) {
        return cep == null ? null : cep.replaceAll("[^0-9]", "");
    }
}
