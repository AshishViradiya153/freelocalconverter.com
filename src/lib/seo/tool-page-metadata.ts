import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type AppLocale, routing } from "@/i18n/routing";
import { buildPageMetadata } from "./metadata";

export type ToolPageSlug =
  | "axios-converter"
  | "base64-converter"
  | "bulk-pdf-watermark"
  | "compare"
  | "csv-to-excel"
  | "csv-to-json"
  | "csv-to-markdown-table"
  | "csv-to-sql"
  | "csv-to-parquet"
  | "cron-parser"
  | "curl-converter"
  | "data-grid"
  | "data-grid-live"
  | "data-grid-render"
  | "fetch-converter"
  | "graphql-tools"
  | "heic-to-jpg"
  | "http-explainer"
  | "image-compress"
  | "image-convert"
  | "image-resize"
  | "images-to-pdf"
  | "json-formatter"
  | "json-to-csv"
  | "json-to-excel"
  | "json-to-parquet"
  | "json-yaml-converter"
  | "jwt-decoder"
  | "merge-pdf"
  | "markdown-html-converter"
  | "openapi-viewer"
  | "parquet-to-csv"
  | "parquet-to-json"
  | "parquet-viewer"
  | "pdf-to-image"
  | "pdf-to-word"
  | "pdf-watermark"
  | "python-requests-converter"
  | "reorder-pdf"
  | "regex-tester"
  | "request-converter"
  | "split-pdf"
  | "sql-formatter"
  | "unix-timestamp-converter"
  | "uuid-generator"
  | "video-compress"
  | "webhook-viewer"
  | "xls-to-csv"
  | "xls-viewer";

interface ToolPageDefinition {
  pathname: `/${string}`;
  titleByLocale: Record<AppLocale, string>;
  keywords: string[];
}

type LocalizedTerm = Record<AppLocale, string>;

function localizedRecord(
  mapper: (locale: AppLocale) => string,
): Record<AppLocale, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, mapper(locale)]),
  ) as Record<AppLocale, string>;
}

const TERMS = {
  api: localizedRecord(() => "API"),
  axios: localizedRecord(() => "axios"),
  csv: localizedRecord(() => "CSV"),
  curl: localizedRecord(() => "cURL"),
  excel: {
    en: "Excel",
    zh: "Excel",
    es: "Excel",
    pt: "Excel",
    fr: "Excel",
    de: "Excel",
    nl: "Excel",
    it: "Excel",
    ja: "Excel",
    tr: "Excel",
    az: "Excel",
    ko: "Excel",
    ar: "Excel",
    fa: "Excel",
    ru: "Excel",
    he: "Excel",
    el: "Excel",
  },
  fetch: localizedRecord(() => "fetch"),
  graphql: localizedRecord(() => "GraphQL"),
  heic: localizedRecord(() => "HEIC"),
  http: localizedRecord(() => "HTTP"),
  image: {
    en: "Image",
    zh: "图片",
    es: "Imagen",
    pt: "Imagem",
    fr: "Image",
    de: "Bild",
    nl: "Afbeelding",
    it: "Immagine",
    ja: "画像",
    tr: "Gorsel",
    az: "Sekil",
    ko: "이미지",
    ar: "صورة",
    fa: "تصویر",
    ru: "Изображение",
    he: "תמונה",
    el: "Εικόνα",
  },
  images: {
    en: "Images",
    zh: "图片",
    es: "Imagenes",
    pt: "Imagens",
    fr: "Images",
    de: "Bilder",
    nl: "Afbeeldingen",
    it: "Immagini",
    ja: "画像",
    tr: "Gorseller",
    az: "Sekiller",
    ko: "이미지",
    ar: "الصور",
    fa: "تصاویر",
    ru: "Изображения",
    he: "תמונות",
    el: "Εικονες",
  },
  json: localizedRecord(() => "JSON"),
  markdownTable: {
    en: "Markdown Table",
    zh: "Markdown 表格",
    es: "tabla Markdown",
    pt: "tabela Markdown",
    fr: "tableau Markdown",
    de: "Markdown-Tabelle",
    nl: "Markdown-tabel",
    it: "tabella Markdown",
    ja: "Markdown表",
    tr: "Markdown tablosu",
    az: "Markdown cedveli",
    ko: "Markdown 표",
    ar: "جدول Markdown",
    fa: "جدول Markdown",
    ru: "таблицу Markdown",
    he: "טבלת Markdown",
    el: "πινακας Markdown",
  },
  sqlInsertsSketch: {
    en: "SQL INSERT & DDL sketch",
    zh: "SQL 插入与表结构草稿",
    es: "SQL INSERT y borrador DDL",
    pt: "SQL INSERT e rascunho DDL",
    fr: "SQL INSERT et ebauche DDL",
    de: "SQL-INSERT & DDL-Skizze",
    nl: "SQL INSERT en DDL-schets",
    it: "SQL INSERT e bozza DDL",
    ja: "SQL INSERT と DDL 下書き",
    tr: "SQL INSERT ve DDL taslagi",
    az: "SQL INSERT ve DDL eskizi",
    ko: "SQL INSERT 및 DDL 초안",
    ar: "مسودة SQL INSERT و DDL",
    fa: "پیش نویس SQL INSERT و DDL",
    ru: "SQL INSERT и черновик DDL",
    he: "SQL INSERT וטיוטת DDL",
    el: "SQL INSERT και προχειρο DDL",
  },
  openapi: localizedRecord(() => "OpenAPI"),
  parquet: localizedRecord(() => "Parquet"),
  pdf: localizedRecord(() => "PDF"),
  pythonRequests: {
    en: "Python requests",
    zh: "Python requests",
    es: "Python requests",
    pt: "Python requests",
    fr: "Python requests",
    de: "Python requests",
    nl: "Python requests",
    it: "Python requests",
    ja: "Python requests",
    tr: "Python requests",
    az: "Python requests",
    ko: "Python requests",
    ar: "Python requests",
    fa: "Python requests",
    ru: "Python requests",
    he: "Python requests",
    el: "Python requests",
  },
  webhookPayload: {
    en: "Webhook payload",
    zh: "Webhook 负载",
    es: "payload de webhook",
    pt: "payload de webhook",
    fr: "charge utile webhook",
    de: "Webhook-Payload",
    nl: "webhook-payload",
    it: "payload webhook",
    ja: "Webhookペイロード",
    tr: "webhook yuk verisi",
    az: "webhook payload-u",
    ko: "Webhook 페이로드",
    ar: "حمولة Webhook",
    fa: "payload وبهوک",
    ru: "полезная нагрузка webhook",
    he: "מטען webhook",
    el: "φορτιο webhook",
  },
  xls: localizedRecord(() => "Excel"),
} satisfies Record<string, LocalizedTerm>;

function convertTitle(from: LocalizedTerm, to: LocalizedTerm) {
  return localizedRecord((locale) => {
    const left = from[locale];
    const right = to[locale];

    switch (locale) {
      case "zh":
        return `${left} 转 ${right}`;
      case "ja":
        return `${left} から ${right}`;
      case "ko":
        return `${left}에서 ${right}`;
      case "tr":
        return `${left}'den ${right}'e`;
      case "az":
        return `${left}-dən ${right}-ə`;
      case "ar":
        return `${left} إلى ${right}`;
      case "fa":
        return `${left} به ${right}`;
      case "he":
        return `${left} ל-${right}`;
      case "el":
        return `${left} σε ${right}`;
      case "de":
        return `${left} zu ${right}`;
      case "fr":
        return `${left} vers ${right}`;
      case "it":
        return `Da ${left} a ${right}`;
      case "nl":
        return `${left} naar ${right}`;
      case "pt":
        return `${left} para ${right}`;
      case "es":
        return `${left} a ${right}`;
      case "ru":
        return `Из ${left} в ${right}`;
      default:
        return `${left} to ${right}`;
    }
  });
}

