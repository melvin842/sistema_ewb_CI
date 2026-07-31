--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: imagenes_noticia
--

CREATE TABLE public.imagenes_noticia (
    id integer NOT NULL,
    id_noticia integer NOT NULL,
    imagen character varying(255) NOT NULL
);

CREATE SEQUENCE public.imagenes_noticia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.imagenes_noticia_id_seq OWNED BY public.imagenes_noticia.id;

--
-- Name: imagenes_pagina
--

CREATE TABLE public.imagenes_pagina (
    id_imagen integer NOT NULL,
    seccion character varying(100),
    url_imagen text
);

CREATE SEQUENCE public.imagenes_pagina_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.imagenes_pagina_id_imagen_seq OWNED BY public.imagenes_pagina.id_imagen;

--
-- Name: imagenes_producto
--

CREATE TABLE public.imagenes_producto (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    imagen character varying(255) CONSTRAINT imagenes_producto_ruta_imagen_not_null NOT NULL,
    descripcion character varying(150)
);

CREATE SEQUENCE public.imagenes_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.imagenes_producto_id_seq OWNED BY public.imagenes_producto.id;

--
-- Name: noticias
--

CREATE TABLE public.noticias (
    id_noticia integer NOT NULL,
    titulo character varying(150) NOT NULL,
    tipo character varying(20) NOT NULL,
    categoria character varying(30) NOT NULL,
    imagen character varying(255),
    contenido text NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_publicacion date DEFAULT CURRENT_DATE,
    id_usuario integer,
    CONSTRAINT noticias_categoria_check CHECK (((categoria)::text = ANY ((ARRAY['Empresa'::character varying, 'Productos'::character varying, 'Recursos Humanos'::character varying, 'Seguridad'::character varying, 'Calidad'::character varying, 'Eventos'::character varying, 'Promociones'::character varying, 'General'::character varying])::text[]))),
    CONSTRAINT noticias_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'oculta'::character varying])::text[]))),
    CONSTRAINT noticias_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['noticia'::character varying, 'aviso'::character varying, 'comunicado'::character varying, 'alerta'::character varying])::text[])))
);

CREATE SEQUENCE public.noticias_id_noticia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.noticias_id_noticia_seq OWNED BY public.noticias.id_noticia;

--
-- Name: postulaciones
--

CREATE TABLE public.postulaciones (
    id_postulacion integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    telefono character varying(20),
    cv character varying(255) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_postulacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_rh integer NOT NULL,
    CONSTRAINT postulaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'revisado'::character varying, 'aceptado'::character varying, 'rechazado'::character varying])::text[])))
);

CREATE SEQUENCE public.postulaciones_id_postulacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.postulaciones_id_postulacion_seq OWNED BY public.postulaciones.id_postulacion;

--
-- Name: productos
--

CREATE TABLE public.productos (
    id_producto integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    tipo character varying(100),
    imagen character varying(255) NOT NULL,
    id_usuario integer,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha date,
    descripcion_corta character varying(200)
);

CREATE SEQUENCE public.productos_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.productos_id_producto_seq OWNED BY public.productos.id_producto;

--
-- Name: recursos_humanos
--

CREATE TABLE public.recursos_humanos (
    id_rh integer NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text NOT NULL,
    requisitos text,
    horario character varying(100),
    salario character varying(50),
    ofrecemos text,
    estado character varying(20) DEFAULT 'disponible'::character varying,
    fecha_publicacion date DEFAULT CURRENT_DATE,
    fecha_cierre date,
    id_usuario integer,
    imagen character varying(255),
    icono character varying(60) DEFAULT 'work'::character varying,
    CONSTRAINT recursos_humanos_estado_check CHECK (((estado)::text = ANY ((ARRAY['disponible'::character varying, 'cerrada'::character varying, 'proxima'::character varying])::text[])))
);

CREATE SEQUENCE public.recursos_humanos_id_rh_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.recursos_humanos_id_rh_seq OWNED BY public.recursos_humanos.id_rh;

