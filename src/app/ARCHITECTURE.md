# 🏗️ ARQUITECTURA DEL PROYECTO

## 📂 Estructura de Carpetas

```
src/app/
├── 🎯 core/                    # Servicios centrales y singleton
│   ├── interceptors/           # HTTP interceptors
│   ├── guards/                 # Route guards
│   └── services/               # Servicios globales (auth, error handling)
│
├── 🔗 shared/                  # Componentes y utilidades compartidas
│   ├── components/             # Componentes reutilizables (UI puros)
│   ├── directives/             # Directivas compartidas
│   ├── pipes/                  # Pipes personalizados
│   └── utils/                  # Funciones utilitarias
│
├── 🎨 features/               # Módulos de funcionalidades
│   └── products/
│       ├── presentation/       # Componentes UI puros (presentational)
│       ├── containers/         # Smart components (containers)
│       └── services/           # Facades y state management
│
├── 🧠 domain/                 # Lógica de negocio pura
│   ├── models/                 # Entidades y value objects
│   ├── repositories/           # Interfaces de repositorios
│   └── use-cases/              # Casos de uso (business logic)
│
├── 🔌 infrastructure/         # Implementaciones externas
│   ├── repositories/           # Implementaciones de repositorios
│   └── services/               # Servicios externos (API, storage)
│
├── 📊 data/                   # Legacy - Para migrar
└── 🏪 store/                  # NgRx store (global state)
```

## 🎯 Principios de Arquitectura

### 1. **Separación de Responsabilidades**

- **Presentation**: Solo UI y interacción del usuario
- **Containers**: Orquestación y estado local
- **Domain**: Lógica de negocio pura
- **Infrastructure**: Comunicación externa

### 2. **Flujo de Datos**

```
User Interaction → Container → Use Case → Repository → API
                ↓
UI Components ← Container ← Use Case ← Repository ← Response
```

### 3. **Dependencias**

```
Features → Domain ← Infrastructure
    ↑         ↑
  Shared    Core
```

### 4. **Estrategias de Performance**

- ✅ OnPush Change Detection
- ✅ Signals para reactividad
- ✅ Lazy Loading de módulos
- ✅ Trackby functions
- ✅ Memoización de cálculos

## 🧩 Tipos de Componentes

### **Presentation Components (Dumb/Pure)**

- Solo reciben datos vía `@Input()`
- Emiten eventos vía `@Output()`
- No tienen lógica de negocio
- ChangeDetection OnPush
- Fáciles de testear

### **Container Components (Smart)**

- Manejan estado y lógica de aplicación
- Se conectan con servicios/store
- Orquestan componentes de presentación
- Mínima lógica de UI

## 📋 Naming Conventions

```typescript
// Presentation Components
product - card.component.ts;
product - form.component.ts;
product - list.component.ts;

// Container Components
product - list - container.component.ts;
product - form - container.component.ts;

// Services
product.facade.ts;
product.state.ts;

// Use Cases
get - products.usecase.ts;
create - product.usecase.ts;
```

## 🔄 Migration Status

- ✅ Core structure created
- 🔄 Moving existing components
- ⏳ Implementing new architecture
- ⏳ Adding performance optimizations