function converterTitle(subject: LocalizedTerm) {
  return localizedRecord((locale) => {
    const value = subject[locale];

    switch (locale) {
      case "zh":
        return `${value} 转换器`;
      case "ja":
        return `${value} 変換`;
      case "ko":
        return `${value} 변환기`;
      case "tr":
        return `${value} donusturucu`;
      case "az":
        return `${value} cevirici`;
      case "ar":
        return `محول ${value}`;
      case "fa":
        return `مبدل ${value}`;
      case "he":
        return `ממיר ${value}`;
      case "el":
        return `Μετατροπεας ${value}`;
      case "de":
        return `${value}-Konverter`;
      case "fr":
        return `Convertisseur ${value}`;
      case "nl":
        return `${value}-converter`;
      case "it":
        return `Convertitore ${value}`;
      case "pt":
        return `Conversor ${value}`;
      case "es":
        return `Conversor ${value}`;
      case "ru":
        return `Конвертер ${value}`;
      default:
        return `${value} converter`;
    }
  });
}

function viewerTitle(subject: LocalizedTerm) {
  return localizedRecord((locale) => {
    const value = subject[locale];

    switch (locale) {
      case "zh":
        return `${value} 查看器`;
      case "ja":
        return `${value} ビューア`;
      case "ko":
        return `${value} 뷰어`;
      case "tr":
        return `${value} goruntuleyici`;
      case "az":
        return `${value} goruntuleyicisi`;
      case "ar":
        return `عارض ${value}`;
      case "fa":
        return `نمایشگر ${value}`;
      case "he":
        return `מציג ${value}`;
      case "el":
        return `Προβολη ${value}`;
      case "de":
        return `${value}-Viewer`;
      case "fr":
        return `Visionneuse ${value}`;
      case "nl":
        return `${value}-viewer`;
      case "it":
        return `Visualizzatore ${value}`;
      case "pt":
        return `Visualizador de ${value}`;
      case "es":
        return `Visor de ${value}`;
      case "ru":
        return `Просмотр ${value}`;
      default:
        return `${value} Viewer`;
    }
  });
}

function compressorTitle(subject: LocalizedTerm) {
  return localizedRecord((locale) => {
    const value = subject[locale];

    switch (locale) {
      case "zh":
        return `${value} 压缩器`;
      case "ja":
        return `${value} 圧縮`;
      case "ko":
        return `${value} 압축기`;
      case "tr":
        return `${value} sikistirici`;
      case "az":
        return `${value} sixisdirici`;
      case "ar":
        return `ضاغط ${value}`;
      case "fa":
        return `فشرده ساز ${value}`;
      case "he":
        return `דוחס ${value}`;
      case "el":
        return `Συμπιεστης ${value}`;
      case "de":
        return `${value}-Kompressor`;
      case "fr":
        return `Compresseur ${value}`;
      case "nl":
        return `${value}-compressor`;
      case "it":
        return `Compressore ${value}`;
      case "pt":
        return `Compressor de ${value}`;
      case "es":
        return `Compresor de ${value}`;
      case "ru":
        return `Сжатие ${value}`;
      default:
        return `${value} Compressor`;
    }
  });
}

