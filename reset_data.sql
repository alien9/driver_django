create or replace function works.find_segment(point_geometry varchar, size_std numeric, roadmap varchar) returns table(
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
road_field_name varchar;
begin
	execute 'select ii.geom, ii.name from (
		select i.geom as geom, i.data->rd.display_field as name from black_spots_road i 
		join black_spots_roadmap rd on i.roadmap_id=rd.uuid
		where i.roadmap_id='''||roadmap||'''::uuid order by i.geom <-> st_geomfromewkt('''||point_geometry||''') limit 10
	) as ii order by st_distance(ii.geom, st_geomfromewkt('''||point_geometry||''')) limit 1;' into  road, road_name;

	start_cut:=0;
	end_cut:=1;
	select st_Linelocatepoint(road, st_geomfromewkt(point_geometry)) into spot;
	for rr in select i.geom as geom from black_spots_road i where st_intersects(i.geom, road)='t' and not st_equals(i.geom,road) and i.roadmap_id=roadmap::uuid loop
		select st_intersection(rr.geom, road) into current_intersection_g;
		if ST_GeometryType(current_intersection_g)='ST_Point' then 
			select st_linelocatepoint(road, current_intersection_g) into current_intersection;
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
	select st_linesubstring(road, start_cut, end_cut) into road;				
	pieces:=round(st_length(road::geography)/size_std);
	if pieces<=1 then
		return query select st_asewkt(road)::varchar as geom, road_name;
	else
		select st_Linelocatepoint(road, st_geomfromewkt(point_geometry)) into spot;
		start_cut:=0;
		end_cut:=1;
		current_size:=1.0/pieces;
		part_position:=floor(spot/current_size);
		if part_position >= pieces then
			part_position:=pieces-1;
			raise notice 'ERRRRRRRR';
		end if;
		road:=st_linesubstring(road, part_position*current_size,(part_position+1)*current_size);
		return query select st_asewkt(road)::varchar as geom, road_name;
	end if;
end;
$B$;
truncate grout_recordtype cascade;
truncate data_recordsegment cascade;