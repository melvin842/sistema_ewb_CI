--
-- PostgreSQL database dump
--

\restrict CRPX3XKAftuPYleSIcPzV46Wxa3gQvMr5vo7QnjTXzMtfSjlIJZ9V5yZjNFv5pU

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-07-17 13:36:05

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

--
-- TOC entry 2 (class 3079 OID 49478)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 49424)
-- Name: imagenes_noticia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagenes_noticia (
    id integer NOT NULL,
    id_noticia integer NOT NULL,
    imagen character varying(255) NOT NULL
);


ALTER TABLE public.imagenes_noticia OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 49423)
-- Name: imagenes_noticia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagenes_noticia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagenes_noticia_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 234
-- Name: imagenes_noticia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagenes_noticia_id_seq OWNED BY public.imagenes_noticia.id;


--
-- TOC entry 221 (class 1259 OID 24743)
-- Name: imagenes_pagina; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagenes_pagina (
    id_imagen integer NOT NULL,
    seccion character varying(100),
    url_imagen text
);


ALTER TABLE public.imagenes_pagina OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24742)
-- Name: imagenes_pagina_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagenes_pagina_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagenes_pagina_id_imagen_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 220
-- Name: imagenes_pagina_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagenes_pagina_id_imagen_seq OWNED BY public.imagenes_pagina.id_imagen;


--
-- TOC entry 233 (class 1259 OID 49409)
-- Name: imagenes_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagenes_producto (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    imagen character varying(255) CONSTRAINT imagenes_producto_ruta_imagen_not_null NOT NULL,
    descripcion character varying(150)
);


ALTER TABLE public.imagenes_producto OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 49408)
-- Name: imagenes_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagenes_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagenes_producto_id_seq OWNER TO postgres;

--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 232
-- Name: imagenes_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagenes_producto_id_seq OWNED BY public.imagenes_producto.id;


--
-- TOC entry 231 (class 1259 OID 41300)
-- Name: noticias; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.noticias OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 41299)
-- Name: noticias_id_noticia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.noticias_id_noticia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.noticias_id_noticia_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 230
-- Name: noticias_id_noticia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.noticias_id_noticia_seq OWNED BY public.noticias.id_noticia;


--
-- TOC entry 237 (class 1259 OID 49442)
-- Name: postulaciones; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.postulaciones OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 49441)
-- Name: postulaciones_id_postulacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.postulaciones_id_postulacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.postulaciones_id_postulacion_seq OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 236
-- Name: postulaciones_id_postulacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.postulaciones_id_postulacion_seq OWNED BY public.postulaciones.id_postulacion;


--
-- TOC entry 225 (class 1259 OID 32958)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 32957)
-- Name: productos_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_producto_seq OWNER TO postgres;

--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 224
-- Name: productos_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_producto_seq OWNED BY public.productos.id_producto;


--
-- TOC entry 229 (class 1259 OID 41279)
-- Name: recursos_humanos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.recursos_humanos OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 41278)
-- Name: recursos_humanos_id_rh_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recursos_humanos_id_rh_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recursos_humanos_id_rh_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 228
-- Name: recursos_humanos_id_rh_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recursos_humanos_id_rh_seq OWNED BY public.recursos_humanos.id_rh;


--
-- TOC entry 227 (class 1259 OID 33063)
-- Name: sugerencias; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.sugerencias OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 33062)
-- Name: sugerencias_id_sugerencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sugerencias_id_sugerencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sugerencias_id_sugerencia_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 226
-- Name: sugerencias_id_sugerencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sugerencias_id_sugerencia_seq OWNED BY public.sugerencias.id_sugerencia;


--
-- TOC entry 223 (class 1259 OID 32935)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 32934)
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 222
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;


--
-- TOC entry 4950 (class 2604 OID 49427)
-- Name: imagenes_noticia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_noticia ALTER COLUMN id SET DEFAULT nextval('public.imagenes_noticia_id_seq'::regclass);