function localizedTitle(slug: ToolPageSlug): Record<AppLocale, string> {
  switch (slug) {
    case "axios-converter":
      return converterTitle(TERMS.axios);
    case "base64-converter":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "Base64 编码解码器";
          case "es":
            return "Codificador Base64";
          case "pt":
            return "Codificador Base64";
          case "fr":
            return "Encodeur Base64";
          case "de":
            return "Base64-Kodierer";
          case "nl":
            return "Base64-converter";
          case "it":
            return "Codificatore Base64";
          case "ja":
            return "Base64 エンコード";
          case "tr":
            return "Base64 kodlayici";
          case "az":
            return "Base64 kodlayici";
          case "ko":
            return "Base64 인코더";
          case "ar":
            return "مشفّر Base64";
          case "fa":
            return "رمزگذار Base64";
          case "ru":
            return "Кодировщик Base64";
          case "he":
            return "מקודד Base64";
          case "el":
            return "Κωδικοποιητης Base64";
          default:
            return "Base64 encoder";
        }
      });
    case "compare":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "比较 CSV 文件";
          case "es":
            return "Comparar archivos CSV";
          case "pt":
            return "Comparar arquivos CSV";
          case "fr":
            return "Comparer des fichiers CSV";
          case "de":
            return "CSV-Dateien vergleichen";
          case "nl":
            return "CSV-bestanden vergelijken";
          case "it":
            return "Confronta file CSV";
          case "ja":
            return "CSV ファイルを比較";
          case "tr":
            return "CSV dosyalarini karsilastir";
          case "az":
            return "CSV fayllarini muqayise et";
          case "ko":
            return "CSV 파일 비교";
          case "ar":
            return "مقارنة ملفات CSV";
          case "fa":
            return "مقایسه فایل های CSV";
          case "ru":
            return "Сравнение файлов CSV";
          case "he":
            return "השוואת קבצי CSV";
          case "el":
            return "Συγκριση αρχειων CSV";
          default:
            return "Compare CSV files";
        }
      });
    case "csv-to-excel":
      return convertTitle(TERMS.csv, TERMS.excel);
    case "csv-to-json":
      return convertTitle(TERMS.csv, TERMS.json);
    case "csv-to-markdown-table":
      return convertTitle(TERMS.csv, TERMS.markdownTable);
    case "csv-to-sql":
      return convertTitle(TERMS.csv, TERMS.sqlInsertsSketch);
    case "csv-to-parquet":
      return convertTitle(TERMS.csv, TERMS.parquet);
    case "cron-parser":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "Cron 解析器";
          case "es":
            return "Analizador Cron";
          case "pt":
            return "Analisador Cron";
          case "fr":
            return "Analyseur Cron";
          case "de":
            return "Cron-Parser";
          case "nl":
            return "Cron-parser";
          case "it":
            return "Parser Cron";
          case "ja":
            return "Cron パーサ";
          case "tr":
            return "Cron cozumleyici";
          case "az":
            return "Cron parseri";
          case "ko":
            return "Cron 파서";
          case "ar":
            return "محلل Cron";
          case "fa":
            return "تجزیه کننده Cron";
          case "ru":
            return "Парсер Cron";
          case "he":
            return "מפענח Cron";
          case "el":
            return "Αναλυτης Cron";
          default:
            return "Cron parser";
        }
      });
    case "curl-converter":
      return converterTitle(TERMS.curl);
    case "data-grid":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "数据表格演示";
          case "es":
            return "Demo de cuadrícula de datos";
          case "pt":
            return "Demo de grade de dados";
          case "fr":
            return "Demo de grille de donnees";
          case "de":
            return "Datenraster-Demo";
          case "nl":
            return "Datagrid-demo";
          case "it":
            return "Demo griglia dati";
          case "ja":
            return "データグリッドデモ";
          case "tr":
            return "Veri izgara demosu";
          case "az":
            return "Veri toru demosu";
          case "ko":
            return "데이터 그리드 데모";
          case "ar":
            return "عرض توضيحي لجدول البيانات";
          case "fa":
            return "دموی جدول داده";
          case "ru":
            return "Демо таблицы данных";
          case "he":
            return "הדגמת טבלת נתונים";
          case "el":
            return "Demo πλεγματος δεδομενων";
          default:
            return "Data Grid Demo";
        }
      });
    case "data-grid-live":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "实时数据表格演示";
          case "es":
            return "Demo de cuadrícula de datos en vivo";
          case "pt":
            return "Demo de grade de dados ao vivo";
          case "fr":
            return "Demo de grille de donnees en direct";
          case "de":
            return "Live-Datenraster-Demo";
          case "nl":
            return "Live-datagrid-demo";
          case "it":
            return "Demo griglia dati live";
          case "ja":
            return "ライブデータグリッドデモ";
          case "tr":
            return "Canli veri izgara demosu";
          case "az":
            return "Canli veri toru demosu";
          case "ko":
            return "실시간 데이터 그리드 데모";
          case "ar":
            return "عرض توضيحي مباشر لجدول البيانات";
          case "fa":
            return "دموی زنده جدول داده";
          case "ru":
            return "Демо живой таблицы данных";
          case "he":
            return "הדגמת טבלת נתונים חיה";
          case "el":
            return "Demo ζωντανου πλεγματος δεδομενων";
          default:
            return "Live Data Grid Demo";
        }
      });
    case "data-grid-render":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "数据表格渲染演示";
          case "es":
            return "Demo de renderizado de cuadrícula de datos";
          case "pt":
            return "Demo de renderizacao de grade de dados";
          case "fr":
            return "Demo de rendu de grille de donnees";
          case "de":
            return "Datenraster-Render-Demo";
          case "nl":
            return "Datagrid-renderdemo";
          case "it":
            return "Demo rendering griglia dati";
          case "ja":
            return "データグリッド描画デモ";
          case "tr":
            return "Veri izgara cizim demosu";
          case "az":
            return "Veri toru render demosu";
          case "ko":
            return "데이터 그리드 렌더링 데모";
          case "ar":
            return "عرض توضيحي لتصيير جدول البيانات";
          case "fa":
            return "دموی رندر جدول داده";
          case "ru":
            return "Демо рендеринга таблицы данных";
          case "he":
            return "הדגמת רינדור טבלת נתונים";
          case "el":
            return "Demo αποδοσης πλεγματος δεδομενων";
          default:
            return "Data Grid Render Demo";
        }
      });
    case "fetch-converter":
      return converterTitle(TERMS.fetch);
    case "graphql-tools":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "GraphQL 工具";
          case "es":
            return "Herramientas GraphQL";
          case "pt":
            return "Ferramentas GraphQL";
          case "fr":
            return "Outils GraphQL";
          case "de":
            return "GraphQL-Tools";
          case "nl":
            return "GraphQL-tools";
          case "it":
            return "Strumenti GraphQL";
          case "ja":
            return "GraphQL ツール";
          case "tr":
            return "GraphQL araclari";
          case "az":
            return "GraphQL alətləri";
          case "ko":
            return "GraphQL 도구";
          case "ar":
            return "أدوات GraphQL";
          case "fa":
            return "ابزارهای GraphQL";
          case "ru":
            return "Инструменты GraphQL";
          case "he":
            return "כלי GraphQL";
          case "el":
            return "Εργαλεια GraphQL";
          default:
            return "GraphQL tools";
        }
      });
    case "heic-to-jpg":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "HEIC 转 JPG/PNG";
          case "ja":
            return "HEIC から JPG/PNG";
          case "ko":
            return "HEIC에서 JPG/PNG";
          case "tr":
            return "HEIC'den JPG/PNG'ye";
          case "az":
            return "HEIC-dən JPG/PNG-yə";
          case "ar":
            return "HEIC إلى JPG/PNG";
          case "fa":
            return "HEIC به JPG/PNG";
          case "he":
            return "HEIC ל-JPG/PNG";
          case "el":
            return "HEIC σε JPG/PNG";
          case "de":
            return "HEIC zu JPG/PNG";
          case "fr":
            return "HEIC vers JPG/PNG";
          case "it":
            return "Da HEIC a JPG/PNG";
          case "nl":
            return "HEIC naar JPG/PNG";
          case "pt":
            return "HEIC para JPG/PNG";
          case "es":
            return "HEIC a JPG/PNG";
          case "ru":
            return "Из HEIC в JPG/PNG";
          default:
            return "HEIC to JPG/PNG";
        }
      });
    case "http-explainer":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "HTTP 状态和标头说明";
          case "es":
            return "Explicacion de estados y cabeceras HTTP";
          case "pt":
            return "Explicacao de status e cabecalhos HTTP";
          case "fr":
            return "Explication des statuts et en-tetes HTTP";
          case "de":
            return "Erklarung zu HTTP-Status und Headern";
          case "nl":
            return "Uitleg over HTTP-status en headers";
          case "it":
            return "Spiegazione di stati e header HTTP";
          case "ja":
            return "HTTP ステータスとヘッダー解説";
          case "tr":
            return "HTTP durum ve baslik aciklayici";
          case "az":
            return "HTTP status ve basliq izahcisi";
          case "ko":
            return "HTTP 상태 및 헤더 설명";
          case "ar":
            return "شرح حالات وترويسات HTTP";
          case "fa":
            return "توضیح وضعیت ها و هدرهای HTTP";
          case "ru":
            return "Объяснение статусов и заголовков HTTP";
          case "he":
            return "הסבר על סטטוסים וכותרות HTTP";
          case "el":
            return "Επεξηγηση καταστασεων και κεφαλιδων HTTP";
          default:
            return "HTTP status + headers explainer";
        }
      });
    case "image-compress":
      return compressorTitle(TERMS.image);
    case "image-convert":
      return converterTitle(TERMS.image);
    case "image-resize":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "图片调整大小/裁剪/转换";
          case "es":
            return "Redimensionar/recortar/convertir imagen";
          case "pt":
            return "Redimensionar/cortar/convertar imagem";
          case "fr":
            return "Redimensionner/rogner/convertir l'image";
          case "de":
            return "Bild vergroßern/zuschneiden/konvertieren";
          case "nl":
            return "Afbeelding schalen/bijsnijden/converteren";
          case "it":
            return "Ridimensiona/ritaglia/converti immagine";
          case "ja":
            return "画像のリサイズ/切り抜き/変換";
          case "tr":
            return "Gorsel yeniden boyutlandir/kirp/donustur";
          case "az":
            return "Sekli olculendir/kes/cevir";
          case "ko":
            return "이미지 크기 조정/자르기/변환";
          case "ar":
            return "تغيير حجم الصورة/اقتصاصها/تحويلها";
          case "fa":
            return "تغییر اندازه/برش/تبدیل تصویر";
          case "ru":
            return "Изменение размера/обрезка/конвертация изображения";
          case "he":
            return "שינוי גודל/חיתוך/המרת תמונה";
          case "el":
            return "Αλλαγη μεγεθους/περικοπη/μετατροπη εικονας";
          default:
            return "Image Resize/Crop + Convert";
        }
      });
    case "images-to-pdf":
      return convertTitle(TERMS.images, TERMS.pdf);
    case "json-formatter":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "JSON 格式化";
          case "es":
            return "Formateador JSON";
          case "pt":
            return "Formatador JSON";
          case "fr":
            return "Formateur JSON";
          case "de":
            return "JSON-Formatierer";
          case "nl":
            return "JSON-formatter";
          case "it":
            return "Formattatore JSON";
          case "ja":
            return "JSON 整形";
          case "tr":
            return "JSON bicimlendirici";
          case "az":
            return "JSON formatlayici";
          case "ko":
            return "JSON 포매터";
          case "ar":
            return "منسق JSON";
          case "fa":
            return "قالب بند JSON";
          case "ru":
            return "Форматирование JSON";
          case "he":
            return "מעצב JSON";
          case "el":
            return "Μορφοποιηση JSON";
          default:
            return "JSON Formatter";
        }
      });
    case "json-to-csv":
      return convertTitle(TERMS.json, TERMS.csv);
    case "json-to-excel":
      return convertTitle(TERMS.json, TERMS.excel);
    case "json-to-parquet":
      return convertTitle(TERMS.json, TERMS.parquet);
    case "json-yaml-converter":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "JSON YAML 转换器";
          case "es":
            return "Convertidor JSON YAML";
          case "pt":
            return "Conversor JSON YAML";
          case "fr":
            return "Convertisseur JSON YAML";
          case "de":
            return "JSON-YAML-Konverter";
          case "nl":
            return "JSON-YAML-converter";
          case "it":
            return "Convertitore JSON YAML";
          case "ja":
            return "JSON YAML 変換";
          case "tr":
            return "JSON YAML donusturucu";
          case "az":
            return "JSON YAML konvertoru";
          case "ko":
            return "JSON YAML 변환기";
          case "ar":
            return "محول JSON و YAML";
          case "fa":
            return "مبدل JSON و YAML";
          case "ru":
            return "Конвертер JSON и YAML";
          case "he":
            return "ממיר JSON YAML";
          case "el":
            return "Μετατροπεας JSON YAML";
          default:
            return "JSON YAML converter";
        }
      });
    case "jwt-decoder":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "JWT 解码器";
          case "es":
            return "Decodificador JWT";
          case "pt":
            return "Decodificador JWT";
          case "fr":
            return "Decodeur JWT";
          case "de":
            return "JWT-Decoder";
          case "nl":
            return "JWT-decoder";
          case "it":
            return "Decoder JWT";
          case "ja":
            return "JWT デコーダ";
          case "tr":
            return "JWT cozucu";
          case "az":
            return "JWT dekoderi";
          case "ko":
            return "JWT 디코더";
          case "ar":
            return "فك ترميز JWT";
          case "fa":
            return "رمزگشای JWT";
          case "ru":
            return "Декодер JWT";
          case "he":
            return "מפענח JWT";
          case "el":
            return "Αποκωδικοποιητης JWT";
          default:
            return "JWT decoder";
        }
      });
    case "merge-pdf":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "合并 PDF";
          case "es":
            return "Unir PDF";
          case "pt":
            return "Mesclar PDF";
          case "fr":
            return "Fusionner PDF";
          case "de":
            return "PDF zusammenfugen";
          case "nl":
            return "PDF samenvoegen";
          case "it":
            return "Unisci PDF";
          case "ja":
            return "PDF 結合";
          case "tr":
            return "PDF birlestir";
          case "az":
            return "PDF birlesdir";
          case "ko":
            return "PDF 병합";
          case "ar":
            return "دمج PDF";
          case "fa":
            return "ادغام PDF";
          case "ru":
            return "Объединить PDF";
          case "he":
            return "מיזוג PDF";
          case "el":
            return "Συγχωνευση PDF";
          default:
            return "Merge PDF";
        }
      });
    case "openapi-viewer":
      return viewerTitle(TERMS.openapi);
    case "parquet-to-csv":
      return convertTitle(TERMS.parquet, TERMS.csv);
    case "parquet-to-json":
      return convertTitle(TERMS.parquet, TERMS.json);
    case "parquet-viewer":
      return viewerTitle(TERMS.parquet);
    case "pdf-to-image":
      return convertTitle(TERMS.pdf, TERMS.image);
    case "pdf-to-word":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "PDF 转 Word";
          case "ja":
            return "PDF から Word";
          case "ko":
            return "PDF에서 Word";
          case "tr":
            return "PDF'den Word'e";
          case "az":
            return "PDF-dən Word-ə";
          case "ar":
            return "PDF إلى Word";
          case "fa":
            return "PDF به Word";
          case "he":
            return "PDF ל-Word";
          case "el":
            return "PDF σε Word";
          case "de":
            return "PDF zu Word";
          case "fr":
            return "PDF vers Word";
          case "it":
            return "Da PDF a Word";
          case "nl":
            return "PDF naar Word";
          case "pt":
            return "PDF para Word";
          case "es":
            return "PDF a Word";
          case "ru":
            return "Из PDF в Word";
          default:
            return "PDF to Word";
        }
      });
    case "pdf-watermark":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "PDF 水印";
          case "es":
            return "Marca de agua PDF";
          case "pt":
            return "Marca d'agua em PDF";
          case "fr":
            return "Filigrane PDF";
          case "de":
            return "PDF-Wasserzeichen";
          case "nl":
            return "PDF-watermerk";
          case "it":
            return "Filigrana PDF";
          case "ja":
            return "PDF 透かし";
          case "tr":
            return "PDF filigrani";
          case "az":
            return "PDF su nişanı";
          case "ko":
            return "PDF 워터마크";
          case "ar":
            return "علامة مائية PDF";
          case "fa":
            return "واترمارک PDF";
          case "ru":
            return "Водяной знак PDF";
          case "he":
            return "סימן מים ל-PDF";
          case "el":
            return "Υδατογραφημα PDF";
          default:
            return "PDF Watermark";
        }
      });
    case "python-requests-converter":
      return converterTitle(TERMS.pythonRequests);
    case "reorder-pdf":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "重新排序 PDF 页面";
          case "es":
            return "Reordenar paginas PDF";
          case "pt":
            return "Reordenar paginas do PDF";
          case "fr":
            return "Reordonner les pages PDF";
          case "de":
            return "PDF-Seiten neu anordnen";
          case "nl":
            return "PDF-pagina's herschikken";
          case "it":
            return "Riordina pagine PDF";
          case "ja":
            return "PDF ページ並べ替え";
          case "tr":
            return "PDF sayfalarini yeniden sirala";
          case "az":
            return "PDF sehifelerini yeniden duz";
          case "ko":
            return "PDF 페이지 재정렬";
          case "ar":
            return "إعادة ترتيب صفحات PDF";
          case "fa":
            return "مرتب سازی دوباره صفحات PDF";
          case "ru":
            return "Изменить порядок страниц PDF";
          case "he":
            return "סידור מחדש של עמודי PDF";
          case "el":
            return "Αναδιαταξη σελιδων PDF";
          default:
            return "Reorder PDF Pages";
        }
      });
    case "request-converter":
      return converterTitle(TERMS.api);
    case "regex-tester":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "正则表达式测试";
          case "es":
            return "Probador de regex";
          case "pt":
            return "Testador de regex";
          case "fr":
            return "Testeur regex";
          case "de":
            return "Regex-Tester";
          case "nl":
            return "Regex-tester";
          case "it":
            return "Tester regex";
          case "ja":
            return "正規表現テスター";
          case "tr":
            return "Regex test araci";
          case "az":
            return "Regex test aləti";
          case "ko":
            return "정규식 테스터";
          case "ar":
            return "مختبر التعبيرات النمطية";
          case "fa":
            return "آزمایشگر regex";
          case "ru":
            return "Тестер регулярных выражений";
          case "he":
            return "בודק ביטויים רגולריים";
          case "el":
            return "Δοκιμαστης regex";
          default:
            return "Regex tester";
        }
      });
    case "split-pdf":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "拆分 PDF";
          case "es":
            return "Dividir PDF";
          case "pt":
            return "Dividir PDF";
          case "fr":
            return "Diviser PDF";
          case "de":
            return "PDF teilen";
          case "nl":
            return "PDF splitsen";
          case "it":
            return "Dividi PDF";
          case "ja":
            return "PDF 分割";
          case "tr":
            return "PDF bol";
          case "az":
            return "PDF bol";
          case "ko":
            return "PDF 분할";
          case "ar":
            return "تقسيم PDF";
          case "fa":
            return "تقسیم PDF";
          case "ru":
            return "Разделить PDF";
          case "he":
            return "פיצול PDF";
          case "el":
            return "Διαχωρισμος PDF";
          default:
            return "Split PDF";
        }
      });
    case "sql-formatter":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "SQL 格式化";
          case "es":
            return "Formateador SQL";
          case "pt":
            return "Formatador SQL";
          case "fr":
            return "Formateur SQL";
          case "de":
            return "SQL-Formatierer";
          case "nl":
            return "SQL-formatter";
          case "it":
            return "Formattatore SQL";
          case "ja":
            return "SQL 整形";
          case "tr":
            return "SQL bicimlendirici";
          case "az":
            return "SQL formatlayicisi";
          case "ko":
            return "SQL 포매터";
          case "ar":
            return "منسّق SQL";
          case "fa":
            return "قالب‌بند SQL";
          case "ru":
            return "Форматирование SQL";
          case "he":
            return "מעצב SQL";
          case "el":
            return "Μορφοποιητης SQL";
          default:
            return "SQL formatter";
        }
      });
    case "uuid-generator":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "UUID 生成器";
          case "es":
            return "Generador UUID";
          case "pt":
            return "Gerador UUID";
          case "fr":
            return "Générateur UUID";
          case "de":
            return "UUID-Generator";
          case "nl":
            return "UUID-generator";
          case "it":
            return "Generatore UUID";
          case "ja":
            return "UUID ジェネレータ";
          case "tr":
            return "UUID uretici";
          case "az":
            return "UUID generatoru";
          case "ko":
            return "UUID 생성기";
          case "ar":
            return "مولّد UUID";
          case "fa":
            return "تولیدکننده UUID";
          case "ru":
            return "Генератор UUID";
          case "he":
            return "מחולל UUID";
          case "el":
            return "Γεννητρια UUID";
          default:
            return "UUID / GUID generator";
        }
      });
    case "video-compress":
      return compressorTitle(
        localizedRecord((locale) =>
          locale === "zh"
            ? "视频"
            : locale === "es"
              ? "Video"
              : locale === "pt"
                ? "Video"
                : locale === "fr"
                  ? "Video"
                  : locale === "de"
                    ? "Video"
                    : locale === "nl"
                      ? "Video"
                      : locale === "it"
                        ? "Video"
                        : locale === "ja"
                          ? "動画"
                          : locale === "tr"
                            ? "Video"
                            : locale === "az"
                              ? "Video"
                              : locale === "ko"
                                ? "비디오"
                                : locale === "ar"
                                  ? "فيديو"
                                  : locale === "fa"
                                    ? "ویدیو"
                                    : locale === "ru"
                                      ? "Видео"
                                      : locale === "he"
                                        ? "וידאו"
                                        : locale === "el"
                                          ? "Βιντεο"
                                          : "Video",
        ),
      );
    case "webhook-viewer":
      return viewerTitle(TERMS.webhookPayload);
    case "xls-to-csv":
      return localizedRecord((locale) => {
        switch (locale) {
          case "zh":
            return "Excel 批量转 CSV";
          case "es":
            return "Excel a CSV por lotes";
          case "pt":
            return "Excel para CSV em lote";
          case "fr":
            return "Excel vers CSV en lot";
          case "de":
            return "Excel zu CSV im Stapel";
          case "nl":
            return "Excel naar CSV in bulk";
          case "it":
            return "Excel in CSV in blocco";
          case "ja":
            return "Excel から CSV 一括変換";
          case "tr":
            return "Toplu Excel'den CSV'ye";
          case "az":
            return "Toplu Excel-dən CSV-yə";
          case "ko":
            return "Excel 일괄 CSV 변환";
          case "ar":
            return "تحويل Excel إلى CSV دفعة واحدة";
          case "fa":
            return "تبدیل گروهی Excel به CSV";
          case "ru":
            return "Пакетное преобразование Excel в CSV";
          case "he":
            return "המרת Excel ל-CSV בכמות";
          case "el":
            return "Μαζικη μετατροπη Excel σε CSV";
          default:
            return "Excel to CSV batch";
        }
      });
    case "xls-viewer":
      return viewerTitle(TERMS.excel);
    default:
      return localizedRecord(() => slug);
  }
}

