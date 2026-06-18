-- =============================================================
-- Seed Data: إضافة بيانات تجريبية للدورات التدريبية و SOPs
-- Date: 2026-08-06
-- =============================================================

-- إدخال دورات تدريبية تجريبية
INSERT INTO public.courses (id, title, title_en, description, description_en, category, duration, level, points, mandatory, instructor, tags, objectives, rich_content, active)
VALUES
(
  'a0000001-0000-0000-0000-000000000001',
  'أساسيات GMP في صناعة الدواء',
  'GMP Fundamentals in Pharmaceutical Industry',
  'دورة شاملة حول ممارسات التصنيع الجيد (GMP) في صناعة الأدوية، تغطي المبادئ الأساسية والمتطلبات التنظيمية',
  'A comprehensive course on Good Manufacturing Practices (GMP) in the pharmaceutical industry',
  'gmp-basics',
  '3 ساعات',
  'مبتدئ',
  100,
  true,
  'د. أحمد الزبيدي',
  ARRAY['GMP', 'جودة', 'FDA', 'WHO'],
  ARRAY['فهم مبادئ GMP الأساسية', 'التعرف على متطلبات التصنيع الدوائي', 'تطبيق معايير النظافة والتعقيم', 'توثيق العمليات وفق متطلبات GMP'],
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"أساسيات GMP","headingLevel":1,"order":1},
      {"id":"b2","type":"text","content":"تعتبر ممارسات التصنيع الجيد (GMP) أساس صناعة الأدوية الآمنة والفعالة. في هذه الدورة سنتعرف على المبادئ الأساسية لـ GMP وكيفية تطبيقها في مصانع الأدوية.","order":2},
      {"id":"b3","type":"heading","content":"ما هو GMP؟","headingLevel":2,"order":3},
      {"id":"b4","type":"text","content":"GMP هو نظام يضمن أن المنتجات يتم إنتاجها ومراقبتها باستمرار وفقاً لمعايير الجودة. يغطي GMP جميع جوانب الإنتاج من المواد الخام إلى المنتج النهائي.","order":4},
      {"id":"b5","type":"heading","content":"المبادئ العشرة لـ GMP","headingLevel":2,"order":5},
      {"id":"b6","type":"list","content":"المبادئ الأساسية","items":["كتابة التعليمات والإجراءات بشكل واضح","اتباع التعليمات بدقة","توثيق العمل فوراً أثناء التنفيذ","إثبات المطابقة للمواصفات","تصميم وتنظيم أماكن العمل","صيانة المرافق والمعدات","تدريب الموظفين باستمرار","النظافة الشخصية والتعقيم","مراقبة الجودة في كل مرحلة","التحسين المستمر"],"order":6},
      {"id":"b7","type":"heading","content":"التوثيق في GMP","headingLevel":3,"order":7},
      {"id":"b8","type":"text","content":"\"ما لم يتم توثيقه، لم يتم إنجازه\" - هذا هو المبدأ الذهبي في GMP. التوثيق الدقيق والشامل هو أساس نظام الجودة الدوائي.","order":8}
    ],
    "mediaFiles": [],
    "summary": "مقدمة شاملة لمبادئ GMP في صناعة الدواء",
    "readingTimeMinutes": 45
  }'::jsonb,
  true
),
(
  'a0000002-0000-0000-0000-000000000002',
  'النظافة والتعقيم في المناطق النظيفة',
  'Cleaning & Sanitization in Clean Areas',
  'دورة متخصصة في إجراءات النظافة والتعقيم للمناطق النظيفة في مصانع الأدوية وفقاً لمتطلبات GMP',
  'A specialized course on cleaning and sanitization procedures for clean areas in pharmaceutical factories',
  'manufacturing',
  '2 ساعة',
  'متوسط',
  75,
  true,
  'د. سارة الجبوري',
  ARRAY['نظافة', 'تعقيم', 'مناطق نظيفة', 'ميكروبيولوجيا'],
  ARRAY['فهم تصنيف المناطق النظيفة', 'التعرف على طرق التعقيم المختلفة', 'تطبيق إجراءات التنظيف القياسية', 'التحقق من فعالية التنظيف'],
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"النظافة والتعقيم","headingLevel":1,"order":1},
      {"id":"b2","type":"text","content":"تعد النظافة والتعقيم من أهم أركان صناعة الأدوية. في هذه الدورة سنتعلم كيفية تنظيف وتعقيم المناطق النظيفة بشكل صحيح.","order":2},
      {"id":"b3","type":"heading","content":"تصنيف المناطق النظيفة","headingLevel":2,"order":3},
      {"id":"b4","type":"table","content":"تصنيفات المناطق النظيفة","tableData":[["الفئة","الجسيمات المسموحة (≥0.5µm)","الاستخدام"],["A","≤ 3,520/m³","التعبئة في ظروف معقمة"],["B","≤ 3,520/m³","منطقة خلفية لـ A"],["C","≤ 352,000/m³","المناطق النظيفة"],["D","≤ 3,520,000/m³","المناطق المساندة"]],"order":4},
      {"id":"b5","type":"heading","content":"طرق التعقيم","headingLevel":2,"order":5},
      {"id":"b6","type":"list","content":"طرق التعقيم","items":["التعقيم الحراري (الأوتوكلاف)","التعقيم الكيميائي (الإيثيلين أوكسايد)","التعقيم بالإشعاع (جاما)","التعقيم بالترشيح","التعقيم بالبلازما (H₂O₂)"],"order":6},
      {"id":"b7","type":"text","content":"يجب توثيق جميع عمليات التنظيف والتعقيم وتاريخ صلاحية المواد بعد التعقيم.","order":7}
    ],
    "mediaFiles": [],
    "summary": "إجراءات النظافة والتعقيم للمناطق النظيفة",
    "readingTimeMinutes": 30
  }'::jsonb,
  true
),
(
  'a0000003-0000-0000-0000-000000000003',
  'ضبط الجودة في المختبرات الدوائية',
  'Quality Control in Pharmaceutical Laboratories',
  'دورة في أساسيات ضبط الجودة في المختبرات الدوائية وطرق الاختبار المختلفة',
  'Course on quality control fundamentals in pharmaceutical laboratories',
  'quality',
  '4 ساعات',
  'متقدم',
  120,
  false,
  'د. محمد العاني',
  ARRAY['ضبط جودة', 'مختبر', 'تحليل', 'اختبارات'],
  ARRAY['فهم أنظمة ضبط الجودة', 'التعرف على طرق التحليل الدوائي', 'تطبيق معايير المختبرات', 'تفسير نتائج الاختبارات'],
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"ضبط الجودة في المختبرات","headingLevel":1,"order":1},
      {"id":"b2","type":"text","content":"ضبط الجودة هو الجزء الأساسي من نظام الجودة الذي يضمن أن المنتجات تلبي المواصفات المحددة.","order":2},
      {"id":"b3","type":"heading","content":"اختبارات ضبط الجودة","headingLevel":2,"order":3},
      {"id":"b4","type":"list","content":"أنواع الاختبارات","items":["الاختبارات الفيزيائية (الصلابة، التفتت، الذوبان)","الاختبارات الكيميائية (المعايرة، الامتصاص الذري)","الاختبارات الميكروبيولوجية (التعقيم، الميكروبات)","اختبارات الثبات (درجات الحرارة، الرطوبة)"],"order":4},
      {"id":"b5","type":"text","content":"يجب أن تكون جميع طرق الاختبار معتمدة وموثقة ومطابقة لدستور الأدوية.","order":5}
    ],
    "mediaFiles": [],
    "summary": "أساسيات ضبط الجودة المختبرية",
    "readingTimeMinutes": 60
  }'::jsonb,
  true
);

