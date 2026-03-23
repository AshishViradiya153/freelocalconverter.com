import type { AppLocale } from "./routing";
import { routing } from "./routing";

export type NonDefaultLocale = Exclude<AppLocale, "en">;

type PseoStrings = Record<
  | "crumbHome"
  | "crumbGuides"
  | "crumbTools"
  | "guidesHubTitle"
  | "guidesHubDescription"
  | "toolsHubTitle"
  | "toolsHubDescription"
  | "toolsHubSectionsTitle"
  | "relatedPagesTitle"
  | "contentLocaleNotice"
  | "faqHeading"
  | "badgeGuide"
  | "badgeToolsHub"
  | "pagesInCategoryHub"
  | "toolLandingKicker",
  string
>;

/**
 * Native `nav.guides` / `nav.tools` plus full `pseo` namespace for locales
 * where the main override file predates these keys. Deep-merged after
 * `locale-overrides` so labels stay correct in every supported language.
 */
export const localeNavPseoExtras: Record<
  NonDefaultLocale,
  { navGuides: string; navTools: string; pseo: PseoStrings }
> = {
  zh: {
    navGuides: "指南",
    navTools: "工具",
    pseo: {
      crumbHome: "首页",
      crumbGuides: "指南",
      crumbTools: "工具",
      guidesHubTitle: "CSV 与数据表格指南",
      guidesHubDescription:
        "关于打开大型 CSV、清理导出以及在同步到 ERP 或上传电子表格之前于本地使用 Table 的结构化指南。",
      toolsHubTitle: "工具与工作流中心",
      toolsHubDescription:
        "围绕浏览器内 CSV 审阅、电商导出等意图的落地页，配套结构化数据、一致的元数据与内链。",
      toolsHubSectionsTitle: "按类别浏览",
      relatedPagesTitle: "相关页面",
      contentLocaleNotice:
        "正文为英文。界面语言为您当前所选，便于导航与辅助功能。",
      faqHeading: "常见问题",
      badgeGuide: "指南",
      badgeToolsHub: "工具",
      pagesInCategoryHub: "本类别中的页面",
      toolLandingKicker: "工具 · {category}",
    },
  },
  es: {
    navGuides: "Guías",
    navTools: "Herramientas",
    pseo: {
      crumbHome: "Inicio",
      crumbGuides: "Guías",
      crumbTools: "Herramientas",
      guidesHubTitle: "Guías sobre CSV y rejillas de datos",
      guidesHubDescription:
        "Guías estructuradas para abrir CSV grandes, limpiar exportaciones y usar Table en local antes de subir hojas de cálculo o sincronizar con el ERP.",
      toolsHubTitle: "Herramientas y centros de flujo de trabajo",
      toolsHubDescription:
        "Páginas alineadas con la intención de búsqueda para revisar CSV en el navegador, exportaciones de comercio electrónico y flujos relacionados, con datos estructurados y enlaces internos coherentes.",
      toolsHubSectionsTitle: "Explorar por categoría",
      relatedPagesTitle: "Páginas relacionadas",
      contentLocaleNotice:
        "El contenido principal está en inglés. La interfaz usa el idioma que seleccionaste para facilitar la navegación y la accesibilidad.",
      faqHeading: "Preguntas frecuentes",
      badgeGuide: "Guía",
      badgeToolsHub: "Herramientas",
      pagesInCategoryHub: "Páginas en este centro",
      toolLandingKicker: "Herramienta · {category}",
    },
  },
  pt: {
    navGuides: "Guias",
    navTools: "Ferramentas",
    pseo: {
      crumbHome: "Início",
      crumbGuides: "Guias",
      crumbTools: "Ferramentas",
      guidesHubTitle: "Guias sobre CSV e grelhas de dados",
      guidesHubDescription:
        "Guias estruturados para abrir CSV grandes, limpar exportações e usar o Table localmente antes de carregar folhas ou sincronizar com o ERP.",
      toolsHubTitle: "Ferramentas e hubs de fluxo de trabalho",
      toolsHubDescription:
        "Páginas alinhadas à intenção para revisão de CSV no navegador, exportações de e-commerce e fluxos relacionados, com dados estruturados e metadados consistentes.",
      toolsHubSectionsTitle: "Navegar por categoria",
      relatedPagesTitle: "Páginas relacionadas",
      contentLocaleNotice:
        "O texto principal está em inglês. A interface segue o idioma que escolheu para navegação e acessibilidade.",
      faqHeading: "Perguntas frequentes",
      badgeGuide: "Guia",
      badgeToolsHub: "Ferramentas",
      pagesInCategoryHub: "Páginas neste hub",
      toolLandingKicker: "Ferramenta · {category}",
    },
  },
  fr: {
    navGuides: "Guides",
    navTools: "Outils",
    pseo: {
      crumbHome: "Accueil",
      crumbGuides: "Guides",
      crumbTools: "Outils",
      guidesHubTitle: "Guides CSV et grilles de données",
      guidesHubDescription:
        "Guides structurés pour ouvrir de gros CSV, nettoyer des exports et utiliser Table en local avant de charger des feuilles ou de synchroniser l’ERP.",
      toolsHubTitle: "Outils et hubs de workflow",
      toolsHubDescription:
        "Pages alignées sur l’intention pour la relecture de CSV dans le navigateur, les exports e-commerce et les flux associés, avec données structurées et maillage cohérent.",
      toolsHubSectionsTitle: "Parcourir par catégorie",
      relatedPagesTitle: "Pages associées",
      contentLocaleNotice:
        "Le contenu principal est en anglais. L’interface utilise la langue choisie pour la navigation et l’accessibilité.",
      faqHeading: "Questions fréquentes",
      badgeGuide: "Guide",
      badgeToolsHub: "Outils",
      pagesInCategoryHub: "Pages dans ce hub",
      toolLandingKicker: "Outil · {category}",
    },
  },
  de: {
    navGuides: "Anleitungen",
    navTools: "Tools",
    pseo: {
      crumbHome: "Start",
      crumbGuides: "Anleitungen",
      crumbTools: "Tools",
      guidesHubTitle: "CSV- und Datenraster-Anleitungen",
      guidesHubDescription:
        "Strukturierte Anleitungen zum Öffnen großer CSV-Dateien, Bereinigen von Exporten und lokaler Nutzung von Table vor Upload oder ERP-Sync.",
      toolsHubTitle: "Tools und Workflow-Hubs",
      toolsHubDescription:
        "Intent-orientierte Seiten für CSV-Prüfung im Browser, E-Commerce-Exporte und verwandte Abläufe, mit strukturierten Daten und konsistenten Metadaten.",
      toolsHubSectionsTitle: "Nach Kategorie stöbern",
      relatedPagesTitle: "Verwandte Seiten",
      contentLocaleNotice:
        "Der Hauptinhalt ist auf Englisch. Die Oberfläche nutzt Ihre gewählte Sprache für Navigation und Barrierefreiheit.",
      faqHeading: "Häufige Fragen",
      badgeGuide: "Anleitung",
      badgeToolsHub: "Tools",
      pagesInCategoryHub: "Seiten in diesem Hub",
      toolLandingKicker: "Tool · {category}",
    },
  },
  nl: {
    navGuides: "Gidsen",
    navTools: "Tools",
    pseo: {
      crumbHome: "Home",
      crumbGuides: "Gidsen",
      crumbTools: "Tools",
      guidesHubTitle: "CSV- en datarastergidsen",
      guidesHubDescription:
        "Gestructureerde gidsen voor grote CSV’s openen, exports opschonen en Table lokaal gebruiken vóór upload of ERP-sync.",
      toolsHubTitle: "Tools en workflow-hubs",
      toolsHubDescription:
        "Intentiegerichte pagina’s voor CSV-review in de browser, e-commerce-exporten en gerelateerde workflows, met gestructureerde data en interne links.",
      toolsHubSectionsTitle: "Bladeren per categorie",
      relatedPagesTitle: "Gerelateerde pagina’s",
      contentLocaleNotice:
        "De hoofdtekst is in het Engels. De interface volgt uw taalkeuze voor navigatie en toegankelijkheid.",
      faqHeading: "Veelgestelde vragen",
      badgeGuide: "Gids",
      badgeToolsHub: "Tools",
      pagesInCategoryHub: "Pagina’s in deze hub",
      toolLandingKicker: "Tool · {category}",
    },
  },
  it: {
    navGuides: "Guide",
    navTools: "Strumenti",
    pseo: {
      crumbHome: "Home",
      crumbGuides: "Guide",
      crumbTools: "Strumenti",
      guidesHubTitle: "Guide su CSV e griglie dati",
      guidesHubDescription:
        "Guide strutturate per aprire CSV grandi, pulire export e usare Table in locale prima di caricare fogli o sincronizzare l’ERP.",
      toolsHubTitle: "Strumenti e hub di workflow",
      toolsHubDescription:
        "Pagine allineate all’intento per revisione CSV nel browser, export e-commerce e flussi collegati, con dati strutturati e metadati coerenti.",
      toolsHubSectionsTitle: "Sfoglia per categoria",
      relatedPagesTitle: "Pagine correlate",
      contentLocaleNotice:
        "Il contenuto principale è in inglese. L’interfaccia usa la lingua selezionata per navigazione e accessibilità.",
      faqHeading: "Domande frequenti",
      badgeGuide: "Guida",
      badgeToolsHub: "Strumenti",
      pagesInCategoryHub: "Pagine in questo hub",
      toolLandingKicker: "Strumento · {category}",
    },
  },
  ja: {
    navGuides: "ガイド",
    navTools: "ツール",
    pseo: {
      crumbHome: "ホーム",
      crumbGuides: "ガイド",
      crumbTools: "ツール",
      guidesHubTitle: "CSV とデータグリッドのガイド",
      guidesHubDescription:
        "大きな CSV の扱い、エクスポートの整形、スプレッドシートのアップロードや ERP 連携の前に Table をローカルで使うためのガイドです。",
      toolsHubTitle: "ツールとワークフローハブ",
      toolsHubDescription:
        "ブラウザでの CSV 確認、e コマースのエクスポートなど、検索意図に合わせたランディング。構造化データと一貫したメタデータ、内部リンクを備えます。",
      toolsHubSectionsTitle: "カテゴリから探す",
      relatedPagesTitle: "関連ページ",
      contentLocaleNotice:
        "本文は英語です。ナビゲーションとアクセシビリティのため、UI は選択中の言語で表示されます。",
      faqHeading: "よくある質問",
      badgeGuide: "ガイド",
      badgeToolsHub: "ツール",
      pagesInCategoryHub: "このハブのページ",
      toolLandingKicker: "ツール · {category}",
    },
  },
  tr: {
    navGuides: "Rehberler",
    navTools: "Araçlar",
    pseo: {
      crumbHome: "Ana sayfa",
      crumbGuides: "Rehberler",
      crumbTools: "Araçlar",
      guidesHubTitle: "CSV ve veri ızgarası rehberleri",
      guidesHubDescription:
        "Büyük CSV açma, dışa aktarımları temizleme ve e-tabloyu yüklemeden veya ERP ile senkronize etmeden önce Table’ı yerelde kullanma rehberleri.",
      toolsHubTitle: "Araçlar ve iş akışı merkezleri",
      toolsHubDescription:
        "Tarayıcıda CSV incelemesi, e-ticaret dışa aktarımları ve ilgili akışlar için niyete uygun sayfalar; yapılandırılmış veri ve tutarlı meta veriler.",
      toolsHubSectionsTitle: "Kategoriye göre göz at",
      relatedPagesTitle: "İlgili sayfalar",
      contentLocaleNotice:
        "Ana içerik İngilizcedir. Gezinme ve erişilebilirlik için arayüz seçtiğiniz dilde gösterilir.",
      faqHeading: "Sık sorulan sorular",
      badgeGuide: "Rehber",
      badgeToolsHub: "Araçlar",
      pagesInCategoryHub: "Bu merkezdeki sayfalar",
      toolLandingKicker: "Araç · {category}",
    },
  },
  az: {
    navGuides: "Bələdçilər",
    navTools: "Alətlər",
    pseo: {
      crumbHome: "Ana səhifə",
      crumbGuides: "Bələdçilər",
      crumbTools: "Alətlər",
      guidesHubTitle: "CSV və data cədvəli bələdçiləri",
      guidesHubDescription:
        "Böyük CSV açmaq, ixracları təmizləmək və cədvəli yükləmədən və ya ERP ilə sinxronlaşdırmadan əvvəl Table-ı lokal istifadə etmək üçün bələdçilər.",
      toolsHubTitle: "Alətlər və iş axını mərkəzləri",
      toolsHubDescription:
        "Brauzerdə CSV yoxlaması, e-ticarət ixracları və əlaqəli axınlar üçün məqsədə uyğun səhifələr; strukturlaşdırılmış məlumat və tutarlı metaverilənlər.",
      toolsHubSectionsTitle: "Kateqoriyaya görə bax",
      relatedPagesTitle: "Əlaqəli səhifələr",
      contentLocaleNotice:
        "Əsas məzmun ingilis dilindədir. Naviqasiya və əlçatanlıq üçün interfeys seçdiyiniz dildədir.",
      faqHeading: "Tez-tez verilən suallar",
      badgeGuide: "Bələdçi",
      badgeToolsHub: "Alətlər",
      pagesInCategoryHub: "Bu mərkəzdəki səhifələr",
      toolLandingKicker: "Alət · {category}",
    },
  },
  ko: {
    navGuides: "가이드",
    navTools: "도구",
    pseo: {
      crumbHome: "홈",
      crumbGuides: "가이드",
      crumbTools: "도구",
      guidesHubTitle: "CSV 및 데이터 그리드 가이드",
      guidesHubDescription:
        "대용량 CSV 열기, 보내기 정리, 스프레드시트 업로드나 ERP 동기화 전에 Table을 로컬에서 쓰는 방법을 안내합니다.",
      toolsHubTitle: "도구 및 워크플로 허브",
      toolsHubDescription:
        "브라우저 CSV 검토, 이커머스 보내기 등 의도에 맞춘 랜딩 페이지로, 구조화 데이터와 일관된 메타데이터·내부 링크를 제공합니다.",
      toolsHubSectionsTitle: "카테고리별 보기",
      relatedPagesTitle: "관련 페이지",
      contentLocaleNotice:
        "본문은 영어입니다. 탐색과 접근성을 위해 인터페이스는 선택한 언어로 표시됩니다.",
      faqHeading: "자주 묻는 질문",
      badgeGuide: "가이드",
      badgeToolsHub: "도구",
      pagesInCategoryHub: "이 허브의 페이지",
      toolLandingKicker: "도구 · {category}",
    },
  },
  ar: {
    navGuides: "أدلة",
    navTools: "أدوات",
    pseo: {
      crumbHome: "الرئيسية",
      crumbGuides: "أدلة",
      crumbTools: "أدوات",
      guidesHubTitle: "أدلة CSV وشبكات البيانات",
      guidesHubDescription:
        "أدلة منظمة لفتح ملفات CSV الكبيرة وتنظيم التصديرات واستخدام Table محليًا قبل رفع الجداول أو المزامنة مع نظام تخطيط الموارد.",
      toolsHubTitle: "أدوات ومراكز سير العمل",
      toolsHubDescription:
        "صفحات تتماشى مع نية البحث لمراجعة CSV في المتصفح وتصديرات التجارة الإلكترونية وتدفقات ذات صلة، مع بيانات منظمة وروابط داخلية متسقة.",
      toolsHubSectionsTitle: "تصفح حسب الفئة",
      relatedPagesTitle: "صفحات ذات صلة",
      contentLocaleNotice:
        "المحتوى الأساسي بالإنجليزية. الواجهة بلغتك المختارة لتسهيل التنقل وإمكانية الوصول.",
      faqHeading: "الأسئلة الشائعة",
      badgeGuide: "دليل",
      badgeToolsHub: "أدوات",
      pagesInCategoryHub: "الصفحات في هذا المركز",
      toolLandingKicker: "أداة · {category}",
    },
  },
  fa: {
    navGuides: "راهنماها",
    navTools: "ابزارها",
    pseo: {
      crumbHome: "خانه",
      crumbGuides: "راهنماها",
      crumbTools: "ابزارها",
      guidesHubTitle: "راهنماهای CSV و جدول داده",
      guidesHubDescription:
        "راهنماهای ساخت‌یافته برای باز کردن CSVهای بزرگ، تمیز کردن خروجی‌ها و استفادهٔ محلی از Table پیش از بارگذاری صفحه‌گسترده یا همگام‌سازی با ERP.",
      toolsHubTitle: "ابزارها و مراکز گردش کار",
      toolsHubDescription:
        "صفحات هم‌راستا با قصد جستجو برای بازبینی CSV در مرورگر، خروجی‌های تجارت الکترونیک و گردش‌های مرتبط، با دادهٔ ساخت‌یافته و فرادادهٔ یکنواخت.",
      toolsHubSectionsTitle: "مرور بر اساس دسته",
      relatedPagesTitle: "صفحات مرتبط",
      contentLocaleNotice:
        "متن اصلی به انگلیسی است. رابط کاربری به زبان انتخابی شما برای ناوبری و دسترسی‌پذیری نمایش داده می‌شود.",
      faqHeading: "پرسش‌های متداول",
      badgeGuide: "راهنما",
      badgeToolsHub: "ابزارها",
      pagesInCategoryHub: "صفحات این مرکز",
      toolLandingKicker: "ابزار · {category}",
    },
  },
  ru: {
    navGuides: "Руководства",
    navTools: "Инструменты",
    pseo: {
      crumbHome: "Главная",
      crumbGuides: "Руководства",
      crumbTools: "Инструменты",
      guidesHubTitle: "Руководства по CSV и таблицам данных",
      guidesHubDescription:
        "Структурированные руководства: большие CSV, очистка выгрузок и локальная работа в Table до загрузки таблиц или синхронизации с ERP.",
      toolsHubTitle: "Инструменты и хабы процессов",
      toolsHubDescription:
        "Страницы под намерение поиска: проверка CSV в браузере, выгрузки e-commerce и связанные сценарии, со структурированными данными и метаданными.",
      toolsHubSectionsTitle: "Обзор по категориям",
      relatedPagesTitle: "Смежные страницы",
      contentLocaleNotice:
        "Основной текст на английском. Интерфейс на выбранном вами языке для навигации и доступности.",
      faqHeading: "Частые вопросы",
      badgeGuide: "Гид",
      badgeToolsHub: "Инструменты",
      pagesInCategoryHub: "Страницы в этом хабе",
      toolLandingKicker: "Инструмент · {category}",
    },
  },
  he: {
    navGuides: "מדריכים",
    navTools: "כלים",
    pseo: {
      crumbHome: "בית",
      crumbGuides: "מדריכים",
      crumbTools: "כלים",
      guidesHubTitle: "מדריכי CSV ורשתות נתונים",
      guidesHubDescription:
        "מדריכים מובנים לפתיחת קבצי CSV גדולים, ניקוי ייצוא ושימוש מקומי ב-Table לפני העלאת גיליונות או סנכרון ל-ERP.",
      toolsHubTitle: "כלים ומרכזי תהליכים",
      toolsHubDescription:
        "דפים מותאמים לכוונת חיפוש לבדיקת CSV בדפדפן, ייצוא מסחר אלקטרוני ותהליכים קשורים, עם נתונים מובנים ומטא-דאטה עקבית.",
      toolsHubSectionsTitle: "עיון לפי קטגוריה",
      relatedPagesTitle: "דפים קשורים",
      contentLocaleNotice:
        "גוף התוכן באנגלית. הממשק בשפה שבחרת לניווט ונגישות.",
      faqHeading: "שאלות נפוצות",
      badgeGuide: "מדריך",
      badgeToolsHub: "כלים",
      pagesInCategoryHub: "דפים במרכז זה",
      toolLandingKicker: "כלי · {category}",
    },
  },
  el: {
    navGuides: "Οδηγοί",
    navTools: "Εργαλεία",
    pseo: {
      crumbHome: "Αρχική",
      crumbGuides: "Οδηγοί",
      crumbTools: "Εργαλεία",
      guidesHubTitle: "Οδηγοί CSV και πλεγμάτων δεδομένων",
      guidesHubDescription:
        "Δομημένοι οδηγοί για μεγάλα CSV, καθαρισμό εξαγωγών και τοπική χρήση του Table πριν από μεταφόρτωση υπολογιστικών φύλλων ή συγχρονισμό ERP.",
      toolsHubTitle: "Εργαλεία και κόμβοι ροών εργασίας",
      toolsHubDescription:
        "Σελίδες ευθυγραμμισμένες με πρόθεση αναζήτησης για έλεγχο CSV στον browser, εξαγωγές e-commerce και σχετικές ροές, με δομημένα δεδομένα και συνεπή μεταδεδομένα.",
      toolsHubSectionsTitle: "Περιήγηση ανά κατηγορία",
      relatedPagesTitle: "Σχετικές σελίδες",
      contentLocaleNotice:
        "Το κύριο περιεχόμενο είναι στα αγγλικά. Η διεπαφή στη γλώσσα που επιλέξατε για πλοήγηση και προσβασιμότητα.",
      faqHeading: "Συχνές ερωτήσεις",
      badgeGuide: "Οδηγός",
      badgeToolsHub: "Εργαλεία",
      pagesInCategoryHub: "Σελίδες σε αυτόν τον κόμβο",
      toolLandingKicker: "Εργαλείο · {category}",
    },
  },
};