const TOOL_PAGE_DEFINITIONS: Record<ToolPageSlug, ToolPageDefinition> = {
  "axios-converter": {
    pathname: "/axios-converter",
    titleByLocale: localizedTitle("axios-converter"),
    keywords: [
      "axios converter",
      "axios to curl",
      "axios to fetch",
      "axios to python requests",
      "request converter",
      "browser api converter",
      "free axios to fetch converter",
      "convert http client code online",
    ],
  },
  "base64-converter": {
    pathname: "/base64-converter",
    titleByLocale: localizedTitle("base64-converter"),
    keywords: [
      "base64 encode",
      "base64 decode",
      "base64 converter",
      "base64url encoder",
      "encode file base64 online",
      "browser base64 tool",
      "utf8 base64 encode",
      "free base64 decoder no upload",
    ],
  },
  "bulk-pdf-watermark": {
    pathname: "/bulk-pdf-watermark",
    titleByLocale: {
      en: "Bulk PDF Watermark",
      zh: "批量 PDF 水印",
      es: "Marca de agua PDF por lotes",
      pt: "Marca d'água em lote para PDF",
      fr: "Filigrane PDF en lot",
      de: "PDF-Wasserzeichen im Stapel",
      nl: "PDF-watermerk in bulk",
      it: "Filigrana PDF in blocco",
      ja: "PDF一括透かし",
      tr: "Toplu PDF filigranı",
      az: "Toplu PDF su nişanı",
      ko: "대량 PDF 워터마크",
      ar: "علامة مائية مجمعة لملفات PDF",
      fa: "واترمارک گروهی PDF",
      ru: "Пакетный водяной знак PDF",
      he: "סימן מים בכמות לקובצי PDF",
      el: "Μαζικό υδατογράφημα PDF",
    },
    keywords: [
      "bulk pdf watermark",
      "watermark multiple pdf files",
      "batch pdf watermark tool",
      "pdf watermark no upload",
      "watermark pdf with text",
      "watermark pdf with image",
      "free pdf watermark online",
      "watermark pdf in browser",
    ],
  },
  compare: {
    pathname: "/compare",
    titleByLocale: localizedTitle("compare"),
    keywords: [
      "compare csv files",
      "csv diff tool",
      "csv compare online",
      "compare two csv files",
      "browser csv diff",
      "csv changes viewer",
      "free csv diff online",
      "side by side csv compare",
    ],
  },
  "csv-to-excel": {
    pathname: "/csv-to-excel",
    titleByLocale: localizedTitle("csv-to-excel"),
    keywords: [
      "csv to excel",
      "csv to xlsx",
      "csv converter",
      "batch csv to excel",
      "browser csv to xlsx",
      "csv excel export",
      "free csv to excel converter",
      "convert csv to spreadsheet online",
    ],
  },
  "csv-to-json": {
    pathname: "/csv-to-json",
    titleByLocale: localizedTitle("csv-to-json"),
    keywords: [
      "csv to json",
      "csv json converter",
      "convert csv to json",
      "browser csv to json",
      "csv to json online",
      "local csv converter",
      "free csv to json",
      "csv to json no upload",
    ],
  },
  "csv-to-markdown-table": {
    pathname: "/csv-to-markdown-table",
    titleByLocale: localizedTitle("csv-to-markdown-table"),
    keywords: [
      "csv to markdown table",
      "csv markdown converter",
      "markdown table generator",
      "convert csv to markdown",
      "browser markdown table",
      "csv to md",
      "free csv to markdown",
      "github readme table from csv",
    ],
  },
  "csv-to-sql": {
    pathname: "/csv-to-sql",
    titleByLocale: localizedTitle("csv-to-sql"),
    keywords: [
      "csv to sql",
      "csv to insert statements",
      "csv create table",
      "generate sql from csv",
      "csv to postgresql",
      "csv to mysql insert",
      "browser csv sql generator",
      "free csv to sql online",
      "import csv sql sketch",
    ],
  },
  "csv-to-parquet": {
    pathname: "/csv-to-parquet",
    titleByLocale: localizedTitle("csv-to-parquet"),
    keywords: [
      "csv to parquet",
      "convert csv to parquet",
      "parquet converter",
      "browser csv to parquet",
      "csv parquet export",
      "local parquet tool",
      "free csv to parquet online",
      "apache parquet from csv",
    ],
  },
  "cron-parser": {
    pathname: "/cron-parser",
    titleByLocale: localizedTitle("cron-parser"),
    keywords: [
      "cron parser",
      "cron next run",
      "crontab calculator",
      "human to cron",
      "cron expression preview",
      "kubernetes cron schedule",
      "quartz cron helper",
      "devops scheduler tool",
    ],
  },
  "curl-converter": {
    pathname: "/curl-converter",
    titleByLocale: localizedTitle("curl-converter"),
    keywords: [
      "curl converter",
      "curl to fetch",
      "curl to axios",
      "curl to python requests",
      "request code converter",
      "browser curl converter",
      "free curl to fetch",
      "convert curl command online",
    ],
  },
  "data-grid": {
    pathname: "/data-grid",
    titleByLocale: localizedTitle("data-grid"),
    keywords: [
      "data grid demo",
      "react data grid",
      "editable data grid",
      "browser data table",
      "grid demo",
      "data grid example",
      "tanstack table demo",
      "interactive data grid browser",
    ],
  },
  "data-grid-live": {
    pathname: "/data-grid-live",
    titleByLocale: localizedTitle("data-grid-live"),
    keywords: [
      "live data grid demo",
      "real time data grid",
      "react data grid live",
      "browser data grid demo",
      "sync data grid",
      "data grid live example",
      "websocket data grid demo",
      "live updating table ui",
    ],
  },
  "data-grid-render": {
    pathname: "/data-grid-render",
    titleByLocale: localizedTitle("data-grid-render"),
    keywords: [
      "data grid render demo",
      "grid rendering demo",
      "react grid performance",
      "render data grid",
      "browser grid benchmark",
      "data grid render example",
      "virtualized grid performance",
      "large dataset table render",
    ],
  },
  "fetch-converter": {
    pathname: "/fetch-converter",
    titleByLocale: localizedTitle("fetch-converter"),
    keywords: [
      "fetch converter",
      "fetch to curl",
      "fetch to axios",
      "fetch to python requests",
      "request converter",
      "browser api converter",
      "javascript fetch to curl",
      "free fetch api converter",
    ],
  },
  "graphql-tools": {
    pathname: "/graphql-tools",
    titleByLocale: localizedTitle("graphql-tools"),
    keywords: [
      "graphql tools",
      "graphql formatter",
      "graphql introspection viewer",
      "graphql schema explorer",
      "browser graphql tool",
      "graphql query formatter",
      "free graphql playground browser",
      "format graphql query online",
    ],
  },
  "heic-to-jpg": {
    pathname: "/heic-to-jpg",
    titleByLocale: localizedTitle("heic-to-jpg"),
    keywords: [
      "heic to jpg",
      "heic to png",
      "heif converter",
      "iphone photo converter",
      "browser heic converter",
      "convert heic locally",
      "free heic converter online",
      "heic to jpeg no upload",
    ],
  },
  "http-explainer": {
    pathname: "/http-explainer",
    titleByLocale: localizedTitle("http-explainer"),
    keywords: [
      "http status explainer",
      "http headers explainer",
      "http status codes",
      "http headers guide",
      "browser http reference",
      "learn http status",
      "http status code list",
      "what is http header",
    ],
  },
  "image-compress": {
    pathname: "/image-compress",
    titleByLocale: localizedTitle("image-compress"),
    keywords: [
      "image compressor",
      "compress images",
      "bulk image compression",
      "browser image compressor",
      "local image compress",
      "no upload image compression",
      "free compress images online",
      "reduce image file size",
    ],
  },
  "image-convert": {
    pathname: "/image-convert",
    titleByLocale: localizedTitle("image-convert"),
    keywords: [
      "image converter",
      "convert image format",
      "png jpg webp converter",
      "browser image converter",
      "local image conversion",
      "no upload image tool",
      "free image converter online",
      "png to webp jpg avif",
    ],
  },
  "image-resize": {
    pathname: "/image-resize",
    titleByLocale: localizedTitle("image-resize"),
    keywords: [
      "image resize",
      "image crop",
      "image resize convert",
      "browser image editor",
      "bulk image resize",
      "local image resize tool",
      "resize images online free",
      "crop and export images",
    ],
  },
  "images-to-pdf": {
    pathname: "/images-to-pdf",
    titleByLocale: localizedTitle("images-to-pdf"),
    keywords: [
      "images to pdf",
      "jpg to pdf",
      "png to pdf",
      "convert images to pdf",
      "browser image pdf tool",
      "no upload image to pdf",
      "merge photos to pdf",
      "free jpg png to pdf",
    ],
  },
  "json-formatter": {
    pathname: "/json-formatter",
    titleByLocale: localizedTitle("json-formatter"),
    keywords: [
      "json formatter",
      "json beautifier",
      "json validator",
      "format json online",
      "browser json tool",
      "local json formatter",
      "pretty print json",
      "free json formatter no upload",
    ],
  },
  "json-to-csv": {
    pathname: "/json-to-csv",
    titleByLocale: localizedTitle("json-to-csv"),
    keywords: [
      "json to csv",
      "convert json to csv",
      "json csv converter",
      "browser json to csv",
      "local json converter",
      "json export csv",
      "free json to csv online",
      "json array to spreadsheet",
    ],
  },
  "json-to-excel": {
    pathname: "/json-to-excel",
    titleByLocale: localizedTitle("json-to-excel"),
    keywords: [
      "json to excel",
      "json to xlsx",
      "convert json to excel",
      "browser json to xlsx",
      "json excel converter",
      "local json export",
      "free json to xlsx",
      "export json to spreadsheet",
    ],
  },
  "json-to-parquet": {
    pathname: "/json-to-parquet",
    titleByLocale: localizedTitle("json-to-parquet"),
    keywords: [
      "json to parquet",
      "convert json to parquet",
      "json parquet converter",
      "browser json to parquet",
      "local parquet export",
      "parquet browser tool",
      "free json to parquet",
      "json lines to parquet",
    ],
  },
  "json-yaml-converter": {
    pathname: "/json-yaml-converter",
    titleByLocale: localizedTitle("json-yaml-converter"),
    keywords: [
      "json to yaml",
      "yaml to json",
      "json yaml converter",
      "convert json to yaml online",
      "kubernetes yaml json",
      "browser json yaml tool",
      "local yaml converter",
      "free json yaml converter no upload",
    ],
  },
  "jwt-decoder": {
    pathname: "/jwt-decoder",
    titleByLocale: localizedTitle("jwt-decoder"),
    keywords: [
      "jwt decoder",
      "decode jwt online",
      "jwt payload viewer",
      "jwt header decoder",
      "browser jwt tool",
      "debug jwt locally",
      "jwt parser no upload",
      "inspect jwt claims",
    ],
  },
  "markdown-html-converter": {
    pathname: "/markdown-html-converter",
    titleByLocale: localizedTitle("markdown-html-converter"),
    keywords: [
      "markdown to html",
      "html to markdown",
      "markdown html converter",
      "gfm markdown preview",
      "convert markdown to html online",
      "browser markdown tool",
      "markdown table to html",
      "local markdown converter no upload",
      "turndown html to md",
    ],
  },
  "merge-pdf": {
    pathname: "/merge-pdf",
    titleByLocale: localizedTitle("merge-pdf"),
    keywords: [
      "merge pdf",
      "combine pdf",
      "pdf merger",
      "browser pdf merge",
      "local pdf merger",
      "no upload pdf merge",
      "join pdf files online free",
      "merge multiple pdf",
    ],
  },
  "openapi-viewer": {
    pathname: "/openapi-viewer",
    titleByLocale: localizedTitle("openapi-viewer"),
    keywords: [
      "openapi viewer",
      "swagger viewer",
      "openapi browser",
      "api spec viewer",
      "swagger file viewer",
      "browser openapi tool",
      "free swagger ui alternative",
      "view openapi yaml json",
    ],
  },
  "parquet-to-csv": {
    pathname: "/parquet-to-csv",
    titleByLocale: localizedTitle("parquet-to-csv"),
    keywords: [
      "parquet to csv",
      "convert parquet to csv",
      "parquet csv converter",
      "browser parquet to csv",
      "local parquet converter",
      "parquet export csv",
      "open parquet as csv",
      "parquet file to csv online",
    ],
  },
  "parquet-to-json": {
    pathname: "/parquet-to-json",
    titleByLocale: localizedTitle("parquet-to-json"),
    keywords: [
      "parquet to json",
      "convert parquet to json",
      "parquet json converter",
      "browser parquet to json",
      "local parquet converter",
      "parquet export json",
      "free parquet to json",
      "read parquet in browser",
    ],
  },
  "parquet-viewer": {
    pathname: "/parquet-viewer",
    titleByLocale: localizedTitle("parquet-viewer"),
    keywords: [
      "parquet viewer",
      "open parquet file",
      "parquet editor",
      "browser parquet viewer",
      "local parquet tool",
      "editable parquet grid",
      "view parquet without python",
      "parquet preview online",
    ],
  },
  "pdf-to-image": {
    pathname: "/pdf-to-image",
    titleByLocale: localizedTitle("pdf-to-image"),
    keywords: [
      "pdf to image",
      "pdf to png",
      "pdf to jpg",
      "convert pdf pages to images",
      "browser pdf converter",
      "local pdf to image",
      "extract images from pdf",
      "pdf page to png jpg free",
    ],
  },
  "pdf-to-word": {
    pathname: "/pdf-to-word",
    titleByLocale: localizedTitle("pdf-to-word"),
    keywords: [
      "pdf to word",
      "pdf to docx",
      "convert pdf to word",
      "browser pdf to docx",
      "local pdf converter",
      "no upload pdf to word",
      "free pdf to docx online",
      "editable word from pdf",
    ],
  },
  "pdf-watermark": {
    pathname: "/pdf-watermark",
    titleByLocale: localizedTitle("pdf-watermark"),
    keywords: [
      "pdf watermark",
      "watermark pdf",
      "pdf watermark text",
      "pdf watermark image",
      "browser pdf watermark",
      "no upload pdf watermark",
      "add watermark to pdf free",
      "stamp pdf online",
    ],
  },
  "python-requests-converter": {
    pathname: "/python-requests-converter",
    titleByLocale: localizedTitle("python-requests-converter"),
    keywords: [
      "python requests converter",
      "python requests to curl",
      "python requests to fetch",
      "python requests to axios",
      "request converter",
      "browser api converter",
      "requests to httpx curl",
      "convert python http code",
    ],
  },
  "reorder-pdf": {
    pathname: "/reorder-pdf",
    titleByLocale: localizedTitle("reorder-pdf"),
    keywords: [
      "reorder pdf pages",
      "pdf page reorder",
      "organize pdf pages",
      "browser pdf reorder",
      "local pdf page tool",
      "no upload pdf organizer",
      "rearrange pdf pages online",
      "change pdf page order free",
    ],
  },
  "request-converter": {
    pathname: "/request-converter",
    titleByLocale: localizedTitle("request-converter"),
    keywords: [
      "api converter",
      "request converter",
      "curl fetch axios converter",
      "python requests converter",
      "browser api tool",
      "request snippet converter",
      "curl to fetch axios online",
      "http request translator",
    ],
  },
  "regex-tester": {
    pathname: "/regex-tester",
    titleByLocale: localizedTitle("regex-tester"),
    keywords: [
      "regex tester",
      "javascript regex tester",
      "regular expression tester online",
      "regex multiline flags",
      "test regex in browser",
      "regex debugger local",
      "ecmascript regex",
      "regex match groups",
    ],
  },
  "split-pdf": {
    pathname: "/split-pdf",
    titleByLocale: localizedTitle("split-pdf"),
    keywords: [
      "split pdf",
      "pdf splitter",
      "split pdf pages",
      "browser pdf split",
      "local pdf splitter",
      "no upload pdf split",
      "extract pages from pdf",
      "separate pdf online free",
    ],
  },
  "sql-formatter": {
    pathname: "/sql-formatter",
    titleByLocale: localizedTitle("sql-formatter"),
    keywords: [
      "sql formatter",
      "format sql online",
      "sql prettifier",
      "pretty print sql",
      "postgresql formatter",
      "mysql sql beautifier",
      "browser sql formatter",
      "local sql formatter no upload",
      "sql pretty printer",
    ],
  },
  "unix-timestamp-converter": {
    pathname: "/unix-timestamp-converter",
    titleByLocale: localizedTitle("unix-timestamp-converter"),
    keywords: [
      "unix timestamp converter",
      "epoch converter",
      "unix time to date",
      "timestamp to date online",
      "milliseconds to date",
      "epoch milliseconds",
      "timezone timestamp",
      "utc to local timestamp",
      "browser epoch tool",
    ],
  },
  "uuid-generator": {
    pathname: "/uuid-generator",
    titleByLocale: localizedTitle("uuid-generator"),
    keywords: [
      "uuid generator",
      "guid generator",
      "bulk uuid",
      "uuid v4 generator",
      "uuid v7 generator",
      "uuid v1 generator",
      "online uuid generator",
      "browser uuid tool",
      "generate uuid for tests",
    ],
  },
  "video-compress": {
    pathname: "/video-compress",
    titleByLocale: localizedTitle("video-compress"),
    keywords: [
      "video compressor",
      "compress video",
      "browser video compressor",
      "local video compression",
      "no upload video compress",
      "video size reducer",
      "shrink mp4 online free",
      "client side video compression",
    ],
  },
  "webhook-viewer": {
    pathname: "/webhook-viewer",
    titleByLocale: localizedTitle("webhook-viewer"),
    keywords: [
      "webhook viewer",
      "webhook payload viewer",
      "json payload viewer",
      "jsonpath webhook tool",
      "browser webhook inspector",
      "webhook json formatter",
      "stripe webhook payload viewer",
      "debug webhook json",
    ],
  },
  "xls-to-csv": {
    pathname: "/xls-to-csv",
    titleByLocale: localizedTitle("xls-to-csv"),
    keywords: [
      "excel to csv",
      "xls to csv",
      "xlsx to csv",
      "batch excel to csv",
      "browser excel converter",
      "local xls converter",
      "free excel to csv online",
      "convert spreadsheet to csv",
    ],
  },
  "xls-viewer": {
    pathname: "/xls-viewer",
    titleByLocale: localizedTitle("xls-viewer"),
    keywords: [
      "excel viewer",
      "xlsx viewer",
      "xls viewer",
      "browser excel viewer",
      "editable excel grid",
      "local spreadsheet viewer",
      "open xlsx without excel",
      "view excel online free",
    ],
  },
};

