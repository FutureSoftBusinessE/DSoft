--1 poner usuario                                           --pusuario                     --pempresa            Jessenia Gomez Practicasa
-- fsoft.Practi                   jgomez@Practi   --encryp(jgomez)               Practi  Jairo Gomez Mercatti
select * from DSOFT.dbo.fsbsmcliusu where cliciausu = '­v}xg' and cliciagrupo = 'Practi'
--usuario no existe

--2 muestro las compañias
select a.cliciaciacodigo,
 a.cliciacianombre,
 a.cliciarutaBD,
 a.clicianonBD from DSOFT.dbo.fsbsmclicia a
	inner join DSOFT.dbo.fsbsmcliusu b on a.cliciaidenti = b.cliciaidenti and b.cliciagrupo = b.cliciagrupo
where b.cliciausu = '­v}xg' --pusuario
and b.cliciagrupo = 'Practi' --pempresa


---Selecciona compañia "01"

--3 ingresado a la compañia

              --${p_prefijo}.dbo.siacusar where usrcodigo = ${p_usuario} / falta la contrasenia
select * from SiacPracticasa.dbo.siaccusr where usrcodigo = '­v}xg' and usrclave = 'I4bªszuj'

--4 localidad
-- select b.locdescri,
b.loccodigo from SiacPracticasa.dbo.siactloc a inner join cgblocal b on a.ciacodigo = b.ciacodigo and a.loccodigo = b.loccodigo
-- 	where a.ciacodigo = '02' and usrcodigo = '­v}xg' and b.locstatus = 'A'
-- 	                                     --${p_usuario}

select b.locdescri,
b.loccodigo from SiacPracticasa.dbo.siactloc a inner join SiacPracticasa.dbo.cgblocal b on a.ciacodigo = b.ciacodigo and a.loccodigo = b.loccodigo
	where a.ciacodigo = '01' and usrcodigo = '­v}xg' and b.locstatus = 'A'
	                                     --${p_usuario}

---seleccione localidad

--5 armar menu
select a.* from siacpracticasa.dbo.siacopc a inner join siacpracticasa.dbo.siactusrweb b on a.opctag = b.opctag and a.modcodigo = b.modcodigo
	where b.ciacodigo = '01' and b.usrcodigo = '­v}xg' and b.modcodigo = 'WEB'
order by a.opctag





SELECT COLUMN_NAME, DATA_TYPE
FROM SiacPracticasa.INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'fapvendedor';


(
	select concat(
		'PE',
		(select top 1 locservidor from SiacIlsaboremio.dbo.siacser  where serstatus='A'),
		SUBSTRING(
			(
				CAST (year(SYSDATETIME()) as varchar(10))
			),
			3,
			4
		),
		FORMAT(
			-- (select dptonumsec from SiacIlsaboremio.dbo.cgpdpto where doccodigo ='PED' and ciacodigo =@ciacodigo and loccodigo =@loccodigo) ,
			(select dptonumsec from SiacIlsaboremio.dbo.cgpdpto where doccodigo ='PED' and ciacodigo ="01" and loccodigo ="01") ,
			'000000'
		) ,
		'01'
		)
)

SELECT TOP 100 *
FROM SiacPracticasa.dbo.facped

select REPLICATE('-', linnivel) as sangria,linnivel,lincodigo,lindescri from SiacPracticasa.dbo.inblin


-- insert into SiacPracticasa.dbo.facped
-- (pednumped,
--  pedtivapor,
--  pedsubtot,
--  pediva,
--  pedtotal,
--  pedusuisys,
--  pedusumodi,
--  pedfeccrea,
--  pedfecmodi)
-- values ( @pednumped,

-- @pedtivapor,

-- @pedsubtot,

-- @pediva,

-- @pedtotal,

-- @pedusuisys,
--  User,
--  SYSDATETIME(),
--  SYSDATETIME() );