-- إدخال SOPs تجريبية
INSERT INTO public.sops (id, title, title_en, code, description, description_en, department, category, version, status, duration, is_mandatory, rich_content)
VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'إجراءات تنظيف خط الإنتاج بعد التصنيع',
  'Production Line Cleaning Procedures After Manufacturing',
  'SOP-CLN-001',
  'إجراءات تنظيف وتعقيم خطوط الإنتاج بعد الانتهاء من عملية التصنيع في قسم الحبوب',
  'Procedures for cleaning and sanitizing production lines after manufacturing in the tablets department',
  'tablets',
  'التنظيف والتعقيم',
  '1.0',
  'active',
  '20',
  true,
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"إجراءات تنظيف خط الإنتاج","headingLevel":1,"order":1},
      {"id":"b2","type":"heading","content":"الغرض","headingLevel":2,"order":2},
      {"id":"b3","type":"text","content":"يهدف هذا الإجراء إلى ضمان تنظيف وتعقيم خطوط الإنتاج بشكل صحيح بعد الانتهاء من التصنيع لمنع التلوث المتبادل بين المنتجات.","order":3},
      {"id":"b4","type":"heading","content":"النطاق","headingLevel":2,"order":4},
      {"id":"b5","type":"text","content":"ينطبق هذا الإجراء على جميع خطوط الإنتاج في قسم الحبوب، بما في ذلك الخلاطات، أجهزة الكبس، وأجهزة التغليف.","order":5},
      {"id":"b6","type":"heading","content":"المعدات المطلوبة","headingLevel":2,"order":6},
      {"id":"b7","type":"list","content":"المعدات","items":["ملابس نظيفة وقفازات","محلول تنظيف (IPA 70%)","ماء منقى WFI","قطع قماش خالية من الوبر","فرشاة تنظيف معقمة","جهاز قياس الميكروبات"],"order":7},
      {"id":"b8","type":"heading","content":"خطوات التنظيف","headingLevel":2,"order":8},
      {"id":"b9","type":"text","content":"1. إزالة جميع بقايا المنتج السابق من الأسطح الملامسة.","order":9},
      {"id":"b10","type":"text","content":"2. شطف الأسطح بالماء المنقى لإزالة البقايا الذائبة.","order":10},
      {"id":"b11","type":"text","content":"3. تطبيق محلول التنظيف وتركه لمدة 10 دقائق.","order":11},
      {"id":"b12","type":"text","content":"4. شطف جيد بالماء المنقى للتأكد من إزالة المنظف بالكامل.","order":12},
      {"id":"b13","type":"text","content":"5. التجفيف باستخدام قطع قماش نظيفة.","order":13},
      {"id":"b14","type":"text","content":"6. التعقيم بمحلول IPA 70% وتركه ليجف طبيعياً.","order":14},
      {"id":"b15","type":"heading","content":"التحقق من التنظيف","headingLevel":2,"order":15},
      {"id":"b16","type":"text","content":"يجب أخذ مسحات (Swabs) من الأسطح بعد التنظيف وإرسالها للمختبر للتحقق من فعالية التنظيف. الحدود المقبولة: ≤ 100 CFU/100cm².","order":16},
      {"id":"b17","type":"text","content":"يجب توثيق جميع خطوات التنظيف في سجل التنظيف اليومي (Form-F-CLN-001).","order":17}
    ],
    "mediaFiles": [],
    "summary": "إجراءات تنظيف وتعقيم خطوط إنتاج الحبوب",
    "readingTimeMinutes": 15
  }'::jsonb
),
(
  'b0000002-0000-0000-0000-000000000002',
  'إجراءات أخذ العينات من المواد الخام',
  'Raw Materials Sampling Procedures',
  'SOP-QC-001',
  'إجراءات أخذ عينات من المواد الخام لاختبارها في مختبر ضبط الجودة',
  'Procedures for sampling raw materials for testing in QC laboratory',
  'quality',
  'ضبط الجودة',
  '1.0',
  'active',
  '15',
  true,
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"إجراءات أخذ العينات من المواد الخام","headingLevel":1,"order":1},
      {"id":"b2","type":"heading","content":"الغرض","headingLevel":2,"order":2},
      {"id":"b3","type":"text","content":"تهدف هذه الإجراءات إلى ضمان أخذ عينات ممثلة من المواد الخام لإجراء الاختبارات اللازمة للتحقق من مطابقتها للمواصفات.","order":3},
      {"id":"b4","type":"heading","content":"الإجراءات","headingLevel":2,"order":4},
      {"id":"b5","type":"list","content":"الخطوات","items":["التأكد من أن المادة الخام مصحوبة بشهادة تحليل من المورد","فحص الحاوية خارجياً للتأكد من سلامتها","أخذ العينة من أعلى وأسفل ووسط الحاوية","وضع العينة في حاوية معقمة وموسومة","إرسال العينة للمختبر مع طلب التحليل"],"order":5},
      {"id":"b6","type":"text","content":"يتم أخذ عينة واحدة لكل حاوية للمواد غير الخطرة، وعينتين لكل حاوية للمواد الخطرة.","order":6}
    ],
    "mediaFiles": [],
    "summary": "إجراءات أخذ عينات المواد الخام لفحص الجودة",
    "readingTimeMinutes": 10
  }'::jsonb
),
(
  'b0000003-0000-0000-0000-000000000003',
  'إجراءات التخزين في المستودعات',
  'Warehouse Storage Procedures',
  'SOP-STO-001',
  'إجراءات تخزين المواد الخام والمنتجات النهائية في المستودعات وفقاً لمتطلبات GMP',
  'Storage procedures for raw materials and finished products in warehouses',
  'syrups',
  'التخزين',
  '1.0',
  'active',
  '15',
  false,
  '{
    "blocks": [
      {"id":"b1","type":"heading","content":"إجراءات التخزين في المستودعات","headingLevel":1,"order":1},
      {"id":"b2","type":"heading","content":"الغرض","headingLevel":2,"order":2},
      {"id":"b3","type":"text","content":"ضمان تخزين المواد الخام والمنتجات النهائية في ظروف مناسبة تحافظ على جودتها وسلامتها.","order":3},
      {"id":"b4","type":"heading","content":"متطلبات التخزين","headingLevel":2,"order":4},
      {"id":"b5","type":"list","content":"المتطلبات","items":["درجة حرارة المخزن: 20-25 درجة مئوية","الرطوبة النسبية: أقل من 60%","تهوية مناسبة","إضاءة كافية","فصل المواد الخام عن المنتجات النهائية"],"order":5}
    ],
    "mediaFiles": [],
    "summary": "إجراءات تخزين المواد في المستودعات الدوائية",
    "readingTimeMinutes": 10
  }'::jsonb
);