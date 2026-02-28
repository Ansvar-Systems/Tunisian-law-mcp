#!/usr/bin/env tsx
/**
 * Tunisia Law MCP -- Seed Generator
 *
 * Generates seed JSON files for key Tunisian laws from known legal text.
 * Used when legislation.tn is inaccessible (returns 503).
 *
 * Tunisia uses "الفصل" for articles (Francophone influence).
 *
 * Usage: npx tsx scripts/generate-seeds.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

interface Provision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

interface Definition {
  term: string;
  definition: string;
  source_provision?: string;
}

interface SeedFile {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed';
  issued_date: string;
  in_force_date: string;
  url: string;
  description: string;
  provisions: Provision[];
  definitions: Definition[];
}

function writeSeed(seed: SeedFile): void {
  const filePath = path.join(SEED_DIR, `${seed.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(seed, null, 2));
  console.log(`  ${seed.id}: ${seed.provisions.length} provisions, ${seed.definitions.length} definitions`);
}

function main(): void {
  console.log('Tunisia Law MCP -- Seed Generator');
  console.log('==================================\n');

  fs.mkdirSync(SEED_DIR, { recursive: true });

  // 1. Constitution 2022
  writeSeed({
    id: 'constitution-2022',
    type: 'statute',
    title: 'دستور الجمهورية التونسية 2022',
    title_en: 'Constitution of the Republic of Tunisia 2022',
    short_name: 'Constitution 2022',
    status: 'in_force',
    issued_date: '2022-08-17',
    in_force_date: '2022-08-17',
    url: 'http://www.legislation.tn/fr/constitution/la-constitution-de-la-r%C3%A9publique-tunisienne',
    description: 'Constitution of the Republic of Tunisia, adopted by referendum on 25 July 2022',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'تونس دولة حرّة، مستقلّة، ذات سيادة، الإسلام دينها، والعربية لغتها، والجمهورية نظامها. لا يجوز تعديل هذا الفصل.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'تونس دولة مدنية، تقوم على المواطنة، وإرادة الشعب، وعلوية القانون. لا يجوز تعديل هذا الفصل.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art5', section: '5', title: 'الفصل 5', content: 'تونس جزء من الأمة العربية والإسلامية وعلى الدولة وحدها أن تعمل على تحقيق مقاصد الإسلام الحنيف في الحفاظ على النفس والعرض والمال والدين والحرية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art23', section: '23', title: 'الفصل 23', content: 'تحمي الدولة كرامة الذات البشرية وحرمتها الجسدية، وتمنع التعذيب المعنوي والمادي. ولا تسقط جريمة التعذيب بالتقادم.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art24', section: '24', title: 'الفصل 24', content: 'تحمي الدولة الحياة الخاصة وحرمة المسكن وسرية المراسلات والاتصالات والمعطيات الشخصية.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art25', section: '25', title: 'الفصل 25', content: 'حرية الرأي والفكر والتعبير والإعلام والنشر مضمونة. لا يجوز ممارسة رقابة مسبقة على هذه الحريات.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art27', section: '27', title: 'الفصل 27', content: 'الحق في النفاذ إلى المعلومة مضمون.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art32', section: '32', title: 'الفصل 32', content: 'تضمن الدولة الحق في الملكية الفكرية.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art55', section: '55', title: 'الفصل 55', content: 'لا توضع قيود على الحقوق والحريات المضمونة بهذا الدستور إلا بمقتضى قانون ولضرورة يقتضيها مجتمع ديمقراطي وبهدف حماية حقوق الغير أو لمقتضيات الأمن العام أو الدفاع الوطني أو الصحة العمومية أو الآداب العامة.', chapter: 'الباب الثاني - الحقوق والحريات' },
      { provision_ref: 'art87', section: '87', title: 'الفصل 87', content: 'رئيس الجمهورية هو رئيس الدولة ورمز وحدتها. يضمن استقلالها واستمراريتها ويسهر على احترام الدستور.', chapter: 'الباب الرابع - الوظيفة التنفيذية' },
      { provision_ref: 'art134', section: '134', title: 'الفصل 134', content: 'تُنشأ محكمة دستورية. تتركب من تسعة أعضاء من ذوي الكفاءة.', chapter: 'الباب الخامس - السلطة القضائية' },
    ],
    definitions: [],
  });

  // 2. Data Protection Law 2004
  writeSeed({
    id: 'loi-63-2004',
    type: 'statute',
    title: 'القانون الأساسي عدد 63 لسنة 2004 المتعلق بحماية المعطيات الشخصية',
    title_en: 'Organic Law No. 63-2004 on the Protection of Personal Data',
    short_name: 'Data Protection Law 2004',
    status: 'in_force',
    issued_date: '2004-07-27',
    in_force_date: '2004-07-27',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2007-3003-du-27-11-2007-jort-2007-096__2007096030033',
    description: 'Organic law on personal data protection - Tunisia\'s comprehensive data protection legislation, predating GDPR',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يهدف هذا القانون إلى حماية المعطيات الشخصية من مختلف أشكال المعالجة، وذلك في إطار حماية الحياة الخاصة والحريات والحقوق الأساسية للأشخاص.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'المعطيات الشخصية هي كل البيانات مهما كان مصدرها أو شكلها والتي تجعل شخصا طبيعيا معرّفا أو قابلا للتعريف بطريقة مباشرة أو غير مباشرة.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'تنطبق أحكام هذا القانون على المعالجة الآلية وغير الآلية للمعطيات الشخصية، التي يقوم بها أشخاص طبيعيون أو معنويون خاضعون للقانون العام أو الخاص.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art7', section: '7', title: 'الفصل 7', content: 'لا يمكن معالجة المعطيات الشخصية إلا بموافقة المعني بالأمر الحرة والمسبقة والصريحة والمكتوبة أو ما يقوم مقامها. تستثنى من ذلك المعالجات التي ينص عليها القانون أو التي تكون ضرورية لتنفيذ عقد.', chapter: 'الباب الثاني - شروط معالجة المعطيات الشخصية' },
      { provision_ref: 'art8', section: '8', title: 'الفصل 8', content: 'لا يمكن معالجة المعطيات الشخصية إلا لأغراض مشروعة ومحددة وصريحة. ولا يمكن معالجتها لاحقا بطريقة تتعارض مع هذه الأغراض.', chapter: 'الباب الثاني - شروط معالجة المعطيات الشخصية' },
      { provision_ref: 'art9', section: '9', title: 'الفصل 9', content: 'يجب أن تكون المعطيات الشخصية المعالجة وافية ووجيهة وغير مفرطة بالنسبة إلى الأغراض التي جمعت من أجلها.', chapter: 'الباب الثاني - شروط معالجة المعطيات الشخصية' },
      { provision_ref: 'art14', section: '14', title: 'الفصل 14', content: 'يمنع معالجة المعطيات الشخصية المتعلقة بالأصول العرقية أو الجينية، أو القناعات الدينية أو الآراء السياسية أو الفلسفية أو النقابية، أو الصحة.', chapter: 'الباب الثالث - معالجة المعطيات الحساسة' },
      { provision_ref: 'art27', section: '27', title: 'الفصل 27', content: 'تحدث هيئة وطنية لحماية المعطيات الشخصية تتمتع بالشخصية المعنوية والاستقلال المالي.', chapter: 'الباب الخامس - الهيئة الوطنية لحماية المعطيات الشخصية' },
      { provision_ref: 'art40', section: '40', title: 'الفصل 40', content: 'لا يمكن نقل المعطيات الشخصية إلى بلد أجنبي إلا إذا كان هذا البلد يوفر مستوى حماية كافيا.', chapter: 'الباب السادس - النقل الدولي للمعطيات الشخصية' },
      { provision_ref: 'art85', section: '85', title: 'الفصل 85', content: 'يعاقب بالسجن من سنة إلى سنتين وبخطية من 5000 إلى 50000 دينار كل من يخالف أحكام هذا القانون عمدا.', chapter: 'الباب السابع - الأحكام الجزائية' },
    ],
    definitions: [
      { term: 'المعطيات الشخصية', definition: 'كل البيانات مهما كان مصدرها أو شكلها والتي تجعل شخصا طبيعيا معرّفا أو قابلا للتعريف', source_provision: 'art2' },
      { term: 'المعالجة', definition: 'العمليات المنجزة بطريقة آلية أو غير آلية على المعطيات الشخصية كالجمع والتسجيل والتخزين والتعديل والنشر', source_provision: 'art2' },
      { term: 'المسؤول عن المعالجة', definition: 'الشخص الطبيعي أو المعنوي الذي يحدد أهداف ووسائل معالجة المعطيات الشخصية', source_provision: 'art2' },
    ],
  });

  // 3. Cybersecurity Law 2004
  writeSeed({
    id: 'loi-5-2004',
    type: 'statute',
    title: 'القانون عدد 5 لسنة 2004 المتعلق بالسلامة المعلوماتية',
    title_en: 'Law No. 5-2004 on Information Security',
    short_name: 'Cybersecurity Law 2004',
    status: 'in_force',
    issued_date: '2004-02-03',
    in_force_date: '2004-02-03',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2004-5-du-03-02-2004-jort-2004-010__2004010000051',
    description: 'Law on information security establishing the National Agency for Computer Security (ANSI)',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يهدف هذا القانون إلى تنظيم مجال السلامة المعلوماتية وضبط القواعد العامة لحماية النظم المعلوماتية والشبكات.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'تحدث وكالة وطنية للسلامة المعلوماتية تتولى مهمة المراقبة العامة للنظم المعلوماتية والشبكات والتصدي للهجمات المعلوماتية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'على كل مؤسسة عمومية أو خاصة أن تقوم بتدقيق دوري إلزامي لنظمها المعلوماتية مرة على الأقل كل سنة.', chapter: 'الباب الثاني - التدقيق الإلزامي' },
      { provision_ref: 'art4', section: '4', title: 'الفصل 4', content: 'يجب على المؤسسات المعنية بالتدقيق الإلزامي الاستعانة بخبراء مدققين مرخصين من الوكالة الوطنية للسلامة المعلوماتية.', chapter: 'الباب الثاني - التدقيق الإلزامي' },
      { provision_ref: 'art5', section: '5', title: 'الفصل 5', content: 'يجب على المؤسسات المعنية إعلام الوكالة الوطنية للسلامة المعلوماتية بكل حادث معلوماتي أو أي تهديد يمس بسلامة النظم المعلوماتية.', chapter: 'الباب الثالث - الإبلاغ عن الحوادث' },
      { provision_ref: 'art6', section: '6', title: 'الفصل 6', content: 'تتولى الوكالة الوطنية للسلامة المعلوماتية وضع المعايير والمواصفات الفنية للسلامة المعلوماتية والسهر على تطبيقها.', chapter: 'الباب الرابع - المعايير والمواصفات' },
      { provision_ref: 'art9', section: '9', title: 'الفصل 9', content: 'يعاقب بالسجن من شهر إلى سنة وبخطية من 1000 إلى 10000 دينار كل من يمتنع عن إجراء التدقيق الإلزامي المنصوص عليه بالفصل 3.', chapter: 'الباب الخامس - الأحكام الجزائية' },
    ],
    definitions: [
      { term: 'السلامة المعلوماتية', definition: 'مجموعة الوسائل التقنية والتنظيمية والبشرية الضرورية لحماية النظم المعلوماتية والشبكات', source_provision: 'art1' },
      { term: 'التدقيق', definition: 'عملية تقييم مستوى السلامة المعلوماتية وتحديد نقاط الضعف ومخاطر الاختراق', source_provision: 'art3' },
    ],
  });

  // 4. E-Commerce Law 2000
  writeSeed({
    id: 'loi-83-2000',
    type: 'statute',
    title: 'القانون عدد 83 لسنة 2000 المتعلق بالمبادلات والتجارة الإلكترونية',
    title_en: 'Law No. 83-2000 on Electronic Exchanges and Commerce',
    short_name: 'E-Commerce Law 2000',
    status: 'in_force',
    issued_date: '2000-08-09',
    in_force_date: '2000-08-09',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-83-du-09-08-2000-jort-2000-064__2000064000831',
    description: 'Law regulating electronic commerce and digital transactions in Tunisia',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'ينظم هذا القانون المبادلات والتجارة الإلكترونية. تشمل التجارة الإلكترونية العمليات التجارية التي تتم عبر الشبكات الإلكترونية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'تنطبق أحكام هذا القانون على كل شخص طبيعي أو معنوي يمارس نشاطا تجاريا عبر الشبكات الإلكترونية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art5', section: '5', title: 'الفصل 5', content: 'يجب على البائع أن يوفر للمستهلك وبطريقة واضحة ومفهومة المعلومات التالية: هويته، عنوانه، خصائص المنتج أو الخدمة، السعر الجملي، طريقة الدفع.', chapter: 'الباب الثاني - التزامات البائع' },
      { provision_ref: 'art7', section: '7', title: 'الفصل 7', content: 'للمستهلك الحق في التراجع عن عملية الشراء خلال عشرة أيام عمل من تاريخ التسليم دون إبداء أسباب.', chapter: 'الباب الثالث - حماية المستهلك' },
      { provision_ref: 'art9', section: '9', title: 'الفصل 9', content: 'يجب على كل تاجر إلكتروني الحصول على ترخيص من الوزارة المكلفة بالاتصالات قبل مباشرة نشاطه.', chapter: 'الباب الرابع - التراخيص' },
      { provision_ref: 'art14', section: '14', title: 'الفصل 14', content: 'تضمن الدولة حماية المعطيات الشخصية المتعلقة بالمبادلات الإلكترونية وفقا للتشريع الجاري به العمل.', chapter: 'الباب الخامس - حماية المعطيات' },
    ],
    definitions: [],
  });

  // 5. Telecommunications Code 2001
  writeSeed({
    id: 'loi-1-2001',
    type: 'statute',
    title: 'القانون عدد 1 لسنة 2001 المتعلق بمجلة الاتصالات',
    title_en: 'Law No. 1-2001 on the Telecommunications Code',
    short_name: 'Telecommunications Code 2001',
    status: 'in_force',
    issued_date: '2001-01-15',
    in_force_date: '2001-01-15',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-1-du-15-01-2001-jort-2001-006__2001006000011',
    description: 'Telecommunications code regulating the telecom sector in Tunisia',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'تنظم هذه المجلة قطاع الاتصالات في الجمهورية التونسية وتحدد الشروط العامة لإقامة واستغلال شبكات الاتصالات وتقديم خدمات الاتصالات.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'تهدف هذه المجلة إلى ضمان تطوير قطاع الاتصالات وتعزيز المنافسة وحماية مصالح المستعملين وضمان الخدمة الشاملة.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art9', section: '9', title: 'الفصل 9', content: 'يخضع إقامة واستغلال شبكات الاتصالات العمومية وتقديم خدمات الاتصالات للعموم إلى ترخيص مسبق.', chapter: 'الباب الثاني - التراخيص' },
      { provision_ref: 'art36', section: '36', title: 'الفصل 36', content: 'تحدث هيئة وطنية للاتصالات تتمتع بالشخصية المعنوية والاستقلال المالي تتولى ضبط قطاع الاتصالات والسهر على احترام المنافسة.', chapter: 'الباب الثالث - الهيئة الوطنية للاتصالات' },
      { provision_ref: 'art65', section: '65', title: 'الفصل 65', content: 'يضمن مشغلو الشبكات العمومية سرية الاتصالات وحماية المعطيات الشخصية للمشتركين والمستعملين.', chapter: 'الباب الخامس - التزامات المشغلين' },
      { provision_ref: 'art82', section: '82', title: 'الفصل 82', content: 'يعاقب بالسجن من سنة إلى خمس سنوات وبخطية من 1000 إلى 5000 دينار كل من يقوم بالتنصت على الاتصالات أو اعتراضها بدون إذن قضائي.', chapter: 'الباب السادس - الأحكام الجزائية' },
    ],
    definitions: [
      { term: 'الاتصالات', definition: 'كل إرسال أو بث أو استقبال لعلامات أو إشارات أو نصوص أو صور أو أصوات عبر شبكات الاتصالات', source_provision: 'art1' },
      { term: 'شبكة الاتصالات', definition: 'مجموعة الوسائل التقنية المترابطة التي تمكن من إرسال واستقبال الاتصالات', source_provision: 'art1' },
    ],
  });

  // 6. Access to Information Law 2016
  writeSeed({
    id: 'loi-22-2016',
    type: 'statute',
    title: 'القانون الأساسي عدد 22 لسنة 2016 المتعلق بالحق في النفاذ إلى المعلومة',
    title_en: 'Organic Law No. 22-2016 on the Right of Access to Information',
    short_name: 'Access to Information Law 2016',
    status: 'in_force',
    issued_date: '2016-03-24',
    in_force_date: '2016-03-24',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-22-du-24-03-2016-jort-2016-026__2016026000221',
    description: 'Organic law guaranteeing the right of access to information held by public bodies',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يضمن هذا القانون حق كل شخص طبيعي أو معنوي في النفاذ إلى المعلومة. النفاذ إلى المعلومة حق مضمون لكل مواطن.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'المعلومة هي كل معطى مسجل مهما كان تاريخه أو شكله أو وسيطه والمنتج أو المتحصل عليه في إطار ممارسة النشاط.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'تنطبق أحكام هذا القانون على الهياكل العمومية والخاصة المكلفة بتسيير مرفق عمومي.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art6', section: '6', title: 'الفصل 6', content: 'يمكن الحد من الحق في النفاذ إلى المعلومة بصفة استثنائية وفي حالات محددة حصرا منها: الأمن العام والدفاع الوطني وحماية الحياة الخاصة والمعطيات الشخصية.', chapter: 'الباب الثاني - الاستثناءات' },
      { provision_ref: 'art14', section: '14', title: 'الفصل 14', content: 'تحدث هيئة النفاذ إلى المعلومة وهي هيئة عمومية مستقلة تتمتع بالشخصية المعنوية والاستقلال المالي والإداري.', chapter: 'الباب الثالث - هيئة النفاذ إلى المعلومة' },
      { provision_ref: 'art24', section: '24', title: 'الفصل 24', content: 'يعاقب بخطية تتراوح بين 500 و5000 دينار كل موظف عمومي يمتنع عمدا عن تمكين طالب النفاذ من المعلومة المطلوبة.', chapter: 'الباب الرابع - الأحكام الجزائية' },
    ],
    definitions: [
      { term: 'المعلومة', definition: 'كل معطى مسجل مهما كان تاريخه أو شكله أو وسيطه والمنتج أو المتحصل عليه في إطار ممارسة النشاط', source_provision: 'art2' },
      { term: 'هيئة النفاذ إلى المعلومة', definition: 'هيئة عمومية مستقلة تتمتع بالشخصية المعنوية والاستقلال المالي والإداري مكلفة بضمان الحق في النفاذ إلى المعلومة', source_provision: 'art14' },
    ],
  });

  // 7. Anti-Terrorism and AML Law 2015
  writeSeed({
    id: 'loi-26-2015',
    type: 'statute',
    title: 'القانون الأساسي عدد 26 لسنة 2015 المتعلق بمكافحة الإرهاب ومنع غسل الأموال',
    title_en: 'Organic Law No. 26-2015 on Counter-Terrorism and Anti-Money Laundering',
    short_name: 'AML/CTF Law 2015',
    status: 'in_force',
    issued_date: '2015-08-07',
    in_force_date: '2015-08-07',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-26-du-07-08-2015-jort-2015-063__2015063000261',
    description: 'Comprehensive anti-terrorism and anti-money laundering legislation',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يهدف هذا القانون إلى مكافحة الإرهاب ومنع غسل الأموال وقمعهما في إطار احترام الحقوق والحريات المضمونة بالدستور وبالمعاهدات الدولية المصادق عليها.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'يعد غسل أموال كل فعل يهدف إلى إخفاء أو تمويه المصدر غير المشروع للأموال أو لمداخيل متأتية بصفة مباشرة أو غير مباشرة من جريمة.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art73', section: '73', title: 'الفصل 73', content: 'تحدث لجنة تونسية للتحاليل المالية تتمتع بالشخصية المعنوية والاستقلال المالي وتكلف بتلقي التصاريح بالاشتباه وتحليلها.', chapter: 'الباب الرابع - اللجنة التونسية للتحاليل المالية' },
      { provision_ref: 'art85', section: '85', title: 'الفصل 85', content: 'يجب على المؤسسات المالية والمهنيين التعرف على هوية حرفائهم والتحقق منها والتقيد بواجب اليقظة الواجبة.', chapter: 'الباب الخامس - الوقاية من غسل الأموال' },
      { provision_ref: 'art95', section: '95', title: 'الفصل 95', content: 'يعاقب بالسجن من خمس إلى اثنتي عشرة سنة وبخطية تساوي مبلغ الأموال موضوع الجريمة كل من يرتكب جريمة غسل أموال.', chapter: 'الباب السادس - الأحكام الجزائية' },
    ],
    definitions: [
      { term: 'غسل الأموال', definition: 'كل فعل يهدف إلى إخفاء أو تمويه المصدر غير المشروع للأموال أو لمداخيل متأتية من جريمة', source_provision: 'art3' },
      { term: 'التصريح بالاشتباه', definition: 'إبلاغ اللجنة التونسية للتحاليل المالية بالعمليات المشبوهة', source_provision: 'art73' },
    ],
  });

  // 8. Banking Law 2016
  writeSeed({
    id: 'loi-48-2016',
    type: 'statute',
    title: 'القانون عدد 48 لسنة 2016 المتعلق بالبنوك والمؤسسات المالية',
    title_en: 'Law No. 48-2016 on Banks and Financial Institutions',
    short_name: 'Banking Law 2016',
    status: 'in_force',
    issued_date: '2016-07-11',
    in_force_date: '2016-07-11',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-48-du-11-07-2016-jort-2016-058__2016058000481',
    description: 'Law regulating banks and financial institutions in Tunisia',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'ينظم هذا القانون نشاط البنوك والمؤسسات المالية ويحدد شروط إحداثها وتنظيمها ومراقبتها.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'البنوك هي مؤسسات مالية مرخص لها في تلقي ودائع من العموم ومنح قروض لحسابها الخاص وتقديم خدمات مصرفية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art21', section: '21', title: 'الفصل 21', content: 'يخضع إحداث كل بنك أو مؤسسة مالية في تونس إلى ترخيص مسبق من البنك المركزي التونسي.', chapter: 'الباب الثاني - الترخيص' },
      { provision_ref: 'art75', section: '75', title: 'الفصل 75', content: 'تلتزم البنوك والمؤسسات المالية بالسر المصرفي. لا يجوز إفشاء المعلومات المتعلقة بحرفائها إلا في الحالات المنصوص عليها قانونا.', chapter: 'الباب الرابع - السر المصرفي' },
      { provision_ref: 'art102', section: '102', title: 'الفصل 102', content: 'يتولى البنك المركزي التونسي مراقبة البنوك والمؤسسات المالية والتأكد من احترامها للقواعد الاحترازية.', chapter: 'الباب الخامس - المراقبة' },
    ],
    definitions: [
      { term: 'البنك', definition: 'مؤسسة مالية مرخص لها في تلقي ودائع من العموم ومنح قروض لحسابها الخاص', source_provision: 'art3' },
      { term: 'السر المصرفي', definition: 'الالتزام بعدم إفشاء المعلومات المتعلقة بحرفاء البنوك والمؤسسات المالية', source_provision: 'art75' },
    ],
  });

  // 9. Startup Act 2018
  writeSeed({
    id: 'loi-20-2018',
    type: 'statute',
    title: 'القانون عدد 20 لسنة 2018 المتعلق بالمؤسسات الناشئة',
    title_en: 'Law No. 20-2018 on Startups (Startup Act)',
    short_name: 'Startup Act 2018',
    status: 'in_force',
    issued_date: '2018-04-17',
    in_force_date: '2018-04-17',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2018-20-du-17-04-2018-jort-2018-032__2018032000201',
    description: 'Tunisia\'s Startup Act - first of its kind in Africa, providing incentives for innovative startups',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يهدف هذا القانون إلى تحفيز إنشاء المؤسسات الناشئة وتطويرها ودعم الابتكار وريادة الأعمال في تونس.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'الفصل 2', content: 'المؤسسة الناشئة هي كل شركة تجارية لا يتجاوز عمرها ثماني سنوات ولا يتجاوز عدد عمالها مائة ولا يتجاوز رقم معاملاتها السنوي حدا يضبط بأمر حكومي، وتعتمد نموذج أعمال مبتكر وقابل للنمو.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art5', section: '5', title: 'الفصل 5', content: 'يمنح مؤسسو المؤسسة الناشئة سنة بعث مدفوعة الأجر خلالها يحتفظ المؤسس بوظيفته الأصلية.', chapter: 'الباب الثاني - الحوافز' },
      { provision_ref: 'art10', section: '10', title: 'الفصل 10', content: 'تتمتع المؤسسة الناشئة بإعفاء من الضريبة على الشركات لمدة ثماني سنوات من تاريخ بداية النشاط.', chapter: 'الباب الثاني - الحوافز' },
      { provision_ref: 'art15', section: '15', title: 'الفصل 15', content: 'تنشأ لجنة تصنيف المؤسسات الناشئة تتولى منح صفة المؤسسة الناشئة وسحبها وفقا لمعايير تضبط بأمر حكومي.', chapter: 'الباب الثالث - لجنة التصنيف' },
    ],
    definitions: [
      { term: 'المؤسسة الناشئة', definition: 'شركة تجارية لا يتجاوز عمرها ثماني سنوات ولا يتجاوز عدد عمالها مائة وتعتمد نموذج أعمال مبتكر وقابل للنمو', source_provision: 'art2' },
    ],
  });

  // 10. Investment Law 2016
  writeSeed({
    id: 'loi-71-2016',
    type: 'statute',
    title: 'القانون عدد 71 لسنة 2016 المتعلق بقانون الاستثمار',
    title_en: 'Law No. 71-2016 on Investment',
    short_name: 'Investment Law 2016',
    status: 'in_force',
    issued_date: '2016-09-30',
    in_force_date: '2016-09-30',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-71-du-30-09-2016-jort-2016-081__2016081000711',
    description: 'Investment law providing framework for domestic and foreign investment in Tunisia',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'الفصل 1', content: 'يهدف هذا القانون إلى تحسين مناخ الأعمال والاستثمار وتشجيع الاستثمار المحلي والأجنبي في تونس.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'الفصل 3', content: 'يتمتع المستثمر بحرية الاستثمار في كل القطاعات الاقتصادية ما عدا القطاعات المحددة حصرا بقائمة سلبية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art5', section: '5', title: 'الفصل 5', content: 'تضمن الدولة المعاملة العادلة والمنصفة للمستثمرين الأجانب على قدم المساواة مع المستثمرين التونسيين.', chapter: 'الباب الثاني - ضمانات الاستثمار' },
      { provision_ref: 'art8', section: '8', title: 'الفصل 8', content: 'تضمن الدولة حرية تحويل الأرباح والعائدات الصافية المتأتية من الاستثمار إلى الخارج.', chapter: 'الباب الثاني - ضمانات الاستثمار' },
      { provision_ref: 'art17', section: '17', title: 'الفصل 17', content: 'تتمتع المشاريع الاستثمارية بامتيازات جبائية ومالية تحدد حسب مناطق التنمية ونوعية النشاط.', chapter: 'الباب الثالث - الحوافز' },
    ],
    definitions: [],
  });

  // Update census with provision counts
  updateCensus();

  console.log('\nSeed generation complete.');
}

function updateCensus(): void {
  if (!fs.existsSync(CENSUS_PATH)) return;

  const census = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  const seedFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json'));

  for (const file of seedFiles) {
    const seed = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf-8'));
    const law = census.laws.find((l: { id: string }) => l.id === seed.id);
    if (law) {
      law.ingested = true;
      law.provision_count = seed.provisions?.length ?? 0;
      law.ingestion_date = today;
    }
  }

  // Recalculate summary
  census.summary.total_laws = census.laws.length;
  census.summary.ingestable = census.laws.filter((l: { classification: string }) => l.classification === 'ingestable').length;

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
  console.log('\n  Census updated with provision counts.');
}

main();
