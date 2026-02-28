#!/usr/bin/env tsx
/**
 * Tunisia Law MCP -- Census Script
 *
 * Enumerates Tunisian legislation from multiple accessible sources:
 *   1. jurisitetunisie.com -- 33+ codes in structured French HTML (primary)
 *   2. legislation.tn -- Official portal (often inaccessible, fallback)
 *   3. africa-laws.org -- Individual laws with PDFs
 *   4. FAOLEX/ILO NATLEX -- Environmental, labor, and sector laws
 *
 * Tunisia uses a civil law system based on the French model.
 * Bilingual: Arabic (official) + French (administrative/legal).
 *
 * Tunisian law references:
 *   - "قانون عدد XX لسنة YYYY" = Law No. XX of Year YYYY
 *   - "مرسوم عدد XX لسنة YYYY" = Decree No. XX of Year YYYY
 *   - "أمر عدد XX لسنة YYYY" = Order No. XX of Year YYYY
 *   - "مجلة" = Code (codified collection)
 *
 * Tunisia uses "الفصل" for articles (Francophone influence), not "المادة".
 * French texts use "Article N" for the same.
 *
 * License: Government Publication (public domain)
 *
 * Usage:
 *   npx tsx scripts/census.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  title_fr?: string;
  identifier: string;
  url: string;
  /** jurisitetunisie.com menu page paths for structured HTML scraping */
  jurisite_pages?: string[];
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act' | 'code';
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
}

interface CensusFile {
  schema_version: string;
  jurisdiction: string;
  jurisdiction_name: string;
  portal: string;
  census_date: string;
  agent: string;
  summary: {
    total_laws: number;
    ingestable: number;
    ocr_needed: number;
    inaccessible: number;
    excluded: number;
  };
  laws: CensusLawEntry[];
}

/* ---------- Comprehensive Law List ---------- */

interface LawDescriptor {
  id: string;
  title: string;
  title_fr?: string;
  identifier: string;
  url: string;
  jurisite_pages?: string[];
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act' | 'code';
}

const JURISITE_BASE = 'https://www.jurisitetunisie.com/tunisie/codes';

/**
 * Complete census of Tunisian legislation.
 *
 * Sources:
 *   - jurisitetunisie.com (33 codes in full text, structured HTML)
 *   - legislation.tn (official portal, fallback)
 *   - africa-laws.org (individual laws)
 *   - FAOLEX/ILO NATLEX (sector laws)
 *
 * Each entry with jurisite_pages has accessible full-text HTML.
 */
