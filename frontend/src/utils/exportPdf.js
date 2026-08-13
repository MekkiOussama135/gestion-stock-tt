import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports an array of plain objects (same shape you'd pass to
 * XLSX.utils.json_to_sheet) as a table in a PDF file.
 *
 * @param {string} title      Heading printed at the top of the PDF
 * @param {Array<Object>} rows Row objects — object keys become column headers
 * @param {string} filename   e.g. "produits.pdf"
 */
export function exportRowsToPdf(title, rows, filename) {
  const doc = new jsPDF({ orientation: rows.length && Object.keys(rows[0]).length > 6 ? 'landscape' : 'portrait' });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 21);

  if (!rows.length) {
    doc.setTextColor(0);
    doc.text('Aucune donnée à exporter.', 14, 32);
  } else {
    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((h) => (row[h] ?? '').toString()));

    autoTable(doc, {
      startY: 26,
      head: [headers],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [19, 83, 189], textColor: 255 }, // #1353bd, matches the app's accent color
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  doc.save(filename);
}