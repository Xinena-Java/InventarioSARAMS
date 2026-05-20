const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// 1. Manejar peticiones GET (Carga inicial)
function doGet(e) {
  try {
    const db = obtenerBaseDeDatosInicial();
    // Apps Script automáticamente añade el CORS "Access-Control-Allow-Origin: *" a los TextOutput
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: db }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. Manejar peticiones POST (Crear/Actualizar)
function doPost(e) {
  try {
    // Si la petición viene en text/plain (para evitar preflight complejo) hacemos JSON.parse
    const body = typeof e.postData.contents === 'string' ? JSON.parse(e.postData.contents) : e.postData.contents;
    
    if (body.action === 'guardarComponenteCompleto') {
      const res = guardarComponenteCompleto(body.componenteData, body.requisitosArray);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (body.action === 'guardarChecklistEvento') {
      const res = guardarChecklistEvento(body.competencia, body.itemsArray);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (body.action === 'eliminarRegistro') {
      const res = eliminarRegistro(body.nombreTabla, body.idColName, body.idValor);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (body.action === 'guardarRegistro') {
      const res = crearRegistro(body.nombreTabla, body.datos);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (body.action === 'actualizarComponente') {
      const res = actualizarComponente(body.componenteData, body.requisitosArray);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    throw new Error("Acción no reconocida");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- Funciones Internas ----

function sheetToJSON(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function obtenerBaseDeDatosInicial() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    Componentes: sheetToJSON(ss.getSheetByName('Componentes') || { getDataRange: () => ({ getValues: () => [] }) }),
    Inventario_Maestro: sheetToJSON(ss.getSheetByName('Inventario_Maestro') || { getDataRange: () => ({ getValues: () => [] }) }),
    Requisitos_Componente: sheetToJSON(ss.getSheetByName('Requisitos_Componente') || { getDataRange: () => ({ getValues: () => [] }) })
  };
}

function crearRegistro(nombreTabla, datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(nombreTabla);
    if (!sheet) throw new Error("La tabla " + nombreTabla + " no existe.");
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let idColName = "";
    let prefix = "";
    
    if (nombreTabla === "Componentes") {
      idColName = "Id_Componente";
      prefix = "S-";
    } else if (nombreTabla === "Inventario_Maestro") {
      idColName = "Id_Item";
      if (datos.Tipo === 'Herramienta') prefix = "H-";
      else if (datos.Tipo === 'Tornillería') prefix = "T-";
      else prefix = "C-"; // Consumible u otro
    } else if (nombreTabla === "Requisitos_Componente") {
      idColName = "Id_Requisito";
      prefix = "R-";
    } else if (nombreTabla === "Eventos_Checklist") {
      idColName = "Id_Registro";
      prefix = "E-";
    }
    
    let newIdNum = 1;
    if (data.length > 1 && idColName && prefix) {
      const idIndex = headers.indexOf(idColName);
      if (idIndex > -1) {
        // Filtrar IDs que existan y que empiecen con el mismo prefijo
        const nums = data.slice(1).map(row => {
          let val = String(row[idIndex]);
          if (val.startsWith(prefix)) {
            let parts = val.split('-');
            if (parts.length > 1) {
              return Number(parts[1]) || 0;
            }
          }
          return 0;
        });
        if (nums.length > 0) {
          newIdNum = Math.max(...nums) + 1;
        }
      }
    }
    
    if (idColName && prefix) {
      datos[idColName] = prefix + newIdNum;
    }
    
    const newRow = headers.map(header => datos[header] !== undefined ? datos[header] : "");
    sheet.appendRow(newRow);
    return { success: true, data: datos };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function guardarComponenteCompleto(componenteData, requisitosArray) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    let resComp = crearRegistro("Componentes", componenteData);
    if (!resComp.success) throw new Error(resComp.error);
    
    let idComponente = resComp.data["Id_Componente"];
    
    for(let req of requisitosArray) {
      req["Id_Componente"] = idComponente;
      let resReq = crearRegistro("Requisitos_Componente", req);
      if(!resReq.success) throw new Error(resReq.error);
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function actualizarComponente(componenteData, requisitosArray) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const idComponente = componenteData.Id_Componente;
    if (!idComponente) throw new Error("Id_Componente es requerido para actualizar");
    
    // 1. Actualizar el componente en la tabla Componentes
    const compSheet = ss.getSheetByName('Componentes');
    if (!compSheet) throw new Error("Tabla 'Componentes' no encontrada");
    
    const compData = compSheet.getDataRange().getValues();
    const compHeaders = compData[0];
    let updated = false;
    
    for (let i = 1; i < compData.length; i++) {
      if (String(compData[i][compHeaders.indexOf('Id_Componente')]) === String(idComponente)) {
        // Actualizar fila
        for (let j = 0; j < compHeaders.length; j++) {
          const header = compHeaders[j];
          if (componenteData[header] !== undefined) {
            compSheet.getRange(i + 1, j + 1).setValue(componenteData[header]);
          }
        }
        updated = true;
        break;
      }
    }
    
    if (!updated) throw new Error("Componente no encontrado para actualizar");
    
    // 2. Eliminar requisitos antiguos asociados a este componente
    const reqSheet = ss.getSheetByName('Requisitos_Componente');
    if (reqSheet) {
      const reqData = reqSheet.getDataRange().getValues();
      if (reqData.length > 1) {
        const idCompIndex = reqData[0].indexOf('Id_Componente');
        if (idCompIndex > -1) {
          // Borrar de abajo hacia arriba para no alterar índices
          for (let i = reqData.length - 1; i >= 1; i--) {
            if (String(reqData[i][idCompIndex]) === String(idComponente)) {
              reqSheet.deleteRow(i + 1);
            }
          }
        }
      }
    }
    
    // 3. Agregar nuevos requisitos
    for (let req of requisitosArray) {
      if (req.Id_Item) { // Solo agregar si tiene Id_Item
        req["Id_Componente"] = idComponente;
        let resReq = crearRegistro("Requisitos_Componente", req);
        if(!resReq.success) throw new Error(resReq.error);
      }
    }
    
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function guardarChecklistEvento(competencia, itemsArray) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    for (let item of itemsArray) {
      let registro = {
        Id_Competencia: competencia,
        Id_Item: item.Id_Item,
        Cant_Llevada: item.Cant_Llevada,
        Cant_Regresada: item.Cant_Regresada
      };
      
      let res = crearRegistro("Eventos_Checklist", registro);
      if (!res.success) throw new Error(res.error);
    }
    
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function eliminarRegistro(nombreTabla, idColName, idValor) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(nombreTabla);
    if (!sheet) throw new Error("La tabla " + nombreTabla + " no existe.");
    
    // Eliminación en cascada para Componentes
    if (nombreTabla === 'Componentes') {
      const reqSheet = ss.getSheetByName('Requisitos_Componente');
      if (reqSheet) {
        const reqData = reqSheet.getDataRange().getValues();
        if (reqData.length > 1) {
          const idCompIndex = reqData[0].indexOf('Id_Componente');
          if (idCompIndex > -1) {
            // Borramos de abajo hacia arriba para no alterar índices
            for (let i = reqData.length - 1; i >= 1; i--) {
              if (String(reqData[i][idCompIndex]) === String(idValor)) {
                reqSheet.deleteRow(i + 1); // +1 porque deleteRow usa 1-index
              }
            }
          }
        }
      }
    }
    
    // Borrado del registro principal
    const data = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const idIndex = data[0].indexOf(idColName);
      if (idIndex > -1) {
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][idIndex]) === String(idValor)) {
            sheet.deleteRow(i + 1);
            return { success: true };
          }
        }
      }
    }
    
    throw new Error("Registro no encontrado.");
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}
