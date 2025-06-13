# Dominio (domain)

Esta carpeta contiene el corazón de la lógica de negocio de la aplicación, siguiendo los principios de Clean Architecture.

## ¿Qué encontrarás aquí?
- **models/**: Modelos de dominio puros (ej: `Product`).
- **repositories/**: Interfaces (contratos) que definen cómo interactuar con los datos, sin importar la fuente.
- **use-cases/**: Casos de uso que orquestan la lógica de negocio. Los componentes de UI solo deben interactuar con estos casos de uso.

## Ejemplo
- `Product` es el modelo de producto.
- `IProductRepository` define las operaciones CRUD.
- `GetProductsUseCase` es el caso de uso para obtener productos.

> **Importante:** Aquí nunca debe haber lógica de infraestructura (HTTP, base de datos, etc), solo contratos y lógica de negocio.
