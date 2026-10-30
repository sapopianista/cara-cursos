package br.com.caracursos.recursos;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import org.junit.jupiter.api.Test;

class DashboardRecursoTest {

    @Test
    void percentuaisSempreFecham100() {
        assertArrayEquals(new int[] { 34, 33, 33 }, DashboardRecurso.percentuaisQueSomam100(new int[] { 1, 1, 1 }, 3));
        assertArrayEquals(new int[] { 0, 0 }, DashboardRecurso.percentuaisQueSomam100(new int[] { 0, 0 }, 0));
        assertArrayEquals(new int[] { 40, 32, 20, 8 },
                DashboardRecurso.percentuaisQueSomam100(new int[] { 40, 32, 20, 8 }, 100));
    }
}