const DESCRIPTION_TEMPLATE: Record<AppLocale, (title: string) => string> = {
  en: (title) =>
    `${title}: free online in your browser. Private, client-side processing; your files are not uploaded to our servers.`,
  zh: (title) =>
    `${title}：免费在线浏览器工具，本地私密处理，文件不会上传到服务器。`,
  es: (title) =>
    `${title}: gratis en el navegador. Procesamiento local y privado; no subimos tus archivos a nuestros servidores.`,
  pt: (title) =>
    `${title}: gratuito no navegador. Processamento local e privado; seus arquivos não são enviados aos nossos servidores.`,
  fr: (title) =>
    `${title} : gratuit dans le navigateur. Traitement local et privé ; vos fichiers ne sont pas envoyés à nos serveurs.`,
  de: (title) =>
    `${title}: kostenlos im Browser. Private Verarbeitung lokal; Ihre Dateien werden nicht auf unsere Server hochgeladen.`,
  nl: (title) =>
    `${title}: gratis in je browser. Privé, lokaal verwerkt; je bestanden worden niet naar onze servers geüpload.`,
  it: (title) =>
    `${title}: gratuito nel browser. Elaborazione locale e privata; i file non vengono caricati sui nostri server.`,
  ja: (title) =>
    `${title}をブラウザで無料利用。端末内でプライベートに処理し、当社サーバーへファイルはアップロードされません。`,
  tr: (title) =>
    `${title}: tarayıcıda ücretsiz. Gizli, yerel işlem; dosyalarınız sunucularımıza yüklenmez.`,
  az: (title) =>
    `${title}: brauzerdə pulsuz. Şəxsi, yerli emal; fayllarınız serverlərimizə yüklənmir.`,
  ko: (title) =>
    `${title}: 브라우저에서 무료. 비공개 로컬 처리이며 파일은 서버로 업로드되지 않습니다.`,
  ar: (title) =>
    `${title}: مجانًا في المتصفح. معالجة محلية خاصة؛ لا تُرفع ملفاتك إلى خوادمنا.`,
  fa: (title) =>
    `${title}: رایگان در مرورگر. پردازش محلی و خصوصی؛ فایل‌های شما به سرورهای ما آپلود نمی‌شود.`,
  ru: (title) =>
    `${title}: бесплатно в браузере. Конфиденциальная локальная обработка; файлы не загружаются на наши серверы.`,
  he: (title) =>
    `${title}: חינם בדפדפן. עיבוד מקומי פרטי; הקבצים שלכם לא מועלים לשרתים שלנו.`,
  el: (title) =>
    `${title}: δωρεάν στον browser. Ιδιωτική τοπική επεξεργασία· τα αρχεία σας δεν ανεβαίνουν στους διακομιστές μας.`,
};

