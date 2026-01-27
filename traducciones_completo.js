// Archivo de traducciones - Simplificado y completado
const TRADUCCIONES = {
    es: {
        // ===== APP =====
        app: {
            titulo: 'Dashboard Económico',
            tituloPagina: 'Dashboard Económico',
            moneda: 'Moneda:'
        },

        // ===== TEMAS =====
        temas: {
            azul: 'Azul Profesional',
            verde: 'Verde Moderno',
            naranja: 'Naranja Energético',
            turquesa: 'Turquesa Fresco',
            purpura: 'Púrpura Moderno',
            rojo: 'Rojo Elegante',
            indigo: 'Índigo Suave',
            teal: 'Teal Profesional',
            gris: 'Gris Corporativo',
            rosado: 'Rosado Moderno',
            cian: 'Cian Vibrante',
            lima: 'Lima Fresco',
            esmeralda: 'Esmeralda Premium',
            ambar: 'Ámbar Dorado',
            violeta: 'Violeta Místico',
            fresa: 'Fresa Rosa',
            oceano: 'Océano Profundo',
            bosque: 'Bosque Verde',
            atardecer: 'Atardecer',
            medianoche: 'Medianoche Oscuro',
            neon: 'Neón Ciberpunk',
            mint: 'Mint Suave',
            coral: 'Coral Tropical',
            lavanda: 'Lavanda Elegante',
            grisminimal: 'Gris Minimalista',
            bronce: 'Bronce Vintage',
            cielo: 'Cielo Claro'
        },

        // ===== PERÍODOS =====
        periodos: {
            un_mes: '1 Mes',
            tres_meses: '3 Meses',
            seis_meses: '6 Meses',
            un_anio: '1 Año',
            cinco_anios: '5 Años',
            diez_anios: '10 Años'
        },

        // ===== RESUMEN =====
        resumen: {
            totalIngresos: 'Total Ingresos',
            totalGastos: 'Total Gastos',
            saldo: 'Saldo',
            totalImpuestos: 'Total Impuestos',
            impuestosPre: 'Pre',
            impuestosPost: 'Post',
            totalHucha: 'Total Hucha',
            portfolioRendimiento: 'Rendimiento Portfolio'
        },

        // ===== TEMA =====
        tema: {
            cambiarTema: '🎨 Tema:',
            seleccionar: 'Seleccionar tema',
            claro: 'Claro',
            oscuro: 'Oscuro',
            automático: 'Automático'
        },

        // ===== IDIOMA =====
        idioma: {
            seleccionar: '🌐 Idioma:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français',
            euskera: 'Euskara'
        },
        hucha: {
            concepto: 'Concepto',
            cantidad: 'Cantidad',
            placeholderConcepto: 'Concepto...',
            placeholderCantidad: '0.00'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Categorías',
            gastos: 'Gastos',
            ingresos: 'Ingresos',
            impuestos: 'Impuestos',
            dashboard: 'Dashboard',
            hucha: 'Hucha Real'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Resumen Financiero',
            periodoRapido: 'Período Rápido',
            desde: 'Desde',
            hasta: 'Hasta',
            desdeDate: 'Selecciona fecha de inicio',
            hastaDate: 'Selecciona fecha de fin',
            actualizar: 'Actualizar',
            totalPeriodo: 'Totales Período',
            gastosPorMes: 'Gastos por Mes',
            todasCategorias: 'Todas las categorías',
            ingresos: 'Ingresos',
            gastos: 'Gastos',
            ahorros: 'Ahorros',
            ingresosPorCategoria: 'Ingresos por Categoría',
            gastosPorCategoria: 'Gastos por Categoría',
            media: 'Media',
            varianza: 'Varianza',
            desviacion: 'Desviación',
            mediaMensualTotal: 'Media mensual total',
            impuestosCategoria: 'Impuestos',
            errorHastaMenorDesde: 'La fecha "hasta" no puede ser menor que "desde"',
            seleccionaRango: 'Por favor selecciona un rango de fechas',
            refrescarResumen: 'Refrescar resumen'
        },

        // ===== CATEGORÍAS =====
        categorias: {
            titulo: 'Administrar Categorías',
            gastos: 'Gastos',
            ingresos: 'Ingresos',
            categoriasGasto: 'Categorías de Gasto',
            categoriasIngreso: 'Categorías de Ingreso',
            nuevaCategoria: 'Nueva categoría...',
            noHayCategoriasGasto: 'No hay categorías de gasto',
            noHayCategoriasIngreso: 'No hay categorías de ingreso',
            categoriaAgregada: 'Categoría agregada correctamente',
            categoriaEliminada: 'Categoría eliminada correctamente',
            categoriaActualizada: 'Categoría actualizada correctamente',
            confirmarEliminar: '¿Eliminar categoría "{nombre}"?',
            errorActualizar: 'Error al actualizar la categoría',
            errorEliminar: 'Error al eliminar la categoría',
            errorAgregar: 'Error: {error}',
            errorConexion: 'Error de conexión: {error}',
            noPudoAgregar: 'No se pudo agregar la categoría'
        },

        // ===== GASTOS =====
        gastos: {
            titulo: 'Administrar Gastos',
            puntuales: 'Gastos Puntuales',
            mensuales: 'Gastos Mensuales',
            descripcion: 'Descripción...',
            desde: 'Desde',
            hasta: 'Hasta',
            monto: 'Monto',
            mostrarAntiguos: 'Mostrar antiguos',
            ocultarAntiguos: 'Ocultar antiguos',
            fraccionar: 'Fraccionar',
            noHayGastos: 'No hay gastos registrados',
            gastoAgregado: 'Gasto agregado correctamente',
            gastoEliminado: 'Gasto eliminado correctamente',
            gastoActualizado: 'Gasto actualizado correctamente',
            validarFecha: 'Por favor selecciona una fecha válida',
            validarMonto: 'Por favor ingresa un monto válido',
            validarCategoria: 'Por favor selecciona una categoría',
            noHayCambios: 'No hay cambios',
            descripcionRequerida: 'Descripción requerida',
            categoriaRequerida: 'Categoría requerida',
            montoInvalido: 'Monto inválido',
            fechaRequerida: 'Fecha requerida',
            formatoDesde: "El campo 'Desde' debe tener formato YYYY-MM",
            formatoHasta: "El campo 'Hasta' debe tener formato YYYY-MM",
            seleccionaFecha: 'Selecciona una fecha',
            ingresaDescripcion: 'Ingresa una descripción',
            seleccionaCategoria: 'Selecciona una categoría',
            confirmarEliminarPuntual: '¿Eliminar este gasto?',
            confirmarEliminarMensual: '¿Eliminar este gasto mensual?',
            parteFraccion: ' (parte {parte}/{total})'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Administrar Ingresos',
            puntuales: 'Ingresos Puntuales',
            mensuales: 'Ingresos Mensuales',
            cuenta_remunerada: 'Cuenta Remunerada',
            descripcion: 'Descripción...',
            desde: 'Desde',
            hasta: 'Hasta',
            bruto: 'Bruto',
            aportacionInicial: 'Aportación Inicial',
            aportacionMensual: 'Aportación Mensual',
            interes: 'Interés (%)',
            interesGenerado: 'Interés Generado',
            mostrarAntiguos: 'Mostrar antiguos',
            ocultarAntiguos: 'Ocultar antiguos',
            noHayIngresos: 'No hay ingresos registrados',
            ingresoAgregado: 'Ingreso agregado correctamente',
            ingresoEliminado: 'Ingreso eliminado correctamente',
            ingresoActualizado: 'Ingreso actualizado correctamente',
            validarFecha: 'Por favor selecciona una fecha válida',
            validarMonto: 'Por favor ingresa un monto válido',
            validarCategoria: 'Por favor selecciona una categoría',
            assets: 'Assets',
            noHayCambios: 'No hay cambios',
            descripcionRequerida: 'Descripción requerida',
            categoriaRequerida: 'Categoría requerida',
            montoInvalido: 'Monto inválido',
            fechaRequerida: 'Fecha requerida',
            formatoDesde: "El campo 'Desde' debe tener formato YYYY-MM",
            formatoHasta: "El campo 'Hasta' debe tener formato YYYY-MM",
            aportacionInvalida: 'Aportación mensual inválida',
            interesInvalido: 'Interés inválido',
            seleccionaFecha: 'Selecciona una fecha',
            ingresaDescripcion: 'Ingresa una descripción',
            seleccionaCategoria: 'Selecciona una categoría',
            ingresaDesde: "Ingresa el mes 'desde' en formato YYYY-MM",
            ingresaHasta: "Ingresa el mes 'hasta' en formato YYYY-MM",
            montoInicialInvalido: 'Monto inicial inválido',
            desdeNoMayorHasta: "El mes 'desde' no puede ser mayor que 'hasta'",
            ingresaNombreCompania: 'Ingresa el nombre de la compañía',
            ingresaTicker: 'Ingresa el ticker',
            accionesInvalidas: 'Número de acciones inválido',
            precioCompraInvalido: 'Precio de compra inválido',
            precioVentaInvalido: 'Por favor ingresa un precio de venta válido',
            confirmarVenta: '¿Confirmar venta de {shares} acciones de {company} a {price} por acción?',
            ventaExitosa: 'Venta exitosa. Ganancia registrada: {profit}',
            errorVenta: 'Error: {error}',
            errorProcesarVenta: 'Error al procesar la venta',
            eliminarAsset: '¿Eliminar este asset?',
            company: 'Compañía',
            ticker: 'Ticker',
            shares: 'Acciones',
            purchasePrice: 'Precio Compra',
            totalInvestment: 'Total Invertido',
            currentPrice: 'Precio Actual',
            currentValue: 'Valor Actual',
            diffPercent: 'Dif. %',
            diffAmount: 'Dif. €',
            sellAsset: 'Vender Asset',
            salePrice: 'Precio de Venta',
            saleValue: 'Valor Venta',
            profit: 'Ganancia/Pérdida',
            confirmSale: 'Confirmar Venta',
            placeholderDescripcion: 'Descripción...',
            placeholderMonto: '0.00',
            placeholderYYYYMM: 'YYYY-MM',
            placeholderCompany: 'Apple Inc.',
            placeholderTicker: 'AAPL',
            placeholderShares: '10',
            placeholderPrice: '150.00',
            placeholderInteres: '0.00',
            placeholderAportacion: '0.00',
            confirmarEliminarPuntual: '¿Eliminar este ingreso?',
            confirmarEliminarMensual: '¿Eliminar este ingreso mensual?',
            confirmarEliminarAportacion: '¿Eliminar esta aportación?',
            companyRequerido: 'Company requerido',
            tickerRequerido: 'Ticker requerido',
            numeroAccionesInvalido: 'Número de acciones inválido',
            precioCompraInvalidoAlt: 'Precio de compra inválido'
        },

        // ===== IMPUESTOS =====
        taxes: {
            agregarPuntual: 'Agregar Impuesto Puntual',
            agregarMensual: 'Agregar Impuesto Mensual',
            impuestoAgregado: 'Impuesto agregado correctamente',
            impuestoEliminado: 'Impuesto eliminado correctamente',
            impuestoActualizado: 'Impuesto actualizado correctamente',
            desde: 'Desde',
            hasta: 'Hasta',
            completaCampos: 'Completa todos los campos'
        },

        // ===== FORMULARIOS =====
        formularios: {
            guardar: 'Guardar',
            cancelar: 'Cancelar',
            editar: 'Editar',
            eliminar: 'Eliminar',
            agregar: 'Agregar',
            buscar: 'Buscar',
            nombre: 'Nombre',
            descripcion: 'Descripción',
            cantidad: 'Cantidad',
            monto: 'Monto',
            categoria: 'Categoría',
            fecha: 'Fecha',
            desde: 'Desde',
            hasta: 'Hasta',
            bruto: 'Bruto',
            interes: 'Interés',
            accion: 'Acción',
            acciones: 'Acciones',
            obligatorio: 'Campo obligatorio',
            confirmarEliminar: '¿Estás seguro de que deseas eliminar esto?',
            si: 'Sí',
            no: 'No',
            cerrar: 'Cerrar',
            aceptar: 'Aceptar',
            rechazar: 'Rechazar',
            placeholderDescripcion: 'Descripción...',
            placeholderMonto: '0.00',
            placeholderYYYYMM: 'YYYY-MM',
            placeholderNumeroPartes: 'Nº',
            formatoYYYYMM: 'Formato: YYYY-MM',
            numeroPartes: 'Número de partes'
        },

        // ===== BOTONES =====
        botones: {
            agregar: 'Agregar',
            actualizar: 'Actualizar',
            editar: 'Editar',
            eliminar: 'Eliminar',
            guardar: 'Guardar',
            cancelar: 'Cancelar'
        },

        // ===== TABS =====
        tabs: {
            puntuales: 'Puntuales',
            mensuales: 'Mensuales'
        },

        // ===== MENSAJES =====
        mensajes: {
            exito: 'Operación completada exitosamente',
            error: 'Ocurrió un error',
            cargando: 'Cargando...',
            noHayDatos: 'No hay datos disponibles',
            seleccionaRango: 'Selecciona un rango de fechas',
            categoriasCargadas: 'Categorías cargadas',
            dashboardActualizado: 'Dashboard actualizado',
            errorCargando: 'Error cargando datos',
            errorGuardando: 'Error guardando datos',
            errorEliminando: 'Error eliminando datos',
            validacionError: 'Por favor rellena todos los campos obligatorios',
            confirmacion: 'Confirmación requerida'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'Sin resultados',
            fecha: 'Fecha',
            descripcion: 'Descripción',
            monto: 'Monto',
            categoria: 'Categoría',
            acciones: 'Acciones',
            cargando: 'Cargando...',
            mostrandoRegistros: 'Mostrando {0} de {1} registros',
            siguiente: 'Siguiente',
            anterior: 'Anterior',
            primera: 'Primera',
            ultima: 'Última',
            porPagina: 'Registros por página'
        },

        // ===== ERRORES =====
        errores: {
            campoObligatorio: 'Este campo es obligatorio',
            formatoInvalido: 'Formato inválido',
            montoNegativo: 'El monto no puede ser negativo',
            fechaInvalida: 'Fecha inválida',
            seleccionaCategoria: 'Debes seleccionar una categoría',
            seleccionaFecha: 'Debes seleccionar una fecha',
            sinConexion: 'Error de conexión',
            tiempoAgotado: 'Tiempo de conexión agotado'
        },

        // ===== CONFIRMACIONES =====
        confirmaciones: {
            guardar: '¿Deseas guardar los cambios?',
            eliminar: '¿Estás seguro de que deseas eliminar este elemento?',
            cancelar: '¿Deseas cancelar esta operación?',
            salirSinGuardar: '¿Deseas salir sin guardar los cambios?'
        }
    },

    en: {
        // ===== APP =====
        app: {
            titulo: 'Economic Dashboard',
            tituloPagina: 'Economic Dashboard',
            moneda: 'Currency:'
        },

        // ===== TEMAS =====
        temas: {
            azul: 'Professional Blue',
            verde: 'Modern Green',
            naranja: 'Energetic Orange',
            turquesa: 'Fresh Turquoise',
            purpura: 'Modern Purple',
            rojo: 'Elegant Red',
            indigo: 'Soft Indigo',
            teal: 'Professional Teal',
            gris: 'Corporate Gray',
            rosado: 'Modern Pink',
            cian: 'Vibrant Cyan',
            lima: 'Fresh Lime',
            esmeralda: 'Premium Emerald',
            ambar: 'Golden Amber',
            violeta: 'Mystic Violet',
            fresa: 'Strawberry Pink',
            oceano: 'Deep Ocean',
            bosque: 'Forest Green',
            atardecer: 'Sunset',
            medianoche: 'Dark Midnight',
            neon: 'Cyberpunk Neon',
            mint: 'Soft Mint',
            coral: 'Tropical Coral',
            lavanda: 'Elegant Lavender',
            grisminimal: 'Minimalist Gray',
            bronce: 'Vintage Bronze',
            cielo: 'Clear Sky'
        },

        // ===== PERÍODOS =====
        periodos: {
            un_mes: '1 Month',
            tres_meses: '3 Months',
            seis_meses: '6 Months',
            un_anio: '1 Year',
            cinco_anios: '5 Years',
            diez_anios: '10 Years'
        },

        // ===== RESUMEN =====
        resumen: {
            totalIngresos: 'Total Income',
            totalGastos: 'Total Expenses',
            saldo: 'Balance',
            totalImpuestos: 'Total Taxes',
            impuestosPre: 'Pre',
            impuestosPost: 'Post',
            totalHucha: 'Total Piggy Bank',
            portfolioRendimiento: 'Portfolio Performance'
        },

        // ===== TEMA =====
        tema: {
            cambiarTema: '🎨 Theme:',
            seleccionar: 'Select theme',
            claro: 'Light',
            oscuro: 'Dark',
            automático: 'Auto'
        },

        // ===== IDIOMA =====
        idioma: {
            seleccionar: '🌐 Language:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français',
            euskera: 'Euskara'
        },
        hucha: {
            concepto: 'Concept',
            cantidad: 'Amount',
            placeholderConcepto: 'Concept...',
            placeholderCantidad: '0.00'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Categories',
            gastos: 'Expenses',
            ingresos: 'Income',
            impuestos: 'Taxes',
            dashboard: 'Dashboard',
            hucha: 'Real Piggy Bank'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Financial Summary',
            periodoRapido: 'Quick Period',
            desde: 'From',
            hasta: 'To',
            desdeDate: 'Select start date',
            hastaDate: 'Select end date',
            actualizar: 'Update',
            totalPeriodo: 'Period Totals',
            gastosPorMes: 'Expenses per Month',
            todasCategorias: 'All categories',
            ingresos: 'Income',
            gastos: 'Expenses',
            ahorros: 'Savings',
            ingresosPorCategoria: 'Income by Category',
            gastosPorCategoria: 'Expenses by Category',
            media: 'Average',
            varianza: 'Variance',
            desviacion: 'Deviation',
            mediaMensualTotal: 'Total monthly average',
            impuestosCategoria: 'Taxes',
            errorHastaMenorDesde: 'End date cannot be earlier than start date',
            seleccionaRango: 'Please select a date range',
            refrescarResumen: 'Refresh summary'
        },

        // ===== CATEGORÍAS =====
        categorias: {
            titulo: 'Manage Categories',
            gastos: 'Expenses',
            ingresos: 'Income',
            categoriasGasto: 'Expense Categories',
            categoriasIngreso: 'Income Categories',
            nuevaCategoria: 'New category...',
            noHayCategoriasGasto: 'No expense categories',
            noHayCategoriasIngreso: 'No income categories',
            categoriaAgregada: 'Category added successfully',
            categoriaEliminada: 'Category deleted successfully',
            categoriaActualizada: 'Category updated successfully',
            confirmarEliminar: 'Delete category "{nombre}"?',
            errorActualizar: 'Error updating category',
            errorEliminar: 'Error deleting category',
            errorAgregar: 'Error: {error}',
            errorConexion: 'Connection error: {error}',
            noPudoAgregar: 'Could not add category'
        },

        // ===== GASTOS =====
        gastos: {
            titulo: 'Manage Expenses',
            puntuales: 'One-time Expenses',
            mensuales: 'Monthly Expenses',
            descripcion: 'Description...',
            desde: 'From',
            hasta: 'To',
            monto: 'Amount',
            mostrarAntiguos: 'Show old',
            ocultarAntiguos: 'Hide old',
            fraccionar: 'Split',
            noHayGastos: 'No expenses recorded',
            gastoAgregado: 'Expense added successfully',
            gastoEliminado: 'Expense deleted successfully',
            gastoActualizado: 'Expense updated successfully',
            validarFecha: 'Please select a valid date',
            validarMonto: 'Please enter a valid amount',
            validarCategoria: 'Please select a category',
            noHayCambios: 'No changes',
            descripcionRequerida: 'Description required',
            categoriaRequerida: 'Category required',
            montoInvalido: 'Invalid amount',
            fechaRequerida: 'Date required',
            formatoDesde: "'From' field must be in YYYY-MM format",
            formatoHasta: "'To' field must be in YYYY-MM format",
            seleccionaFecha: 'Select a date',
            ingresaDescripcion: 'Enter a description',
            seleccionaCategoria: 'Select a category',
            confirmarEliminarPuntual: 'Delete this expense?',
            confirmarEliminarMensual: 'Delete this monthly expense?',
            parteFraccion: ' (part {parte}/{total})'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Manage Income',
            puntuales: 'One-time Income',
            mensuales: 'Monthly Income',
            cuenta_remunerada: 'Interest-bearing Account',
            descripcion: 'Description...',
            desde: 'From',
            hasta: 'To',
            bruto: 'Gross',
            aportacionInicial: 'Initial Contribution',
            aportacionMensual: 'Monthly Contribution',
            interes: 'Interest (%)',
            interesGenerado: 'Interest Generated',
            mostrarAntiguos: 'Show old',
            ocultarAntiguos: 'Hide old',
            noHayIngresos: 'No income recorded',
            ingresoAgregado: 'Income added successfully',
            ingresoEliminado: 'Income deleted successfully',
            ingresoActualizado: 'Income updated successfully',
            validarFecha: 'Please select a valid date',
            validarMonto: 'Please enter a valid amount',
            validarCategoria: 'Please select a category',
            assets: 'Assets',
            noHayCambios: 'No changes',
            descripcionRequerida: 'Description required',
            categoriaRequerida: 'Category required',
            montoInvalido: 'Invalid amount',
            fechaRequerida: 'Date required',
            formatoDesde: "'From' field must be in YYYY-MM format",
            formatoHasta: "'To' field must be in YYYY-MM format",
            aportacionInvalida: 'Invalid monthly contribution',
            interesInvalido: 'Invalid interest',
            seleccionaFecha: 'Select a date',
            ingresaDescripcion: 'Enter a description',
            seleccionaCategoria: 'Select a category',
            ingresaDesde: "Enter 'from' month in YYYY-MM format",
            ingresaHasta: "Enter 'to' month in YYYY-MM format",
            montoInicialInvalido: 'Invalid initial amount',
            desdeNoMayorHasta: "'From' month cannot be later than 'to'",
            ingresaNombreCompania: 'Enter company name',
            ingresaTicker: 'Enter ticker',
            accionesInvalidas: 'Invalid number of shares',
            precioCompraInvalido: 'Invalid purchase price',
            precioVentaInvalido: 'Please enter a valid sale price',
            confirmarVenta: 'Confirm sale of {shares} shares of {company} at {price} per share?',
            ventaExitosa: 'Sale successful. Profit recorded: {profit}',
            errorVenta: 'Error: {error}',
            errorProcesarVenta: 'Error processing sale',
            eliminarAsset: 'Delete this asset?',
            company: 'Company',
            ticker: 'Ticker',
            shares: 'Shares',
            purchasePrice: 'Purchase Price',
            totalInvestment: 'Total Invested',
            currentPrice: 'Current Price',
            currentValue: 'Current Value',
            diffPercent: 'Diff. %',
            diffAmount: 'Diff. €',
            sellAsset: 'Sell Asset',
            salePrice: 'Sale Price',
            saleValue: 'Sale Value',
            profit: 'Profit/Loss',
            confirmSale: 'Confirm Sale',
            placeholderDescripcion: 'Description...',
            placeholderMonto: '0.00',
            placeholderYYYYMM: 'YYYY-MM',
            placeholderCompany: 'Apple Inc.',
            placeholderTicker: 'AAPL',
            placeholderShares: '10',
            placeholderPrice: '150.00',
            placeholderInteres: '0.00',
            placeholderAportacion: '0.00',
            confirmarEliminarPuntual: 'Delete this income?',
            confirmarEliminarMensual: 'Delete this monthly income?',
            confirmarEliminarAportacion: 'Delete this contribution?',
            companyRequerido: 'Company required',
            tickerRequerido: 'Ticker required',
            numeroAccionesInvalido: 'Invalid number of shares',
            precioCompraInvalidoAlt: 'Invalid purchase price'
        },

        // ===== IMPUESTOS =====
        taxes: {
            agregarPuntual: 'Add One-time Tax',
            agregarMensual: 'Add Monthly Tax',
            impuestoAgregado: 'Tax added successfully',
            impuestoEliminado: 'Tax deleted successfully',
            impuestoActualizado: 'Tax updated successfully',
            desde: 'From',
            hasta: 'To',
            completaCampos: 'Complete all fields'
        },

        // ===== FORMULARIOS =====
        formularios: {
            guardar: 'Save',
            cancelar: 'Cancel',
            editar: 'Edit',
            eliminar: 'Delete',
            agregar: 'Add',
            buscar: 'Search',
            nombre: 'Name',
            descripcion: 'Description',
            cantidad: 'Quantity',
            monto: 'Amount',
            categoria: 'Category',
            fecha: 'Date',
            desde: 'From',
            hasta: 'To',
            bruto: 'Gross',
            interes: 'Interest',
            accion: 'Action',
            acciones: 'Actions',
            obligatorio: 'Required field',
            confirmarEliminar: 'Are you sure you want to delete this?',
            si: 'Yes',
            no: 'No',
            cerrar: 'Close',
            aceptar: 'Accept',
            rechazar: 'Reject',
            placeholderDescripcion: 'Description...',
            placeholderMonto: '0.00',
            placeholderYYYYMM: 'YYYY-MM',
            placeholderNumeroPartes: 'No.',
            formatoYYYYMM: 'Format: YYYY-MM',
            numeroPartes: 'Number of parts'
        },

        // ===== BOTONES =====
        botones: {
            agregar: 'Add',
            actualizar: 'Update',
            editar: 'Edit',
            eliminar: 'Delete',
            guardar: 'Save',
            cancelar: 'Cancel'
        },

        // ===== TABS =====
        tabs: {
            puntuales: 'One-time',
            mensuales: 'Monthly'
        },

        // ===== MENSAJES =====
        mensajes: {
            exito: 'Operation completed successfully',
            error: 'An error occurred',
            cargando: 'Loading...',
            noHayDatos: 'No data available',
            seleccionaRango: 'Select a date range',
            categoriasCargadas: 'Categories loaded',
            dashboardActualizado: 'Dashboard updated',
            errorCargando: 'Error loading data',
            errorGuardando: 'Error saving data',
            errorEliminando: 'Error deleting data',
            validacionError: 'Please fill in all required fields',
            confirmacion: 'Confirmation required'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'No results',
            fecha: 'Date',
            descripcion: 'Description',
            monto: 'Amount',
            categoria: 'Category',
            acciones: 'Actions',
            cargando: 'Loading...',
            mostrandoRegistros: 'Showing {0} of {1} records',
            siguiente: 'Next',
            anterior: 'Previous',
            primera: 'First',
            ultima: 'Last',
            porPagina: 'Records per page'
        },

        // ===== ERRORES =====
        errores: {
            campoObligatorio: 'This field is required',
            formatoInvalido: 'Invalid format',
            montoNegativo: 'Amount cannot be negative',
            fechaInvalida: 'Invalid date',
            seleccionaCategoria: 'You must select a category',
            seleccionaFecha: 'You must select a date',
            sinConexion: 'Connection error',
            tiempoAgotado: 'Connection timeout'
        },

        // ===== CONFIRMACIONES =====
        confirmaciones: {
            guardar: 'Do you want to save the changes?',
            eliminar: 'Are you sure you want to delete this item?',
            cancelar: 'Do you want to cancel this operation?',
            salirSinGuardar: 'Do you want to exit without saving changes?'
        }
    },

    pt: {
        // ===== APP =====
        app: {
            titulo: 'Painel Económico',
            tituloPagina: 'Painel Económico',
            moneda: 'Moeda:'
        },

        // ===== TEMAS =====
        temas: {
            azul: 'Azul Profissional',
            verde: 'Verde Moderno',
            naranja: 'Laranja Energético',
            turquesa: 'Turquesa Fresco',
            purpura: 'Roxo Moderno',
            rojo: 'Vermelho Elegante',
            indigo: 'Índigo Suave',
            teal: 'Azul-petróleo Profissional',
            gris: 'Cinza Corporativo',
            rosado: 'Rosa Moderno',
            cian: 'Ciano Vibrante',
            lima: 'Lima Fresco',
            esmeralda: 'Esmeralda Premium',
            ambar: 'Âmbar Dourado',
            violeta: 'Violeta Místico',
            fresa: 'Morango Rosa',
            oceano: 'Oceano Profundo',
            bosque: 'Floresta Verde',
            atardecer: 'Pôr do Sol',
            medianoche: 'Meia-noite Escura',
            neon: 'Neon Cyberpunk',
            mint: 'Menta Suave',
            coral: 'Coral Tropical',
            lavanda: 'Lavanda Elegante',
            grisminimal: 'Cinza Minimalista',
            bronce: 'Bronze Vintage',
            cielo: 'Céu Claro'
        },

        // ===== PERÍODOS =====
        periodos: {
            un_mes: '1 Mês',
            tres_meses: '3 Meses',
            seis_meses: '6 Meses',
            un_anio: '1 Ano',
            cinco_anios: '5 Anos',
            diez_anios: '10 Anos'
        },

        // ===== RESUMEN =====
        resumen: {
            totalIngresos: 'Total de Receitas',
            totalGastos: 'Total de Despesas',
            saldo: 'Saldo',
            totalImpuestos: 'Total de Impostos',
            impuestosPre: 'Pré',
            impuestosPost: 'Pós',
            totalHucha: 'Total Cofrinho',
            portfolioRendimiento: 'Desempenho do Portfólio'
        },

        // ===== TEMA =====
        tema: {
            cambiarTema: '🎨 Tema:',
            seleccionar: 'Selecionar tema',
            claro: 'Claro',
            oscuro: 'Escuro',
            automático: 'Auto'
        },

        // ===== IDIOMA =====
        idioma: {
            seleccionar: '🌐 Idioma:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français',
            euskera: 'Euskara'
        },
        hucha: {
            concepto: 'Conceito',
            cantidad: 'Quantidade',
            placeholderConcepto: 'Conceito...',
            placeholderCantidad: '0,00'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Categorias',
            gastos: 'Despesas',
            ingresos: 'Receitas',
            impuestos: 'Impostos',
            dashboard: 'Painel',
            hucha: 'Cofrinho Real'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Resumo Financeiro',
            periodoRapido: 'Período Rápido',
            desde: 'De',
            hasta: 'Até',
            desdeDate: 'Selecione a data de início',
            hastaDate: 'Selecione a data de fim',
            actualizar: 'Atualizar',
            totalPeriodo: 'Totais do Período',
            gastosPorMes: 'Despesas por Mês',
            todasCategorias: 'Todas as categorias',
            ingresos: 'Receitas',
            gastos: 'Despesas',
            ahorros: 'Poupanças',
            ingresosPorCategoria: 'Receitas por Categoria',
            gastosPorCategoria: 'Despesas por Categoria',
            media: 'Média',
            varianza: 'Variância',
            desviacion: 'Desvio',
            mediaMensualTotal: 'Média mensal total',
            impuestosCategoria: 'Impostos',
            errorHastaMenorDesde: 'A data "até" não pode ser anterior à "de"',
            seleccionaRango: 'Por favor selecione um intervalo de datas',
            refrescarResumen: 'Atualizar resumo'
        },

        // ===== CATEGORÍAS =====
        categorias: {
            titulo: 'Gerenciar Categorias',
            gastos: 'Despesas',
            ingresos: 'Receitas',
            categoriasGasto: 'Categorias de Despesa',
            categoriasIngreso: 'Categorias de Receita',
            nuevaCategoria: 'Nova categoria...',
            noHayCategoriasGasto: 'Sem categorias de despesa',
            noHayCategoriasIngreso: 'Sem categorias de receita',
            categoriaAgregada: 'Categoria adicionada com sucesso',
            categoriaEliminada: 'Categoria eliminada com sucesso',
            categoriaActualizada: 'Categoria atualizada com sucesso',
            confirmarEliminar: 'Eliminar categoria "{nombre}"?',
            errorActualizar: 'Erro ao atualizar a categoria',
            errorEliminar: 'Erro ao eliminar a categoria',
            errorAgregar: 'Erro: {error}',
            errorConexion: 'Erro de conexão: {error}',
            noPudoAgregar: 'Não foi possível adicionar a categoria'
        },

        // ===== GASTOS =====
        gastos: {
            titulo: 'Gerenciar Despesas',
            puntuales: 'Despesas Pontuais',
            mensuales: 'Despesas Mensais',
            descripcion: 'Descrição...',
            desde: 'De',
            hasta: 'Até',
            monto: 'Montante',
            mostrarAntiguos: 'Mostrar antigos',
            ocultarAntiguos: 'Ocultar antigos',
            fraccionar: 'Dividir',
            noHayGastos: 'Sem despesas registradas',
            gastoAgregado: 'Despesa adicionada com sucesso',
            gastoEliminado: 'Despesa eliminada com sucesso',
            gastoActualizado: 'Despesa atualizada com sucesso',
            validarFecha: 'Por favor selecione uma data válida',
            validarMonto: 'Por favor insira um montante válido',
            validarCategoria: 'Por favor selecione uma categoria',
            noHayCambios: 'Sem alterações',
            descripcionRequerida: 'Descrição obrigatória',
            categoriaRequerida: 'Categoria obrigatória',
            montoInvalido: 'Montante inválido',
            fechaRequerida: 'Data obrigatória',
            formatoDesde: "O campo 'De' deve ter formato AAAA-MM",
            formatoHasta: "O campo 'Até' deve ter formato AAAA-MM",
            seleccionaFecha: 'Selecione uma data',
            ingresaDescripcion: 'Insira uma descrição',
            seleccionaCategoria: 'Selecione uma categoria',
            confirmarEliminarPuntual: 'Eliminar esta despesa?',
            confirmarEliminarMensual: 'Eliminar esta despesa mensal?',
            parteFraccion: ' (parte {parte}/{total})'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Gerenciar Receitas',
            puntuales: 'Receitas Pontuais',
            mensuales: 'Receitas Mensais',
            cuenta_remunerada: 'Conta Remunerada',
            descripcion: 'Descrição...',
            desde: 'De',
            hasta: 'Até',
            bruto: 'Bruto',
            aportacionInicial: 'Contribuição Inicial',
            aportacionMensual: 'Contribuição Mensal',
            interes: 'Juros (%)',
            interesGenerado: 'Juros Gerados',
            mostrarAntiguos: 'Mostrar antigos',
            ocultarAntiguos: 'Ocultar antigos',
            noHayIngresos: 'Sem receitas registradas',
            ingresoAgregado: 'Receita adicionada com sucesso',
            ingresoEliminado: 'Receita eliminada com sucesso',
            ingresoActualizado: 'Receita atualizada com sucesso',
            validarFecha: 'Por favor selecione uma data válida',
            validarMonto: 'Por favor insira um montante válido',
            validarCategoria: 'Por favor selecione uma categoria',
            assets: 'Ativos',
            noHayCambios: 'Sem alterações',
            descripcionRequerida: 'Descrição obrigatória',
            categoriaRequerida: 'Categoria obrigatória',
            montoInvalido: 'Montante inválido',
            fechaRequerida: 'Data obrigatória',
            formatoDesde: "O campo 'De' deve ter formato AAAA-MM",
            formatoHasta: "O campo 'Até' deve ter formato AAAA-MM",
            aportacionInvalida: 'Contribuição mensal inválida',
            interesInvalido: 'Juros inválidos',
            seleccionaFecha: 'Selecione uma data',
            ingresaDescripcion: 'Insira uma descrição',
            seleccionaCategoria: 'Selecione uma categoria',
            ingresaDesde: "Insira o mês 'de' em formato AAAA-MM",
            ingresaHasta: "Insira o mês 'até' em formato AAAA-MM",
            montoInicialInvalido: 'Montante inicial inválido',
            desdeNoMayorHasta: "O mês 'de' não pode ser posterior a 'até'",
            ingresaNombreCompania: 'Insira o nome da empresa',
            ingresaTicker: 'Insira o ticker',
            accionesInvalidas: 'Número de ações inválido',
            precioCompraInvalido: 'Preço de compra inválido',
            precioVentaInvalido: 'Por favor insira um preço de venda válido',
            confirmarVenta: 'Confirmar venda de {shares} ações de {company} a {price} por ação?',
            ventaExitosa: 'Venda bem-sucedida. Lucro registrado: {profit}',
            errorVenta: 'Erro: {error}',
            errorProcesarVenta: 'Erro ao processar a venda',
            eliminarAsset: 'Eliminar este ativo?',
            company: 'Empresa',
            ticker: 'Ticker',
            shares: 'Ações',
            purchasePrice: 'Preço de Compra',
            totalInvestment: 'Total Investido',
            currentPrice: 'Preço Atual',
            currentValue: 'Valor Atual',
            diffPercent: 'Dif. %',
            diffAmount: 'Dif. €',
            sellAsset: 'Vender Ativo',
            salePrice: 'Preço de Venda',
            saleValue: 'Valor de Venda',
            profit: 'Lucro/Perda',
            confirmSale: 'Confirmar Venda',
            placeholderDescripcion: 'Descrição...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'AAAA-MM',
            placeholderCompany: 'Apple Inc.',
            placeholderTicker: 'AAPL',
            placeholderShares: '10',
            placeholderPrice: '150,00',
            placeholderInteres: '0,00',
            placeholderAportacion: '0,00',
            confirmarEliminarPuntual: 'Eliminar esta receita?',
            confirmarEliminarMensual: 'Eliminar esta receita mensal?',
            confirmarEliminarAportacion: 'Eliminar esta contribuição?',
            companyRequerido: 'Empresa obrigatória',
            tickerRequerido: 'Ticker obrigatório',
            numeroAccionesInvalido: 'Número de ações inválido',
            precioCompraInvalidoAlt: 'Preço de compra inválido'
        },

        // ===== IMPUESTOS =====
        taxes: {
            agregarPuntual: 'Adicionar Imposto Pontual',
            agregarMensual: 'Adicionar Imposto Mensal',
            impuestoAgregado: 'Imposto adicionado com sucesso',
            impuestoEliminado: 'Imposto eliminado com sucesso',
            impuestoActualizado: 'Imposto atualizado com sucesso',
            desde: 'De',
            hasta: 'Até',
            completaCampos: 'Complete todos os campos'
        },

        // ===== FORMULARIOS =====
        formularios: {
            guardar: 'Guardar',
            cancelar: 'Cancelar',
            editar: 'Editar',
            eliminar: 'Eliminar',
            agregar: 'Adicionar',
            buscar: 'Procurar',
            nombre: 'Nome',
            descripcion: 'Descrição',
            cantidad: 'Quantidade',
            monto: 'Montante',
            categoria: 'Categoria',
            fecha: 'Data',
            desde: 'De',
            hasta: 'Até',
            bruto: 'Bruto',
            interes: 'Juros',
            accion: 'Ação',
            acciones: 'Ações',
            obligatorio: 'Campo obrigatório',
            confirmarEliminar: 'Tem certeza de que deseja eliminar isto?',
            si: 'Sim',
            no: 'Não',
            cerrar: 'Fechar',
            aceptar: 'Aceitar',
            rechazar: 'Rejeitar',
            placeholderDescripcion: 'Descrição...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'AAAA-MM',
            placeholderNumeroPartes: 'Nº',
            formatoYYYYMM: 'Formato: AAAA-MM',
            numeroPartes: 'Número de partes'
        },

        // ===== BOTONES =====
        botones: {
            agregar: 'Adicionar',
            actualizar: 'Atualizar',
            editar: 'Editar',
            eliminar: 'Eliminar',
            guardar: 'Guardar',
            cancelar: 'Cancelar'
        },

        // ===== TABS =====
        tabs: {
            puntuales: 'Pontuais',
            mensuales: 'Mensais'
        },

        // ===== MENSAJES =====
        mensajes: {
            exito: 'Operação concluída com sucesso',
            error: 'Ocorreu um erro',
            cargando: 'Carregando...',
            noHayDatos: 'Sem dados disponíveis',
            seleccionaRango: 'Selecione um intervalo de datas',
            categoriasCargadas: 'Categorias carregadas',
            dashboardActualizado: 'Painel atualizado',
            errorCargando: 'Erro ao carregar dados',
            errorGuardando: 'Erro ao guardar dados',
            errorEliminando: 'Erro ao eliminar dados',
            validacionError: 'Por favor preencha todos os campos obrigatórios',
            confirmacion: 'Confirmação necessária'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'Sem resultados',
            fecha: 'Data',
            descripcion: 'Descrição',
            monto: 'Montante',
            categoria: 'Categoria',
            acciones: 'Ações',
            cargando: 'Carregando...',
            mostrandoRegistros: 'Mostrando {0} de {1} registros',
            siguiente: 'Próximo',
            anterior: 'Anterior',
            primera: 'Primeiro',
            ultima: 'Último',
            porPagina: 'Registros por página'
        },

        // ===== ERRORES =====
        errores: {
            campoObligatorio: 'Este campo é obrigatório',
            formatoInvalido: 'Formato inválido',
            montoNegativo: 'O montante não pode ser negativo',
            fechaInvalida: 'Data inválida',
            seleccionaCategoria: 'Deve selecionar uma categoria',
            seleccionaFecha: 'Deve selecionar uma data',
            sinConexion: 'Erro de conexão',
            tiempoAgotado: 'Tempo de conexão esgotado'
        },

        // ===== CONFIRMACIONES =====
        confirmaciones: {
            guardar: 'Deseja guardar as alterações?',
            eliminar: 'Tem certeza de que deseja eliminar este item?',
            cancelar: 'Deseja cancelar esta operação?',
            salirSinGuardar: 'Deseja sair sem guardar as alterações?'
        }
    },

    fr: {
        // ===== APP =====
        app: {
            titulo: 'Tableau de Bord Économique',
            tituloPagina: 'Tableau de Bord Économique',
            moneda: 'Devise:'
        },

        // ===== TEMAS =====
        temas: {
            azul: 'Bleu Professionnel',
            verde: 'Vert Moderne',
            naranja: 'Orange Énergétique',
            turquesa: 'Turquoise Frais',
            purpura: 'Violet Moderne',
            rojo: 'Rouge Élégant',
            indigo: 'Indigo Doux',
            teal: 'Sarcelle Professionnel',
            gris: 'Gris Corporatif',
            rosado: 'Rose Moderne',
            cian: 'Cyan Vibrant',
            lima: 'Citron Vert Frais',
            esmeralda: 'Émeraude Premium',
            ambar: 'Ambre Doré',
            violeta: 'Violet Mystique',
            fresa: 'Fraise Rose',
            oceano: 'Océan Profond',
            bosque: 'Forêt Verte',
            atardecer: 'Coucher de Soleil',
            medianoche: 'Minuit Sombre',
            neon: 'Néon Cyberpunk',
            mint: 'Menthe Douce',
            coral: 'Corail Tropical',
            lavanda: 'Lavande Élégante',
            grisminimal: 'Gris Minimaliste',
            bronce: 'Bronze Vintage',
            cielo: 'Ciel Clair'
        },

        // ===== PERÍODOS =====
        periodos: {
            un_mes: '1 Mois',
            tres_meses: '3 Mois',
            seis_meses: '6 Mois',
            un_anio: '1 An',
            cinco_anios: '5 Ans',
            diez_anios: '10 Ans'
        },

        // ===== RESUMEN =====
        resumen: {
            totalIngresos: 'Total des Revenus',
            totalGastos: 'Total des Dépenses',
            saldo: 'Solde',
            totalImpuestos: 'Total des Impôts',
            impuestosPre: 'Pré',
            impuestosPost: 'Post',
            totalHucha: 'Total Tirelire',
            portfolioRendimiento: 'Performance du Portefeuille'
        },

        // ===== TEMA =====
        tema: {
            cambiarTema: '🎨 Thème:',
            seleccionar: 'Sélectionner le thème',
            claro: 'Clair',
            oscuro: 'Sombre',
            automático: 'Auto'
        },

        // ===== IDIOMA =====
        idioma: {
            seleccionar: '🌐 Langue:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français',
            euskera: 'Euskara'
        },
        hucha: {
            concepto: 'Concept',
            cantidad: 'Montant',
            placeholderConcepto: 'Concept...',
            placeholderCantidad: '0,00'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Catégories',
            gastos: 'Dépenses',
            ingresos: 'Revenus',
            impuestos: 'Impôts',
            dashboard: 'Tableau de Bord',
            hucha: 'Vraie Tirelire'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Résumé Financier',
            periodoRapido: 'Période Rapide',
            desde: 'De',
            hasta: 'À',
            desdeDate: 'Sélectionnez la date de début',
            hastaDate: 'Sélectionnez la date de fin',
            actualizar: 'Actualiser',
            totalPeriodo: 'Totaux de la Période',
            gastosPorMes: 'Dépenses par Mois',
            todasCategorias: 'Toutes les catégories',
            ingresos: 'Revenus',
            gastos: 'Dépenses',
            ahorros: 'Économies',
            ingresosPorCategoria: 'Revenus par Catégorie',
            gastosPorCategoria: 'Dépenses par Catégorie',
            media: 'Moyenne',
            varianza: 'Variance',
            desviacion: 'Écart',
            mediaMensualTotal: 'Moyenne mensuelle totale',
            impuestosCategoria: 'Impôts',
            errorHastaMenorDesde: 'La date "à" ne peut pas être antérieure à "de"',
            seleccionaRango: 'Veuillez sélectionner une plage de dates',
            refrescarResumen: 'Actualiser le résumé'
        },

        // ===== CATEGORÍAS =====
        categorias: {
            titulo: 'Gérer les Catégories',
            gastos: 'Dépenses',
            ingresos: 'Revenus',
            categoriasGasto: 'Catégories de Dépenses',
            categoriasIngreso: 'Catégories de Revenus',
            nuevaCategoria: 'Nouvelle catégorie...',
            noHayCategoriasGasto: 'Aucune catégorie de dépenses',
            noHayCategoriasIngreso: 'Aucune catégorie de revenus',
            categoriaAgregada: 'Catégorie ajoutée avec succès',
            categoriaEliminada: 'Catégorie supprimée avec succès',
            categoriaActualizada: 'Catégorie mise à jour avec succès',
            confirmarEliminar: 'Supprimer la catégorie "{nombre}"?',
            errorActualizar: 'Erreur lors de la mise à jour de la catégorie',
            errorEliminar: 'Erreur lors de la suppression de la catégorie',
            errorAgregar: 'Erreur: {error}',
            errorConexion: 'Erreur de connexion: {error}',
            noPudoAgregar: 'Impossible d\'ajouter la catégorie'
        },

        // ===== GASTOS =====
        gastos: {
            titulo: 'Gérer les Dépenses',
            puntuales: 'Dépenses Ponctuelles',
            mensuales: 'Dépenses Mensuelles',
            descripcion: 'Description...',
            desde: 'De',
            hasta: 'À',
            monto: 'Montant',
            mostrarAntiguos: 'Afficher anciens',
            ocultarAntiguos: 'Masquer anciens',
            fraccionar: 'Diviser',
            noHayGastos: 'Aucune dépense enregistrée',
            gastoAgregado: 'Dépense ajoutée avec succès',
            gastoEliminado: 'Dépense supprimée avec succès',
            gastoActualizado: 'Dépense mise à jour avec succès',
            validarFecha: 'Veuillez sélectionner une date valide',
            validarMonto: 'Veuillez saisir un montant valide',
            validarCategoria: 'Veuillez sélectionner une catégorie',
            noHayCambios: 'Aucun changement',
            descripcionRequerida: 'Description requise',
            categoriaRequerida: 'Catégorie requise',
            montoInvalido: 'Montant invalide',
            fechaRequerida: 'Date requise',
            formatoDesde: "Le champ 'De' doit être au format AAAA-MM",
            formatoHasta: "Le champ 'À' doit être au format AAAA-MM",
            seleccionaFecha: 'Sélectionnez une date',
            ingresaDescripcion: 'Saisissez une description',
            seleccionaCategoria: 'Sélectionnez une catégorie',
            confirmarEliminarPuntual: 'Supprimer cette dépense?',
            confirmarEliminarMensual: 'Supprimer cette dépense mensuelle?',
            parteFraccion: ' (partie {parte}/{total})'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Gérer les Revenus',
            puntuales: 'Revenus Ponctuels',
            mensuales: 'Revenus Mensuels',
            cuenta_remunerada: 'Compte Rémunéré',
            descripcion: 'Description...',
            desde: 'De',
            hasta: 'À',
            bruto: 'Brut',
            aportacionInicial: 'Contribution Initiale',
            aportacionMensual: 'Contribution Mensuelle',
            interes: 'Intérêt (%)',
            interesGenerado: 'Intérêt Généré',
            mostrarAntiguos: 'Afficher anciens',
            ocultarAntiguos: 'Masquer anciens',
            noHayIngresos: 'Aucun revenu enregistré',
            ingresoAgregado: 'Revenu ajouté avec succès',
            ingresoEliminado: 'Revenu supprimé avec succès',
            ingresoActualizado: 'Revenu mis à jour avec succès',
            validarFecha: 'Veuillez sélectionner une date valide',
            validarMonto: 'Veuillez saisir un montant valide',
            validarCategoria: 'Veuillez sélectionner une catégorie',
            assets: 'Actifs',
            noHayCambios: 'Aucun changement',
            descripcionRequerida: 'Description requise',
            categoriaRequerida: 'Catégorie requise',
            montoInvalido: 'Montant invalide',
            fechaRequerida: 'Date requise',
            formatoDesde: "Le champ 'De' doit être au format AAAA-MM",
            formatoHasta: "Le champ 'À' doit être au format AAAA-MM",
            aportacionInvalida: 'Contribution mensuelle invalide',
            interesInvalido: 'Intérêt invalide',
            seleccionaFecha: 'Sélectionnez une date',
            ingresaDescripcion: 'Saisissez une description',
            seleccionaCategoria: 'Sélectionnez une catégorie',
            ingresaDesde: "Saisissez le mois 'de' au format AAAA-MM",
            ingresaHasta: "Saisissez le mois 'à' au format AAAA-MM",
            montoInicialInvalido: 'Montant initial invalide',
            desdeNoMayorHasta: "Le mois 'de' ne peut pas être postérieur à 'à'",
            ingresaNombreCompania: 'Saisissez le nom de l\'entreprise',
            ingresaTicker: 'Saisissez le ticker',
            accionesInvalidas: 'Nombre d\'actions invalide',
            precioCompraInvalido: 'Prix d\'achat invalide',
            precioVentaInvalido: 'Veuillez saisir un prix de vente valide',
            confirmarVenta: 'Confirmer la vente de {shares} actions de {company} à {price} par action?',
            ventaExitosa: 'Vente réussie. Profit enregistré: {profit}',
            errorVenta: 'Erreur: {error}',
            errorProcesarVenta: 'Erreur lors du traitement de la vente',
            eliminarAsset: 'Supprimer cet actif?',
            company: 'Entreprise',
            ticker: 'Ticker',
            shares: 'Actions',
            purchasePrice: 'Prix d\'Achat',
            totalInvestment: 'Total Investi',
            currentPrice: 'Prix Actuel',
            currentValue: 'Valeur Actuelle',
            diffPercent: 'Diff. %',
            diffAmount: 'Diff. €',
            sellAsset: 'Vendre Actif',
            salePrice: 'Prix de Vente',
            saleValue: 'Valeur de Vente',
            profit: 'Profit/Perte',
            confirmSale: 'Confirmer la Vente',
            placeholderDescripcion: 'Description...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'AAAA-MM',
            placeholderCompany: 'Apple Inc.',
            placeholderTicker: 'AAPL',
            placeholderShares: '10',
            placeholderPrice: '150,00',
            placeholderInteres: '0,00',
            placeholderAportacion: '0,00',
            confirmarEliminarPuntual: 'Supprimer ce revenu?',
            confirmarEliminarMensual: 'Supprimer ce revenu mensuel?',
            confirmarEliminarAportacion: 'Supprimer cette contribution?',
            companyRequerido: 'Entreprise requise',
            tickerRequerido: 'Ticker requis',
            numeroAccionesInvalido: 'Nombre d\'actions invalide',
            precioCompraInvalidoAlt: 'Prix d\'achat invalide'
        },

        // ===== IMPUESTOS =====
        taxes: {
            agregarPuntual: 'Ajouter Impôt Ponctuel',
            agregarMensual: 'Ajouter Impôt Mensuel',
            impuestoAgregado: 'Impôt ajouté avec succès',
            impuestoEliminado: 'Impôt supprimé avec succès',
            impuestoActualizado: 'Impôt mis à jour avec succès',
            desde: 'De',
            hasta: 'À',
            completaCampos: 'Complétez tous les champs'
        },

        // ===== FORMULARIOS =====
        formularios: {
            guardar: 'Enregistrer',
            cancelar: 'Annuler',
            editar: 'Modifier',
            eliminar: 'Supprimer',
            agregar: 'Ajouter',
            buscar: 'Rechercher',
            nombre: 'Nom',
            descripcion: 'Description',
            cantidad: 'Quantité',
            monto: 'Montant',
            categoria: 'Catégorie',
            fecha: 'Date',
            desde: 'De',
            hasta: 'À',
            bruto: 'Brut',
            interes: 'Intérêt',
            accion: 'Action',
            acciones: 'Actions',
            obligatorio: 'Champ obligatoire',
            confirmarEliminar: 'Êtes-vous sûr de vouloir supprimer ceci?',
            si: 'Oui',
            no: 'Non',
            cerrar: 'Fermer',
            aceptar: 'Accepter',
            rechazar: 'Rejeter',
            placeholderDescripcion: 'Description...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'AAAA-MM',
            placeholderNumeroPartes: 'N°',
            formatoYYYYMM: 'Format: AAAA-MM',
            numeroPartes: 'Nombre de parties'
        },

        // ===== BOTONES =====
        botones: {
            agregar: 'Ajouter',
            actualizar: 'Actualiser',
            editar: 'Modifier',
            eliminar: 'Supprimer',
            guardar: 'Enregistrer',
            cancelar: 'Annuler'
        },

        // ===== TABS =====
        tabs: {
            puntuales: 'Ponctuels',
            mensuales: 'Mensuels'
        },

        // ===== MENSAJES =====
        mensajes: {
            exito: 'Opération terminée avec succès',
            error: 'Une erreur s\'est produite',
            cargando: 'Chargement...',
            noHayDatos: 'Aucune donnée disponible',
            seleccionaRango: 'Sélectionnez une plage de dates',
            categoriasCargadas: 'Catégories chargées',
            dashboardActualizado: 'Tableau de bord mis à jour',
            errorCargando: 'Erreur lors du chargement des données',
            errorGuardando: 'Erreur lors de l\'enregistrement des données',
            errorEliminando: 'Erreur lors de la suppression des données',
            validacionError: 'Veuillez remplir tous les champs obligatoires',
            confirmacion: 'Confirmation requise'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'Aucun résultat',
            fecha: 'Date',
            descripcion: 'Description',
            monto: 'Montant',
            categoria: 'Catégorie',
            acciones: 'Actions',
            cargando: 'Chargement...',
            mostrandoRegistros: 'Affichage de {0} sur {1} enregistrements',
            siguiente: 'Suivant',
            anterior: 'Précédent',
            primera: 'Premier',
            ultima: 'Dernier',
            porPagina: 'Enregistrements par page'
        },

        // ===== ERRORES =====
        errores: {
            campoObligatorio: 'Ce champ est obligatoire',
            formatoInvalido: 'Format invalide',
            montoNegativo: 'Le montant ne peut pas être négatif',
            fechaInvalida: 'Date invalide',
            seleccionaCategoria: 'Vous devez sélectionner une catégorie',
            seleccionaFecha: 'Vous devez sélectionner une date',
            sinConexion: 'Erreur de connexion',
            tiempoAgotado: 'Délai de connexion dépassé'
        },

        // ===== CONFIRMACIONES =====
        confirmaciones: {
            guardar: 'Voulez-vous enregistrer les modifications?',
            eliminar: 'Êtes-vous sûr de vouloir supprimer cet élément?',
            cancelar: 'Voulez-vous annuler cette opération?',
            salirSinGuardar: 'Voulez-vous quitter sans enregistrer les modifications?'
        }
    },

    eu: {
        // ===== APP =====
        app: {
            titulo: 'Ekonomia Panela',
            tituloPagina: 'Ekonomia Panela',
            moneda: 'Moneta:'
        },

        // ===== TEMAS =====
        temas: {
            azul: 'Urdin Profesionala',
            verde: 'Berde Modernoa',
            naranja: 'Laranja Energetikoa',
            turquesa: 'Turkesa Freskoa',
            purpura: 'More Modernoa',
            rojo: 'Gorri Dotorea',
            indigo: 'Indigo Leuna',
            teal: 'Teal Profesionala',
            gris: 'Gris Korporatiboa',
            rosado: 'Arrosa Modernoa',
            cian: 'Zian Bizia',
            lima: 'Lima Freskoa',
            esmeralda: 'Esmeralda Premium',
            ambar: 'Anbar Urrezkoa',
            violeta: 'Bioleta Mistikoa',
            fresa: 'Marrubi Arrosa',
            oceano: 'Ozeano Sakona',
            bosque: 'Oihan Berdea',
            atardecer: 'Ilunabarra',
            medianoche: 'Gauerdi Iluna',
            neon: 'Neon Cyberpunk',
            mint: 'Menta Leuna',
            coral: 'Koral Tropikala',
            lavanda: 'Labanda Dotorea',
            grisminimal: 'Gris Minimalista',
            bronce: 'Brontze Vintage',
            cielo: 'Zeru Garbia'
        },

        // ===== PERÍODOS =====
        periodos: {
            un_mes: '1 Hilabete',
            tres_meses: '3 Hilabete',
            seis_meses: '6 Hilabete',
            un_anio: '1 Urte',
            cinco_anios: '5 Urte',
            diez_anios: '10 Urte'
        },

        // ===== RESUMEN =====
        resumen: {
            totalIngresos: 'Diru-sarrera Osoa',
            totalGastos: 'Gastu Osoa',
            saldo: 'Saldoa',
            totalImpuestos: 'Zerga Osoa',
            impuestosPre: 'Aurre',
            impuestosPost: 'Ondo',
            totalHucha: 'Kutxa Osoa',
            portfolioRendimiento: 'Portafolio Errendimendua'
        },

        // ===== TEMA =====
        tema: {
            cambiarTema: '🎨 Gaia:',
            seleccionar: 'Gaia hautatu',
            claro: 'Argia',
            oscuro: 'Iluna',
            automático: 'Auto'
        },

        // ===== IDIOMA =====
        idioma: {
            seleccionar: '🌐 Hizkuntza:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français',
            euskera: 'Euskara'
        },
        hucha: {
            concepto: 'Kontzeptua',
            cantidad: 'Kopurua',
            placeholderConcepto: 'Kontzeptua...',
            placeholderCantidad: '0,00'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Kategoriak',
            gastos: 'Gastuak',
            ingresos: 'Diru-sarrerak',
            impuestos: 'Zergak',
            dashboard: 'Panela',
            hucha: 'Benetako Kutxa'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Finantza Laburpena',
            periodoRapido: 'Aldia Azkarra',
            desde: 'Noiztik',
            hasta: 'Noizera',
            desdeDate: 'Hasiera data hautatu',
            hastaDate: 'Amaiera data hautatu',
            actualizar: 'Eguneratu',
            totalPeriodo: 'Aldiaren Guztira',
            gastosPorMes: 'Hilabeteko Gastuak',
            todasCategorias: 'Kategoria guztiak',
            ingresos: 'Diru-sarrerak',
            gastos: 'Gastuak',
            ahorros: 'Aurrezkiak',
            ingresosPorCategoria: 'Diru-sarrerak Kategoriaz',
            gastosPorCategoria: 'Gastuak Kategoriaz',
            media: 'Batezbestekoa',
            varianza: 'Bariantza',
            desviacion: 'Desbideratzea',
            mediaMensualTotal: 'Hileroko batezbesteko guztira',
            impuestosCategoria: 'Zergak',
            errorHastaMenorDesde: '"Noizera" data ezin da "noiztik" baino lehenagokoa izan',
            seleccionaRango: 'Mesedez hautatu data tartea',
            refrescarResumen: 'Laburpena freskatu'
        },

        // ===== CATEGORÍAS =====
        categorias: {
            titulo: 'Kategoriak Kudeatu',
            gastos: 'Gastuak',
            ingresos: 'Diru-sarrerak',
            categoriasGasto: 'Gastu Kategoriak',
            categoriasIngreso: 'Diru-sarrera Kategoriak',
            nuevaCategoria: 'Kategoria berria...',
            noHayCategoriasGasto: 'Ez dago gastu kategoriarik',
            noHayCategoriasIngreso: 'Ez dago diru-sarrera kategoriarik',
            categoriaAgregada: 'Kategoria gehitu da',
            categoriaEliminada: 'Kategoria ezabatu da',
            categoriaActualizada: 'Kategoria eguneratu da',
            confirmarEliminar: '"{nombre}" kategoria ezabatu?',
            errorActualizar: 'Errorea kategoria eguneratzean',
            errorEliminar: 'Errorea kategoria ezabatzean',
            errorAgregar: 'Errorea: {error}',
            errorConexion: 'Konexio errorea: {error}',
            noPudoAgregar: 'Ezin izan da kategoria gehitu'
        },

        // ===== GASTOS =====
        gastos: {
            titulo: 'Gastuak Kudeatu',
            puntuales: 'Gastu Puntuala',
            mensuales: 'Hileroko Gastuak',
            descripcion: 'Deskribapena...',
            desde: 'Noiztik',
            hasta: 'Noizera',
            monto: 'Zenbatekoa',
            mostrarAntiguos: 'Zaharrak erakutsi',
            ocultarAntiguos: 'Zaharrak ezkutatu',
            fraccionar: 'Zatitu',
            noHayGastos: 'Ez dago gasturik erregistraturik',
            gastoAgregado: 'Gastua gehitu da',
            gastoEliminado: 'Gastua ezabatu da',
            gastoActualizado: 'Gastua eguneratu da',
            validarFecha: 'Mesedez hautatu baliozko data',
            validarMonto: 'Mesedez sartu baliozko zenbatekoa',
            validarCategoria: 'Mesedez hautatu kategoria',
            noHayCambios: 'Ez dago aldaketarik',
            descripcionRequerida: 'Deskribapena beharrezkoa',
            categoriaRequerida: 'Kategoria beharrezkoa',
            montoInvalido: 'Zenbateko baliogabea',
            fechaRequerida: 'Data beharrezkoa',
            formatoDesde: "'Noiztik' eremuak UUUU-HH formatua izan behar du",
            formatoHasta: "'Noizera' eremuak UUUU-HH formatua izan behar du",
            seleccionaFecha: 'Data hautatu',
            ingresaDescripcion: 'Deskribapena sartu',
            seleccionaCategoria: 'Kategoria hautatu',
            confirmarEliminarPuntual: 'Gastu hau ezabatu?',
            confirmarEliminarMensual: 'Hileroko gastu hau ezabatu?',
            parteFraccion: ' (zatia {parte}/{total})'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Diru-sarrerak Kudeatu',
            puntuales: 'Diru-sarrera Puntuala',
            mensuales: 'Hileroko Diru-sarrerak',
            cuenta_remunerada: 'Kontu Ordaindua',
            descripcion: 'Deskribapena...',
            desde: 'Noiztik',
            hasta: 'Noizera',
            bruto: 'Gordina',
            aportacionInicial: 'Hasierako Ekarpena',
            aportacionMensual: 'Hileroko Ekarpena',
            interes: 'Interesa (%)',
            interesGenerado: 'Sortutako Interesa',
            mostrarAntiguos: 'Zaharrak erakutsi',
            ocultarAntiguos: 'Zaharrak ezkutatu',
            noHayIngresos: 'Ez dago diru-sarrerarik erregistraturik',
            ingresoAgregado: 'Diru-sarrera gehitu da',
            ingresoEliminado: 'Diru-sarrera ezabatu da',
            ingresoActualizado: 'Diru-sarrera eguneratu da',
            validarFecha: 'Mesedez hautatu baliozko data',
            validarMonto: 'Mesedez sartu baliozko zenbatekoa',
            validarCategoria: 'Mesedez hautatu kategoria',
            assets: 'Aktiboak',
            noHayCambios: 'Ez dago aldaketarik',
            descripcionRequerida: 'Deskribapena beharrezkoa',
            categoriaRequerida: 'Kategoria beharrezkoa',
            montoInvalido: 'Zenbateko baliogabea',
            fechaRequerida: 'Data beharrezkoa',
            formatoDesde: "'Noiztik' eremuak UUUU-HH formatua izan behar du",
            formatoHasta: "'Noizera' eremuak UUUU-HH formatua izan behar du",
            aportacionInvalida: 'Hileroko ekarpen baliogabea',
            interesInvalido: 'Interes baliogabea',
            seleccionaFecha: 'Data hautatu',
            ingresaDescripcion: 'Deskribapena sartu',
            seleccionaCategoria: 'Kategoria hautatu',
            ingresaDesde: "Sartu 'noiztik' hilabetea UUUU-HH formatuan",
            ingresaHasta: "Sartu 'noizera' hilabetea UUUU-HH formatuan",
            montoInicialInvalido: 'Hasierako zenbateko baliogabea',
            desdeNoMayorHasta: "'Noiztik' hilabetea ezin da 'noizera' baino beranduagokoa izan",
            ingresaNombreCompania: 'Enpresaren izena sartu',
            ingresaTicker: 'Ticker-a sartu',
            accionesInvalidas: 'Akzio kopuru baliogabea',
            precioCompraInvalido: 'Erosketa prezioa baliogabea',
            precioVentaInvalido: 'Mesedez sartu baliozko salmenta prezioa',
            confirmarVenta: '{company}-(e)ko {shares} akzio saldu {price} prezioaren akzioko?',
            ventaExitosa: 'Salmenta arrakastatsua. Irabazia erregistratu da: {profit}',
            errorVenta: 'Errorea: {error}',
            errorProcesarVenta: 'Errorea salmenta prozesatzean',
            eliminarAsset: 'Aktibo hau ezabatu?',
            company: 'Enpresa',
            ticker: 'Ticker',
            shares: 'Akzioak',
            purchasePrice: 'Erosketa Prezioa',
            totalInvestment: 'Guztira Inbertitua',
            currentPrice: 'Uneko Prezioa',
            currentValue: 'Uneko Balioa',
            diffPercent: 'Dif. %',
            diffAmount: 'Dif. €',
            sellAsset: 'Aktiboak Saldu',
            salePrice: 'Salmenta Prezioa',
            saleValue: 'Salmenta Balioa',
            profit: 'Irabazia/Galera',
            confirmSale: 'Salmenta Berretsi',
            placeholderDescripcion: 'Deskribapena...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'UUUU-HH',
            placeholderCompany: 'Apple Inc.',
            placeholderTicker: 'AAPL',
            placeholderShares: '10',
            placeholderPrice: '150,00',
            placeholderInteres: '0,00',
            placeholderAportacion: '0,00',
            confirmarEliminarPuntual: 'Diru-sarrera hau ezabatu?',
            confirmarEliminarMensual: 'Hileroko diru-sarrera hau ezabatu?',
            confirmarEliminarAportacion: 'Ekarpen hau ezabatu?',
            companyRequerido: 'Enpresa beharrezkoa',
            tickerRequerido: 'Ticker beharrezkoa',
            numeroAccionesInvalido: 'Akzio kopuru baliogabea',
            precioCompraInvalidoAlt: 'Erosketa prezioa baliogabea'
        },

        // ===== IMPUESTOS =====
        taxes: {
            agregarPuntual: 'Zerga Puntuala Gehitu',
            agregarMensual: 'Hileroko Zerga Gehitu',
            impuestoAgregado: 'Zerga gehitu da',
            impuestoEliminado: 'Zerga ezabatu da',
            impuestoActualizado: 'Zerga eguneratu da',
            desde: 'Noiztik',
            hasta: 'Noizera',
            completaCampos: 'Eremu guztiak bete'
        },

        // ===== FORMULARIOS =====
        formularios: {
            guardar: 'Gorde',
            cancelar: 'Ezeztatu',
            editar: 'Editatu',
            eliminar: 'Ezabatu',
            agregar: 'Gehitu',
            buscar: 'Bilatu',
            nombre: 'Izena',
            descripcion: 'Deskribapena',
            cantidad: 'Kopurua',
            monto: 'Zenbatekoa',
            categoria: 'Kategoria',
            fecha: 'Data',
            desde: 'Noiztik',
            hasta: 'Noizera',
            bruto: 'Gordina',
            interes: 'Interesa',
            accion: 'Ekintza',
            acciones: 'Ekintzak',
            obligatorio: 'Derrigorrezko eremua',
            confirmarEliminar: 'Ziur hau ezabatu nahi duzula?',
            si: 'Bai',
            no: 'Ez',
            cerrar: 'Itxi',
            aceptar: 'Onartu',
            rechazar: 'Baztertu',
            placeholderDescripcion: 'Deskribapena...',
            placeholderMonto: '0,00',
            placeholderYYYYMM: 'UUUU-HH',
            placeholderNumeroPartes: 'Zk.',
            formatoYYYYMM: 'Formatua: UUUU-HH',
            numeroPartes: 'Zati kopurua'
        },

        // ===== BOTONES =====
        botones: {
            agregar: 'Gehitu',
            actualizar: 'Eguneratu',
            editar: 'Editatu',
            eliminar: 'Ezabatu',
            guardar: 'Gorde',
            cancelar: 'Ezeztatu'
        },

        // ===== TABS =====
        tabs: {
            puntuales: 'Puntuala',
            mensuales: 'Hilerokoa'
        },

        // ===== MENSAJES =====
        mensajes: {
            exito: 'Eragiketa arrakastatsua',
            error: 'Errore bat gertatu da',
            cargando: 'Kargatzen...',
            noHayDatos: 'Ez dago daturik eskuragarri',
            seleccionaRango: 'Data tartea hautatu',
            categoriasCargadas: 'Kategoriak kargatuta',
            dashboardActualizado: 'Panela eguneratuta',
            errorCargando: 'Errorea datuak kargatzean',
            errorGuardando: 'Errorea datuak gordetzean',
            errorEliminando: 'Errorea datuak ezabatzean',
            validacionError: 'Mesedez bete derrigorrezko eremu guztiak',
            confirmacion: 'Berrespena beharrezkoa'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'Emaitzarik ez',
            fecha: 'Data',
            descripcion: 'Deskribapena',
            monto: 'Zenbatekoa',
            categoria: 'Kategoria',
            acciones: 'Ekintzak',
            cargando: 'Kargatzen...',
            mostrandoRegistros: '{0} erakusten {1}-(e)tik',
            siguiente: 'Hurrengoa',
            anterior: 'Aurrekoa',
            primera: 'Lehenengoa',
            ultima: 'Azkena',
            porPagina: 'Erregistroak orriko'
        },

        // ===== ERRORES =====
        errores: {
            campoObligatorio: 'Eremu hau derrigorrezkoa da',
            formatoInvalido: 'Formatu baliogabea',
            montoNegativo: 'Zenbatekoa ezin da negatiboa izan',
            fechaInvalida: 'Data baliogabea',
            seleccionaCategoria: 'Kategoria bat hautatu behar duzu',
            seleccionaFecha: 'Data bat hautatu behar duzu',
            sinConexion: 'Konexio errorea',
            tiempoAgotado: 'Konexio denbora agortu da'
        },

        // ===== CONFIRMACIONES =====
        confirmaciones: {
            guardar: 'Aldaketak gorde nahi dituzu?',
            eliminar: 'Ziur elementu hau ezabatu nahi duzula?',
            cancelar: 'Eragiketa hau ezeztatu nahi duzu?',
            salirSinGuardar: 'Aldaketak gorde gabe irten nahi duzu?'
        }
    }

};