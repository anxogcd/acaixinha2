# **Especificación de Alto Nivel (HLD)**

## **1\. Visión General**

**Nombre del Proyecto:** La cajita de los recuerdos / A caixiña das lembranzas.

**Descripción:** Aplicación web bilingüe (Español / Galego) que permite a los usuarios almacenar, gestionar y compartir "recuerdos" digitales. Cada recuerdo puede enriquecerse con metadatos de localización, etiquetas y archivos multimedia adjuntos.

**Convención de Idioma:** Toda la interfaz de usuario (UI) será bilingüe (ES/GL). Todo el código, nombres de variables, base de datos y modelos de dominio estarán estrictamente en **Inglés**.

## **2\. Arquitectura del Sistema**

El sistema sigue un modelo de aplicación web moderna (SPA) separada de una API Serverless alojada en AWS.

### **2.1. Frontend**

* **Framework:** React interactuando con Vite como bundler.  
* **UI Library:** shadcn/ui (basado en Tailwind CSS y Radix UI) para componentes accesibles y consistentes.  
* **Internacionalización (i18n):** Soporte nativo para Español y Galego.  
* **Hosting:** AWS S3 (Static Website Hosting) distribuido a través de AWS CloudFront (CDN) para baja latencia y alta disponibilidad.

### **2.2. Backend (API e Infraestructura)**

* **Cómputo:** AWS Lambda (funciones serverless).  
* **Punto de Entrada:** AWS API Gateway.  
* **Base de Datos:** Amazon DynamoDB (NoSQL).  
* **Almacenamiento de Archivos:** AWS S3. Las Lambdas generarán *Pre-signed URLs* para subida/descarga directa.  
* **Autenticación:** Amazon Cognito (User Pools) para registro, login y gestión de sesión vía JWT.  
* **Infraestructura como Código (IaC):** Terraform.

## **3\. Arquitectura de Software (Backend)**

El backend cumplirá con los principios de **Arquitectura Hexagonal (Ports & Adapters)**, **CQRS** y **Domain-Driven Design (DDD)**.

### **3.1. Reglas de Dependencia y Capas**

1. **Dominio (domain/):** Núcleo lógico (*Aggregates*, *Value Objects* con *branding* nominal, *Domain Services*, *Ports*, *Events*, *Exceptions*). Cero dependencias externas.  
2. **Aplicación (application/):** Orquestación vía CQRS (*Commands* / *Queries*).  
3. **Infraestructura (infrastructure/):** Adaptadores de persistencia (DynamoDB), Entry Points y DI Tokens.

### **3.2. Estructura de Directorios Estándar**

src/\<module-name\>/  
├── application/  
│   ├── commands/                  
│   ├── queries/                   
│   └── use-cases/                 
├── domain/  
│   ├── constants/                 
│   ├── exceptions/                
│   ├── events/                    
│   ├── models/                    
│   ├── repositories/              
│   ├── services/                  
│   └── value-objects/             
└── infrastructure/  
    ├── entities/                  
    ├── delivery/                  
    ├── repositories/              
    └── providers/               

## **4\. Modelo de Dominio Principal (Aggregates)**

Para mantener la pureza en DDD, los *Aggregates* referencian a otros mediante sus IDs en lugar de anidar objetos complejos.

### **Aggregate Root: User**

Gestiona la identidad extendida y la relación estructural del usuario con sus recuerdos.

* id (String \- UUID) \- Identificador único (mapeado desde el sub de Cognito).  
* name (String) \- Nombre público a mostrar.  
* username (String) \- Nombre de usuario único (handle, ej. @pepe).  
* avatarUrl (String) \- Ruta en S3 de su imagen de perfil.  
* description (String) \- Biografía o estado del usuario.  
* ownMemoryIds (Array of Strings) \- Lista de IDs de los recuerdos creados por él.  
* sharedMemoryIds (Array of Strings) \- Lista de IDs de los recuerdos a los que ha sido invitado.

### **Aggregate Root: Memory**

Entidad principal que almacena el recuerdo.

* id (String \- UUID) \- Identificador único.  
* title (String) \- Título del recuerdo.  
* description (Text) \- Cuerpo o detalle del recuerdo.  
* memoryDate (Timestamp) \- Fecha y hora en la que ocurrió el recuerdo.  
* locationName (String) \- Nombre del lugar (ej. "Praia de Samil, Vigo").  
* coordinates (Object) \- Latitud y longitud (latitude, longitude).  
* ownerId (String) \- ID del usuario creador (referencia a User).  
* tags (Array of Strings) \- Etiquetas para categorización.  
* sharedWithUserIds (Array of Strings) \- Lista de IDs de usuarios (User) con acceso al recuerdo.  
* attachments (Array of Objects Attachment) \- Lista de archivos adjuntos.

### **Value Object / Local Entity: Attachment**

Pertenece estructuralmente al agregado Memory.

* id (String \- UUID) \- Identificador del archivo.  
* s3Key (String) \- Ruta de almacenamiento en el bucket S3.  
* mimeType (String) \- Tipo MIME (pdf, imagen, audio, vídeo).  
* description (String) \- Breve texto descriptivo del archivo.  
* uploadedByUserId (String) \- ID del usuario que adjuntó este archivo.  
* uploadedAt (Timestamp) \- Cuándo se subió el archivo.

## **5\. Funcionalidades Core (MVP)**

1. **Gestión de Usuarios (User Module):**  
   * Autenticación vía Cognito. Un trigger post-confirmación creará el User en DynamoDB.  
   * Gestión de perfil (name, avatarUrl, description).  
   * Toggle en la UI para cambiar entre Español y Galego.  
2. **Gestión de Archivos (Pre-signed URLs):**  
   * El frontend solicita subida. El backend (Lambda) devuelve una URL prefirmada.  
   * El archivo se sube a S3. Se actualiza el Memory añadiendo el Attachment con su descripción.  
3. **CRUD de Recuerdos (Memory Module):**  
   * Crear, leer, actualizar (textos, tags) y eliminar recuerdos propios.  
4. **Búsqueda y Listado Avanzado:**  
   * Filtros combinados por texto, tags y rangos de fechas (memoryDate).  
   * El feed principal incluirá: los de ownMemoryIds \+ los de sharedMemoryIds.  
5. **Sistema de Compartición (Colaboración):**  
   * Un usuario puede invitar a otros vía username o id añadiéndolos a sharedWithUserIds.  
   * **Permisos granulares:** El usuario invitado solo tiene permisos de *lectura* sobre los datos del Memory y permisos de *escritura parcial* (exclusivamente para añadir nuevos objetos Attachment con su descripción). No puede editar el texto original, borrar el recuerdo ni borrar attachments subidos por otros.