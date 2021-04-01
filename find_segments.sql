-- FUNCTION: public.caclulate_black_spots(uuid)
CREATE EXTENSION IF NOT EXISTS  HSTORE; CREATE EXTENSION  IF NOT EXISTS POSTGIS;CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- select * from works.find_segment((select geom from grout_record limit 1), 100)

-- drop function works.find_segment(geometry, numeric);
--select * from works.find_segment(st_geomfromewkt('SRID=4326;POINT (-68.087329 -16.540165)'), 100)

--select works.find_segment(st_geomfromewkt((select st_asewkt(geom) from grout_record limit 1)), 100)
--(select st_asewkt(geom) from grout_record limit 1)
-- select st_geomfromewkt('SRID=4326;POINT (-68.087329 -16.540165)')
create schema if not exists works;
grant all on schema works to driver;

-- select * from works.find_segment(st_geomfromewkt('SRID=4326;POINT (-68.076719 -16.544928)'), 100)

create or replace function works.find_segment(p geometry, size_std numeric) returns table(
	geom varchar,
	road_name varchar
	)
	
	LANGUAGE 'plpgsql' as $B$
declare
r record;
rr record;
rrr record;
b uuid;
blackspotset_id uuid;
recordschema uuid;
road geometry;
updated uuid;
start_cut numeric;
end_cut numeric;
spot numeric;
current_intersection numeric;
current_intersection_g geometry;
current_size numeric;
pieces numeric;
part_position numeric;
time_limit timestamp with time zone;
severe int;
road_name varchar;

begin
	select ii.geom, ii.name into road, road_name from (
		select i.geom as geom, i.name from black_spots_road i order by i.geom <-> p limit 10
	) as ii order by st_distance(ii.geom, p) limit 1;

--	raise notice 'Country and boundary: %', b;
	raise notice 'Road: % %', road_name, road;
	start_cut:=0;
	end_cut:=1;
	select st_Linelocatepoint(road, p) into spot;
	raise notice 'Spot is located at %', spot;
	for rr in select i.geom as geom from black_spots_road i where st_intersects(i.geom, road)='t' and not st_equals(i.geom,road) loop
		select st_intersection(rr.geom, road) into current_intersection_g;
		raise notice '%', ST_GeometryType(current_intersection_g);
		if ST_GeometryType(current_intersection_g)='ST_Point' then 
			select st_linelocatepoint(road, current_intersection_g) into current_intersection;
			raise notice 'Intersection %', current_intersection;
			if current_intersection>spot then
				if current_intersection<end_cut then
					end_cut:=current_intersection;
				end if;
			elsif current_intersection<spot then
				if current_intersection>start_cut then
					start_cut:=current_intersection;
				end if;
			end if;
		end if;
	end loop;
	raise notice 'max min % %', start_cut, end_cut;
	select st_linesubstring(road, start_cut, end_cut) into road;				
	pieces:=round(st_length(road::geography)/size_std);
	raise notice '% pieces fit', pieces;
	if pieces<=1 then
		return query select st_asewkt(road)::varchar as geom, road_name;
	else
		select st_Linelocatepoint(road, p) into spot;
		start_cut:=0;
		end_cut:=1;
		current_size:=1.0/pieces;
		part_position:=floor(spot/current_size);
		if part_position >= pieces then
			part_position:=pieces-1;
			raise notice 'ERRRRRRRR';
		end if;
		raise notice 'Will be part % of %', part_position, pieces;
		raise notice 'This is % % ', part_position*current_size,(part_position+1)*current_size;
		road:=st_linesubstring(road, part_position*current_size,(part_position+1)*current_size);
		return query select st_asewkt(road)::varchar as geom, road_name;
	end if;
--return query select null, null;
end;
$B$;
ALTER FUNCTION works.find_segment(geometry,numeric)
    OWNER TO driver;
