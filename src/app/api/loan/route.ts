import { validateToken } from "@/lib/validate-token";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Configuración del runtime para App Router
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para subidas grandes
export const dynamic = 'force-dynamic'; // Forzar que esta ruta sea dinámica

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('creditoya_token')?.value;

    try {
        await validateToken(token);
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Token inválido o expirado'
        }, { status: 401 });
    }

    try {
        console.log('[UPLOAD] Iniciando procesamiento de archivos...');

        // Verificar el tamaño del contenido antes de procesarlo
        const contentLength = request.headers.get('content-length');
        const maxRequestSize = 50 * 1024 * 1024; // 50MB para la request completa

        if (contentLength && parseInt(contentLength) > maxRequestSize) {
            console.log(`[UPLOAD] Request demasiado grande: ${contentLength} bytes`);
            return NextResponse.json({
                success: false,
                error: 'La solicitud es demasiado grande. Máximo 50MB total.'
            }, { status: 413 });
        }

        // Parse FormData con timeout
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch (error) {
            console.error('[UPLOAD] Error parsing FormData:', error);
            return NextResponse.json({
                success: false,
                error: 'Error al procesar los archivos. Posible tamaño excesivo.'
            }, { status: 400 });
        }

        // Extract the form fields from formData
        const phone = formData.get('phone') as string;
        const signature = formData.get('signature') as string;
        const userId = formData.get('user_id') as string;
        const entity = formData.get('entity') as string;
        const bankNumberAccount = formData.get('bankNumberAccount') as string;
        const cantity = formData.get('cantity') as string;
        const city = formData.get('city') as string;
        const residence_address = formData.get('residence_address') as string;
        const terms_and_conditions = formData.get('terms_and_conditions') === 'true';
        const isValorAgregado = formData.get('isValorAgregado') === 'true';

        // Extract file uploads
        const labor_card = formData.get('labor_card') as File | null;
        const fisrt_flyer = formData.get('fisrt_flyer') as File | null;
        const second_flyer = formData.get('second_flyer') as File | null;
        const third_flyer = formData.get('third_flyer') as File | null;

        // Log file sizes for debugging
        const files = { labor_card, fisrt_flyer, second_flyer, third_flyer };
        let totalSize = 0;

        Object.entries(files).forEach(([key, file]) => {
            if (file) {
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                console.log(`[UPLOAD] ${key}: ${sizeMB}MB, tipo: ${file.type}`);
                totalSize += file.size;
            }
        });

        console.log(`[UPLOAD] Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

        // Validate required fields
        if (!signature) {
            return NextResponse.json({
                success: false,
                error: 'No se proporcionó la firma del préstamo'
            }, { status: 400 });
        }
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'No se proporcionó el ID del usuario'
            }, { status: 400 });
        }
        
        if (!entity || !bankNumberAccount || !cantity || !terms_and_conditions) {
            return NextResponse.json({
                success: false,
                error: 'Faltan campos obligatorios'
            }, { status: 400 });
        }

        // If not isValorAgregado, check for required files
        if (!isValorAgregado && (!labor_card || !fisrt_flyer || !second_flyer || !third_flyer)) {
            return NextResponse.json({
                success: false,
                error: 'Faltan archivos requeridos'
            }, { status: 400 });
        }

        // Validate file types and sizes - Límites consistentes
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const maxFileSize = 12 * 1024 * 1024; // 12MB por archivo (más conservador)
        const maxTotalSize = 45 * 1024 * 1024; // 45MB total (dejar margen para metadata)

        for (const [key, file] of Object.entries(files)) {
            if (file) {
                if (!allowedTypes.includes(file.type)) {
                    return NextResponse.json({
                        success: false,
                        error: `Tipo de archivo no permitido para ${key}. Solo PDF, JPG, PNG`
                    }, { status: 400 });
                }

                if (file.size > maxFileSize) {
                    return NextResponse.json({
                        success: false,
                        error: `Archivo ${key} muy grande (máximo 12MB). Actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
                    }, { status: 400 });
                }
            }
        }

        if (totalSize > maxTotalSize) {
            return NextResponse.json({
                success: false,
                error: `Tamaño total de archivos excede 45MB (actual: ${(totalSize / 1024 / 1024).toFixed(2)}MB)`
            }, { status: 400 });
        }

        // Create a new FormData for the API request
        const apiFormData = new FormData();

        // Add body fields to the API request
        apiFormData.append('phone', phone);
        apiFormData.append('signature', signature);
        apiFormData.append('entity', entity);
        apiFormData.append('bankNumberAccount', bankNumberAccount);
        apiFormData.append('cantity', cantity);
        apiFormData.append('city', city);
        apiFormData.append('residence_address', residence_address);
        apiFormData.append('terms_and_conditions', terms_and_conditions.toString());

        // Only add isValorAgregado if it's true
        if (isValorAgregado) {
            apiFormData.append('isValorAgregado', isValorAgregado.toString());
        }

        // Add files with the exact field names expected by the FileFieldsInterceptor
        if (labor_card) apiFormData.append('labor_card', labor_card);
        if (fisrt_flyer) apiFormData.append('fisrt_flyer', fisrt_flyer);
        if (second_flyer) apiFormData.append('second_flyer', second_flyer);
        if (third_flyer) apiFormData.append('third_flyer', third_flyer);

        // Configure the request headers with increased limits
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            },
            timeout: 120000, // 2 minutos
            maxContentLength: 50 * 1024 * 1024, // 50MB
            maxBodyLength: 50 * 1024 * 1024, // 50MB
        };

        try {
            const baseURL = process.env.GATEWAY_API || '';

            if (!baseURL) {
                console.error('[UPLOAD] GATEWAY_API no configurado');
                return NextResponse.json({
                    success: false,
                    error: 'Configuración del servidor incompleta'
                }, { status: 500 });
            }

            console.log('[UPLOAD] Enviando al backend...');

            // Make the request to the backend API
            const loanResponse = await axios.post(
                `${baseURL}/loans/${userId}`,
                apiFormData,
                config
            );

            console.log('[UPLOAD] Backend response:', loanResponse.status, loanResponse.statusText);

            return NextResponse.json({
                success: true,
                data: "Creación de préstamo exitoso",
                loanDetails: loanResponse.data
            });

        } catch (apiError: any) {
            console.error('[UPLOAD] Backend error:', {
                status: apiError.response?.status,
                statusText: apiError.response?.statusText,
                data: apiError.response?.data,
                message: apiError.message,
                code: apiError.code
            });

            // Handle specific error cases
            if (apiError.code === 'ECONNABORTED') {
                return NextResponse.json({
                    success: false,
                    error: 'Timeout: La subida de archivos tardó demasiado tiempo'
                }, { status: 408 });
            }

            if (apiError.response?.status === 413) {
                return NextResponse.json({
                    success: false,
                    error: 'Los archivos son demasiado grandes para el servidor backend'
                }, { status: 413 });
            }

            if (apiError.response?.status === 400) {
                return NextResponse.json({
                    success: false,
                    error: apiError.response?.data?.message || 'Datos inválidos enviados al backend'
                }, { status: 400 });
            }

            if (apiError.response?.status >= 500) {
                return NextResponse.json({
                    success: false,
                    error: 'Error interno del servidor backend'
                }, { status: 502 });
            }

            return NextResponse.json({
                success: false,
                error: apiError.response?.data?.message || 'Error al comunicarse con el backend'
            }, { status: apiError.response?.status || 500 });
        }

    } catch (error: any) {
        console.error('[UPLOAD] Server error:', error);

        if (error.name === 'PayloadTooLargeError' || error.message?.includes('too large')) {
            return NextResponse.json({
                success: false,
                error: 'Los archivos son muy grandes para procesar (límite del servidor)'
            }, { status: 413 });
        }

        if (error.name === 'SyntaxError' && error.message?.includes('JSON')) {
            return NextResponse.json({
                success: false,
                error: 'Error al procesar los datos del formulario'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 });
    }
}

