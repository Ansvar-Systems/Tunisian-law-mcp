#!/usr/bin/env tsx
/**
 * Tunisia Law MCP -- Census Script
 *
 * Enumerates key Tunisian laws from legislation.tn.
 * Tunisia uses a civil law system based on the French model.
 *
 * The legislation.tn portal is often slow/inaccessible, so this census
 * uses a curated list of core laws covering: constitution, data protection,
 * cybersecurity, commerce, labor, finance, and public administration.
 *
 * Tunisian law references:
 *   - "قانون عدد XX لسنة YYYY" = Law No. XX of Year YYYY
 *   - "مرسوم عدد XX لسنة YYYY" = Decree No. XX of Year YYYY
 *   - "أمر عدد XX لسنة YYYY" = Order No. XX of Year YYYY
 *
 * Tunisia uses "الفصل" for articles (Francophone influence), not "المادة".
 *
 * Source: legislation.tn (Portail National de l'Information Juridique)
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
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act';
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

/* ---------- Curated Law List ---------- */

interface LawDescriptor {
  id: string;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
}

/**
 * Core Tunisian laws for cybersecurity, data protection, commerce,
 * and governance. URLs point to legislation.tn and JORT.
 *
 * Tunisia uses "الفصل" (chapter/article) in Francophone convention.
 */
