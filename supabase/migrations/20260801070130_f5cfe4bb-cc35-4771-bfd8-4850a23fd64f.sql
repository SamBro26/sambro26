INSERT INTO public.wilayas (code, name_ar, name_fr, name_en) VALUES
('59','أفلو','Aflou','Aflou'),
('60','الأبيض سيدي الشيخ','El Abiodh Sidi Cheikh','El Abiodh Sidi Cheikh'),
('61','العريشة','El Aricha','El Aricha'),
('62','القنطرة','El Kantara','El Kantara'),
('63','بريكة','Barika','Barika'),
('64','بوسعادة','Bou Saada','Bou Saada'),
('65','بئر العاتر','Bir El Ater','Bir El Ater'),
('66','قصر البخاري','Ksar El Boukhari','Ksar El Boukhari'),
('67','قصر الشلالة','Ksar Chellala','Ksar Chellala'),
('68','عين وسارة','Ain Oussara','Ain Oussara'),
('69','مسعد','Messaad','Messaad')
;

INSERT INTO public.baladiyas (wilaya_id, code, name_ar, name_fr, name_en)
SELECT w.id, v.code, v.name_ar, v.name_fr, v.name_en
FROM (VALUES
  ('16','1608','بئر خادم','Birkhadem','Birkhadem'),
  ('16','1609','الحراش','El Harrach','El Harrach'),
  ('16','1610','بئر توتة','Birtouta','Birtouta'),
  ('16','1611','زرالدة','Zeralda','Zeralda'),
  ('16','1612','الشراقة','Cheraga','Cheraga'),
  ('31','3106','السانية','Sidi Chami','Sidi Chami'),
  ('31','3107','بطيوة','Bethioua','Bethioua'),
  ('31','3108','مرسى الحجاج','Marsat El Hadjadj','Marsat El Hadjadj'),
  ('25','2501','قسنطينة','Constantine','Constantine'),
  ('25','2502','الخروب','El Khroub','El Khroub'),
  ('25','2503','حامة بوزيان','Hamma Bouziane','Hamma Bouziane'),
  ('25','2504','ديدوش مراد','Didouche Mourad','Didouche Mourad'),
  ('25','2505','عين سمارة','Ain Smara','Ain Smara'),
  ('19','1901','سطيف','Setif','Setif'),
  ('19','1902','العلمة','El Eulma','El Eulma'),
  ('19','1903','عين ولمان','Ain Oulmene','Ain Oulmene'),
  ('19','1904','بوقاعة','Bougaa','Bougaa'),
  ('09','0901','البليدة','Blida','Blida'),
  ('09','0902','بوفاريك','Boufarik','Boufarik'),
  ('09','0903','الأربعاء','Larbaa','Larbaa'),
  ('09','0904','موزاية','Mouzaia','Mouzaia'),
  ('23','2301','عنابة','Annaba','Annaba'),
  ('23','2302','البوني','El Bouni','El Bouni'),
  ('23','2303','سيدي عمار','Sidi Amar','Sidi Amar'),
  ('15','1501','تيزي وزو','Tizi Ouzou','Tizi Ouzou'),
  ('15','1502','ذراع بن خدة','Draa Ben Khedda','Draa Ben Khedda'),
  ('15','1503','عزازقة','Azazga','Azazga'),
  ('15','1504','ذراع الميزان','Draa El Mizan','Draa El Mizan'),
  ('05','0501','باتنة','Batna','Batna'),
  ('05','0502','عين التوتة','Ain Touta','Ain Touta'),
  ('05','0503','مروانة','Merouana','Merouana'),
  ('05','0504','تازولت','Tazoult','Tazoult')
) AS v(wilaya_code, code, name_ar, name_fr, name_en)
JOIN public.wilayas w ON w.code = v.wilaya_code
WHERE NOT EXISTS (SELECT 1 FROM public.baladiyas b WHERE b.code = v.code);