--
-- TOC entry 4934 (class 2604 OID 24746)
-- Name: imagenes_pagina id_imagen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_pagina ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagenes_pagina_id_imagen_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 49412)
-- Name: imagenes_producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_producto ALTER COLUMN id SET DEFAULT nextval('public.imagenes_producto_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 41303)
-- Name: noticias id_noticia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias ALTER COLUMN id_noticia SET DEFAULT nextval('public.noticias_id_noticia_seq'::regclass);


--
-- TOC entry 4951 (class 2604 OID 49445)
-- Name: postulaciones id_postulacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones ALTER COLUMN id_postulacion SET DEFAULT nextval('public.postulaciones_id_postulacion_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 32961)
-- Name: productos id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id_producto SET DEFAULT nextval('public.productos_id_producto_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 41282)
-- Name: recursos_humanos id_rh; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos_humanos ALTER COLUMN id_rh SET DEFAULT nextval('public.recursos_humanos_id_rh_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 33066)
-- Name: sugerencias id_sugerencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sugerencias ALTER COLUMN id_sugerencia SET DEFAULT nextval('public.sugerencias_id_sugerencia_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 32938)
-- Name: usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);


--
-- TOC entry 4980 (class 2606 OID 49432)
-- Name: imagenes_noticia imagenes_noticia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_noticia
    ADD CONSTRAINT imagenes_noticia_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 24751)
-- Name: imagenes_pagina imagenes_pagina_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_pagina
    ADD CONSTRAINT imagenes_pagina_pkey PRIMARY KEY (id_imagen);


--
-- TOC entry 4978 (class 2606 OID 49416)
-- Name: imagenes_producto imagenes_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT imagenes_producto_pkey PRIMARY KEY (id);


--
-- TOC entry 4976 (class 2606 OID 41315)
-- Name: noticias noticias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (id_noticia);


--
-- TOC entry 4982 (class 2606 OID 49457)
-- Name: postulaciones postulaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_pkey PRIMARY KEY (id_postulacion);


--
-- TOC entry 4970 (class 2606 OID 32967)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 4974 (class 2606 OID 41292)
-- Name: recursos_humanos recursos_humanos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos_humanos
    ADD CONSTRAINT recursos_humanos_pkey PRIMARY KEY (id_rh);


--
-- TOC entry 4972 (class 2606 OID 33076)
-- Name: sugerencias sugerencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sugerencias
    ADD CONSTRAINT sugerencias_pkey PRIMARY KEY (id_sugerencia);


--
-- TOC entry 4964 (class 2606 OID 41323)
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- TOC entry 4966 (class 2606 OID 32945)
-- Name: usuario usuario_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_nombre_key UNIQUE (nombre);


--
-- TOC entry 4968 (class 2606 OID 32943)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4987 (class 2606 OID 49433)
-- Name: imagenes_noticia fk_imagen_noticia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_noticia
    ADD CONSTRAINT fk_imagen_noticia FOREIGN KEY (id_noticia) REFERENCES public.noticias(id_noticia) ON DELETE CASCADE;


--
-- TOC entry 4986 (class 2606 OID 49417)
-- Name: imagenes_producto fk_imagen_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT fk_imagen_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto) ON DELETE CASCADE;


--
-- TOC entry 4985 (class 2606 OID 41316)
-- Name: noticias fk_noticias_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT fk_noticias_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- TOC entry 4988 (class 2606 OID 49458)
-- Name: postulaciones fk_postulacion_rh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT fk_postulacion_rh FOREIGN KEY (id_rh) REFERENCES public.recursos_humanos(id_rh) ON DELETE CASCADE;


--
-- TOC entry 4983 (class 2606 OID 32968)
-- Name: productos fk_productos_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fk_productos_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- TOC entry 4984 (class 2606 OID 41293)
-- Name: recursos_humanos fk_rh_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos_humanos
    ADD CONSTRAINT fk_rh_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


-- Completed on 2026-07-17 13:36:06

--
-- PostgreSQL database dump complete
--

\unrestrict CRPX3XKAftuPYleSIcPzV46Wxa3gQvMr5vo7QnjTXzMtfSjlIJZ9V5yZjNFv5pU

