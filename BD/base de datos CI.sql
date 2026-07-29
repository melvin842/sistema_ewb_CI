Create table usuario (
ID_usuario SERIAL PRIMARY KEY,
nombre VARCHAR(50) UNIQUE NOT NULL,
contrasena VARCHAR(255) NOT NULL
);

Create table productos (
ID_producto SERIAL PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
descripcion TEXT,
tipo VARCHAR(100) ,
imagen VARCHAR(255),
ID_usuario INT,

 CONSTRAINT fk_productos_usuario
 FOREIGN KEY (ID_usuario)
 REFERENCES usuario(ID_usuario)
);

CREATE TABLE imagenes_producto (
ID SERIAL PRIMARY KEY,
ID_producto INT NOT NULL,
imagen VARCHAR(255),
descripcion VARCHAR(150),

CONSTRAINT fk_imagen_producto
FOREIGN KEY (ID_producto)
REFERENCES productos(ID_producto)
ON DELETE CASCADE
);

CREATE TABLE recursos_humanos (
ID_rh SERIAL PRIMARY KEY,
titulo VARCHAR(150) NOT NULL,
descripcion TEXT NOT NULL,
requisitos TEXT,
horario VARCHAR(100),
salario VARCHAR (50),
ofrecemos TEXT,
estado VARCHAR(20)
CHECK (estado IN ('disponible', 'cerrada', 'proxima'))
DEFAULT 'disponible',
fecha_publicacion DATE DEFAULT CURRENT_DATE,
fecha_cierre DATE,
ID_usuario INT,

CONSTRAINT fk_rh_usuario
FOREIGN KEY (ID_usuario)
REFERENCES usuario(id_usuario)
);

CREATE TABLE postulaciones (
ID_postulacion SERIAL PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
correo VARCHAR(100) NOT NULL,
telefono VARCHAR(20),
cv VARCHAR(255) NOT NULL,
estado VARCHAR(20)
DEFAULT 'pendiente'
CHECK (
estado IN (
'pendiente',
'revisado',
'aceptado',
'rechazado'
)
),
fecha_postulacion TIMESTAMP
DEFAULT CURRENT_TIMESTAMP,
ID_rh INT NOT NULL,
CONSTRAINT fk_postulacion_rh
FOREIGN KEY (ID_rh)
REFERENCES recursos_humanos(ID_rh)
ON DELETE CASCADE
);

CREATE TABLE noticias (
ID_noticia SERIAL PRIMARY KEY,
titulo VARCHAR(150) NOT NULL,
tipo VARCHAR(20)
CHECK (tipo IN (
'noticia',
'aviso',
'comunicado',
'alerta'
)) NOT NULL,
categoria VARCHAR(30) NOT NULL,
imagen VARCHAR(255),
contenido TEXT NOT NULL,
estado VARCHAR(20) DEFAULT 'activo',
fecha_publicacion DATE DEFAULT CURRENT_DATE,
ID_usuario INT,

CONSTRAINT fk_noticias_usuario
FOREIGN KEY (ID_usuario)
REFERENCES usuario(ID_usuario)
);

CREATE TABLE imagenes_noticia (
ID SERIAL PRIMARY KEY,
ID_noticia INT NOT NULL,
imagen VARCHAR(255) NOT NULL,

CONSTRAINT fk_imagen_noticia
FOREIGN KEY (ID_noticia)
REFERENCES noticias(ID_noticia)
ON DELETE CASCADE
);

