-- FUNCTION: public.caclulate_black_spots(uuid)

-- DROP FUNCTION public.caclulate_black_spots(uuid);


create schema if not exists works;
grant all on schema works to driver;
create or replace function works.find_segment(p geometry) returns geometry LANGUAGE 'plpgsql' as $B$
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
size_std numeric;
current_size numeric;
pieces numeric;
part_position numeric;
time_limit timestamp with time zone;
severe int;
count_points int;
costs numeric;
v_enum_costs hstore;
v_property_key text;
v_content_type_key text;
severity text;

begin
	select ii.geom into road from (
		select i.geom as geom from black_spots_road i order by i.geom <-> r.geom limit 10
	) as ii order by st_distance(ii.geom, r.geom) limit 1;

--	raise notice 'Country and boundary: %', b;
	raise notice 'Road: %', road;
	start_cut:=0;
	end_cut:=1;
	select st_Linelocatepoint(road, r.geom) into spot;
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
	if pieces > 1 then
		select st_Linelocatepoint(road, r.geom) into spot;
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
	end if;



return NULL;
end;
$B$;
ALTER FUNCTION works.find_segment(geometry)
    OWNER TO driver;


CREATE OR REPLACE FUNCTION works.caclulate_black_spots(
	recordtype uuid, elevated varchar)
    RETURNS void
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    
AS $BODY$
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
size_std numeric;
current_size numeric;
pieces numeric;
part_position numeric;
time_limit timestamp with time zone;
severe int;
count_points int;
costs numeric;
v_enum_costs hstore;
v_property_key text;
v_content_type_key text;
severity text;

--costs
begin
raise notice 'rec type %', recordtype;
size_std:=100;
select uuid into blackspotset_id from black_spots_blackspotset limit 1;
if blackspotset_id is null then
	raise notice 'Not found. Create.';
	select uuid_generate_v1() into blackspotset_id;
	INSERT INTO public.black_spots_blackspotset(
	uuid, created, modified, effective_start, effective_end, record_type_id)
	VALUES (blackspotset_id, now(), now(), now()-interval '1 year', now()+interval '1 year', recordtype);
end if;
delete from black_spots_blackspot  where black_spot_set_id=blackspotset_id;

select rc.enum_costs, rc.property_key, rc.content_type_key 
	into  v_enum_costs, v_property_key, v_content_type_key
	from data_recordcostconfig rc where rc.record_type_id=recordtype order by created  desc limit 1;

select uuid into recordschema from grout_recordschema where record_type_id=recordtype order by version desc limit 1;
select max(gr.occurred_from)-interval '3000 days' into time_limit from grout_record  gr join grout_recordschema gs on gs.uuid=gr.schema_id where archived='f' and gs.record_type_id=recordtype;
for r in select gr.* from grout_record gr join grout_recordschema gs on gs.uuid=gr.schema_id where archived='f' and gs.record_type_id=recordtype and occurred_from >= time_limit loop
	select v_enum_costs->replace((r.data->v_content_type_key->v_property_key)::text,'"', '') into costs;
	raise notice 'costs % to %', costs, r.data->v_content_type_key->v_property_key;
	severe = case when 
		(r.data->v_content_type_key->v_property_key)::text=elevated
			then
		1 
			else
		0 
	end;
	raise notice 'Severity is elevee %', ((r.data->v_content_type_key->v_property_key)::text=elevated);
	select bo.uuid into b 
		from grout_boundarypolygon bo 
		where st_contains(bo.geom, r.geom)='t';
	if b is null then
		raise notice 'Not in the country';
	else
		select ii.geom into road from (
			select i.geom as geom from black_spots_road i order by i.geom <-> r.geom limit 10
		) as ii order by st_distance(ii.geom, r.geom) limit 1;

		raise notice 'Country and boundary: %', b;
		raise notice 'Road: %', road;
		start_cut:=0;
		end_cut:=1;
		select st_Linelocatepoint(road, r.geom) into spot;
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
		if pieces > 1 then
			select st_Linelocatepoint(road, r.geom) into spot;
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
		end if;
		with upd_row as(
			update public.black_spots_blackspot set 
				modified=now(),
				num_records=num_records+1,
				num_severe=num_severe+severe,
				severity_score=severity_score+costs
			where st_contains(geom, road)='t' and black_spot_set_id=blackspotset_id
			returning uuid
		) select uuid into updated from upd_row;
		raise notice 'Updated: %', updated;
		if updated is null then
			if costs is null then
				costs:=0;
			end if;
			INSERT INTO public.black_spots_blackspot(
				uuid,
				created,
				modified, 
				geom, 
				severity_score, 
				num_records, 
				num_severe, 
				black_spot_set_id)
			VALUES (md5(random()::text || clock_timestamp()::text)::uuid
				, now(), 
				now(), 
				st_buffer(road::geography,30)::geometry, 
				costs, 
				1, 
				severe,
				blackspotset_id);
		end if;
	end if;
end loop;
select count(*) into count_points from black_spots_blackspot where black_spot_set_id=blackspotset_id;
delete from black_spots_blackspot  where black_spot_set_id=blackspotset_id and uuid not in (
	select uuid from black_spots_blackspot where black_spot_set_id=blackspotset_id order by severity_score desc, num_severe desc, num_records desc limit round(count_points/5) 
);
end;
$BODY$;
ALTER FUNCTION works.caclulate_black_spots(uuid, varchar)
    OWNER TO driver;
--select works.caclulate_black_spots((select uuid from grout_recordtype))

--insert into black_spots_road (geom, roadmap_id, created, modified, data) 
--select st_linemerge(geom), (SELECT uuid from black_spots_roadmap), now(), now(), '{}'::jsonb from temp_table
 

--select uuid from grout_recordtype

--delete from black_spots_blackspotset cascade;