const TUNISIAN_LAWS: LawDescriptor[] = [
  // ============================
  // CONSTITUTIONS
  // ============================
  {
    id: 'constitution-2022',
    title: 'دستور الجمهورية التونسية 2022',
    title_fr: 'Constitution de la République Tunisienne 2022',
    identifier: 'constitution/2022',
    url: 'https://www.jurisitetunisie.com/tunisie/codes/Constitution_2022/menu.html',
    jurisite_pages: [`${JURISITE_BASE}/Constitution_2022/menu.html`],
    status: 'in_force',
    category: 'code',
  },

  // ============================
  // MAJOR CODES (jurisitetunisie.com full text)
  // ============================
  {
    id: 'code-penal',
    title: 'المجلة الجزائية',
    title_fr: 'Code Pénal',
    identifier: 'code/penal',
    url: `${JURISITE_BASE}/cp/menu.html`,
    jurisite_pages: [
      `${JURISITE_BASE}/cp/cp1005.htm`, `${JURISITE_BASE}/cp/cp1010.htm`,
      `${JURISITE_BASE}/cp/cp1015.htm`, `${JURISITE_BASE}/cp/cp1020.htm`,
      `${JURISITE_BASE}/cp/cp1025.htm`, `${JURISITE_BASE}/cp/cp1030.htm`,
      `${JURISITE_BASE}/cp/cp1035.htm`, `${JURISITE_BASE}/cp/cp1040.htm`,
      `${JURISITE_BASE}/cp/cp1045.htm`, `${JURISITE_BASE}/cp/cp1050.htm`,
      `${JURISITE_BASE}/cp/cp1055.htm`, `${JURISITE_BASE}/cp/cp1060.htm`,
      `${JURISITE_BASE}/cp/cp1065.htm`, `${JURISITE_BASE}/cp/cp1070.htm`,
      `${JURISITE_BASE}/cp/cp2005.htm`, `${JURISITE_BASE}/cp/cp2010.htm`,
      `${JURISITE_BASE}/cp/cp2015.htm`, `${JURISITE_BASE}/cp/cp2020.htm`,
      `${JURISITE_BASE}/cp/cp2025.htm`, `${JURISITE_BASE}/cp/cp2030.htm`,
      `${JURISITE_BASE}/cp/cp2035.htm`, `${JURISITE_BASE}/cp/cp2040.htm`,
      `${JURISITE_BASE}/cp/cp3005.htm`,
    ],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-obligations-contrats',
    title: 'مجلة الالتزامات والعقود',
    title_fr: 'Code des Obligations et des Contrats',
    identifier: 'code/obligations-contrats',
    url: `${JURISITE_BASE}/coc/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/coc/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-commerce',
    title: 'المجلة التجارية',
    title_fr: 'Code de Commerce',
    identifier: 'code/commerce',
    url: `${JURISITE_BASE}/cc/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cc/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-travail',
    title: 'مجلة الشغل',
    title_fr: 'Code du Travail',
    identifier: 'code/travail',
    url: `${JURISITE_BASE}/ct/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/ct/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-procedure-civile-commerciale',
    title: 'مجلة المرافعات المدنية والتجارية',
    title_fr: 'Code de Procédure Civile et Commerciale',
    identifier: 'code/procedure-civile-commerciale',
    url: `${JURISITE_BASE}/cpcc/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cpcc/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-procedure-penale',
    title: 'مجلة الإجراءات الجزائية',
    title_fr: 'Code de Procédure Pénale',
    identifier: 'code/procedure-penale',
    url: `${JURISITE_BASE}/cpp/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cpp/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-societes-commerciales',
    title: 'مجلة الشركات التجارية',
    title_fr: 'Code des Sociétés Commerciales',
    identifier: 'code/societes-commerciales',
    url: `${JURISITE_BASE}/cs/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cs/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-statut-personnel',
    title: 'مجلة الأحوال الشخصية',
    title_fr: 'Code du Statut Personnel',
    identifier: 'code/statut-personnel',
    url: `${JURISITE_BASE}/csp/Menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/csp/Menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-droits-reels',
    title: 'مجلة الحقوق العينية',
    title_fr: 'Code des Droits Réels',
    identifier: 'code/droits-reels',
    url: `${JURISITE_BASE}/cdr/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cdr/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-assurances',
    title: 'مجلة التأمين',
    title_fr: 'Code des Assurances',
    identifier: 'code/assurances',
    url: `${JURISITE_BASE}/assurance/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/assurance/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-irpp-is',
    title: 'مجلة الضريبة على دخل الأشخاص الطبيعيين والضريبة على الشركات',
    title_fr: "Code de l'Impôt sur le Revenu des Personnes Physiques et de l'Impôt sur les Sociétés",
    identifier: 'code/irpp-is',
    url: `${JURISITE_BASE}/cirppis/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cirppis/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-tva',
    title: 'مجلة الأداء على القيمة المضافة',
    title_fr: 'Code de la Taxe sur la Valeur Ajoutée',
    identifier: 'code/tva',
    url: `${JURISITE_BASE}/tva/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/tva/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-fiscalite-locale',
    title: 'مجلة الجباية المحلية',
    title_fr: 'Code de la Fiscalité Locale',
    identifier: 'code/fiscalite-locale',
    url: `${JURISITE_BASE}/flocal/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/flocal/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-droits-enregistrement-timbre',
    title: 'مجلة معاليم التسجيل والطابع الجبائي',
    title_fr: "Code des Droits d'Enregistrement et de Timbre",
    identifier: 'code/droits-enregistrement-timbre',
    url: `${JURISITE_BASE}/cdet/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cdet/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-droits-procedures-fiscaux',
    title: 'مجلة الحقوق والإجراءات الجبائية',
    title_fr: 'Code des Droits et Procédures Fiscaux',
    identifier: 'code/droits-procedures-fiscaux',
    url: `${JURISITE_BASE}/cdpf/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cdpf/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-telecommunications',
    title: 'مجلة الاتصالات',
    title_fr: 'Code des Télécommunications',
    identifier: 'code/telecommunications',
    url: `${JURISITE_BASE}/telecom/menu.html`,
    jurisite_pages: [
      `${JURISITE_BASE}/telecom/telcom1000.htm`,
      `${JURISITE_BASE}/telecom/telcom1050.htm`,
      `${JURISITE_BASE}/telecom/telcom1055.htm`,
      `${JURISITE_BASE}/telecom/telcom1075.htm`,
    ],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-hydrocarbures',
    title: 'مجلة المحروقات',
    title_fr: 'Code des Hydrocarbures',
    identifier: 'code/hydrocarbures',
    url: `${JURISITE_BASE}/chydro/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/chydro/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-arbitrage',
    title: 'مجلة التحكيم',
    title_fr: "Code de l'Arbitrage",
    identifier: 'code/arbitrage',
    url: `${JURISITE_BASE}/ca/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/ca/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-dip',
    title: 'مجلة القانون الدولي الخاص',
    title_fr: 'Code de Droit International Privé',
    identifier: 'code/dip',
    url: `${JURISITE_BASE}/cdip/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cdip/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-presse',
    title: 'مجلة الصحافة',
    title_fr: 'Code de la Presse',
    identifier: 'code/presse',
    url: `${JURISITE_BASE}/cpresse/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cpresse/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-route',
    title: 'مجلة الطرقات',
    title_fr: 'Code de la Route',
    identifier: 'code/route',
    url: `${JURISITE_BASE}/cr/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cr/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-protection-enfant',
    title: 'مجلة حماية الطفل',
    title_fr: "Code de la Protection de l'Enfant",
    identifier: 'code/protection-enfant',
    url: `${JURISITE_BASE}/cde/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cde/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-amenagement-urbanisme',
    title: 'مجلة التهيئة الترابية والتعمير',
    title_fr: "Code de l'Aménagement du Territoire et de l'Urbanisme",
    identifier: 'code/amenagement-urbanisme',
    url: `${JURISITE_BASE}/catu/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/catu/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-nationalite',
    title: 'مجلة الجنسية التونسية',
    title_fr: 'Code de la Nationalité Tunisienne',
    identifier: 'code/nationalite',
    url: `${JURISITE_BASE}/national/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/national/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-poste',
    title: 'مجلة البريد',
    title_fr: 'Code de la Poste',
    identifier: 'code/poste',
    url: `${JURISITE_BASE}/poste/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/poste/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-patrimoine-archeologique',
    title: 'مجلة حماية التراث الأثري والتاريخي',
    title_fr: 'Code de la Protection du Patrimoine Archéologique, Historique et des Arts Traditionnels',
    identifier: 'code/patrimoine-archeologique',
    url: `${JURISITE_BASE}/patri/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/patri/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-securite-prevention-risques',
    title: 'مجلة السلامة والوقاية من أخطار الحريق والانفجار',
    title_fr: 'Code de Sécurité et Prévention des Risques d\'Incendie et d\'Explosion',
    identifier: 'code/securite-prevention-risques',
    url: `${JURISITE_BASE}/cspri/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cspri/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-incitations-investissements',
    title: 'مجلة تشجيع الاستثمارات',
    title_fr: 'Code des Incitations aux Investissements',
    identifier: 'code/incitations-investissements',
    url: `${JURISITE_BASE}/cii/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/cii/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-opc',
    title: 'مجلة هيئات التوظيف الجماعي',
    title_fr: 'Code des Organismes de Placement Collectif',
    identifier: 'code/opc',
    url: `${JURISITE_BASE}/copc/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/copc/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-electoral',
    title: 'المجلة الانتخابية',
    title_fr: 'Code Électoral',
    identifier: 'code/electoral',
    url: `${JURISITE_BASE}/celect/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/celect/menu.html`],
    status: 'amended',
    category: 'code',
  },
  {
    id: 'code-deontologie-veterinaire',
    title: 'مجلة واجبات الطبيب البيطري',
    title_fr: 'Code de Déontologie du Médecin Vétérinaire',
    identifier: 'code/deontologie-veterinaire',
    url: `${JURISITE_BASE}/veteri/menu.html`,
    jurisite_pages: [`${JURISITE_BASE}/veteri/menu.html`],
    status: 'in_force',
    category: 'code',
  },
  {
    id: 'code-collectivites-locales',
    title: 'مجلة الجماعات المحلية',
    title_fr: 'Code des Collectivités Locales',
    identifier: 'code/collectivites-locales',
    url: `${JURISITE_BASE}/ccl/menua.html`,
    jurisite_pages: [`${JURISITE_BASE}/ccl/menua.html`],
    status: 'in_force',
    category: 'code',
  },

  // ============================
  // KEY INDIVIDUAL LAWS (legislation.tn / africa-laws.org)
  // ============================

  // Data protection / privacy
  {
    id: 'loi-63-2004',
    title: 'القانون الأساسي عدد 63 لسنة 2004 المتعلق بحماية المعطيات الشخصية',
    title_fr: 'Loi organique n° 2004-63 relative à la protection des données à caractère personnel',
    identifier: 'loi/2004/63',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2007-3003-du-27-11-2007-jort-2007-096__2007096030033',
    status: 'in_force',
    category: 'act',
  },
  // Cybersecurity
  {
    id: 'loi-5-2004',
    title: 'القانون عدد 5 لسنة 2004 المتعلق بالسلامة المعلوماتية',
    title_fr: 'Loi n° 2004-5 relative à la sécurité informatique',
    identifier: 'loi/2004/5',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2004-5-du-03-02-2004-jort-2004-010__2004010000051',
    status: 'in_force',
    category: 'act',
  },
  // Electronic commerce
  {
    id: 'loi-83-2000',
    title: 'القانون عدد 83 لسنة 2000 المتعلق بالمبادلات والتجارة الإلكترونية',
    title_fr: 'Loi n° 2000-83 relative aux échanges et au commerce électroniques',
    identifier: 'loi/2000/83',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-83-du-09-08-2000-jort-2000-064__2000064000831',
    status: 'in_force',
    category: 'act',
  },
  // Electronic signature
  {
    id: 'loi-57-2000',
    title: 'القانون عدد 57 لسنة 2000 المتعلق بإسناد التوقيع الإلكتروني والتصديق عليه',
    title_fr: 'Loi n° 2000-57 relative à la signature électronique et la certification',
    identifier: 'loi/2000/57',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-57-du-13-06-2000-jort-2000-048__2000048000571',
    status: 'in_force',
    category: 'act',
  },
  // Press and publication (decree-law)
  {
    id: 'decret-loi-115-2011',
    title: 'المرسوم عدد 115 لسنة 2011 المتعلق بحرية الصحافة والطباعة والنشر',
    title_fr: 'Décret-loi n° 2011-115 relatif à la liberté de la presse, de l\'imprimerie et de l\'édition',
    identifier: 'decret-loi/2011/115',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-115-du-02-11-2011-jort-2011-084__2011084011501',
    status: 'in_force',
    category: 'act',
  },
  // Audiovisual communication
  {
    id: 'decret-loi-116-2011',
    title: 'المرسوم عدد 116 لسنة 2011 المتعلق بحرية الاتصال السمعي والبصري',
    title_fr: 'Décret-loi n° 2011-116 relatif à la liberté de la communication audiovisuelle',
    identifier: 'decret-loi/2011/116',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-116-du-02-11-2011-jort-2011-084__2011084011601',
    status: 'in_force',
    category: 'act',
  },
  // Access to information
  {
    id: 'loi-22-2016',
    title: 'القانون الأساسي عدد 22 لسنة 2016 المتعلق بالحق في النفاذ إلى المعلومة',
    title_fr: "Loi organique n° 2016-22 relative au droit d'accès à l'information",
    identifier: 'loi/2016/22',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-22-du-24-03-2016-jort-2016-026__2016026000221',
    status: 'in_force',
    category: 'act',
  },
  // Consumer protection
  {
    id: 'loi-117-1992',
    title: 'القانون عدد 117 لسنة 1992 المتعلق بحماية المستهلك',
    title_fr: 'Loi n° 92-117 relative à la protection du consommateur',
    identifier: 'loi/1992/117',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1992-117-du-07-12-1992-jort-1992-083__1992083011701',
    status: 'amended',
    category: 'act',
  },
  // Competition and prices
  {
    id: 'loi-36-2015',
    title: 'القانون عدد 36 لسنة 2015 المتعلق بإعادة تنظيم المنافسة والأسعار',
    title_fr: 'Loi n° 2015-36 relative à la réorganisation de la concurrence et des prix',
    identifier: 'loi/2015/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-36-du-15-09-2015-jort-2015-076__2015076000361',
    status: 'in_force',
    category: 'act',
  },
  // Central Bank
  {
    id: 'loi-35-2016',
    title: 'القانون عدد 35 لسنة 2016 المتعلق بضبط النظام الأساسي للبنك المركزي التونسي',
    title_fr: 'Loi n° 2016-35 portant fixation du statut de la Banque Centrale de Tunisie',
    identifier: 'loi/2016/35',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-35-du-25-04-2016-jort-2016-035__2016035000351',
    status: 'in_force',
    category: 'act',
  },
  // Banking law
  {
    id: 'loi-48-2016',
    title: 'القانون عدد 48 لسنة 2016 المتعلق بالبنوك والمؤسسات المالية',
    title_fr: 'Loi n° 2016-48 relative aux banques et aux établissements financiers',
    identifier: 'loi/2016/48',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-48-du-11-07-2016-jort-2016-058__2016058000481',
    status: 'in_force',
    category: 'act',
  },
  // Anti-money laundering / anti-terrorism
  {
    id: 'loi-26-2015',
    title: 'القانون الأساسي عدد 26 لسنة 2015 المتعلق بمكافحة الإرهاب ومنع غسل الأموال',
    title_fr: 'Loi organique n° 2015-26 relative à la lutte contre le terrorisme et la répression du blanchiment d\'argent',
    identifier: 'loi/2015/26',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-26-du-07-08-2015-jort-2015-063__2015063000261',
    status: 'in_force',
    category: 'act',
  },
  // Investment law
  {
    id: 'loi-71-2016',
    title: 'القانون عدد 71 لسنة 2016 المتعلق بقانون الاستثمار',
    title_fr: "Loi n° 2016-71 portant loi de l'investissement",
    identifier: 'loi/2016/71',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-71-du-30-09-2016-jort-2016-081__2016081000711',
    status: 'in_force',
    category: 'act',
  },
  // Public procurement
  {
    id: 'decret-1039-2014',
    title: 'المرسوم عدد 1039 لسنة 2014 المتعلق بتنظيم الصفقات العمومية',
    title_fr: 'Décret n° 2014-1039 relatif à la réglementation des marchés publics',
    identifier: 'decret/2014/1039',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2014-1039-du-13-03-2014-jort-2014-024__2014024103901',
    status: 'in_force',
    category: 'act',
  },
  // Copyright / intellectual property
  {
    id: 'loi-36-2001',
    title: 'القانون عدد 36 لسنة 2001 المتعلق بحماية حقوق المؤلف والحقوق المجاورة',
    title_fr: "Loi n° 2001-36 relative à la protection des marques de fabrique, de commerce et de services",
    identifier: 'loi/2001/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-36-du-17-04-2001-jort-2001-032__2001032000361',
    status: 'in_force',
    category: 'act',
  },
  // Public-private partnerships
  {
    id: 'loi-49-2015',
    title: 'القانون عدد 49 لسنة 2015 المتعلق بعقود الشراكة بين القطاع العام والقطاع الخاص',
    title_fr: 'Loi n° 2015-49 relative aux contrats de partenariat public-privé',
    identifier: 'loi/2015/49',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-49-du-27-11-2015-jort-2015-097__2015097000491',
    status: 'in_force',
    category: 'act',
  },
  // Access to administrative documents
  {
    id: 'decret-loi-41-2011',
    title: 'المرسوم عدد 41 لسنة 2011 المتعلق بالنفاذ إلى الوثائق الإدارية',
    title_fr: "Décret-loi n° 2011-41 relatif à l'accès aux documents administratifs",
    identifier: 'decret-loi/2011/41',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-41-du-26-05-2011-jort-2011-039__2011039004101',
    status: 'in_force',
    category: 'act',
  },
  // Whistleblower protection
  {
    id: 'loi-10-2017',
    title: 'القانون عدد 10 لسنة 2017 المتعلق بالإبلاغ عن الفساد وحماية المبلغين',
    title_fr: 'Loi n° 2017-10 relative au signalement de la corruption et à la protection des lanceurs d\'alerte',
    identifier: 'loi/2017/10',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2017-10-du-07-03-2017-jort-2017-020__2017020000101',
    status: 'in_force',
    category: 'act',
  },
  // Startup Act
  {
    id: 'loi-20-2018',
    title: 'القانون عدد 20 لسنة 2018 المتعلق بالمؤسسات الناشئة',
    title_fr: 'Loi n° 2018-20 relative aux start-up',
    identifier: 'loi/2018/20',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2018-20-du-17-04-2018-jort-2018-032__2018032000201',
    status: 'in_force',
    category: 'act',
  },
  // Sales techniques and advertising
  {
    id: 'loi-40-1998',
    title: 'القانون عدد 40 لسنة 1998 المتعلق بأساليب البيع والإشهار التجاري',
    title_fr: 'Loi n° 98-40 relative aux techniques de vente et à la publicité commerciale',
    identifier: 'loi/1998/40',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1998-40-du-02-06-1998',
    status: 'in_force',
    category: 'act',
  },
  // Sales with payment facilities
  {
    id: 'loi-39-1998',
    title: 'القانون عدد 39 لسنة 1998 المتعلق بالبيع بالتقسيط',
    title_fr: 'Loi n° 98-39 relative aux ventes avec facilités de paiement',
    identifier: 'loi/1998/39',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1998-39-du-02-06-1998',
    status: 'in_force',
    category: 'act',
  },
  // Commercial register
  {
    id: 'loi-44-1995',
    title: 'القانون عدد 44 لسنة 1995 المتعلق بالسجل التجاري',
    title_fr: 'Loi n° 95-44 relative au registre du commerce',
    identifier: 'loi/1995/44',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1995-44-du-02-05-1995',
    status: 'in_force',
    category: 'act',
  },
  // Patents
  {
    id: 'loi-84-2000',
    title: 'القانون عدد 84 لسنة 2000 المتعلق ببراءات الاختراع',
    title_fr: 'Loi n° 2000-84 relative aux brevets d\'invention',
    identifier: 'loi/2000/84',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-84-du-24-08-2000',
    status: 'in_force',
    category: 'act',
  },
  // Layout designs of integrated circuits
  {
    id: 'loi-20-2001',
    title: 'القانون عدد 20 لسنة 2001 المتعلق بحماية تصاميم الدوائر المتكاملة',
    title_fr: 'Loi n° 2001-20 relative à la protection des schémas de configuration des circuits intégrés',
    identifier: 'loi/2001/20',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-20-du-06-02-2001',
    status: 'in_force',
    category: 'act',
  },
  // Industrial designs
  {
    id: 'loi-21-2001',
    title: 'القانون عدد 21 لسنة 2001 المتعلق بحماية الرسوم والنماذج الصناعية',
    title_fr: 'Loi n° 2001-21 relative à la protection des dessins et modèles industriels',
    identifier: 'loi/2001/21',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-21-du-06-02-2001',
    status: 'in_force',
    category: 'act',
  },
  // Geographical indications
  {
    id: 'loi-68-2007',
    title: 'القانون عدد 68 لسنة 2007 المتعلق بتسميات المنشأ والبيانات الجغرافية',
    title_fr: "Loi n° 2007-68 relative aux appellations d'origine et aux indications géographiques",
    identifier: 'loi/2007/68',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2007-68-du-27-12-2007',
    status: 'in_force',
    category: 'act',
  },
  // Literary and artistic property
  {
    id: 'loi-36-1994',
    title: 'القانون عدد 36 لسنة 1994 المتعلق بالملكية الأدبية والفنية',
    title_fr: 'Loi n° 94-36 relative à la propriété littéraire et artistique',
    identifier: 'loi/1994/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1994-36-du-24-02-1994',
    status: 'amended',
    category: 'act',
  },
  // Personal data protection implementation decree
  {
    id: 'decret-3003-2007',
    title: 'الأمر عدد 3003 لسنة 2007 المتعلق بالهيئة الوطنية لحماية المعطيات الشخصية',
    title_fr: "Décret n° 2007-3003 fixant les modalités de fonctionnement de l'instance nationale de protection des données à caractère personnel",
    identifier: 'decret/2007/3003',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2007-3003-du-27-11-2007',
    status: 'in_force',
    category: 'act',
  },
  // Anti-corruption and asset declaration
  {
    id: 'loi-46-2018',
    title: 'القانون عدد 46 لسنة 2018 المتعلق بالتصريح بالمكاسب والمصالح ومكافحة الإثراء غير المشروع',
    title_fr: "Loi n° 2018-46 relative à la déclaration des biens et des intérêts et à la lutte contre l'enrichissement illicite",
    identifier: 'loi/2018/46',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2018-46',
    status: 'in_force',
    category: 'act',
  },
  // Collective proceedings
  {
    id: 'loi-36-2016',
    title: 'القانون عدد 36 لسنة 2016 المتعلق بالإجراءات الجماعية',
    title_fr: 'Loi n° 2016-36 relative aux procédures collectives',
    identifier: 'loi/2016/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-36',
    status: 'in_force',
    category: 'act',
  },
  // Prevention of torture
  {
    id: 'loi-43-2013',
    title: 'القانون الأساسي عدد 43 لسنة 2013 المتعلق بالهيئة الوطنية للوقاية من التعذيب',
    title_fr: "Loi organique n° 2013-43 relative à l'instance nationale pour la prévention de la torture",
    identifier: 'loi/2013/43',
    url: 'http://www.legislation.tn/en/detailtexte/Loi-num-2013-43-du-23-10-2013-jort-2013-085__2013085000431',
    status: 'in_force',
    category: 'act',
  },
  // Good governance / anti-corruption authority
  {
    id: 'loi-59-2017',
    title: 'القانون الأساسي عدد 59 لسنة 2017 المتعلق بهيئة الحوكمة الرشيدة ومكافحة الفساد',
    title_fr: 'Loi organique n° 2017-59 relative à l\'instance de la bonne gouvernance et de la lutte contre la corruption',
    identifier: 'loi/2017/59',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2017-59',
    status: 'in_force',
    category: 'act',
  },
  // Food safety
  {
    id: 'loi-25-2019',
    title: 'القانون عدد 25 لسنة 2019 المتعلق بالسلامة الصحية للمنتجات الغذائية',
    title_fr: 'Loi n° 2019-25 relative à la sécurité sanitaire des produits alimentaires',
    identifier: 'loi/2019/25',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2019-25',
    status: 'in_force',
    category: 'act',
  },
  // Air quality
  {
    id: 'loi-34-2007',
    title: 'القانون عدد 34 لسنة 2007 المتعلق بنوعية الهواء',
    title_fr: "Loi n° 2007-34 relative à la qualité de l'air",
    identifier: 'loi/2007/34',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2007-34',
    status: 'in_force',
    category: 'act',
  },
  // Waste management
  {
    id: 'loi-41-1996',
    title: 'القانون عدد 41 لسنة 1996 المتعلق بالنفايات وبمراقبة التصرف فيها وإزالتها',
    title_fr: 'Loi n° 96-41 relative aux déchets et au contrôle de leur gestion et de leur élimination',
    identifier: 'loi/1996/41',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1996-41',
    status: 'in_force',
    category: 'act',
  },
  // Renewable energy
  {
    id: 'loi-12-2015',
    title: 'القانون عدد 12 لسنة 2015 المتعلق بإنتاج الكهرباء من الطاقات المتجددة',
    title_fr: "Loi n° 2015-12 relative à la production d'électricité à partir des énergies renouvelables",
    identifier: 'loi/2015/12',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-12',
    status: 'in_force',
    category: 'act',
  },
  // Fisheries
  {
    id: 'loi-13-1994',
    title: 'القانون عدد 13 لسنة 1994 المتعلق بممارسة الصيد البحري',
    title_fr: "Loi n° 94-13 relative à l'exercice de la pêche",
    identifier: 'loi/1994/13',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1994-13',
    status: 'amended',
    category: 'act',
  },
  // Organic agriculture
  {
    id: 'loi-30-1999',
    title: 'القانون عدد 30 لسنة 1999 المتعلق بالفلاحة البيولوجية',
    title_fr: "Loi n° 99-30 relative à l'agriculture biologique",
    identifier: 'loi/1999/30',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1999-30',
    status: 'in_force',
    category: 'act',
  },
  // Water Code
  {
    id: 'code-eaux',
    title: 'مجلة المياه',
    title_fr: "Code des Eaux",
    identifier: 'code/eaux',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1975-16',
    status: 'amended',
    category: 'code',
  },
  // Forest Code
  {
    id: 'code-forestier',
    title: 'مجلة الغابات',
    title_fr: 'Code Forestier',
    identifier: 'code/forestier',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1988-20',
    status: 'amended',
    category: 'code',
  },
  // Mining Code
  {
    id: 'code-minier',
    title: 'مجلة المناجم',
    title_fr: 'Code Minier',
    identifier: 'code/minier',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2003-30',
    status: 'in_force',
    category: 'code',
  },
  // Livestock and animal products
  {
    id: 'loi-95-2005',
    title: 'القانون عدد 95 لسنة 2005 المتعلق بتربية الماشية وبالمنتجات الحيوانية',
    title_fr: "Loi n° 2005-95 relative à l'élevage et aux produits animaux",
    identifier: 'loi/2005/95',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2005-95',
    status: 'in_force',
    category: 'act',
  },
  // Soil and water conservation
  {
    id: 'loi-70-1995',
    title: 'القانون عدد 70 لسنة 1995 المتعلق بالمحافظة على المياه والتربة',
    title_fr: "Loi n° 95-70 relative à la conservation des eaux et du sol",
    identifier: 'loi/1995/70',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1995-70',
    status: 'amended',
    category: 'act',
  },
  // Maritime public domain
  {
    id: 'loi-73-1995',
    title: 'القانون عدد 73 لسنة 1995 المتعلق بالملك العمومي البحري',
    title_fr: 'Loi n° 95-73 relative au domaine public maritime',
    identifier: 'loi/1995/73',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1995-73',
    status: 'in_force',
    category: 'act',
  },
  // Coastal protection
  {
    id: 'loi-72-1995',
    title: 'القانون عدد 72 لسنة 1995 المتعلق بإحداث وكالة حماية وتهيئة الشريط الساحلي',
    title_fr: "Loi n° 95-72 portant création de l'Agence de protection et d'aménagement du littoral",
    identifier: 'loi/1995/72',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1995-72',
    status: 'in_force',
    category: 'act',
  },
  // Environmental impact assessment
  {
    id: 'decret-1991-2005',
    title: 'الأمر عدد 1991 لسنة 2005 المتعلق بدراسة المؤثرات على المحيط',
    title_fr: "Décret n° 2005-1991 relatif à l'étude d'impact sur l'environnement",
    identifier: 'decret/2005/1991',
    url: 'http://www.legislation.tn/fr/detailtexte/Decret-num-2005-1991',
    status: 'in_force',
    category: 'act',
  },
  // Promotional games
  {
    id: 'loi-62-2002',
    title: 'القانون عدد 62 لسنة 2002 المتعلق بالألعاب الترويجية',
    title_fr: 'Loi n° 2002-62 relative aux jeux promotionnels',
    identifier: 'loi/2002/62',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2002-62',
    status: 'in_force',
    category: 'act',
  },
  // Higher education elections authority
  {
    id: 'loi-23-2012',
    title: 'القانون الأساسي عدد 23 لسنة 2012 المتعلق بالهيئة العليا المستقلة للانتخابات',
    title_fr: "Loi organique n° 2012-23 relative à l'instance supérieure indépendante pour les élections",
    identifier: 'loi/2012/23',
    url: 'http://www.legislation.tn/en/detailtexte/Loi-num-2012-23-du-20-12-2012-jort-2012-101__2012101000231',
    status: 'in_force',
    category: 'act',
  },
  // Protected marine and coastal areas
  {
    id: 'loi-49-2009',
    title: 'القانون عدد 49 لسنة 2009 المتعلق بالمناطق البحرية والساحلية المحمية',
    title_fr: 'Loi n° 2009-49 relative aux aires marines et côtières protégées',
    identifier: 'loi/2009/49',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2009-49',
    status: 'in_force',
    category: 'act',
  },
  // Endangered species trade
  {
    id: 'loi-17-2024',
    title: 'القانون عدد 17 لسنة 2024 المتعلق بالاتجار الدولي في الأنواع المهددة بالانقراض',
    title_fr: 'Loi n° 2024-17 relative au commerce international des espèces menacées d\'extinction',
    identifier: 'loi/2024/17',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2024-17',
    status: 'in_force',
    category: 'act',
  },
  // Dangerous road transport
  {
    id: 'loi-37-1997',
    title: 'القانون عدد 37 لسنة 1997 المتعلق بالنقل البري للمواد الخطرة',
    title_fr: 'Loi n° 97-37 relative au transport par route des matières dangereuses',
    identifier: 'loi/1997/37',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1997-37',
    status: 'in_force',
    category: 'act',
  },
  // Veterinary profession
  {
    id: 'loi-47-1997',
    title: 'القانون عدد 47 لسنة 1997 المتعلق بممارسة المهنة البيطرية',
    title_fr: "Loi n° 97-47 relative à l'exercice de la profession de médecin vétérinaire",
    identifier: 'loi/1997/47',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1997-47',
    status: 'in_force',
    category: 'act',
  },
  // Seeds and plant varieties
  {
    id: 'loi-42-1999',
    title: 'القانون عدد 42 لسنة 1999 المتعلق بالبذور والشتلات والمستنبطات النباتية',
    title_fr: 'Loi n° 99-42 relative aux semences, plants et obtentions végétales',
    identifier: 'loi/1999/42',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1999-42',
    status: 'in_force',
    category: 'act',
  },
  // Protected designations of origin
  {
    id: 'loi-57-1999',
    title: 'القانون عدد 57 لسنة 1999 المتعلق بتسميات المنشأ المراقبة',
    title_fr: "Loi n° 99-57 relative aux appellations d'origine contrôlées",
    identifier: 'loi/1999/57',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1999-57',
    status: 'in_force',
    category: 'act',
  },
  // Anti-corruption (decree)
  {
    id: 'decret-loi-120-2011',
    title: 'المرسوم عدد 120 لسنة 2011 المتعلق بمكافحة الفساد',
    title_fr: 'Décret-loi n° 2011-120 relatif à la lutte contre la corruption',
    identifier: 'decret-loi/2011/120',
    url: 'http://www.legislation.tn/fr/detailtexte/Decret-loi-num-2011-120',
    status: 'in_force',
    category: 'act',
  },
  // Associations
  {
    id: 'decret-loi-88-2011',
    title: 'المرسوم عدد 88 لسنة 2011 المتعلق بتنظيم الجمعيات',
    title_fr: "Décret-loi n° 2011-88 portant organisation des associations",
    identifier: 'decret-loi/2011/88',
    url: 'http://www.legislation.tn/fr/detailtexte/Decret-loi-num-2011-88',
    status: 'in_force',
    category: 'act',
  },
  // Paris Agreement ratification
  {
    id: 'loi-72-2016',
    title: 'القانون الأساسي عدد 72 لسنة 2016 المتعلق بالموافقة على اتفاق باريس',
    title_fr: "Loi organique n° 2016-72 portant approbation de l'Accord de Paris sur le climat",
    identifier: 'loi/2016/72',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-72',
    status: 'in_force',
    category: 'act',
  },
  // Maritime ports code
  {
    id: 'code-ports-maritimes',
    title: 'مجلة الموانئ البحرية',
    title_fr: 'Code des Ports Maritimes',
    identifier: 'code/ports-maritimes',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2009-48',
    status: 'in_force',
    category: 'code',
  },
];

/* ---------- Main ---------- */

async function main(): Promise<void> {
  console.log('Tunisia Law MCP -- Census');
  console.log('=========================\n');
  console.log('  Sources:');
  console.log('    - jurisitetunisie.com (33 codes, structured HTML)');
  console.log('    - legislation.tn (official portal, fallback)');
  console.log('    - africa-laws.org, FAOLEX, ILO NATLEX (sector laws)');
  console.log(`  Laws enumerated: ${TUNISIAN_LAWS.length}\n`);

  // Load existing census for merge/resume
  const existingEntries = new Map<string, CensusLawEntry>();
  if (fs.existsSync(CENSUS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8')) as CensusFile;
      for (const law of data.laws) {
        if ('ingested' in law && 'url' in law) {
          existingEntries.set(law.id, law);
        }
      }
      console.log(`  Loaded ${existingEntries.size} existing entries from previous census\n`);
    } catch {
      // Start fresh
    }
  }

  for (const law of TUNISIAN_LAWS) {
    const existing = existingEntries.get(law.id);

    const entry: CensusLawEntry = {
      id: law.id,
      title: law.title,
      title_fr: law.title_fr,
      identifier: law.identifier,
      url: law.url,
      jurisite_pages: law.jurisite_pages,
      status: law.status,
      category: law.category,
      classification: 'ingestable',
      ingested: existing?.ingested ?? false,
      provision_count: existing?.provision_count ?? 0,
      ingestion_date: existing?.ingestion_date ?? null,
    };

    existingEntries.set(law.id, entry);
  }

  const allLaws = Array.from(existingEntries.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  const ingestable = allLaws.filter(l => l.classification === 'ingestable').length;
  const inaccessible = allLaws.filter(l => l.classification === 'inaccessible').length;
  const excluded = allLaws.filter(l => l.classification === 'excluded').length;
  const withJurisite = allLaws.filter(l => l.jurisite_pages && l.jurisite_pages.length > 0).length;

  const today = new Date().toISOString().split('T')[0];

  const census: CensusFile = {
    schema_version: '2.0',
    jurisdiction: 'TN',
    jurisdiction_name: 'Tunisia',
    portal: 'http://www.legislation.tn',
    census_date: today,
    agent: 'claude-opus-4-6',
    summary: {
      total_laws: allLaws.length,
      ingestable,
      ocr_needed: 0,
      inaccessible,
      excluded,
    },
    laws: allLaws,
  };

  fs.mkdirSync(path.dirname(CENSUS_PATH), { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('=========================');
  console.log('Census Complete');
  console.log('=========================\n');
  console.log(`  Total laws:         ${allLaws.length}`);
  console.log(`  Ingestable:         ${ingestable}`);
  console.log(`  With jurisite HTML: ${withJurisite}`);
  console.log(`  Inaccessible:       ${inaccessible}`);
  console.log(`  Excluded:           ${excluded}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