CREATE TABLE sugerencias (
ID_sugerencia SERIAL PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
correo VARCHAR(100) NOT NULL,
asunto VARCHAR(100) NOT NULL,
mensaje TEXT NOT NULL,
fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE  noticias;

ALTER TABLE productos
ADD COLUMN estado VARCHAR(20) DEFAULT 'activo',
ADD COLUMN motivo_baja VARCHAR(100);

ALTER TABLE productos
DROP CONSTRAINT fk_productos_admin;

ALTER TABLE noticias
DROP CONSTRAINT fk_noticias_admin;

ALTER TABLE recursos_humanos
DROP CONSTRAINT fk_rh_admin;

select*from productos;

ALTER TABLE noticias
ADD COLUMN imagen VARCHAR(255),
ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';

SELECT*FROM noticias;

ALTER TABLE productos
ALTER COLUMN imagen SET NOT NULL;

ALTER TABLE usuario
ADD COLUMN correo VARCHAR(100) UNIQUE NOT NULL;

SELECT current_user;

ALTER USER postgres WITH PASSWORD '123456';

INSERT INTO usuario(nombre, correo ,contrasena)
VALUES ('melvin', 'melvinamable84@gmail.com' ,'123456');

SELECT * FROM productos;

SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos';

SELECT * FROM usuario;

ALTER TABLE imagenes_producto 
ALTER COLUMN ruta_imagen SET NOT NULL;

ALTER TABLE imagenes_producto
RENAME COLUMN ruta_imagen TO imagen;

SELECT conname
FROM pg_constraint
WHERE conrelid = 'noticias'::regclass;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'noticias';

ALTER TABLE noticias
ADD CONSTRAINT noticias_estado_check
CHECK (estado IN ('activo', 'oculta'));

SELECT conname
FROM pg_constraint
WHERE conrelid = 'noticias'::regclass;

ALTER TABLE productos
ADD COLUMN descripcion_corta VARCHAR(200);

ALTER TABLE usuario
ADD COLUMN rol VARCHAR(20)
DEFAULT 'administrador'
CHECK (
    rol IN (
        'administrador',
        'editor',
        'rh'
    )
);

UPDATE usuario
SET rol = 'administrador'
WHERE ID_usuario = 2;

ALTER TABLE usuario
ALTER COLUMN rol SET DEFAULT 'administrador';

ALTER TABLE usuario
ADD COLUMN foto_perfil VARCHAR(255),
ADD COLUMN nombre_completo VARCHAR(150);

SELECT ID_usuario, nombre, nombre_completo
FROM usuario
WHERE nombre_completo IS NULL;

UPDATE usuario
SET nombre_completo = 'Melvin Amable Muñoz'
WHERE ID_usuario = 2;

SELECT *FROM usuario
WHERE nombre_completo IS NULL;

ALTER TABLE usuario
ALTER COLUMN nombre_completo SET NOT NULL;

INSERT INTO recursos_humanos 
    (titulo, descripcion, requisitos, horario, salario, ofrecemos, estado, ID_usuario)
VALUES 
(
    'Auxiliar Administrativo',
    'Apoyo en actividades administrativas, control documental y seguimiento de procesos internos.',
    'Carrera trunca o pasante en Administración, Contabilidad o afín. Manejo de Office. Buena ortografía.',
    'Lunes a viernes 8:00 - 17:00',
    '$8,000 - $10,000 MXN mensual',
    'Prestaciones de ley, buen ambiente laboral, capacitación.',
    'disponible',
    2
),
(
    'Chofer Repartidor',
    'Responsable de la distribución y entrega de productos, asegurando cumplimiento de rutas, horarios y normas de seguridad vial.',
    'Licencia de conducir vigente tipo B o C. Conocimiento de rutas locales. Responsable y puntual.',
    'Lunes a sábado 7:00 - 16:00',
    '$7,500 - $9,000 MXN mensual',
    'Prestaciones de ley, vales de gasolina, comisiones por entrega.',
    'disponible',
    2
);

ALTER TABLE recursos_humanos 
ADD COLUMN IF NOT EXISTS icono VARCHAR(60) DEFAULT 'work';

SELECT*FROM recursos_humanos ;

SELECT*FROM PRODUCTOS;


ALTER TABLE productos
RENAME COLUMN motivo_baja TO fecha;

ALTER TABLE productos
ALTER COLUMN fecha TYPE DATE
USING fecha::DATE;

UPDATE productos
SET fecha = '2026-06-19'
WHERE fecha IS NULL;

SELECT * FROM recursos_humanos;

ALTER TABLE noticias
ADD CONSTRAINT noticias_categoria_check
CHECK (
    categoria IN (
        'Empresa',
        'Productos',
        'Recursos Humanos',
        'Seguridad',
        'Calidad',
        'Eventos',
        'Promociones',
        'General'
    )
);

SELECT*FROM sugerencias;

ALTER TABLE sugerencias
ADD COLUMN estado VARCHAR(20) DEFAULT 'pendiente'
CHECK (estado IN ('pendiente', 'revisada'));

SELECT*FROM usuario;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE usuario
SET contrasena = crypt('123456', gen_salt('bf', 10))
WHERE correo = 'sofia@gmail.com';

UPDATE usuario
SET contrasena = crypt('123456', gen_salt('bf', 10))
WHERE correo = 'pedropp@gmail.com';

UPDATE usuario
SET contrasena = crypt('123456', gen_salt('bf', 10))
WHERE correo = 'juan@gmail.com';

UPDATE usuario
SET contrasena = crypt('123456', gen_salt('bf', 10))
WHERE correo = 'melvinamable84@gmail.com';

SELECT correo, contrasena FROM usuario;