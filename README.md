# Comercial Nova — Sistema de segmentación comercial

Aplicación didáctica de React + TypeScript + Vite para administrar registros y segmentar patrones de compra con K-Means.

## Arquitectura: solo 3 módulos principales

1. **Panel principal:** KPI de negocio, gasto promedio, visitas y distribución de grupos.
2. **Mantenimiento:** contiene la gestión de clientes (registrar, consultar, buscar, editar, eliminar y exportar CSV), con validaciones.
3. **Análisis comercial:** contiene la segmentación K-Means y las recomendaciones por perfil.

## Importante: sin base de datos

Este proyecto no usa base de datos, backend, API ni `localStorage`. Los 12 registros de prueba se cargan en memoria al iniciar la aplicación. Los cambios se mantienen mientras la página esté abierta; al recargar, vuelven los datos iniciales. Esto cumple el requisito de practicar la lógica sin conectar una BD.

## Requisitos
- Node.js LTS y npm
- Navegador moderno

## Ejecutar en Windows
1. Extrae el ZIP.
2. Abre la carpeta del proyecto en Visual Studio Code.
3. Abre Terminal → New Terminal.
4. Ejecuta:

```powershell
npm install
npm run dev
```

5. Abre la dirección local mostrada por Vite, normalmente `http://localhost:5173`.

No hace falta instalar Python, iniciar otra terminal ni configurar una base de datos.

## Lógica de negocio
- Código de cliente único.
- Nombre y campos numéricos obligatorios.
- Gasto, visitas y antigüedad no pueden ser negativos.
- Visitas y antigüedad deben ser enteros.
- No se permite ejecutar K si hay menos registros válidos que grupos solicitados.
- K se elige entre 2 y 5.
- K-Means utiliza gasto acumulado, visitas de los últimos seis meses y antigüedad.
- Las tres variables se estandarizan antes de calcular distancias.
- Se asigna un grupo, se recalculan centroides y se repite hasta converger o llegar a 100 iteraciones.
- Los promedios de cada grupo se convierten en perfiles y recomendaciones comerciales orientativas.
- Antes de eliminar un registro se pide confirmación.

## Datos de prueba
Se incluyen los 12 clientes ficticios indicados en el manual de práctica.

## Estructura
- `src/app/App.tsx`: composición de pantallas y navegación entre módulos.
- `src/services/customerService.ts`: conjunto inicial en memoria.
- `src/services/segmentationService.ts`: implementación local de K-Means.
- `src/types/index.ts`: tipos de datos de clientes y resumen.
- `src/styles.css`: diseño adaptable.

## Pruebas recomendadas
1. Registrar un cliente válido.
2. Rechazar un código duplicado.
3. Rechazar gasto negativo.
4. Editar visitas y comprobar cambios en los KPI.
5. Buscar por nombre y código.
6. Cancelar una eliminación y verificar que el registro se conserve.
7. Ejecutar K=3 y revisar los grupos.
8. Intentar usar K mayor que el número de clientes válidos.
9. Probar una búsqueda sin coincidencias.
10. Recargar la página y verificar que los datos vuelven al conjunto inicial, ya que no existe persistencia.


## Requisitos funcionales cubiertos

- **RF-01 Panel principal:** total de clientes, gasto promedio, visitas promedio y cantidad de segmentos.
- **RF-02 Clientes:** alta, listado, búsqueda, edición y eliminación con confirmación.
- **RF-03 Validación:** campos obligatorios, valores numéricos no negativos, visitas y antigüedad enteras e identificador único.
- **RF-04 Segmentación:** selección de K entre 2 y 5 y ejecución de K-Means.
- **RF-05 Resultados:** asignación de segmento por cliente y resumen de gasto, visitas y antigüedad por grupo.
- **RF-06 Análisis:** filtro por segmento y ordenamiento por gasto, visitas o antigüedad.
- **RF-07 Recomendaciones:** propuestas comerciales orientativas calculadas a partir del perfil promedio de cada segmento.
- **RF-08 Auditoría básica:** fecha/hora y cantidad de registros procesados en la última ejecución.
- **RF-09 Persistencia:** clientes y resumen de la última segmentación guardados en `localStorage`.
- **RF-10 Experiencia:** estados vacíos, errores comprensibles, confirmación de eliminación y exportación CSV.

> La aplicación es una práctica educativa: los datos permanecen en el navegador donde se registraron. Para compartir datos entre usuarios o equipos, se necesitaría una API y una base de datos.

## Versión empresarial ampliada

Se añadió una pantalla de acceso con presentación de la plataforma, formulario de inicio de sesión y cierre de sesión desde la barra superior. Credenciales locales de demostración:

- Usuario: `admin`
- Contraseña: `Nova2026!`

También se añadieron los espacios de **Procesamiento de datos** (lista de validaciones de calidad), **Auditoría** (última ejecución, K y registros procesados) y **Análisis comparativo** (comparación de gasto, visitas y antigüedad por segmento).

**Aviso de seguridad:** las credenciales son únicamente para la demostración académica en frontend. Para producción se requiere autenticación en backend, contraseñas con hash y gestión de sesiones/token seguros.