const TUNISIAN_LAWS: LawDescriptor[] = [
  // Constitution
  {
    id: 'constitution-2022',
    title: 'دستور الجمهورية التونسية 2022',
    identifier: 'constitution/2022',
    url: 'http://www.legislation.tn/fr/constitution/la-constitution-de-la-r%C3%A9publique-tunisienne',
    status: 'in_force',
  },
  // Data protection / privacy
  {
    id: 'loi-63-2004',
    title: 'القانون الأساسي عدد 63 لسنة 2004 المتعلق بحماية المعطيات الشخصية',
    identifier: 'loi/2004/63',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2007-3003-du-27-11-2007-jort-2007-096__2007096030033',
    status: 'in_force',
  },
  // Cybersecurity
  {
    id: 'loi-5-2004',
    title: 'القانون عدد 5 لسنة 2004 المتعلق بالسلامة المعلوماتية',
    identifier: 'loi/2004/5',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2004-5-du-03-02-2004-jort-2004-010__2004010000051',
    status: 'in_force',
  },
  // Electronic commerce
  {
    id: 'loi-83-2000',
    title: 'القانون عدد 83 لسنة 2000 المتعلق بالمبادلات والتجارة الإلكترونية',
    identifier: 'loi/2000/83',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-83-du-09-08-2000-jort-2000-064__2000064000831',
    status: 'in_force',
  },
  // Electronic signature
  {
    id: 'loi-57-2000',
    title: 'القانون عدد 57 لسنة 2000 المتعلق بإسناد التوقيع الإلكتروني والتصديق عليه',
    identifier: 'loi/2000/57',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2000-57-du-13-06-2000-jort-2000-048__2000048000571',
    status: 'in_force',
  },
  // Telecommunications
  {
    id: 'loi-1-2001',
    title: 'القانون عدد 1 لسنة 2001 المتعلق بمجلة الاتصالات',
    identifier: 'loi/2001/1',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-1-du-15-01-2001-jort-2001-006__2001006000011',
    status: 'in_force',
  },
  // Press and publication
  {
    id: 'decret-loi-115-2011',
    title: 'المرسوم عدد 115 لسنة 2011 المتعلق بحرية الصحافة والطباعة والنشر',
    identifier: 'decret-loi/2011/115',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-115-du-02-11-2011-jort-2011-084__2011084011501',
    status: 'in_force',
  },
  // Audiovisual communication
  {
    id: 'decret-loi-116-2011',
    title: 'المرسوم عدد 116 لسنة 2011 المتعلق بحرية الاتصال السمعي والبصري',
    identifier: 'decret-loi/2011/116',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-116-du-02-11-2011-jort-2011-084__2011084011601',
    status: 'in_force',
  },
  // Access to information
  {
    id: 'loi-22-2016',
    title: 'القانون الأساسي عدد 22 لسنة 2016 المتعلق بالحق في النفاذ إلى المعلومة',
    identifier: 'loi/2016/22',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-22-du-24-03-2016-jort-2016-026__2016026000221',
    status: 'in_force',
  },
  // Penal Code (cyber provisions)
  {
    id: 'code-penal',
    title: 'المجلة الجزائية',
    identifier: 'code/penal',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2005-46-du-06-06-2005-jort-2005-046__2005046000461',
    status: 'in_force',
  },
  // Code of Obligations and Contracts
  {
    id: 'code-obligations-contrats',
    title: 'مجلة الالتزامات والعقود',
    identifier: 'code/obligations-contrats',
    url: 'http://www.legislation.tn/fr/detailtexte/Code-num-1906-1-du-15-12-1906-jort-2014-067__2014067000011',
    status: 'in_force',
  },
  // Commercial Companies
  {
    id: 'loi-93-2000',
    title: 'القانون عدد 93 لسنة 2000 المتعلق بمجلة الشركات التجارية',
    identifier: 'loi/2000/93',
    url: 'http://www.legislation.tn/fr/detailtexte/Code-num-2000-93-du-03-11-2000-jort-2000-089__2000089000931',
    status: 'in_force',
  },
  // Consumer protection
  {
    id: 'loi-117-1992',
    title: 'القانون عدد 117 لسنة 1992 المتعلق بحماية المستهلك',
    identifier: 'loi/1992/117',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1992-117-du-07-12-1992-jort-1992-083__1992083011701',
    status: 'amended',
  },
  // Competition and prices
  {
    id: 'loi-36-2015',
    title: 'القانون عدد 36 لسنة 2015 المتعلق بإعادة تنظيم المنافسة والأسعار',
    identifier: 'loi/2015/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-36-du-15-09-2015-jort-2015-076__2015076000361',
    status: 'in_force',
  },
  // Labor Code
  {
    id: 'code-travail',
    title: 'مجلة الشغل',
    identifier: 'code/travail',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1966-27-du-30-04-1966-jort-1966-021__1966021000271',
    status: 'amended',
  },
  // Central Bank
  {
    id: 'loi-35-2016',
    title: 'القانون عدد 35 لسنة 2016 المتعلق بضبط النظام الأساسي للبنك المركزي التونسي',
    identifier: 'loi/2016/35',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-35-du-25-04-2016-jort-2016-035__2016035000351',
    status: 'in_force',
  },
  // Banking law
  {
    id: 'loi-48-2016',
    title: 'القانون عدد 48 لسنة 2016 المتعلق بالبنوك والمؤسسات المالية',
    identifier: 'loi/2016/48',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-48-du-11-07-2016-jort-2016-058__2016058000481',
    status: 'in_force',
  },
  // Anti-money laundering
  {
    id: 'loi-26-2015',
    title: 'القانون الأساسي عدد 26 لسنة 2015 المتعلق بمكافحة الإرهاب ومنع غسل الأموال',
    identifier: 'loi/2015/26',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-26-du-07-08-2015-jort-2015-063__2015063000261',
    status: 'in_force',
  },
  // Investment law
  {
    id: 'loi-71-2016',
    title: 'القانون عدد 71 لسنة 2016 المتعلق بقانون الاستثمار',
    identifier: 'loi/2016/71',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-71-du-30-09-2016-jort-2016-081__2016081000711',
    status: 'in_force',
  },
  // Public procurement
  {
    id: 'decret-1039-2014',
    title: 'المرسوم عدد 1039 لسنة 2014 المتعلق بتنظيم الصفقات العمومية',
    identifier: 'decret/2014/1039',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-num-2014-1039-du-13-03-2014-jort-2014-024__2014024103901',
    status: 'in_force',
  },
  // Intellectual property
  {
    id: 'loi-36-2001',
    title: 'القانون عدد 36 لسنة 2001 المتعلق بحماية حقوق المؤلف والحقوق المجاورة',
    identifier: 'loi/2001/36',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2001-36-du-17-04-2001-jort-2001-032__2001032000361',
    status: 'in_force',
  },
  // Tax Code
  {
    id: 'code-irpp-is',
    title: 'مجلة الضريبة على دخل الأشخاص الطبيعيين والضريبة على الشركات',
    identifier: 'code/irpp-is',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1989-114-du-30-12-1989-jort-1989-087__1989087011401',
    status: 'amended',
  },
  // Public-private partnerships
  {
    id: 'loi-49-2015',
    title: 'القانون عدد 49 لسنة 2015 المتعلق بعقود الشراكة بين القطاع العام والقطاع الخاص',
    identifier: 'loi/2015/49',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2015-49-du-27-11-2015-jort-2015-097__2015097000491',
    status: 'in_force',
  },
  // Right to access administrative documents
  {
    id: 'decret-loi-41-2011',
    title: 'المرسوم عدد 41 لسنة 2011 المتعلق بالنفاذ إلى الوثائق الإدارية',
    identifier: 'decret-loi/2011/41',
    url: 'http://www.legislation.tn/fr/detailtexte/D%C3%A9cret-loi-num-2011-41-du-26-05-2011-jort-2011-039__2011039004101',
    status: 'in_force',
  },
  // Whistleblower protection
  {
    id: 'loi-10-2017',
    title: 'القانون عدد 10 لسنة 2017 المتعلق بالإبلاغ عن الفساد وحماية المبلغين',
    identifier: 'loi/2017/10',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2017-10-du-07-03-2017-jort-2017-020__2017020000101',
    status: 'in_force',
  },
  // Customs code
  {
    id: 'code-douanes',
    title: 'مجلة الديوانة',
    identifier: 'code/douanes',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2008-34-du-02-06-2008-jort-2008-044__2008044000341',
    status: 'amended',
  },
  // Insurance code
  {
    id: 'code-assurances',
    title: 'مجلة التأمين',
    identifier: 'code/assurances',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1992-24-du-09-03-1992-jort-1992-018__1992018000241',
    status: 'amended',
  },
  // Administrative procedures
  {
    id: 'loi-38-1996',
    title: 'القانون عدد 38 لسنة 1996 المتعلق بتنقيح مجلة الإجراءات الجزائية',
    identifier: 'loi/1996/38',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-1996-38-du-03-06-1996-jort-1996-045__1996045000381',
    status: 'in_force',
  },
  // Environment protection
  {
    id: 'loi-30-2016',
    title: 'القانون عدد 30 لسنة 2016 المتعلق بقانون الجماعات المحلية',
    identifier: 'loi/2016/30',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2016-30-du-05-05-2016-jort-2016-039__2016039000301',
    status: 'in_force',
  },
  // Startup Act
  {
    id: 'loi-20-2018',
    title: 'القانون عدد 20 لسنة 2018 المتعلق بالمؤسسات الناشئة',
    identifier: 'loi/2018/20',
    url: 'http://www.legislation.tn/fr/detailtexte/Loi-num-2018-20-du-17-04-2018-jort-2018-032__2018032000201',
    status: 'in_force',
  },
];

/* ---------- Main ---------- */

async function main(): Promise<void> {
  console.log('Tunisia Law MCP -- Census');
  console.log('=========================\n');
  console.log('  Source: legislation.tn (Portail National de l\'Information Juridique)');
  console.log('  Method: Curated law list (portal often inaccessible)');
  console.log(`  Laws: ${TUNISIAN_LAWS.length}\n`);

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
      identifier: law.identifier,
      url: law.url,
      status: law.status,
      category: 'act',
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

  const today = new Date().toISOString().split('T')[0];

  const census: CensusFile = {
    schema_version: '1.0',
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
  console.log(`  Total laws:     ${allLaws.length}`);
  console.log(`  Ingestable:     ${ingestable}`);
  console.log(`  Inaccessible:   ${inaccessible}`);
  console.log(`  Excluded:       ${excluded}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
