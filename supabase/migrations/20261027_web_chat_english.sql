-- English version of the platform chat + platform video + course-axes image.
-- Arabic stays the default; every *_en column falls back to the Arabic text when empty.

alter table public.whatsapp_menus            add column if not exists header_text_en text, add column if not exists body_text_en text, add column if not exists footer_text_en text;
alter table public.whatsapp_menu_items       add column if not exists label_en text, add column if not exists description_en text;
alter table public.whatsapp_answers          add column if not exists message_text_en text, add column if not exists video_url text;
alter table public.whatsapp_courses          add column if not exists short_description_en text, add column if not exists details_en text, add column if not exists variants_prompt_en text, add column if not exists syllabus_image_url text;
alter table public.whatsapp_course_variants  add column if not exists title_en text, add column if not exists short_description_en text, add column if not exists details_en text, add column if not exists syllabus_image_url text;
alter table public.whatsapp_course_prices    add column if not exists offer_label_en text;
alter table public.web_chat_entry_points     add column if not exists welcome_text_en text;
alter table public.web_chat_settings         add column if not exists followup_messages_en text[];
alter table public.web_chat_sessions         add column if not exists locale text not null default 'ar';
alter table public.web_chat_messages         add column if not exists image_url text;

-- ---------- English content ----------
update public.web_chat_entry_points set welcome_text_en = case entry_key
  when 'contact' then E'Welcome to Masar Makers 👋\nI''m the platform assistant — I''ll help you find out everything about the platform, journeys and prices in seconds.'
  when 'course_action' then E'Welcome 👋 We received your request about *{action}*.\nHere''s everything you need to know about the journey 👇'
  when 'enrollment' then E'Your subscription request has been recorded ✅\nReview the subscription details and price, and when you''re ready press “Subscribe now” — we''ll complete the payment with you on WhatsApp.'
  when 'launcher' then 'Welcome to Masar Makers 👋 Choose your question from the menu.'
  when 'members_only' then E'🔒 Prices and subscription details are available to registered members only.\nCreate your free account in under a minute, then come back here and you''ll find all prices in your currency 👇'
  else welcome_text_en end;

update public.whatsapp_menus set
  header_text_en = case menu_key when 'main_menu' then 'Masar Makers' when 'courses_menu' then 'Available courses' else header_text_en end,
  body_text_en = case menu_key
    when 'main_menu' then E'Welcome to Masar Makers 👋\nChoose your question from the menu.'
    when 'course_actions' then 'What would you like to know about this course?'
    when 'courses_menu' then 'Choose the course you want to know more about.'
    when 'currency_menu' then 'Choose the currency you want to see the price in:'
    when 'tracks_menu' then 'Choose the track whose courses you want to explore:'
    else body_text_en end,
  footer_text_en = case menu_key when 'main_menu' then 'Don''t just learn a course… build your career.' else footer_text_en end;

update public.whatsapp_menu_items set
  label_en = case item_key
    when 'course_details' then '📋 Course details'
    when 'course_price' then '💰 See the price'
    when 'course_video' then '🎥 First lecture'
    when 'course_subscribe' then '✅ I want to subscribe'
    when 'course_back' then '📚 All courses'
    when 'course_main' then '↩️ Main menu'
    when 'currency_sar' then '🇸🇦 Saudi riyal'
    when 'currency_egp' then '🇪🇬 Egyptian pound'
    when 'currency_other' then '🌍 Other currency'
    when 'main_courses' then '📚 Courses & prices'
    when 'main_offers' then '🎁 Current offers'
    when 'main_platform' then '🛣️ Explore the platform'
    when 'main_requirements' then '💻 Software requirements'
    when 'main_login' then '🔐 Login problem'
    when 'main_human' then '👩‍💼 Customer service'
    when 'track_road' then '🛣️ Road Design'
    when 'track_traffic' then '🚦 Traffic Engineering'
    else label_en end,
  description_en = case item_key
    when 'main_courses' then 'Browse the available courses'
    when 'main_offers' then 'See the available offers'
    when 'main_platform' then 'Get to know Masar Makers'
    when 'main_human' then 'Talk to us directly'
    else description_en end;

