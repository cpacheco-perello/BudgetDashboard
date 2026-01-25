const TRADUCCIONES = {
    es: {
        // ===== APP =====
        app: {
            titulo: 'Dashboard Económico'
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
            saldo: 'Saldo'
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
            frances: 'Français'
        },

        // ===== NAVEGACIÓN =====
        nav: {
            categorias: 'Categorías',
            gastos: 'Gastos',
            ingresos: 'Ingresos',
            dashboard: 'Dashboard'
        },

        // ===== DASHBOARD =====
        dashboard: {
            titulo: 'Resumen Financiero',
            periodoRapido: 'Período Rápido',
            desde: 'Desde',
            hasta: 'Hasta',
            actualizar: 'Actualizar',
            totalPeriodo: 'Totales Período',
            gastosPorMes: 'Gastos por Mes',
            todasCategorias: 'Todas las categorías',
            ingresos: 'Ingresos',
            gastos: 'Gastos',
            ahorros: 'Ahorros',
            ingresosPorCategoria: 'Ingresos por Categoría',
            gastosPorCategoria: 'Gastos por Categoría'
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
            categoriaActualizada: 'Categoría actualizada correctamente'
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
            noHayGastos: 'No hay gastos registrados',
            gastoAgregado: 'Gasto agregado correctamente',
            gastoEliminado: 'Gasto eliminado correctamente',
            gastoActualizado: 'Gasto actualizado correctamente',
            validarFecha: 'Por favor selecciona una fecha válida',
            validarMonto: 'Por favor ingresa un monto válido',
            validarCategoria: 'Por favor selecciona una categoría'
        },

        // ===== INGRESOS =====
        ingresos: {
            titulo: 'Administrar Ingresos',
            puntuales: 'Ingresos Puntuales',
            mensuales: 'Ingresos Mensuales',
            descripcion: 'Descripción...',
            noHayIngresos: 'No hay ingresos registrados',
            ingresoAgregado: 'Ingreso agregado correctamente',
            ingresoEliminado: 'Ingreso eliminado correctamente',
            ingresoActualizado: 'Ingreso actualizado correctamente',
            validarFecha: 'Por favor selecciona una fecha válida',
            validarMonto: 'Por favor ingresa un monto válido',
            validarCategoria: 'Por favor selecciona una categoría'
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
            accion: 'Acción',
            acciones: 'Acciones',
            obligatorio: 'Campo obligatorio',
            confirmarEliminar: '¿Estás seguro de que deseas eliminar esto?',
            si: 'Sí',
            no: 'No',
            cerrar: 'Cerrar',
            aceptar: 'Aceptar',
            rechazar: 'Rechazar'
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
            errorCargando: 'Error al cargar datos',
            errorGuardando: 'Error al guardar datos',
            errorEliminando: 'Error al eliminar datos',
            validacionError: 'Por favor completa todos los campos requeridos',
            confirmacion: 'Confirmación requerida'
        },

        // ===== TABLAS =====
        tablas: {
            sinResultados: 'Sin resultados',
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
        app: {
            titulo: 'Financial Dashboard'
        },
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
            bosque: 'Green Forest',
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
        periodos: {
            un_mes: '1 Month',
            tres_meses: '3 Months',
            seis_meses: '6 Months',
            un_anio: '1 Year',
            cinco_anios: '5 Years',
            diez_anios: '10 Years'
        },
        resumen: {
            totalIngresos: 'Total Income',
            totalGastos: 'Total Expenses',
            saldo: 'Balance'
        },
        tema: {
            cambiarTema: '🎨 Theme:',
            seleccionar: 'Select theme',
            claro: 'Light',
            oscuro: 'Dark',
            automático: 'Automatic'
        },
        idioma: {
            seleccionar: '🌐 Select language:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français'
        },
        nav: {
            categorias: 'Categories',
            gastos: 'Expenses',
            ingresos: 'Income',
            dashboard: 'Dashboard'
        },
        dashboard: {
            titulo: 'Financial Summary',
            periodoRapido: 'Quick Period',
            desde: 'From',
            hasta: 'To',
            actualizar: 'Update',
            totalPeriodo: 'Period Totals',
            gastosPorMes: 'Expenses by Month',
            todasCategorias: 'All categories',
            ingresos: 'Income',
            gastos: 'Expenses',
            ahorros: 'Savings',
            ingresosPorCategoria: 'Income by Category',
            gastosPorCategoria: 'Expenses by Category'
        },
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
            categoriaActualizada: 'Category updated successfully'
        },
        gastos: {
            titulo: 'Manage Expenses',
            puntuales: 'One-time Expenses',
            mensuales: 'Monthly Expenses',
            descripcion: 'Description...',
            desde: 'From',
            hasta: 'To',
            monto: 'Amount',
            noHayGastos: 'No expenses recorded',
            gastoAgregado: 'Expense added successfully',
            gastoEliminado: 'Expense deleted successfully',
            gastoActualizado: 'Expense updated successfully',
            validarFecha: 'Please select a valid date',
            validarMonto: 'Please enter a valid amount',
            validarCategoria: 'Please select a category'
        },
        ingresos: {
            titulo: 'Manage Income',
            puntuales: 'One-time Income',
            mensuales: 'Monthly Income',
            descripcion: 'Description...',
            noHayIngresos: 'No income recorded',
            ingresoAgregado: 'Income added successfully',
            ingresoEliminado: 'Income deleted successfully',
            ingresoActualizado: 'Income updated successfully',
            validarFecha: 'Please select a valid date',
            validarMonto: 'Please enter a valid amount',
            validarCategoria: 'Please select a category'
        },
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
            accion: 'Action',
            acciones: 'Actions',
            obligatorio: 'Required field',
            confirmarEliminar: 'Are you sure you want to delete this?',
            si: 'Yes',
            no: 'No',
            cerrar: 'Close',
            aceptar: 'Accept',
            rechazar: 'Reject'
        },
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
        tablas: {
            sinResultados: 'No results',
            cargando: 'Loading...',
            mostrandoRegistros: 'Showing {0} of {1} records',
            siguiente: 'Next',
            anterior: 'Previous',
            primera: 'First',
            ultima: 'Last',
            porPagina: 'Records per page'
        },
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
        confirmaciones: {
            guardar: 'Do you want to save the changes?',
            eliminar: 'Are you sure you want to delete this item?',
            cancelar: 'Do you want to cancel this operation?',
            salirSinGuardar: 'Do you want to exit without saving changes?'
        }
    },

    pt: {
        app: {
            titulo: 'Painel Financeiro'
        },
        temas: {
            azul: 'Azul Profissional',
            verde: 'Verde Moderno',
            naranja: 'Laranja Energético',
            turquesa: 'Turquesa Fresco',
            purpura: 'Púrpura Moderno',
            rojo: 'Vermelho Elegante',
            indigo: 'Índigo Suave',
            teal: 'Teal Profissional',
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
            medianoche: 'Meia-Noite Escura',
            neon: 'Neon Ciberpunk',
            mint: 'Menta Suave',
            coral: 'Coral Tropical',
            lavanda: 'Lavanda Elegante',
            grisminimal: 'Cinza Minimalista',
            bronce: 'Bronze Vintage',
            cielo: 'Céu Claro'
        },
        periodos: {
            un_mes: '1 Mês',
            tres_meses: '3 Meses',
            seis_meses: '6 Meses',
            un_anio: '1 Ano',
            cinco_anios: '5 Anos',
            diez_anios: '10 Anos'
        },
        resumen: {
            totalIngresos: 'Total de Receitas',
            totalGastos: 'Total de Despesas',
            saldo: 'Saldo'
        },
        tema: {
            cambiarTema: '🎨 Tema:',
            seleccionar: 'Selecionar tema',
            claro: 'Claro',
            oscuro: 'Escuro',
            automático: 'Automático'
        },
        idioma: {
            seleccionar: '🌐 Selecionar idioma:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français'
        },
        nav: {
            categorias: 'Categorias',
            gastos: 'Despesas',
            ingresos: 'Receitas',
            dashboard: 'Painel'
        },
        dashboard: {
            titulo: 'Resumo Financeiro',
            periodoRapido: 'Período Rápido',
            desde: 'De',
            hasta: 'Até',
            actualizar: 'Atualizar',
            totalPeriodo: 'Totais do Período',
            gastosPorMes: 'Despesas por Mês',
            todasCategorias: 'Todas as categorias',
            ingresos: 'Receitas',
            gastos: 'Despesas',
            ahorros: 'Poupança',
            ingresosPorCategoria: 'Receitas por Categoria',
            gastosPorCategoria: 'Despesas por Categoria'
        },
        categorias: {
            titulo: 'Gerenciar Categorias',
            gastos: 'Despesas',
            ingresos: 'Receitas',
            categoriasGasto: 'Categorias de Despesa',
            categoriasIngreso: 'Categorias de Receita',
            nuevaCategoria: 'Nova categoria...',
            noHayCategoriasGasto: 'Nenhuma categoria de despesa',
            noHayCategoriasIngreso: 'Nenhuma categoria de receita',
            categoriaAgregada: 'Categoria adicionada com sucesso',
            categoriaEliminada: 'Categoria excluída com sucesso',
            categoriaActualizada: 'Categoria atualizada com sucesso'
        },
        gastos: {
            titulo: 'Gerenciar Despesas',
            puntuales: 'Despesas Pontuais',
            mensuales: 'Despesas Mensais',
            descripcion: 'Descrição...',
            desde: 'De',
            hasta: 'Até',
            monto: 'Valor',
            noHayGastos: 'Nenhuma despesa registrada',
            gastoAgregado: 'Despesa adicionada com sucesso',
            gastoEliminado: 'Despesa excluída com sucesso',
            gastoActualizado: 'Despesa atualizada com sucesso',
            validarFecha: 'Por favor selecione uma data válida',
            validarMonto: 'Por favor insira um valor válido',
            validarCategoria: 'Por favor selecione uma categoria',
            fraccionar: 'Fracionar'
        },
        ingresos: {
            titulo: 'Gerenciar Receitas',
            puntuales: 'Receitas Pontuais',
            mensuales: 'Receitas Mensais',
            descripcion: 'Descrição...',
            noHayIngresos: 'Nenhuma receita registrada',
            ingresoAgregado: 'Receita adicionada com sucesso',
            ingresoEliminado: 'Receita excluída com sucesso',
            ingresoActualizado: 'Receita atualizada com sucesso',
            validarFecha: 'Por favor selecione uma data válida',
            validarMonto: 'Por favor insira um valor válido',
            validarCategoria: 'Por favor selecione uma categoria'
        },
        formularios: {
            guardar: 'Salvar',
            cancelar: 'Cancelar',
            editar: 'Editar',
            eliminar: 'Excluir',
            agregar: 'Adicionar',
            buscar: 'Pesquisar',
            nombre: 'Nome',
            descripcion: 'Descrição',
            cantidad: 'Quantidade',
            monto: 'Valor',
            categoria: 'Categoria',
            fecha: 'Data',
            accion: 'Ação',
            acciones: 'Ações',
            obligatorio: 'Campo obrigatório',
            confirmarEliminar: 'Tem certeza de que deseja excluir isto?',
            si: 'Sim',
            no: 'Não',
            cerrar: 'Fechar',
            aceptar: 'Aceitar',
            rechazar: 'Rejeitar'
        },
        mensajes: {
            exito: 'Operação concluída com sucesso',
            error: 'Ocorreu um erro',
            cargando: 'Carregando...',
            noHayDatos: 'Nenhum dado disponível',
            seleccionaRango: 'Selecione um intervalo de datas',
            categoriasCargadas: 'Categorias carregadas',
            dashboardActualizado: 'Painel atualizado',
            errorCargando: 'Erro ao carregar dados',
            errorGuardando: 'Erro ao salvar dados',
            errorEliminando: 'Erro ao excluir dados',
            validacionError: 'Por favor preencha todos os campos obrigatórios',
            confirmacion: 'Confirmação necessária'
        },
        tablas: {
            sinResultados: 'Sem resultados',
            cargando: 'Carregando...',
            mostrandoRegistros: 'Mostrando {0} de {1} registros',
            siguiente: 'Próximo',
            anterior: 'Anterior',
            primera: 'Primeiro',
            ultima: 'Último',
            porPagina: 'Registros por página'
        },
        errores: {
            campoObligatorio: 'Este campo é obrigatório',
            formatoInvalido: 'Formato inválido',
            montoNegativo: 'O valor não pode ser negativo',
            fechaInvalida: 'Data inválida',
            seleccionaCategoria: 'Você deve selecionar uma categoria',
            seleccionaFecha: 'Você deve selecionar uma data',
            sinConexion: 'Erro de conexão',
            tiempoAgotado: 'Tempo de conexão esgotado'
        },
        confirmaciones: {
            guardar: 'Deseja salvar as alterações?',
            eliminar: 'Tem certeza de que deseja excluir este item?',
            cancelar: 'Deseja cancelar esta operação?',
            salirSinGuardar: 'Deseja sair sem salvar as alterações?'
        }
    },

    fr: {
        app: {
            titulo: 'Tableau de Bord Financier'
        },
        temas: {
            azul: 'Bleu Professionnel',
            verde: 'Vert Moderne',
            naranja: 'Orange Énergétique',
            turquesa: 'Turquoise Frais',
            purpura: 'Violet Moderne',
            rojo: 'Rouge Élégant',
            indigo: 'Indigo Doux',
            teal: 'Teal Professionnel',
            gris: 'Gris Corporatif',
            rosado: 'Rose Moderne',
            cian: 'Cyan Vibrant',
            lima: 'Citron Vert Frais',
            esmeralda: 'Émeraude Premium',
            ambar: 'Ambre Doré',
            violeta: 'Violet Mystique',
            fresa: 'Rose Fraise',
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
        periodos: {
            un_mes: '1 Mois',
            tres_meses: '3 Mois',
            seis_meses: '6 Mois',
            un_anio: '1 An',
            cinco_anios: '5 Ans',
            diez_anios: '10 Ans'
        },
        resumen: {
            totalIngresos: 'Revenu Total',
            totalGastos: 'Dépenses Totales',
            saldo: 'Solde'
        },
        tema: {
            cambiarTema: '🎨 Thème:',
            seleccionar: 'Sélectionner le thème',
            claro: 'Clair',
            oscuro: 'Sombre',
            automático: 'Automatique'
        },
        idioma: {
            seleccionar: '🌐 Sélectionner la langue:',
            espanol: 'Español',
            ingles: 'English',
            portugues: 'Português',
            frances: 'Français'
        },
        nav: {
            categorias: 'Catégories',
            gastos: 'Dépenses',
            ingresos: 'Revenus',
            dashboard: 'Tableau de Bord'
        },
        dashboard: {
            titulo: 'Résumé Financier',
            periodoRapido: 'Période Rapide',
            desde: 'Du',
            hasta: 'Au',
            actualizar: 'Mettre à jour',
            totalPeriodo: 'Totaux de la Période',
            gastosPorMes: 'Dépenses par Mois',
            todasCategorias: 'Toutes les catégories',
            ingresos: 'Revenus',
            gastos: 'Dépenses',
            ahorros: 'Économies',
            ingresosPorCategoria: 'Revenus par Catégorie',
            gastosPorCategoria: 'Dépenses par Catégorie'
        },
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
            categoriaActualizada: 'Catégorie mise à jour avec succès'
        },
        gastos: {
            titulo: 'Gérer les Dépenses',
            puntuales: 'Dépenses Ponctuelles',
            mensuales: 'Dépenses Mensuelles',
            descripcion: 'Description...',
            desde: 'Du',
            hasta: 'Au',
            monto: 'Montant',
            noHayGastos: 'Aucune dépense enregistrée',
            gastoAgregado: 'Dépense ajoutée avec succès',
            gastoEliminado: 'Dépense supprimée avec succès',
            gastoActualizado: 'Dépense mise à jour avec succès',
            validarFecha: 'Veuillez sélectionner une date valide',
            validarMonto: 'Veuillez entrer un montant valide',
            validarCategoria: 'Veuillez sélectionner une catégorie'
        },
        ingresos: {
            titulo: 'Gérer les Revenus',
            puntuales: 'Revenus Ponctuels',
            mensuales: 'Revenus Mensuels',
            descripcion: 'Description...',
            noHayIngresos: 'Aucun revenu enregistré',
            ingresoAgregado: 'Revenu ajouté avec succès',
            ingresoEliminado: 'Revenu supprimé avec succès',
            ingresoActualizado: 'Revenu mis à jour avec succès',
            validarFecha: 'Veuillez sélectionner une date valide',
            validarMonto: 'Veuillez entrer un montant valide',
            validarCategoria: 'Veuillez sélectionner une catégorie'
        },
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
            accion: 'Action',
            acciones: 'Actions',
            obligatorio: 'Champ requis',
            confirmarEliminar: 'Êtes-vous sûr de vouloir supprimer ceci ?',
            si: 'Oui',
            no: 'Non',
            cerrar: 'Fermer',
            aceptar: 'Accepter',
            rechazar: 'Rejeter'
        },
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
        tablas: {
            sinResultados: 'Aucun résultat',
            cargando: 'Chargement...',
            mostrandoRegistros: 'Affichage de {0} sur {1} enregistrements',
            siguiente: 'Suivant',
            anterior: 'Précédent',
            primera: 'Premier',
            ultima: 'Dernier',
            porPagina: 'Enregistrements par page'
        },
        errores: {
            campoObligatorio: 'Ce champ est obligatoire',
            formatoInvalido: 'Format invalide',
            montoNegativo: 'Le montant ne peut pas être négatif',
            fechaInvalida: 'Date invalide',
            seleccionaCategoria: 'Vous devez sélectionner une catégorie',
            seleccionaFecha: 'Vous devez sélectionner une date',
            sinConexion: 'Erreur de connexion',
            tiempoAgotado: 'Délai d\'attente de connexion dépassé'
        },
        confirmaciones: {
            guardar: 'Voulez-vous enregistrer les modifications ?',
            eliminar: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            cancelar: 'Voulez-vous annuler cette opération ?',
            salirSinGuardar: 'Voulez-vous quitter sans enregistrer les modifications ?'
        }
    }
};