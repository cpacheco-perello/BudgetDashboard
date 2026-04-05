const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ensureUserFolders, readLastUser } = require('../config/userManager');
const router = express.Router();

function getUploadsDir() {
    const user = readLastUser();
    if (!user) {
        return path.join(process.cwd(), 'uploads', 'importaciones');
    }
    const paths = ensureUserFolders(user);
    return paths.uploadsDir;
}
// Configurar multer para guardar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = getUploadsDir();
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Guardar con timestamp para evitar colisiones
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${timestamp}_${originalName}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) y CSV (.csv)'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

function resolverRutaSeguraArchivo(fileId) {
    const uploadsDir = getUploadsDir();
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const id = String(fileId || '').trim();
    if (!id || id.includes('\0')) {
        return { error: 'Identificador de archivo inválido', status: 400 };
    }

    if (id.includes('/') || id.includes('\\') || id.includes('..')) {
        return { error: 'Identificador de archivo inválido', status: 400 };
    }

    const rutaArchivo = path.join(uploadsDir, id);
    if (!fs.existsSync(rutaArchivo)) {
        return { error: 'Archivo no encontrado', status: 404 };
    }

    const stat = fs.statSync(rutaArchivo);
    if (!stat.isFile()) {
        return { error: 'Recurso inválido', status: 400 };
    }

    const realUploadsDir = fs.realpathSync(uploadsDir);
    const realPath = fs.realpathSync(rutaArchivo);
    const relative = path.relative(realUploadsDir, realPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return { error: 'Acceso denegado', status: 403 };
    }

    return { rutaArchivo, realPath, realUploadsDir };
}

/**
 * POST /api/importacion/guardar
 * Guarda un archivo importado
 */
router.post('/api/importacion/guardar', (req, res, next) => {
    upload.single('archivo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('❌ Error de Multer:', err.message);
            return res.status(400).json({ success: false, error: `Error en upload: ${err.message}` });
        } else if (err) {
            console.error('❌ Error en validación:', err.message);
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
}, (req, res) => {
    try {
        console.log('📥 Solicitud POST /api/importacion/guardar recibida');
        console.log('📦 Archivo recibido:', {
            filename: req.file?.filename,
            originalname: req.file?.originalname,
            size: req.file?.size,
            path: req.file?.path
        });
        console.log('📝 Body:', req.body);

        if (!req.file) {
            console.error('❌ No se cargó ningún archivo');
            return res.status(400).json({ success: false, error: 'No se cargó ningún archivo' });
        }

        const archivoGuardado = {
            id: req.file.filename,
            nombre: req.body.nombre || req.file.originalname,
            archivo: req.file.filename,
            fechaGuardado: new Date().toISOString(),
            tamaño: req.file.size,
            tipo: path.extname(req.file.originalname).toLowerCase()
        };

        console.log('✅ Archivo importado guardado:', archivoGuardado);
        console.log('📁 Ubicación física:', req.file.path);
        res.json({ success: true, archivo: archivoGuardado });
    } catch (error) {
        console.error('❌ Error guardando archivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/importacion/listar
 * Lista todos los archivos guardados
 */
router.get('/api/importacion/listar', (req, res) => {
    try {
        const uploadsDir = getUploadsDir();
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const archivos = fs.readdirSync(uploadsDir);
        
        const lista = archivos.map(archivo => {
            const rutaCompleta = path.join(uploadsDir, archivo);
            const stats = fs.statSync(rutaCompleta);
            
            // Intentar extraer timestamp del nombre (formato: timestamp_nombre.ext)
            const parts = archivo.split('_');
            const timestamp = parseInt(parts[0]);
            
            let nombre, fechaGuardado;
            
            // Si el primer segmento es un timestamp válido (número de 13 dígitos)
            if (!isNaN(timestamp) && timestamp.toString().length === 13) {
                nombre = archivo.substring(timestamp.toString().length + 1); // Sin timestamp
                fechaGuardado = new Date(timestamp).toISOString();
            } else {
                // Archivo sin timestamp, usar nombre completo y fecha de modificación
                nombre = archivo;
                fechaGuardado = stats.mtime.toISOString();
            }
            
            return {
                id: archivo,
                nombre,
                archivo: archivo,
                fechaGuardado,
                tamaño: stats.size,
                tipo: path.extname(archivo).toLowerCase()
            };
        }).sort((a, b) => new Date(b.fechaGuardado) - new Date(a.fechaGuardado));

        console.log(`📋 Se listaron ${lista.length} archivos guardados`);
        res.json({ success: true, archivos: lista });
    } catch (error) {
        console.error('❌ Error listando archivos:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/importacion/descargar/:id
 * Descarga un archivo guardado
 */
router.get('/api/importacion/descargar/:id', (req, res) => {
    try {
        const validacion = resolverRutaSeguraArchivo(req.params.id);
        if (validacion.error) {
            return res.status(validacion.status).json({ error: validacion.error });
        }
        const { rutaArchivo } = validacion;

        // Extraer nombre sin timestamp si existe
        let nombreDescarga = req.params.id;
        const parts = req.params.id.split('_');
        const timestamp = parseInt(parts[0]);
        
        // Si tiene timestamp válido, quitarlo del nombre
        if (!isNaN(timestamp) && timestamp.toString().length === 13) {
            nombreDescarga = req.params.id.substring(timestamp.toString().length + 1);
        }
        
        res.download(rutaArchivo, nombreDescarga);
        console.log('📥 Archivo descargado:', nombreDescarga);
    } catch (error) {
        console.error('❌ Error descargando archivo:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/importacion/eliminar/:id
 * Elimina un archivo guardado
 */
router.delete('/api/importacion/eliminar/:id', (req, res) => {
    try {
        const validacion = resolverRutaSeguraArchivo(req.params.id);
        if (validacion.error) {
            return res.status(validacion.status).json({ error: validacion.error });
        }
        const { rutaArchivo } = validacion;

        fs.unlinkSync(rutaArchivo);
        console.log('🗑️ Archivo eliminado:', req.params.id);
        res.json({ success: true, mensaje: 'Archivo eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error eliminando archivo:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/importacion/contenido/:id
 * Obtiene el contenido de un archivo para cargarlo en análisis
 */
router.get('/api/importacion/contenido/:id', (req, res) => {
    try {
        const validacion = resolverRutaSeguraArchivo(req.params.id);
        if (validacion.error) {
            return res.status(validacion.status).json({ error: validacion.error });
        }
        const { rutaArchivo } = validacion;

        const contenido = fs.readFileSync(rutaArchivo, 'base64');
        const tipo = path.extname(rutaArchivo).toLowerCase();
        
        // Extraer nombre sin timestamp si existe
        let nombreSinTimestamp = req.params.id;
        const parts = req.params.id.split('_');
        const timestamp = parseInt(parts[0]);
        
        // Si tiene timestamp válido, quitarlo del nombre
        if (!isNaN(timestamp) && timestamp.toString().length === 13) {
            nombreSinTimestamp = req.params.id.substring(timestamp.toString().length + 1);
        }
        
        res.json({ 
            success: true, 
            contenido,
            tipo,
            nombre: nombreSinTimestamp
        });
        console.log('📖 Contenido del archivo enviado:', req.params.id);
    } catch (error) {
        console.error('❌ Error leyendo archivo:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
