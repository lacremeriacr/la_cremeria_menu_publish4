# Control administrativo – La Cremería

`Control_Restaurante_La_Cremeria.xlsx`: libro de Excel para llevar inventario, compras,
recetas / fichas técnicas, costeo y precios, ventas, mermas, planilla (CCSS/INS/provisiones),
gastos, cierre de caja, estado de resultados, punto de equilibrio, flujo de caja a 12 meses y dashboard.

- Celdas **azules** = se llenan; **grises** = se calculan solas. Empiece por la hoja `INICIO`.
- Los datos que trae son ejemplos ilustrativos: reemplácelos por los reales.
- Verifique las tasas CCSS, INS e impuesto de renta vigentes con su contador (hoja `CONFIG`).

Para regenerar el libro desde cero: `python3 administracion/generar_control_restaurante.py`

## QR para reseñas en Google

`qr-resena.html`: abre la página en el navegador, pega el enlace de "Pedir reseñas" de tu Perfil de Negocio
de Google (o el ID de lugar que empieza con `ChIJ`) y descarga la tarjeta de 4 × 6 pulgadas o solo el QR.
Para que la página muestre siempre tu enlace, pégalo en `ENLACE_PREDETERMINADO` dentro del archivo.
