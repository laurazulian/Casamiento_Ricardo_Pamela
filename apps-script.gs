// Pegar en Extensiones > Apps Script de la planilla de Google Sheets.
const SHEET_ID = '1vo20jMbPcLheuMEZJhg9T9yKG40F7S2UGmUMPRyVETI';

function doPost(e) {
  const p = e.parameter;
  const hoja = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha', 'Nombre', 'Asiste', 'Cantidad', 'Restricción alimentaria']);
  }
  hoja.appendRow([new Date(), p.nombre || '', p.asiste || '', p.cantidad || '', p.comida || '']);
  return ContentService.createTextOutput('ok');
}
