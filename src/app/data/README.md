# Data

Esta carpeta contiene las implementaciones concretas de los repositorios definidos en el dominio. Aquí se conecta la lógica de negocio con la infraestructura real (API, base de datos, etc).

## ¿Qué encontrarás aquí?
- **repositories/**: Implementaciones de los contratos del dominio, usando servicios HTTP, APIs, etc.

## Ejemplo
- `ProductRepositoryImpl` implementa `IProductRepository` usando una API REST.

> **Importante:** Ningún componente de UI debe importar directamente los servicios de aquí, siempre deben usar los casos de uso del dominio.
