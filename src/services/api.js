// Reemplaza esta URL con la que obtengas al desplegar tu Google Apps Script
export const API_URL = "https://script.google.com/macros/s/AKfycbx5Wl4K89aF0Kxai8EbPZzkqmOfwbOVKte6-9F2mg7dDg8D6U_Zz8lQ6DIwTcpXK2th/exec";

// IMPORTANTE: Esta debe ser exactamente igual a la de tu Google Apps Script
const API_KEY = "Cabra-Salvaje-777";

export async function fetchSheetData(sheetName) {
  try {
    const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&apiKey=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en red");
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error("Error fetching", sheetName, error);
    alert("Error de conexión o contraseña incorrecta.");
    return [];
  }
}

export async function createRow(sheetName, data) {
  return sendAction('CREATE', sheetName, data);
}

export async function updateRow(sheetName, _rowIndex, data) {
  return sendAction('UPDATE', sheetName, data, _rowIndex);
}

export async function deleteRow(sheetName, _rowIndex) {
  return sendAction('DELETE', sheetName, {}, _rowIndex);
}

async function sendAction(action, sheetName, data, _rowIndex = null) {
  try {
    const payload = {
      apiKey: API_KEY, // Enviamos la contraseña con cada operación
      action,
      sheet: sheetName,
      data,
      _rowIndex
    };

    // Usamos text/plain para evitar el preflight OPTIONS de CORS que Google Apps Script rechazaría
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
