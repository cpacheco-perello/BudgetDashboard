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

module.exports = {
    calcularInteresGenerado,
    calcularInteresesMensuales,
    restarFecha,
    contarMesesDesde28,
    generarDescripcionRandom
};
