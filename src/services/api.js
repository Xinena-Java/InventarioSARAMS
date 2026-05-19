// Reemplaza esta URL con la que obtengas al desplegar tu Google Apps Script
export const API_URL = "https://script.google.com/macros/s/AKfycbx5Wl4K89aF0Kxai8EbPZzkqmOfwbOVKte6-9F2mg7dDg8D6U_Zz8lQ6DIwTcpXK2th/exec";

export async function fetchSheetData(sheetName, apiKey) {
  try {
    const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&apiKey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en red");
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error("Error fetching", sheetName, error);
    throw error; // Lanzamos el error para que App.jsx se entere si falló el login
  }
}

export async function createRow(sheetName, data, apiKey) {
  return sendAction('CREATE', sheetName, data, null, apiKey);
}

export async function updateRow(sheetName, _rowIndex, data, apiKey) {
  return sendAction('UPDATE', sheetName, data, _rowIndex, apiKey);
}

export async function deleteRow(sheetName, _rowIndex, apiKey) {
  return sendAction('DELETE', sheetName, {}, _rowIndex, apiKey);
}

async function sendAction(action, sheetName, data, _rowIndex = null, apiKey) {
  try {
    const payload = {
      apiKey: apiKey,
      action,
      sheet: sheetName,
      data,
      _rowIndex
    };

    // Usamos text/plain para evitar el preflight OPTIONS de CORS
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    const json = await res.json();
    if (!json.success && json.error) {
      alert("Error: " + json.error);
    }
    return json;
  } catch (error) {
    console.error("Error in action", action, sheetName, error);
    alert("Error: " + error.message);
    return { success: false, error: error.message };
  }
}
