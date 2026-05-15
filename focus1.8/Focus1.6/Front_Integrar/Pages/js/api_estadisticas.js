/**
 * API Estatísticas — Integração com backend (usando dados de Missões/Tasks)
 * Fornece funções para comunicar com api_estatisticas.php
 */

const StatsAPI = (() => {
  const BASE_URL = 'php/api_estatisticas.php';

  return {
    /* Obter estatísticas de missões por período */
    getStats: async (period = 'weekly') => {
      try {
        const res = await fetch(`${BASE_URL}?action=stats&period=${period}`);
        return await res.json();
      } catch (e) {
        console.error('Erro ao buscar estatísticas:', e);
        return { success: false, error: e.message };
      }
    },

    /* Obter missões do mês */
    getMonthMissions: async (year, month) => {
      try {
        const res = await fetch(`${BASE_URL}?action=get_month&year=${year}&month=${month}`);
        return await res.json();
      } catch (e) {
        console.error('Erro ao buscar missões:', e);
        return { success: false, error: e.message };
      }
    },

    /* Obter resumo geral (total de hábitos, completadas, progresso) */
    getSummary: async () => {
      try {
        const res = await fetch(`${BASE_URL}?action=summary`);
        return await res.json();
      } catch (e) {
        console.error('Erro ao buscar resumo:', e);
        return { success: false, error: e.message };
      }
    }
  };
})();
