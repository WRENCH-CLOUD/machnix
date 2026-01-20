drop extension if exists "pg_net";

revoke delete on table "public"."leads" from "anon";

revoke insert on table "public"."leads" from "anon";

revoke references on table "public"."leads" from "anon";

revoke select on table "public"."leads" from "anon";

revoke trigger on table "public"."leads" from "anon";

revoke truncate on table "public"."leads" from "anon";

revoke update on table "public"."leads" from "anon";

revoke references on table "public"."leads" from "authenticated";

revoke trigger on table "public"."leads" from "authenticated";

revoke truncate on table "public"."leads" from "authenticated";

revoke references on table "public"."leads" from "service_role";

revoke trigger on table "public"."leads" from "service_role";

revoke truncate on table "public"."leads" from "service_role";

revoke delete on table "public"."platform_admins" from "anon";

revoke insert on table "public"."platform_admins" from "anon";

revoke references on table "public"."platform_admins" from "anon";

revoke select on table "public"."platform_admins" from "anon";

revoke trigger on table "public"."platform_admins" from "anon";

revoke truncate on table "public"."platform_admins" from "anon";

revoke update on table "public"."platform_admins" from "anon";

revoke references on table "public"."platform_admins" from "authenticated";

revoke trigger on table "public"."platform_admins" from "authenticated";

revoke truncate on table "public"."platform_admins" from "authenticated";

revoke delete on table "public"."vehicle_category" from "anon";

revoke insert on table "public"."vehicle_category" from "anon";

revoke references on table "public"."vehicle_category" from "anon";

revoke select on table "public"."vehicle_category" from "anon";

revoke trigger on table "public"."vehicle_category" from "anon";

revoke truncate on table "public"."vehicle_category" from "anon";

revoke update on table "public"."vehicle_category" from "anon";

revoke delete on table "public"."vehicle_category" from "authenticated";

revoke insert on table "public"."vehicle_category" from "authenticated";

revoke references on table "public"."vehicle_category" from "authenticated";

revoke select on table "public"."vehicle_category" from "authenticated";

revoke trigger on table "public"."vehicle_category" from "authenticated";

revoke truncate on table "public"."vehicle_category" from "authenticated";

revoke update on table "public"."vehicle_category" from "authenticated";

revoke delete on table "public"."vehicle_category" from "service_role";

revoke insert on table "public"."vehicle_category" from "service_role";

revoke references on table "public"."vehicle_category" from "service_role";

revoke select on table "public"."vehicle_category" from "service_role";

revoke trigger on table "public"."vehicle_category" from "service_role";

revoke truncate on table "public"."vehicle_category" from "service_role";

revoke update on table "public"."vehicle_category" from "service_role";

revoke delete on table "public"."vehicle_make" from "anon";

revoke insert on table "public"."vehicle_make" from "anon";

revoke references on table "public"."vehicle_make" from "anon";

revoke select on table "public"."vehicle_make" from "anon";

revoke trigger on table "public"."vehicle_make" from "anon";

revoke truncate on table "public"."vehicle_make" from "anon";

revoke update on table "public"."vehicle_make" from "anon";

revoke delete on table "public"."vehicle_make" from "authenticated";

revoke insert on table "public"."vehicle_make" from "authenticated";

revoke references on table "public"."vehicle_make" from "authenticated";

revoke select on table "public"."vehicle_make" from "authenticated";

revoke trigger on table "public"."vehicle_make" from "authenticated";

revoke truncate on table "public"."vehicle_make" from "authenticated";

revoke update on table "public"."vehicle_make" from "authenticated";

revoke delete on table "public"."vehicle_make" from "service_role";

revoke insert on table "public"."vehicle_make" from "service_role";

revoke references on table "public"."vehicle_make" from "service_role";

revoke select on table "public"."vehicle_make" from "service_role";

revoke trigger on table "public"."vehicle_make" from "service_role";

revoke truncate on table "public"."vehicle_make" from "service_role";

revoke update on table "public"."vehicle_make" from "service_role";

revoke delete on table "public"."vehicle_model" from "anon";

revoke insert on table "public"."vehicle_model" from "anon";

revoke references on table "public"."vehicle_model" from "anon";

revoke select on table "public"."vehicle_model" from "anon";

revoke trigger on table "public"."vehicle_model" from "anon";

revoke truncate on table "public"."vehicle_model" from "anon";

revoke update on table "public"."vehicle_model" from "anon";

revoke delete on table "public"."vehicle_model" from "authenticated";

revoke insert on table "public"."vehicle_model" from "authenticated";

revoke references on table "public"."vehicle_model" from "authenticated";

revoke select on table "public"."vehicle_model" from "authenticated";

revoke trigger on table "public"."vehicle_model" from "authenticated";

revoke truncate on table "public"."vehicle_model" from "authenticated";

revoke update on table "public"."vehicle_model" from "authenticated";

revoke delete on table "public"."vehicle_model" from "service_role";

revoke insert on table "public"."vehicle_model" from "service_role";

revoke references on table "public"."vehicle_model" from "service_role";

revoke select on table "public"."vehicle_model" from "service_role";

revoke trigger on table "public"."vehicle_model" from "service_role";

revoke truncate on table "public"."vehicle_model" from "service_role";

revoke update on table "public"."vehicle_model" from "service_role";