--
-- Name: sugerencias
--

CREATE TABLE public.sugerencias (
    id_sugerencia integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    asunto character varying(100) NOT NULL,
    mensaje text NOT NULL,
    fecha_envio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    CONSTRAINT sugerencias_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'revisada'::character varying])::text[])))
);

CREATE SEQUENCE public.sugerencias_id_sugerencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.sugerencias_id_sugerencia_seq OWNED BY public.sugerencias.id_sugerencia;

--
-- Name: usuario
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    nombre character varying(50) NOT NULL,
    contrasena character varying(255) NOT NULL,
    correo character varying(100) NOT NULL,
    rol character varying(20) DEFAULT 'administrador'::character varying,
    foto_perfil character varying(255),
    nombre_completo character varying(150) NOT NULL,
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['administrador'::character varying, 'editor'::character varying, 'rh'::character varying])::text[])))
);

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;

--
-- Defaults
--

ALTER TABLE ONLY public.imagenes_noticia ALTER COLUMN id SET DEFAULT nextval('public.imagenes_noticia_id_seq'::regclass);
ALTER TABLE ONLY public.imagenes_pagina ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagenes_pagina_id_imagen_seq'::regclass);
ALTER TABLE ONLY public.imagenes_producto ALTER COLUMN id SET DEFAULT nextval('public.imagenes_producto_id_seq'::regclass);
ALTER TABLE ONLY public.noticias ALTER COLUMN id_noticia SET DEFAULT nextval('public.noticias_id_noticia_seq'::regclass);
ALTER TABLE ONLY public.postulaciones ALTER COLUMN id_postulacion SET DEFAULT nextval('public.postulaciones_id_postulacion_seq'::regclass);
ALTER TABLE ONLY public.productos ALTER COLUMN id_producto SET DEFAULT nextval('public.productos_id_producto_seq'::regclass);
ALTER TABLE ONLY public.recursos_humanos ALTER COLUMN id_rh SET DEFAULT nextval('public.recursos_humanos_id_rh_seq'::regclass);
ALTER TABLE ONLY public.sugerencias ALTER COLUMN id_sugerencia SET DEFAULT nextval('public.sugerencias_id_sugerencia_seq'::regclass);
ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);

--
-- Primary Keys / Unique Constraints
--

ALTER TABLE ONLY public.imagenes_noticia
    ADD CONSTRAINT imagenes_noticia_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.imagenes_pagina
    ADD CONSTRAINT imagenes_pagina_pkey PRIMARY KEY (id_imagen);

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT imagenes_producto_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (id_noticia);

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_pkey PRIMARY KEY (id_postulacion);

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);

ALTER TABLE ONLY public.recursos_humanos
    ADD CONSTRAINT recursos_humanos_pkey PRIMARY KEY (id_rh);

ALTER TABLE ONLY public.sugerencias
    ADD CONSTRAINT sugerencias_pkey PRIMARY KEY (id_sugerencia);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);

--
-- Foreign Keys
--

ALTER TABLE ONLY public.imagenes_noticia
    ADD CONSTRAINT fk_imagen_noticia FOREIGN KEY (id_noticia) REFERENCES public.noticias(id_noticia) ON DELETE CASCADE;

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT fk_imagen_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto) ON DELETE CASCADE;

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT fk_noticias_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT fk_postulacion_rh FOREIGN KEY (id_rh) REFERENCES public.recursos_humanos(id_rh) ON DELETE CASCADE;

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fk_productos_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE ONLY public.recursos_humanos
    ADD CONSTRAINT fk_rh_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';


CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuario (nombre, correo, contrasena, nombre_completo, rol)
VALUES (
    'melvin',
    'melvinamable84@gmail.com',
    crypt('123456', gen_salt('bf', 10)),
    'Melvin Amable Muñoz',
    'administrador'
);

SET search_path TO public;