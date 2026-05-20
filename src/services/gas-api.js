const API_URL = "https://script.google.com/macros/s/AKfycbw1_V7iqtND5aHBJLZPBRh2nCIx9FjVQg9uR_EjFtrv8qPzNLScH3De5SjOOqa0VyU/exec";

// Wrapper for fetch requests to Apps Script
export const gasAPI = {
  obtenerBaseDeDatosInicial: async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Error de red");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    } catch (error) {
      console.error("Error fetching DB:", error);
      throw error;
    }
  },

  guardarComponenteCompleto: async (componenteData, requisitosArray) => {
    try {
      const payload = {
        action: 'guardarComponenteCompleto',
        componenteData,
        requisitosArray
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Se usa text/plain para evitar problemas de CORS preflight
        }
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    } catch (error) {
      console.error("Error saving:", error);
      throw error;
    }
  },

  guardarRegistro: async (nombreTabla, datos) => {
    try {
      const payload = {
        action: 'guardarRegistro',
        nombreTabla,
        datos
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    } catch (error) {
      console.error("Error saving record:", error);
      throw error;
    }
  },

  guardarChecklistEvento: async (competencia, itemsArray) => {
    try {
      const payload = {
        action: 'guardarChecklistEvento',
        competencia,
        itemsArray
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    } catch (error) {
      console.error("Error saving checklist:", error);
      throw error;
    }
  },

  eliminarRegistro: async (nombreTabla, idColName, idValor) => {
    try {
      const payload = {
        action: 'eliminarRegistro',
        nombreTabla,
        idColName,
        idValor
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    } catch (error) {
      console.error("Error deleting:", error);
      throw error;
    }
  }
};