const compareLabelByLocale: Record<NonDefaultLocale, string> = {
  zh: "比较",
  es: "Comparar",
  pt: "Comparar",
  fr: "Comparer",
  de: "Vergleichen",
  nl: "Vergelijken",
  it: "Confronta",
  ja: "比較",
  tr: "Karşılaştır",
  az: "Müqayisə",
  ko: "비교",
  ar: "مقارنة",
  fa: "مقایسه",
  ru: "Сравнить",
  he: "השוואה",
  el: "Σύγκριση",
};

const csvToJsonLabelByLocale: Record<NonDefaultLocale, string> = {
  zh: "CSV → JSON",
  es: "CSV → JSON",
  pt: "CSV → JSON",
  fr: "CSV → JSON",
  de: "CSV → JSON",
  nl: "CSV → JSON",
  it: "CSV → JSON",
  ja: "CSV → JSON",
  tr: "CSV → JSON",
  az: "CSV → JSON",
  ko: "CSV → JSON",
  ar: "CSV → JSON",
  fa: "CSV → JSON",
  ru: "CSV → JSON",
  he: "CSV → JSON",
  el: "CSV → JSON",
};

const jsonToCsvLabelByLocale: Record<NonDefaultLocale, string> = {
  zh: "JSON → CSV",
  es: "JSON → CSV",
  pt: "JSON → CSV",
  fr: "JSON → CSV",
  de: "JSON → CSV",
  nl: "JSON → CSV",
  it: "JSON → CSV",
  ja: "JSON → CSV",
  tr: "JSON → CSV",
  az: "JSON → CSV",
  ko: "JSON → CSV",
  ar: "JSON → CSV",
  fa: "JSON → CSV",
  ru: "JSON → CSV",
  he: "JSON → CSV",
  el: "JSON → CSV",
};

