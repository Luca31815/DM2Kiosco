import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Genera un PDF con la lista de productos
 * @param {Array} products - Lista de objetos de producto ({ nombre, ultimo_precio_venta })
 * @param {string} filterLabel - Etiqueta del filtro aplicado (opcional)
 */
export const generateProductsPDF = (products, filterLabel = '') => {
    const doc = jsPDF()
    const now = new Date()
    const dateStr = now.toLocaleDateString()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // --- ENCABEZADO ---
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('LISTA DE PRODUCTOS', 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el: ${dateStr} - ${timeStr}`, 14, 28)
    
    if (filterLabel) {
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text(`Filtro aplicado: "${filterLabel}"`, 14, 38)
        doc.setFont('helvetica', 'normal')
    }

    // --- TABLA ---
    const tableColumn = ["PRODUCTO", "PRECIO DE VENTA"]
    const tableRows = products.map(p => [
        p.nombre,
        `$${p.ultimo_precio_venta?.toLocaleString() || '0'}`
    ])

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: filterLabel ? 42 : 35,
        theme: 'striped',
        headStyles: {
            fillColor: [30, 41, 59], // Slate 800
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [50, 50, 50]
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250] // Light grey
        },
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } // Emerald 500 for price
        },
        margin: { top: 35 },
        didDrawPage: (data) => {
            // Pie de página
            const str = 'Página ' + doc.internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10)
        }
    })

    // --- GUARDAR ---
    const filename = `productos_${filterLabel ? filterLabel.toLowerCase().replace(/\s+/g, '_') : 'todos'}_${now.getTime()}.pdf`
    doc.save(filename)
}