insert into SiacPracticasa.dbo.facped
values(
	'01',
	@pednumped,
	'01',
	NULL,
	'PR',
	'EFE',
	'D',
	'000001',
	'000001',
	'GUAYAQUIL',
	0.00,
	SYSDATETIME(),
	SYSDATETIME(),
	0.00,
	@pedtivapor,
	@pedsubtot,
	@pediva,
	@pedtotal,
	'P',
	'prueba app mobile',
	SYSDATETIME(),
	SYSDATETIME(),
	@pedusuisys,
	User,
	SYSDATETIME(),
	SYSDATETIME(),
	@pedusuisys,
	User,
	null,
	(select vencodigo from SiacPracticasa.dbo.fapvendedor where 1=1 and usrcodigo=@pedusuisys and ciacodigo =@ciacodigo and loccodigo=@loccodigo),
	(select zoncodigo from SiacPracticasa.dbo.cxcmcli where clicodigo ='000001'),
	0.00,
	0.00,
	0.00,
	0.00,
	(select tipcodigo from SiacPracticasa.dbo.cxcmcli where clicodigo ='000001'),
	0.00,
	12.00,
	0.00,
	0.00,
	0.00,
	0,
	'CC',
	1,
	0,
	0.00,
	0,
	0.00,
	0.00,
	0,
	0,
	0,
	null,
	null,
	null,
	0,
	0.00,
	-1,
	0,
	NULL,
	0,
	NULL,
	'000',
	'000',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0.00,
	(select regcodigo from SiacPracticasa.dbo.cxcmcli where clicodigo ='000001'),
	(select ciucodigo from SiacPracticasa.dbo.cxcmcli where clicodigo ='000001'),
	(select procodigo from SiacPracticasa.dbo.cxcmcli where clicodigo ='000001'),
	0,
	1,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	0.00,
	NULL,
	'000',
	'B',
	NULL,
	NULL,
	NULL,
	' ',
	(select top 1 sysservicio from SiacPracticasa.dbo.SiacSys),
	@pedvalser,
	@mesacodigo
);


-- --1 poner usuario
-- -- fsoft.Practi
-- select * from DSOFT.dbo.fsbsmcliusu where cliciausu = '­¡ƒsv' and cliciagrupo = 'Mercatti'
-- --usuario no existe

-- --2 muestro las compa�ias
-- select a.cliciaciacodigo,
 a.cliciacianombre,
 a.cliciarutaBD,
 a.clicianonBD from DSOFT.dbo.fsbsmclicia a
-- 	inner join DSOFT.dbo.fsbsmcliusu b on a.cliciaidenti = b.cliciaidenti and b.cliciagrupo = b.cliciagrupo
-- where b.cliciausu = '_‹xAƒ‚P_NO' and b.cliciagrupo = 'Mercatti'
-- ---Selecciona compa�ia "01"

-- --3 ingresado a la compa�ia,
 para el usuario '_‹xAƒ‚P_NO' tiene clicianonBD = SiacMercatti,
 entonces
-- -- select * from SiacPracticasa.dbo.SiacMercatti where usrcodigo = '_‹xAƒ‚P_NO'
-- select * from SiacMercatti.dbo.siactusr where usrcodigo = '­¡ƒsv'

-- --- TODO: hasta aqui entiendo lo que hay que hacer vamos a ver luego

-- --4 localidad
-- select b.locdescri from SiacPracticasa.dbo.siactloc a inner join cgblocal b on a.ciacodigo = b.ciacodigo and a.loccodigo = b.loccodigo
-- 	where a.ciacodigo = '01' and usrcodigo = '�v}xg' and b.locstatus = 'A'

-- ---seleccione localidad

-- --5 armar menu
-- select a.* from siacopc a inner join siactusrweb b on a.opctag = b.opctag and a.modcodigo = b.modcodigo
-- 	where b.ciacodigo = '01' and b.usrcodigo = '�v}xg' and b.modcodigo = 'WEB'
-- order by a.opctag


-- select * from siacopc where modcodigo = 'WEB'




insert into SiacIlsaboremio.dbo.fatped values (
	@ciacodigo,
	@pednumped,
	@pedsecuen,NULL,'PR',-1, 'EFE','D',0.00,   ${fechaSistema}, (select clicodigo from SiacIlsaboremio.dbo.facped where pednumped =@pednumped),@loccodigo, 1,@pedstatus, '','01',    @artcodigo,'01','',(select lincodigo from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo),
  (select vencodigo from SiacIlsaboremio.dbo.facped where pednumped =@pednumped),
  (select zoncodigo from SiacIlsaboremio.dbo.facped where pednumped =@pednumped),'',@pedcantidad,0.000000, 0.000000,
  (select artprecventa1 from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo),0.000000,0.000000, 0.000000, 12.00,
  (select (artprecventa1*0.12) * @pedcantidad from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo),
  (select (artprecventa1* @pedcantidad) from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo),
  (select ((artprecventa1*0.12) + artprecventa1)*@pedcantidad from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo),${fechaSistema}, CONVERT (time, ${horaSistema}), @pedusuisys, User,${fechaSistema}, CONVERT (time, ${horaSistema}), @pedusuisys,  User,'001', 0.000000, '', 0, 0.000000, 'UNI','ISM','0.00', 0, -1, 0,    NULL, 0,'000','000',${fechaSistema}, 0.000000, 0.000000,10.000000,1,'000',(select artdescri from SiacIlsaboremio.dbo.inmart where artcodigo=@artcodigo), NULL, NULL, NULL, NULL, NULL, NULL, NULL,    NULL, NULL, NULL, NULL, NULL, (select mesacodigo from SiacIlsaboremio.dbo.facped where pednumped =@pednumped), 0, NULL, @pedcomencoci )`,