export function getToolPageDescription(locale: string, title: string): string {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  return DESCRIPTION_TEMPLATE[safeLocale](title);
}

export const ALL_TOOL_PAGE_SLUGS: ToolPageSlug[] = Object.keys(
  TOOL_PAGE_DEFINITIONS,
) as ToolPageSlug[];

/** Fallback when `toolMeta` messages are missing or empty (CI should keep them filled). */
export function getToolPageMetaFallback(
  locale: AppLocale,
  slug: ToolPageSlug,
): { title: string; description: string; keywords: string[] } {
  const def = TOOL_PAGE_DEFINITIONS[slug];
  const title = def.titleByLocale[locale];
  return {
    title,
    description: DESCRIPTION_TEMPLATE[locale](title),
    keywords: [...def.keywords],
  };
}

function parseToolMetaKeywordLine(raw: string): string[] | undefined {
  const list = raw
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Tool SEO from messages JSON: namespace toolMeta, keys like "compare.title".
 * Keywords are pipe-separated (same convention as pageMeta).
 */
export async function buildToolPageMetadata(
  locale: string,
  slug: ToolPageSlug,
): Promise<Metadata> {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const definition = TOOL_PAGE_DEFINITIONS[slug];
  const fb = getToolPageMetaFallback(safeLocale, slug);
  const t = await getTranslations({
    locale: safeLocale,
    namespace: "toolMeta",
  });

  const titleRaw = t(`${slug}.title`).trim();
  const title = titleRaw.length > 0 ? titleRaw : fb.title;

  const descriptionRaw = t(`${slug}.description`).trim();
  const description =
    descriptionRaw.length > 0 ? descriptionRaw : fb.description;

  const keywordsRaw = t(`${slug}.keywords`).trim();
  const keywords =
    keywordsRaw.length > 0
      ? (parseToolMetaKeywordLine(keywordsRaw) ?? fb.keywords)
      : fb.keywords;

  return buildPageMetadata({
    locale: safeLocale,
    pathname: definition.pathname,
    title,
    description,
    keywords,
  });
}