/**
 * API endpoint para obtener información de préstamos
 * Soporta tanto la obtención de un préstamo específico como el último préstamo de un usuario
 */
export async function GET(req: NextRequest) {
    // 1. Validación de autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('creditoya_token')?.value;

    await validateToken(token);

    // 2. Extracción y validación de parámetros
    const { searchParams } = new URL(req.url);
    const loanId = searchParams.get('loan_id');
    const userId = searchParams.get('user_id');
    const isLatest = searchParams.get('latest') === 'true';

    try {
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'Falta parámetro requerido: user_id'
            }, { status: 400 });
        }

        if (!isLatest && !loanId) {
            return NextResponse.json({
                success: false,
                error: 'Falta parámetro requerido: loan_id'
            }, { status: 400 });
        }

        // 3. Preparación de la petición
        const baseURL = process.env.GATEWAY_API || '';
        const endpoint = isLatest
            ? `${baseURL}/loans/${userId}/latest`
            : `${baseURL}/loans/${userId}/${loanId}/info`;

        const axiosConfig = {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        };

        // 4. Ejecución de la petición
        const response = await axios.get(endpoint, axiosConfig);

        // 5. Manejo de la respuesta del backend
        if (!response.data && !isLatest) {
            throw new Error('No se recibieron datos de la API');
        }

        // Si es la petición latest y no hay préstamos (response.data es null),
        // devolver respuesta de éxito con data: null
        if (isLatest && response.data === null) {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No tienes préstamos por el momento'
            });
        }

        // Verificar si hay un mensaje de error específico en la respuesta
        if (response.data && response.data.success === false) {
            throw new Error(response.data.error || 'Error al obtener información del préstamo');
        }

        return NextResponse.json({
            success: true,
            data: response.data
        });

    } catch (error: any) {
        // 6. Manejo de errores centralizado
        console.error('[API] Error en petición GET loan:', error.message);

        // Determinar el tipo de error para respuesta adecuada
        if (error.response?.status === 401) {
            return NextResponse.json({
                success: false,
                error: 'No autenticado'
            }, { status: 401 });
        }

        // Si es un error 404 y es una petición de 'latest', retornar éxito con null
        // en lugar de un error para mantener consistencia con respuestas nulas
        if (error.response?.status === 404 && searchParams.get('latest') === 'true') {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No tienes préstamos por el momento'
            });
        }

        if (error.response?.status === 404) {
            return NextResponse.json({
                success: false,
                error: 'Préstamo o usuario no encontrado'
            }, { status: 404 });
        }

        const errorStatus = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || 'Error del servidor';

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: errorStatus });
    }
}