update public.whatsapp_answers set message_text_en = case answer_key
  when 'current_offer' then E'🎁 Current savings offer\n\n40% off the courses currently available throughout September.\n\nPick the right course from the Courses & prices list to see its price.'
  when 'human_support' then E'👩‍💼 Your chat has been transferred to customer service.\n\nWe''ll reply to you directly as soon as possible.'
  when 'login_help' then E'🔐 Trouble logging in?\n\n1️⃣ Log in here: https://masarmakers.com/login\n2️⃣ Make sure you use the same email you registered with.\n3️⃣ If you forgot your password: https://masarmakers.com/forgot-password — a reset link will be sent to your email (check Spam too).\n4️⃣ If the course isn''t showing after you log in, your subscription may still be being activated.\n\nIf the problem continues, choose “Customer service” and send us the email you registered with and a screenshot of the message you see.'
  when 'other_currency' then '🌍 To see the price in another currency, you will be transferred to customer service.'
  when 'platform_info' then E'🛣️ Masar Makers\n\nA professional learning-journeys platform that helps engineers move from learning to applying and mastering the craft.\n\n🌐 https://masarmakers.com/\n\n🎥 Platform tour:\nhttps://youtu.be/zEnhTPW9xvQ'
  when 'software_requirements' then E'💻 Course requirements\n\n• Software: [⚠️ Add the required software and version for each course, e.g. Civil 3D 20xx / CSD 20xx]\n• Computer: [⚠️ Suggested minimum specs]\n• Level: [⚠️ Does the course start from zero or need prior basics? Which course suits a beginner?]\n\nNot sure which course to start with? Choose “Customer service” and we''ll help you pick the right path 👌'
  else message_text_en end;

update public.whatsapp_answers set video_url = 'https://youtu.be/zEnhTPW9xvQ' where answer_key = 'platform_info' and video_url is null;

update public.whatsapp_courses set
  short_description_en = case course_key
    when 'Civil 3D' then 'The complete training course for road design using Civil 3D.'
    when 'csd' then 'The complete training course for road design using Civil Site Design.'
    when 'bim' then 'Build a complete 3D BIM model for a road project.'
    when 'vehicle_tracking' then 'Vehicle movement simulation, roundabout and parking design.'
    when 'spd' then 'Extract hundreds of sheets at lightning speed.'
    when 'cube' then 'A specialized program for traffic engineering and traffic demand modeling.'
    else short_description_en end,
  details_en = case course_key
    when 'Civil 3D' then 'Hands-on application on a project from start to finish to master the fundamentals of the software and present the design professionally. Covers project setup, Alignments, Profiles, Assemblies, Corridors, Surfaces, Grading, Intersections, and extracting reports and quantities.'
    when 'csd' then 'Choose the level that suits you: Fundamentals, Advanced, or the Integrated course.'
    when 'bim' then 'Explains the steps of converting a project designed in Civil 3D or CSD into Navisworks, extracting solids, surfaces and design layers, choosing materials, and creating markings, signs and road furniture such as lighting poles, trees and speed humps.'
    when 'vehicle_tracking' then 'Covers vehicle movement simulation, parking design, roundabout design, validating the design and running checks, designing roundabout levels and geometric elements, and creating 3D videos of vehicle movement.'
    when 'spd' then 'Covers General Plan, Road Details, Cross Sections for both Civil 3D and CSD, Profiles, Plan / Profile and Plan Cuts.'
    when 'cube' then 'A specialized program for traffic engineering, traffic demand modeling and strategic planning.'
    else details_en end,
  variants_prompt_en = case when variants_prompt like 'اختر نوع الرحلة التي%' then 'Choose the journey type you want details about:' when variants_prompt is not null then 'Choose the journey type:' else variants_prompt_en end;

update public.whatsapp_course_variants v set
  title_en = case v.title when 'الأساسيات' then 'Fundamentals' when 'المتقدم' then 'Advanced' when 'المتكامل' then 'Integrated' else v.title_en end,
  short_description_en = case
    when c.course_key = 'Civil 3D' and v.title = 'الأساسيات' then 'The fundamentals level of Civil 3D.'
    when c.course_key = 'Civil 3D' and v.title = 'المتقدم' then 'The advanced, specialized level of Civil 3D.'
    when c.course_key = 'csd' and v.title = 'الأساسيات' then 'The fundamentals level of Civil Site Design.'
    when c.course_key = 'csd' and v.title = 'المتقدم' then 'The advanced, specialized level of Civil Site Design.'
    when v.title = 'المتكامل' then 'The integrated course: Fundamentals + Advanced.'
    else v.short_description_en end,
  details_en = case
    when c.course_key = 'Civil 3D' and v.title = 'الأساسيات' then 'Hands-on application on a project from start to finish to master the fundamentals and present the design professionally. Covers project setup, Alignments, Profiles, Assemblies, Corridors, Surfaces, and extracting quantities.'
    when c.course_key = 'Civil 3D' and v.title = 'المتقدم' then 'Covers Data Shortcuts, Profiles, Daylight Conditions, Grading & Feature Lines, Road Levels, Superelevation, Cross Sections, Roundabout Design and Grading Intersections.'
    when c.course_key = 'Civil 3D' and v.title = 'المتكامل' then 'Includes the complete Fundamentals and Advanced levels, with recorded lectures.'
    when c.course_key = 'csd' and v.title = 'الأساسيات' then 'Hands-on application on a project from start to finish to master the fundamentals and present the design in 3D. Covers project setup, Templates, Data Design Form, Profiles, Grading Intersections, Cul-De-Sac, building the model and extracting reports and quantities.'
    when c.course_key = 'csd' and v.title = 'المتقدم' then 'Covers Data Shortcuts & Data Share, advanced Profiles, Intelligent Sections and Daylight Conditions, Model Builder and Auto Grading, Road Levels, Superelevation, Cross Sections, Knuckle Design, Roundabout Design and Marking.'
    when c.course_key = 'csd' and v.title = 'المتكامل' then 'Includes the complete Fundamentals and Advanced levels, recorded lectures, a 90-day trial version of the software, an accredited certificate, a 5% discount on buying the software for subscribers, and the option to buy Corridor EZ for 3 months at a reduced price as needed.'
    else v.details_en end
