/**
 * Utilidades para cálculos financieros y manejo de fechas
 */

/**
 * Calcula el interés generado en un rango de fechas
 */
function calcularInteresGenerado(monto, aportacionMensual, interes, desde, hasta) {
    const [desdeY, desdeM] = desde.split('-').map(Number);
    const [hastaY, hastaM] = hasta.split('-').map(Number);
    
    // Si es un solo mes, solo calcula interés con la base, sin aportaciones
    if (desde === hasta) {
        return monto * (interes / 100) / 12;
    }
    
    const desdeDate = new Date(desdeY, desdeM - 1, 1);
    const hastaDate = new Date(hastaY, hastaM, 0);
    
    let saldo = monto;
    let totalInteres = 0;
    let current = new Date(desdeDate);
    
    // Primer mes: monto inicial genera interés
    totalInteres += saldo * (interes / 100) / 12;
    current.setMonth(current.getMonth() + 1);
    
    // Meses siguientes: aportación el día 1, luego genera interés
    while (current <= hastaDate) {
        saldo += aportacionMensual || 0;
        totalInteres += saldo * (interes / 100) / 12;
        current.setMonth(current.getMonth() + 1);
    }
    
    return totalInteres;
}

/**
 * Calcula intereses mensuales (mes a mes)
 */
function calcularInteresesMensuales(monto, aportacionMensual, interes, desde, hasta) {
    const [desdeY, desdeM] = desde.split('-').map(Number);
    const [hastaY, hastaM] = hasta.split('-').map(Number);
    
    const mesesInteres = {};
    
    // Si es un solo mes, solo calcula interés con la base
    if (desde === hasta) {
        mesesInteres[desde] = monto * (interes / 100) / 12;
        return mesesInteres;
    }
    
    const desdeDate = new Date(desdeY, desdeM - 1, 1);
    const hastaDate = new Date(hastaY, hastaM, 0);
    
    let saldo = monto;
    let current = new Date(desdeDate);
    
    // Primer mes: monto inicial genera interés
    const primerMes = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    mesesInteres[primerMes] = saldo * (interes / 100) / 12;
    current.setMonth(current.getMonth() + 1);
    
    // Meses siguientes: aportación el día 1, luego genera interés
    while (current <= hastaDate) {
        saldo += aportacionMensual || 0;
        const mesKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        mesesInteres[mesKey] = saldo * (interes / 100) / 12;
        current.setMonth(current.getMonth() + 1);
    }
    
    return mesesInteres;
}

/**
 * Resta una cantidad de tiempo a una fecha
 */
function restarFecha(fecha, cantidad, unidad) {
    const nuevaFecha = new Date(fecha);
    if (unidad === 'years') nuevaFecha.setFullYear(nuevaFecha.getFullYear() - cantidad);
    else if (unidad === 'months') nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidad);
    return nuevaFecha;
}

/**
 * Cuenta los meses desde el día 28 entre dos fechas
 */
function contarMesesDesde28(desdeStr, hastaStr, inicioRepeticion, finRepeticion) {
    const desde = new Date(desdeStr);
    const hasta = new Date(hastaStr);
    const inicio28 = new Date(inicioRepeticion + "-28");
    const fin28 = finRepeticion ? new Date(finRepeticion + "-28") : new Date(9999, 11, 31);

    let contador = 0;
    let current = new Date(inicio28.getFullYear(), inicio28.getMonth(), 28);

    while (current <= hasta && current <= fin28) {
        if (current >= desde) contador++;
        current.setMonth(current.getMonth() + 1);
    }
    return contador;
}

/**
 * Genera una descripción aleatoria
 */
function generarDescripcionRandom() {
    const ids = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `Cuenta-${ids}-${timestamp}`;
}

/**
 * Genera un array de meses entre dos fechas
 * @param {Date|string} desde - Fecha inicial
 * @param {Date|string} hasta - Fecha final
 * @param {Object} initialValue - Valor inicial para cada mes (default: { total: 0 })
 * @returns {Array} Array de objetos con { mes: 'YYYY-MM', ...initialValue }
 */
function generarArrayMeses(desde, hasta, initialValue = { total: 0 }) {
    const desdeDate = typeof desde === 'string' ? new Date(desde) : desde;
    const hastaDate = typeof hasta === 'string' ? new Date(hasta) : hasta;
    
    const meses = [];
    let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
    const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
    
    while (current <= end) {
        const mesStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        meses.push({ mes: mesStr, ...initialValue });
        current.setMonth(current.getMonth() + 1);
    }
    
    return meses;
}