const jsonToExcelLabelByLocale: Record<NonDefaultLocale, string> = {
  zh: "JSON → Excel",
  es: "JSON → Excel",
  pt: "JSON → Excel",
  fr: "JSON → Excel",
  de: "JSON → Excel",
  nl: "JSON → Excel",
  it: "JSON → Excel",
  ja: "JSON → Excel",
  tr: "JSON → Excel",
  az: "JSON → Excel",
  ko: "JSON → Excel",
  ar: "JSON → Excel",
  fa: "JSON → Excel",
  ru: "JSON → Excel",
  he: "JSON → Excel",
  el: "JSON → Excel",
};

const csvToExcelLabelByLocale: Record<NonDefaultLocale, string> = {
  zh: "CSV → Excel",
  es: "CSV → Excel",
  pt: "CSV → Excel",
  fr: "CSV → Excel",
  de: "CSV → Excel",
  nl: "CSV → Excel",
  it: "CSV → Excel",
  ja: "CSV → Excel",
  tr: "CSV → Excel",
  az: "CSV → Excel",
  ko: "CSV → Excel",
  ar: "CSV → Excel",
  fa: "CSV → Excel",
  ru: "CSV → Excel",
  he: "CSV → Excel",
  el: "CSV → Excel",
};

export function getLocaleNavPseoExtras(
  locale: string,
): Record<string, unknown> | null {
  if (locale === routing.defaultLocale) {
    return null;
  }
  if (!(locale in localeNavPseoExtras)) {
    return null;
  }
  const row = localeNavPseoExtras[locale as NonDefaultLocale];
  return {
    nav: {
      guides: row.navGuides,
      tools: row.navTools,
      compare: compareLabelByLocale[locale as NonDefaultLocale],
      csvToJson: csvToJsonLabelByLocale[locale as NonDefaultLocale],
      jsonToCsv: jsonToCsvLabelByLocale[locale as NonDefaultLocale],
      csvToExcel: csvToExcelLabelByLocale[locale as NonDefaultLocale],
      jsonToExcel: jsonToExcelLabelByLocale[locale as NonDefaultLocale],
    },
    pseo: row.pseo,
  };
}
