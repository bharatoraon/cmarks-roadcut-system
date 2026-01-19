-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL
);

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'agency_user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roads Table
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    owner VARCHAR(100),
    surface_type VARCHAR(50),
    geom GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_roads_geom ON roads USING GIST (geom);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id),
    purpose TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    geom GEOMETRY(Geometry, 4326), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_apps_geom ON applications USING GIST (geom);

-- Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom);

-- Wards Table
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_wards_geom ON wards USING GIST (geom);

-- Seed Initial Agencies
INSERT INTO agencies (name, type) VALUES 
('GCC', 'authority'),
('CMWSSB', 'utility'),
('TANGEDCO', 'utility'),
('CMRL', 'utility')
ON CONFLICT (name) DO NOTHING;