from public.whatsapp_courses c where c.id = v.course_id;

update public.whatsapp_course_prices set offer_label_en = case offer_label when 'عرض التوفير' then 'Savings offer' when 'عرض خاص' then 'Special offer' else offer_label_en end where offer_label is not null;

update public.web_chat_settings set followup_messages_en = array[
  '👋 Welcome back! You were asking about *{course}*. If you''re still interested you can continue your subscription from here, or check the details and price again 👇',
  '📌 Reminder: your spot in *{course}* is still open. If you have any question before subscribing, choose “Customer service” and we''ll reply.',
  '⏳ Last reminder about *{course}*. If you''d like to continue, press “Subscribe now” 👇 — we won''t bother you again after that.'
] where id = 1 and followup_messages_en is null;

-- ---------- scheduled follow-ups follow the chat language ----------
create or replace function public.web_chat_run_followups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
  s record;
  course_title text;
  msg text;
  btns jsonb;
  notif_id uuid;
  en boolean;
  list text[];
  sent integer := 0;
begin
  select * into cfg from web_chat_settings where id = 1;
  if cfg is null then return 0; end if;

  update web_chat_sessions
     set followup_status = 'closed', followup_closed_reason = 'no_reply',
         followup_closed_at = now(), followup_next_at = null
   where followup_status = 'active'
     and followup_count >= cfg.followup_max
     and followup_next_at <= now();

  for s in
    select * from web_chat_sessions
     where followup_status = 'active'
       and followup_count < cfg.followup_max
       and followup_next_at <= now()
     order by followup_next_at
     limit 200
  loop
    en := coalesce(s.locale, 'ar') = 'en';
    course_title := null;
    if s.current_course_id is not null then
      select coalesce(nullif(whatsapp_label, ''), title) into course_title
        from whatsapp_courses where id = s.current_course_id;
    end if;

    list := case when en and coalesce(array_length(cfg.followup_messages_en, 1), 0) > 0 then cfg.followup_messages_en else cfg.followup_messages end;
    msg := coalesce(
      list[least(s.followup_count + 1, coalesce(array_length(list, 1), 1))],
      case when en then '👋 Still interested in *{course}*?' else '👋 لسه مهتم بـ *{course}*؟' end
    );
    msg := replace(msg, '{course}', coalesce(course_title, case when en then 'your request' else 'طلبك' end));

    if s.current_course_id is not null then
      btns := jsonb_build_array(
        jsonb_build_object('id', 'course:' || s.current_course_id, 'label', case when en then '📘 Course details & price' else '📘 تفاصيل وسعر الكورس' end),
        jsonb_build_object('id', 'handoff:subscribe', 'label', case when en then '✅ Subscribe now' else '✅ اشترك الآن' end, 'kind', 'handoff'),
        jsonb_build_object('id', 'handoff:support', 'label', case when en then '👩‍💼 Customer service' else '👩‍💼 خدمة العملاء' end, 'kind', 'handoff')
      );
    else
      btns := jsonb_build_array(
        jsonb_build_object('id', 'courses', 'label', case when en then '📚 Courses & prices' else '📚 الكورسات والأسعار' end),
        jsonb_build_object('id', 'handoff:support', 'label', case when en then '👩‍💼 Customer service' else '👩‍💼 خدمة العملاء' end, 'kind', 'handoff')
      );
    end if;

    insert into web_chat_messages (session_id, sender, body, buttons, action_id)
    values (s.id, 'bot', msg, btns, 'followup:' || (s.followup_count + 1));

    if s.user_id is not null then
      insert into notifications (title, body, type, action_url)
      values (
        case when en then '💬 A message from the Masar Makers assistant' else '💬 رسالة من مساعد Masar Makers' end,
        left(regexp_replace(msg, '\*', '', 'g'), 300),
        'announcement',
        '/?chat=' || s.id
      )
      returning id into notif_id;
      insert into notification_recipients (notification_id, user_id) values (notif_id, s.user_id)
      on conflict do nothing;
    end if;

    update web_chat_sessions
       set followup_count = followup_count + 1,
           followup_last_at = now(),
           followup_next_at = now() + make_interval(days => cfg.followup_every_days),
           message_count = message_count + 1,
           has_unseen = true,
           updated_at = now()
     where id = s.id;

    sent := sent + 1;
  end loop;

  return sent;
end;
$$;

revoke all on function public.web_chat_run_followups() from public, anon, authenticated;
