CREATE TABLE `aranceles` (
	`id` text PRIMARY KEY NOT NULL,
	`grupo` text NOT NULL,
	`nombre` text NOT NULL,
	`precio` integer,
	`unidad` text DEFAULT '' NOT NULL,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`cupo` integer,
	`horario` text,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `aranceles_grupo_orden_idx` ON `aranceles` (`grupo`,`orden`);--> statement-breakpoint
INSERT OR IGNORE INTO `aranceles` (`id`,`grupo`,`nombre`,`precio`,`unidad`,`estado`,`cupo`,`horario`,`orden`) VALUES
('cuota-adulto','cuotas','Socio adulto',3500,'por mes','vigente',NULL,NULL,1),
('cuota-jubilado','cuotas','Socio jubilado',1800,'por mes','vigente',NULL,NULL,2),
('cuota-estudiante','cuotas','Socio estudiante',2000,'por mes','vigente',NULL,NULL,3),
('cuota-familiar','cuotas','Grupo familiar de hasta 4 personas',7000,'por mes','vigente',NULL,NULL,4),
('taller-encuadernacion','talleres','Encuadernación artesanal',11000,'por mes','vigente',8,'Sábados 10:00',1),
('taller-escritura','talleres','Escritura creativa',9000,'por mes','vigente',10,'Miércoles 18:30',2),
('taller-apoyo','talleres','Apoyo escolar primaria',4000,'por mes','vigente',12,'Martes y jueves 16:00',3),
('taller-ajedrez','talleres','Ajedrez para chicos',5500,'por mes','suspendido',10,'Viernes 17:00',4),
('serv-fotocopia','servicios','Fotocopia blanco y negro',120,'por hoja','vigente',NULL,NULL,1),
('serv-color','servicios','Impresión color',350,'por hoja','vigente',NULL,NULL,2),
('serv-escaneo','servicios','Escaneo',200,'por hoja','vigente',NULL,NULL,3),
('serv-carne','servicios','Reemplazo de carné',800,'','vigente',NULL,NULL,4),
('serv-multa','servicios','Multa por demora',150,'por libro y por día','vigente',NULL,NULL,5),
('serv-sala','servicios','Uso de sala de lectura',NULL,'','sin_cargo',NULL,NULL,6);