/**
 * Calcula si un registro mensual está activo en un mes específico
 * @param {string} mes - Mes en formato YYYY-MM
 * @param {Date} hastaDate - Fecha límite del período
 * @param {string} registroDesde - Inicio del registro mensual (YYYY-MM)
 * @param {string} registroHasta - Fin del registro mensual (YYYY-MM) o null
 * @returns {boolean}
 */
function esMensualActivo(mes, hastaDate, registroDesde, registroHasta) {
    const mes28 = new Date(mes + "-28");
    const inicio28 = new Date(registroDesde + "-28");
    const fin28 = registroHasta ? new Date(registroHasta + "-28") : new Date(9999, 11, 31);
    
    return mes28 >= inicio28 && mes28 <= fin28 && mes28 <= hastaDate;
}

/**
 * Calcula impuestos desde el campo bruto (bruto - monto)
 * @param {Array} registros - Array de registros con campos bruto y monto
 * @returns {number} Total de impuestos
 */
function calcularImpuestosDesdeRruto(registros) {
    return registros.reduce((total, r) => {
        if (r.bruto && r.bruto !== r.monto) {
            return total + (r.bruto - r.monto);
        }
        return total;
    }, 0);
}

/**
 * Calcula impuestos de ingresos puntuales por mes
 * @param {Array} ingresos - Ingresos puntuales con bruto
 * @param {Object} mesesObj - Objeto donde agregar los impuestos por mes
 * @param {string} campo - Campo donde guardar el resultado (default: 'impuestos')
 */
function agregarImpuestosPuntualesPorMes(ingresos, mesesObj, campo = 'impuestos') {
    ingresos.forEach(i => {
        if (i.bruto && i.bruto !== i.monto) {
            const mes = i.fecha.slice(0, 7);
            const mesData = mesesObj.find(m => m.mes === mes);
            if (mesData) {
                mesData[campo] = (mesData[campo] || 0) + (i.bruto - i.monto);
            }
        }
    });
}

/**
 * Calcula impuestos de ingresos mensuales por mes
 * @param {Array} ingresos - Ingresos mensuales con bruto
 * @param {Array} meses - Array de meses
 * @param {Date} hastaDate - Fecha límite
 * @param {string} campo - Campo donde guardar el resultado (default: 'impuestos')
 */
function agregarImpuestosMensualesPorMes(ingresos, meses, hastaDate, campo = 'impuestos') {
    ingresos.forEach(i => {
        if (i.bruto && i.bruto !== i.monto) {
            meses.forEach(m => {
                if (esMensualActivo(m.mes, hastaDate, i.desde, i.hasta)) {
                    m[campo] = (m[campo] || 0) + (i.bruto - i.monto);
                }
            });
        }
    });
}

/**
 * Agrega transacciones puntuales a un array de meses
 * @param {Array} transacciones - Array de transacciones con fecha y monto
 * @param {Array} meses - Array de meses donde agregar
 * @param {string} campo - Campo donde sumar (default: 'total')
 */
function agregarPuntualesPorMes(transacciones, meses, campo = 'total') {
    transacciones.forEach(t => {
        const mes = t.fecha.slice(0, 7);
        const mesData = meses.find(m => m.mes === mes);
        if (mesData) {
            mesData[campo] = (mesData[campo] || 0) + t.monto;
        }
    });
}

/**
 * Agrega transacciones mensuales a un array de meses
 * @param {Array} transacciones - Array de transacciones con desde, hasta y monto
 * @param {Array} meses - Array de meses donde agregar
 * @param {Date} hastaDate - Fecha límite del período
 * @param {string} campo - Campo donde sumar (default: 'total')
 */
function agregarMensualesPorMes(transacciones, meses, hastaDate, campo = 'total') {
    transacciones.forEach(t => {
        meses.forEach(m => {
            if (esMensualActivo(m.mes, hastaDate, t.desde, t.hasta)) {
                m[campo] = (m[campo] || 0) + t.monto;
            }
        });
    });
}

module.exports = {
    calcularInteresGenerado,
    calcularInteresesMensuales,
    restarFecha,
    contarMesesDesde28,
    generarDescripcionRandom,
    generarArrayMeses,
    esMensualActivo,
    calcularImpuestosDesdeRruto,
    agregarImpuestosPuntualesPorMes,
    agregarImpuestosMensualesPorMes,
    agregarPuntualesPorMes,
    agregarMensualesPorMes
};
