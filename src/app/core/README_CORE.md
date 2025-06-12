# Core Layer

Esta carpeta contiene utilidades y helpers globales para la aplicación Angular, como el helper genérico para peticiones HTTP (`HttpHelper`).

## Ventajas
- Desacopla la lógica de red de los servicios de dominio.
- Facilita el testeo y la reutilización.
- Permite centralizar lógica común (headers, manejo de errores, etc.) en un solo lugar.
