-- 1) Requested majors
INSERT INTO public.baladiyas (wilaya_id, code, name_ar, name_fr, name_en)
SELECT w.id, v.code, v.name_ar, v.name_fr, v.name_en
FROM (VALUES
  ('16','1601','الجزائر الوسطى','Alger Centre','Alger Centre'),
  ('16','1602','سيدي امحمد','Sidi M''Hamed','Sidi MHamed'),
  ('16','1603','باب الوادي','Bab El Oued','Bab El Oued'),
  ('16','1613','الأبيار','El Biar','El Biar'),
  ('16','1614','باب الزوار','Bab Ezzouar','Bab Ezzouar'),
  ('16','1615','بوروبة','Bourouba','Bourouba'),
  ('31','3101','وهران','Oran','Oran'),
  ('31','3102','بئر الجير','Bir El Djir','Bir El Djir'),
  ('31','3103','السانيا','Es Senia','Es Senia'),
  ('31','3104','عين الترك','Ain El Turk','Ain El Turk'),
  ('25','2501','قسنطينة','Constantine','Constantine'),
  ('25','2502','الخروب','El Khroub','El Khroub'),
  ('25','2503','حامة بوزيان','Hamma Bouziane','Hamma Bouziane'),
  ('23','2301','عنابة','Annaba','Annaba'),
  ('23','2302','البوني','El Bouni','El Bouni'),
  ('23','2303','سيدي عمار','Sidi Amar','Sidi Amar'),
  ('02','0201','الشلف','Chlef','Chlef'),
  ('02','0202','وادي الفضة','Oued Fodda','Oued Fodda'),
  ('02','0203','بوقادير','Boukadir','Boukadir'),
  ('02','0204','أولاد فارس','Ouled Fares','Ouled Fares')
) AS v(wcode, code, name_ar, name_fr, name_en)
JOIN public.wilayas w ON w.code = v.wcode
WHERE NOT EXISTS (SELECT 1 FROM public.baladiyas b WHERE b.code = v.code);

-- 2) Fallback: every wilaya without communes gets its chef-lieu
INSERT INTO public.baladiyas (wilaya_id, code, name_ar, name_fr, name_en)
SELECT w.id, w.code || '01', w.name_ar, w.name_fr, COALESCE(w.name_en, w.name_fr)
FROM public.wilayas w
WHERE NOT EXISTS (SELECT 1 FROM public.baladiyas b WHERE b.wilaya_id = w.id)
  AND NOT EXISTS (SELECT 1 FROM public.baladiyas b2 WHERE b2.code = w.code || '01');