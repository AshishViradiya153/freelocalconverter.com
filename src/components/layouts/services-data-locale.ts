import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { ServiceGroup } from "./services-data";

function localizedText(
  locale: AppLocale,
  values: Partial<Record<AppLocale, string>> & { en: string },
) {
  return values[locale] ?? values.en;
}

function getLocalizedLabel(
  locale: AppLocale,
  key:
    | "csvViewer"
    | "csvCompare"
    | "csvToJson"
    | "jsonToCsv"
    | "csvToParquet"
    | "parquetToCsv"
    | "jsonToParquet"
    | "parquetToJson"
    | "csvToMarkdownTable"
    | "csvToSql"
    | "xlsViewer"
    | "parquetViewer"
    | "csvToExcel"
    | "xlsToCsv"
    | "jsonToExcel"
    | "jsonFormatter"
    | "sqlFormatter"
    | "jsonYamlConverter"
    | "markdownHtmlConverter"
    | "jwtDecoder"
    | "cronParser"
    | "uuidGenerator"
    | "regexTester"
    | "base64Converter"
    | "unixTimestampConverter"
    | "curlConverter"
    | "fetchConverter"
    | "axiosConverter"
    | "pythonRequestsConverter"
    | "httpExplainer"
    | "openapiViewer"
    | "graphqlTools"
    | "webhookViewer"
    | "pdfToWord"
    | "splitPdf"
    | "reorderPdf"
    | "mergePdf"
    | "pdfToImage"
    | "imagesToPdf"
    | "pdfWatermark"
    | "bulkPdfWatermark"
    | "videoCompressor"
    | "imageCompressor"
    | "imageConverter"
    | "imageResize"
    | "faviconGenerator"
    | "gifTools"
    | "heicToJpg"
    | "imageBase64"
    | "linkedinBanner"
    | "ogPreview"
    | "svgToPng"
    | "colorPaletteGenerator"
    | "gradientGenerator"
    | "meshGradientGenerator"
    | "trendingPalettes"
    | "trendingGradients"
    | "trendingMeshGradients"
    | "guides"
    | "tools"
    | "blog"
    | "privacy"
    | "terms"
    | "contactUs",
) {
  switch (key) {
    case "csvViewer":
      return localizedText(locale, {
        en: "CSV viewer & editor",
        de: "CSV-Viewer & Editor",
        es: "Visor y editor CSV",
        fr: "Visionneuse et éditeur CSV",
        it: "Visualizzatore e editor CSV",
        ja: "CSVビューアとエディタ",
        ko: "CSV 뷰어·편집기",
        nl: "CSV-viewer en editor",
        pt: "Visualizador e editor CSV",
        ru: "Просмотр и редактирование CSV",
        tr: "CSV goruntuleyici ve duzenleyici",
        zh: "CSV 查看器与编辑器",
        ar: "عارض ومحرر CSV",
        fa: "نمایشگر و ویرایشگر CSV",
        he: "מציג ועורך CSV",
        az: "CSV baxıcı və redaktor",
        el: "Προβολη και επεξεργασια CSV",
      });
    case "csvCompare":
      return localizedText(locale, {
        en: "CSV Compare",
        de: "CSV-Vergleich",
        es: "Comparar CSV",
        fr: "Comparer CSV",
        it: "Confronta CSV",
        ja: "CSV比較",
        ko: "CSV 비교",
        nl: "CSV vergelijken",
        pt: "Comparar CSV",
        ru: "Сравнение CSV",
        tr: "CSV Karsilastir",
        zh: "CSV 比较",
        ar: "مقارنة CSV",
        fa: "مقایسه CSV",
        he: "השוואת CSV",
        az: "CSV muqayise",
        el: "Συγκριση CSV",
      });
    case "csvToJson":
      return localizedText(locale, {
        en: "CSV to JSON",
        de: "CSV zu JSON",
        es: "CSV a JSON",
        fr: "CSV vers JSON",
        it: "CSV in JSON",
        ja: "CSVからJSON",
        ko: "CSV를 JSON으로",
        nl: "CSV naar JSON",
        pt: "CSV para JSON",
        ru: "CSV в JSON",
        tr: "CSV'den JSON'a",
        zh: "CSV 转 JSON",
      });
    case "jsonToCsv":
      return localizedText(locale, {
        en: "JSON to CSV",
        de: "JSON zu CSV",
        es: "JSON a CSV",
        fr: "JSON vers CSV",
        it: "JSON in CSV",
        ja: "JSONからCSV",
        ko: "JSON을 CSV로",
        nl: "JSON naar CSV",
        pt: "JSON para CSV",
        ru: "JSON в CSV",
        tr: "JSON'dan CSV'ye",
        zh: "JSON 转 CSV",
      });
    case "csvToParquet":
      return localizedText(locale, {
        en: "CSV to Parquet",
        de: "CSV zu Parquet",
        es: "CSV a Parquet",
        fr: "CSV vers Parquet",
        it: "CSV in Parquet",
        ja: "CSVからParquet",
        ko: "CSV를 Parquet으로",
        nl: "CSV naar Parquet",
        pt: "CSV para Parquet",
        ru: "CSV в Parquet",
        tr: "CSV'den Parquet'e",
        zh: "CSV 转 Parquet",
      });
    case "parquetToCsv":
      return localizedText(locale, {
        en: "Parquet to CSV",
        de: "Parquet zu CSV",
        es: "Parquet a CSV",
        fr: "Parquet vers CSV",
        it: "Parquet in CSV",
        ja: "ParquetからCSV",
        ko: "Parquet를 CSV로",
        nl: "Parquet naar CSV",
        pt: "Parquet para CSV",
        ru: "Parquet в CSV",
        tr: "Parquet'ten CSV'ye",
        zh: "Parquet 转 CSV",
      });
    case "jsonToParquet":
      return localizedText(locale, {
        en: "JSON to Parquet",
        de: "JSON zu Parquet",
        es: "JSON a Parquet",
        fr: "JSON vers Parquet",
        it: "JSON in Parquet",
        ja: "JSONからParquet",
        ko: "JSON을 Parquet으로",
        nl: "JSON naar Parquet",
        pt: "JSON para Parquet",
        ru: "JSON в Parquet",
        tr: "JSON'dan Parquet'e",
        zh: "JSON 转 Parquet",
      });
    case "parquetToJson":
      return localizedText(locale, {
        en: "Parquet to JSON",
        de: "Parquet zu JSON",
        es: "Parquet a JSON",
        fr: "Parquet vers JSON",
        it: "Parquet in JSON",
        ja: "ParquetからJSON",
        ko: "Parquet를 JSON으로",
        nl: "Parquet naar JSON",
        pt: "Parquet para JSON",
        ru: "Parquet в JSON",
        tr: "Parquet'ten JSON'a",
        zh: "Parquet 转 JSON",
      });
    case "csvToMarkdownTable":
      return localizedText(locale, {
        en: "CSV to Markdown Table",
        de: "CSV zu Markdown-Tabelle",
        es: "CSV a tabla Markdown",
        fr: "CSV vers tableau Markdown",
        it: "CSV in tabella Markdown",
        ja: "CSVからMarkdown表",
        ko: "CSV를 Markdown 표로",
        nl: "CSV naar Markdown-tabel",
        pt: "CSV para tabela Markdown",
        ru: "CSV в таблицу Markdown",
        tr: "CSV'den Markdown tablosuna",
        zh: "CSV 转 Markdown 表格",
      });
    case "csvToSql":
      return localizedText(locale, {
        en: "CSV to SQL",
        de: "CSV zu SQL",
        es: "CSV a SQL",
        fr: "CSV vers SQL",
        it: "CSV in SQL",
        ja: "CSVからSQL",
        ko: "CSV를 SQL로",
        nl: "CSV naar SQL",
        pt: "CSV para SQL",
        ru: "CSV в SQL",
        tr: "CSV'den SQL'e",
        zh: "CSV 转 SQL",
      });
    case "xlsViewer":
      return localizedText(locale, {
        en: "Excel viewer & editor",
        de: "Excel-Viewer & Editor",
        es: "Visor y editor de Excel",
        fr: "Visionneuse et éditeur Excel",
        it: "Visualizzatore e editor Excel",
        ja: "Excelビューアとエディタ",
        ko: "Excel 뷰어·편집기",
        nl: "Excel-viewer en editor",
        pt: "Visualizador e editor Excel",
        ru: "Просмотр и редактирование Excel",
        tr: "Excel goruntuleyici ve duzenleyici",
        zh: "Excel 查看器与编辑器",
      });
    case "parquetViewer":
      return localizedText(locale, {
        en: "Parquet viewer & editor",
        de: "Parquet-Viewer & Editor",
        es: "Visor y editor Parquet",
        fr: "Visionneuse et éditeur Parquet",
        it: "Visualizzatore e editor Parquet",
        ja: "Parquetビューアとエディタ",
        ko: "Parquet 뷰어·편집기",
        nl: "Parquet-viewer en editor",
        pt: "Visualizador e editor Parquet",
        ru: "Просмотр и редактирование Parquet",
        tr: "Parquet goruntuleyici ve duzenleyici",
        zh: "Parquet 查看器与编辑器",
      });
    case "csvToExcel":
      return localizedText(locale, {
        en: "CSV to Excel",
        de: "CSV zu Excel",
        es: "CSV a Excel",
        fr: "CSV vers Excel",
        it: "CSV in Excel",
        ja: "CSVからExcel",
        ko: "CSV를 Excel로",
        nl: "CSV naar Excel",
        pt: "CSV para Excel",
        ru: "CSV в Excel",
        tr: "CSV'den Excel'e",
        zh: "CSV 转 Excel",
      });
    case "xlsToCsv":
      return localizedText(locale, {
        en: "Excel to CSV",
        de: "Excel zu CSV",
        es: "Excel a CSV",
        fr: "Excel vers CSV",
        it: "Excel in CSV",
        ja: "ExcelからCSV",
        ko: "Excel을 CSV로",
        nl: "Excel naar CSV",
        pt: "Excel para CSV",
        ru: "Excel в CSV",
        tr: "Excel'den CSV'ye",
        zh: "Excel 转 CSV",
      });
    case "jsonToExcel":
      return localizedText(locale, {
        en: "JSON to Excel",
        de: "JSON zu Excel",
        es: "JSON a Excel",
        fr: "JSON vers Excel",
        it: "JSON in Excel",
        ja: "JSONからExcel",
        ko: "JSON을 Excel로",
        nl: "JSON naar Excel",
        pt: "JSON para Excel",
        ru: "JSON в Excel",
        tr: "JSON'dan Excel'e",
        zh: "JSON 转 Excel",
      });
    case "jsonFormatter":
      return localizedText(locale, {
        en: "JSON Formatter",
        de: "JSON-Formatierer",
        es: "Formateador JSON",
        fr: "Formateur JSON",
        it: "Formattatore JSON",
        ja: "JSON整形",
        ko: "JSON 포매터",
        nl: "JSON-formatter",
        pt: "Formatador JSON",
        ru: "Форматирование JSON",
        tr: "JSON Bicimlendirici",
        zh: "JSON 格式化",
      });
    case "sqlFormatter":
      return localizedText(locale, {
        en: "SQL formatter",
        de: "SQL-Formatierer",
        es: "Formateador SQL",
        fr: "Formateur SQL",
        it: "Formattatore SQL",
        ja: "SQL整形",
        ko: "SQL 포매터",
        nl: "SQL-formatter",
        pt: "Formatador SQL",
        ru: "Форматирование SQL",
        tr: "SQL bicimlendirici",
        zh: "SQL 格式化",
      });
    case "jsonYamlConverter":
      return localizedText(locale, {
        en: "JSON YAML converter",
        de: "JSON-YAML-Konverter",
        es: "Convertidor JSON YAML",
        fr: "Convertisseur JSON YAML",
        it: "Convertitore JSON YAML",
        ja: "JSON YAML 変換",
        ko: "JSON YAML 변환기",
        nl: "JSON-YAML-converter",
        pt: "Conversor JSON YAML",
        ru: "Конвертер JSON и YAML",
        tr: "JSON YAML donusturucu",
        zh: "JSON YAML 转换器",
      });
    case "markdownHtmlConverter":
      return localizedText(locale, {
        en: "Markdown HTML converter",
        de: "Markdown-HTML-Konverter",
        es: "Convertidor Markdown HTML",
        fr: "Convertisseur Markdown HTML",
        it: "Convertitore Markdown HTML",
        ja: "Markdown HTML 変換",
        ko: "Markdown HTML 변환기",
        nl: "Markdown-HTML-converter",
        pt: "Conversor Markdown HTML",
        ru: "Конвертер Markdown и HTML",
        tr: "Markdown HTML donusturucu",
        zh: "Markdown HTML 转换器",
      });
    case "jwtDecoder":
      return localizedText(locale, {
        en: "JWT decoder",
        de: "JWT-Decoder",
        es: "Decodificador JWT",
        fr: "Decodeur JWT",
        it: "Decoder JWT",
        ja: "JWT デコーダ",
        ko: "JWT 디코더",
        nl: "JWT-decoder",
        pt: "Decodificador JWT",
        ru: "Декодер JWT",
        tr: "JWT cozucu",
        zh: "JWT 解码器",
      });
    case "cronParser":
      return localizedText(locale, {
        en: "Cron parser",
        de: "Cron-Parser",
        es: "Analizador Cron",
        fr: "Analyseur Cron",
        it: "Parser Cron",
        ja: "Cron パーサ",
        ko: "Cron 파서",
        nl: "Cron-parser",
        pt: "Analisador Cron",
        ru: "Парсер Cron",
        tr: "Cron cozumleyici",
        zh: "Cron 解析器",
      });
    case "uuidGenerator":
      return localizedText(locale, {
        en: "UUID / GUID generator",
        de: "UUID-/GUID-Generator",
        es: "Generador UUID / GUID",
        fr: "Générateur UUID / GUID",
        it: "Generatore UUID / GUID",
        ja: "UUID / GUID ジェネレータ",
        ko: "UUID / GUID 생성기",
        nl: "UUID-/GUID-generator",
        pt: "Gerador UUID / GUID",
        ru: "Генератор UUID / GUID",
        tr: "UUID / GUID uretici",
        zh: "UUID / GUID 生成器",
        ar: "مولّد UUID / GUID",
        fa: "تولیدکننده UUID / GUID",
        he: "מחולל UUID / GUID",
        az: "UUID / GUID generatoru",
        el: "Γεννητρια UUID / GUID",
      });
    case "regexTester":
      return localizedText(locale, {
        en: "Regex tester",
        de: "Regex-Tester",
        es: "Probador de regex",
        fr: "Testeur regex",
        it: "Tester regex",
        ja: "正規表現テスター",
        ko: "정규식 테스터",
        nl: "Regex-tester",
        pt: "Testador de regex",
        ru: "Тестер regex",
        tr: "Regex test araci",
        zh: "正则测试",
        ar: "مختبر regex",
        fa: "آزمایشگر regex",
        he: "בודק regex",
        az: "Regex test aləti",
        el: "Δοκιμαστης regex",
      });
    case "base64Converter":
      return localizedText(locale, {
        en: "Base64 encoder & decoder",
        de: "Base64-Kodierer & Decoder",
        es: "Codificador y decodificador Base64",
        fr: "Encodeur et decodeur Base64",
        it: "Codificatore e decodificatore Base64",
        ja: "Base64 エンコード・デコード",
        ko: "Base64 인코더·디코더",
        nl: "Base64 encoder en decoder",
        pt: "Codificador e decodificador Base64",
        ru: "Кодирование и декодирование Base64",
        tr: "Base64 kodlayici ve cozucu",
        zh: "Base64 编解码",
      });
    case "unixTimestampConverter":
      return localizedText(locale, {
        en: "Unix timestamp converter",
        de: "Unix-Zeitstempel-Konverter",
        es: "Convertidor de marca Unix",
        fr: "Convertisseur horodatage Unix",
        it: "Convertitore timestamp Unix",
        ja: "Unix タイムスタンプ変換",
        ko: "Unix 타임스탬프 변환기",
        nl: "Unix-timestampconverter",
        pt: "Conversor de timestamp Unix",
        ru: "Конвертер Unix-времени",
        tr: "Unix zaman damgasi donusturucu",
        zh: "Unix 时间戳转换器",
      });
    case "curlConverter":
      return localizedText(locale, {
        en: "cURL Converter",
        de: "cURL-Konverter",
        es: "Conversor cURL",
        fr: "Convertisseur cURL",
        it: "Convertitore cURL",
        ja: "cURL変換",
        ko: "cURL 변환기",
        nl: "cURL-converter",
        pt: "Conversor cURL",
        ru: "Конвертер cURL",
        tr: "cURL Donusturucu",
        zh: "cURL 转换器",
      });
    case "fetchConverter":
      return localizedText(locale, {
        en: "Fetch Converter",
        de: "Fetch-Konverter",
        es: "Conversor Fetch",
        fr: "Convertisseur Fetch",
        it: "Convertitore Fetch",
        ja: "fetch変換",
        ko: "fetch 변환기",
        nl: "Fetch-converter",
        pt: "Conversor Fetch",
        ru: "Конвертер Fetch",
        tr: "Fetch Donusturucu",
        zh: "Fetch 转换器",
      });
    case "axiosConverter":
      return localizedText(locale, {
        en: "Axios Converter",
        de: "Axios-Konverter",
        es: "Conversor Axios",
        fr: "Convertisseur Axios",
        it: "Convertitore Axios",
        ja: "Axios変換",
        ko: "Axios 변환기",
        nl: "Axios-converter",
        pt: "Conversor Axios",
        ru: "Конвертер Axios",
        tr: "Axios Donusturucu",
        zh: "Axios 转换器",
      });
    case "pythonRequestsConverter":
      return localizedText(locale, {
        en: "Python Requests Converter",
        de: "Python-Requests-Konverter",
        es: "Conversor de Python Requests",
        fr: "Convertisseur Python Requests",
        it: "Convertitore Python Requests",
        ja: "Python requests変換",
        ko: "Python requests 변환기",
        nl: "Python Requests-converter",
        pt: "Conversor de Python Requests",
        ru: "Конвертер Python Requests",
        tr: "Python Requests Donusturucu",
        zh: "Python Requests 转换器",
      });
    case "httpExplainer":
      return localizedText(locale, {
        en: "HTTP Explainer",
        de: "HTTP-Erklarer",
        es: "Explicador HTTP",
        fr: "Guide HTTP",
        it: "Spiegazione HTTP",
        ja: "HTTP解説",
        ko: "HTTP 설명",
        nl: "HTTP-uitleg",
        pt: "Explicador HTTP",
        ru: "Объяснение HTTP",
        tr: "HTTP Aciklayici",
        zh: "HTTP 说明",
      });
    case "openapiViewer":
      return localizedText(locale, {
        en: "OpenAPI viewer & editor",
        de: "OpenAPI-Viewer & Editor",
        es: "Visor y editor OpenAPI",
        fr: "Visionneuse et éditeur OpenAPI",
        it: "Visualizzatore e editor OpenAPI",
        ja: "OpenAPIビューアとエディタ",
        ko: "OpenAPI 뷰어·편집기",
        nl: "OpenAPI-viewer en editor",
        pt: "Visualizador e editor OpenAPI",
        ru: "Просмотр и правка OpenAPI",
        tr: "OpenAPI goruntuleyici ve duzenleyici",
        zh: "OpenAPI 查看器与编辑器",
      });
    case "graphqlTools":
      return localizedText(locale, {
        en: "GraphQL Tools",
        de: "GraphQL-Tools",
        es: "Herramientas GraphQL",
        fr: "Outils GraphQL",
        it: "Strumenti GraphQL",
        ja: "GraphQLツール",
        ko: "GraphQL 도구",
        nl: "GraphQL-tools",
        pt: "Ferramentas GraphQL",
        ru: "Инструменты GraphQL",
        tr: "GraphQL Araclari",
        zh: "GraphQL 工具",
      });
    case "webhookViewer":
      return localizedText(locale, {
        en: "Webhook viewer & editor",
        de: "Webhook-Viewer & Editor",
        es: "Visor y editor de webhooks",
        fr: "Visionneuse et éditeur webhook",
        it: "Visualizzatore e editor webhook",
        ja: "Webhookビューアとエディタ",
        ko: "Webhook 뷰어·편집기",
        nl: "Webhook-viewer en editor",
        pt: "Visualizador e editor de webhook",
        ru: "Просмотр и правка webhook",
        tr: "Webhook goruntuleyici ve duzenleyici",
        zh: "Webhook 查看器与编辑器",
      });
    case "pdfToWord":
      return localizedText(locale, {
        en: "PDF to Word",
        de: "PDF zu Word",
        es: "PDF a Word",
        fr: "PDF vers Word",
        it: "PDF in Word",
        ja: "PDFからWord",
        ko: "PDF를 Word로",
        nl: "PDF naar Word",
        pt: "PDF para Word",
        ru: "PDF в Word",
        tr: "PDF'den Word'e",
        zh: "PDF 转 Word",
      });
    case "splitPdf":
      return localizedText(locale, {
        en: "Split PDF",
        de: "PDF teilen",
        es: "Dividir PDF",
        fr: "Diviser PDF",
        it: "Dividi PDF",
        ja: "PDF分割",
        ko: "PDF 분할",
        nl: "PDF splitsen",
        pt: "Dividir PDF",
        ru: "Разделить PDF",
        tr: "PDF Bol",
        zh: "拆分 PDF",
      });
    case "reorderPdf":
      return localizedText(locale, {
        en: "Reorder PDF Pages",
        de: "PDF-Seiten neu anordnen",
        es: "Reordenar paginas PDF",
        fr: "Reordonner les pages PDF",
        it: "Riordina pagine PDF",
        ja: "PDFページ並べ替え",
        ko: "PDF 페이지 재정렬",
        nl: "PDF-pagina's herschikken",
        pt: "Reordenar paginas PDF",
        ru: "Изменить порядок страниц PDF",
        tr: "PDF Sayfalarini Yeniden Sirala",
        zh: "重新排序 PDF 页面",
      });
    case "mergePdf":
      return localizedText(locale, {
        en: "Merge PDF",
        de: "PDF zusammenfugen",
        es: "Unir PDF",
        fr: "Fusionner PDF",
        it: "Unisci PDF",
        ja: "PDF結合",
        ko: "PDF 병합",
        nl: "PDF samenvoegen",
        pt: "Mesclar PDF",
        ru: "Объединить PDF",
        tr: "PDF Birlestir",
        zh: "合并 PDF",
      });
    case "pdfToImage":
      return localizedText(locale, {
        en: "PDF to Image",
        de: "PDF zu Bild",
        es: "PDF a imagen",
        fr: "PDF vers image",
        it: "PDF in immagine",
        ja: "PDFから画像",
        ko: "PDF를 이미지로",
        nl: "PDF naar afbeelding",
        pt: "PDF para imagem",
        ru: "PDF в изображение",
        tr: "PDF'den Gorsele",
        zh: "PDF 转图片",
      });
    case "imagesToPdf":
      return localizedText(locale, {
        en: "Images to PDF",
        de: "Bilder zu PDF",
        es: "Imagenes a PDF",
        fr: "Images vers PDF",
        it: "Immagini in PDF",
        ja: "画像からPDF",
        ko: "이미지를 PDF로",
        nl: "Afbeeldingen naar PDF",
        pt: "Imagens para PDF",
        ru: "Изображения в PDF",
        tr: "Gorsellerden PDF'ye",
        zh: "图片转 PDF",
      });
    case "pdfWatermark":
      return localizedText(locale, {
        en: "PDF Watermark",
        de: "PDF-Wasserzeichen",
        es: "Marca de agua PDF",
        fr: "Filigrane PDF",
        it: "Filigrana PDF",
        ja: "PDF透かし",
        ko: "PDF 워터마크",
        nl: "PDF-watermerk",
        pt: "Marca d'agua PDF",
        ru: "Водяной знак PDF",
        tr: "PDF Filigrani",
        zh: "PDF 水印",
      });
    case "bulkPdfWatermark":
      return localizedText(locale, {
        en: "Bulk PDF Watermark",
        de: "PDF-Wasserzeichen im Stapel",
        es: "Marca de agua PDF por lotes",
        fr: "Filigrane PDF en lot",
        it: "Filigrana PDF in blocco",
        ja: "PDF一括透かし",
        ko: "대량 PDF 워터마크",
        nl: "PDF-watermerk in bulk",
        pt: "Marca d'agua em lote para PDF",
        ru: "Пакетный водяной знак PDF",
        tr: "Toplu PDF Filigrani",
        zh: "批量 PDF 水印",
      });
    case "videoCompressor":
      return localizedText(locale, {
        en: "Video Compressor",
        de: "Video-Kompressor",
        es: "Compresor de video",
        fr: "Compresseur video",
        it: "Compressore video",
        ja: "動画圧縮",
        ko: "비디오 압축기",
        nl: "Videocompressor",
        pt: "Compressor de video",
        ru: "Сжатие видео",
        tr: "Video Sikistirici",
        zh: "视频压缩器",
      });
    case "imageCompressor":
      return localizedText(locale, {
        en: "Image Compressor",
        de: "Bildkompressor",
        es: "Compresor de imagen",
        fr: "Compresseur d'image",
        it: "Compressore immagini",
        ja: "画像圧縮",
        ko: "이미지 압축기",
        nl: "Afbeeldingscompressor",
        pt: "Compressor de imagem",
        ru: "Сжатие изображений",
        tr: "Gorsel Sikistirici",
        zh: "图片压缩器",
      });
    case "imageConverter":
      return localizedText(locale, {
        en: "Image Converter",
        de: "Bildkonverter",
        es: "Conversor de imagen",
        fr: "Convertisseur d'image",
        it: "Convertitore immagini",
        ja: "画像変換",
        ko: "이미지 변환기",
        nl: "Afbeeldingsconverter",
        pt: "Conversor de imagem",
        ru: "Конвертер изображений",
        tr: "Gorsel Donusturucu",
        zh: "图片转换器",
      });
    case "imageResize":
      return localizedText(locale, {
        en: "Resize/Crop + Convert",
        de: "Große andern/Zuschneiden + Konvertieren",
        es: "Redimensionar/recortar + convertir",
        fr: "Redimensionner/rogner + convertir",
        it: "Ridimensiona/ritaglia + converti",
        ja: "リサイズ/切り抜き + 変換",
        ko: "크기 조정/자르기 + 변환",
        nl: "Formaat wijzigen/bijsnijden + converteren",
        pt: "Redimensionar/recortar + converter",
        ru: "Изменить размер/обрезать + конвертировать",
        tr: "Boyutlandir/Kirp + Donustur",
        zh: "调整大小/裁剪 + 转换",
      });
    case "faviconGenerator":
      return localizedText(locale, {
        en: "Favicon generator",
        de: "Favicon-Generator",
        es: "Generador de favicon",
        fr: "Generateur de favicon",
        it: "Generatore favicon",
        ja: "ファビコン生成",
        ko: "파비콘 생성기",
        nl: "Favicon-generator",
        pt: "Gerador de favicon",
        ru: "Генератор favicon",
        tr: "Favicon uretici",
        zh: "网站图标生成器",
        ar: "مولّد أيقونة الموقع",
        fa: "تولیدکننده فاویکون",
        he: "מחולל favicon",
        az: "Favicon generatoru",
        el: "Γεννητρια favicon",
      });
    case "gifTools":
      return localizedText(locale, {
        en: "GIF & motion tools",
      });
    case "heicToJpg":
      return localizedText(locale, {
        en: "HEIC to JPG/PNG",
        de: "HEIC zu JPG/PNG",
        es: "HEIC a JPG/PNG",
        fr: "HEIC vers JPG/PNG",
        it: "HEIC in JPG/PNG",
        ja: "HEICからJPG/PNG",
        ko: "HEIC를 JPG/PNG로",
        nl: "HEIC naar JPG/PNG",
        pt: "HEIC para JPG/PNG",
        ru: "HEIC в JPG/PNG",
        tr: "HEIC'den JPG/PNG'ye",
        zh: "HEIC 转 JPG/PNG",
      });
    case "imageBase64":
      return localizedText(locale, {
        en: "Image Base64",
      });
    case "linkedinBanner":
      return localizedText(locale, {
        en: "LinkedIn Banner Maker",
        de: "LinkedIn-Banner-Ersteller",
        es: "Creador de banners de LinkedIn",
        fr: "Créateur de bannière LinkedIn",
        it: "Creatore banner LinkedIn",
        ja: "LinkedInバナーメーカー",
        ko: "LinkedIn 배너 메이커",
        nl: "LinkedIn-bannermaker",
        pt: "Criador de banner do LinkedIn",
        ru: "Создатель баннеров LinkedIn",
        tr: "LinkedIn Banner Olusturucu",
        zh: "LinkedIn 横幅制作",
      });
    case "ogPreview":
      return localizedText(locale, {
        en: "Open Graph preview",
      });
    case "svgToPng":
      return localizedText(locale, {
        en: "SVG to PNG (sizes)",
      });
    case "colorPaletteGenerator":
      return localizedText(locale, {
        en: "Color Palette Generator",
        de: "Farbpaletten-Generator",
        es: "Generador de paletas",
        fr: "Generateur de palettes",
        it: "Generatore di palette",
        ja: "カラーパレット生成",
        ko: "색상 팔레트 생성기",
        nl: "Kleurenpaletgenerator",
        pt: "Gerador de paletas",
        ru: "Генератор палитр",
        tr: "Renk Paleti Olusturucu",
        zh: "配色生成器",
      });
    case "gradientGenerator":
      return localizedText(locale, {
        en: "Gradient Generator",
        de: "Verlaufs-Generator",
        es: "Generador de degradados",
        fr: "Generateur de degradés",
        it: "Generatore di gradienti",
        ja: "グラデーション生成",
        ko: "그라디언트 생성기",
        nl: "Gradientgenerator",
        pt: "Gerador de gradientes",
        ru: "Генератор градиентов",
        tr: "Gradient Olusturucu",
        zh: "渐变生成器",
      });
    case "meshGradientGenerator":
      return localizedText(locale, {
        en: "Mesh gradients",
      });
    case "trendingPalettes":
      return localizedText(locale, {
        en: "Trending Palettes",
        de: "Beliebte Paletten",
        es: "Paletas en tendencia",
        fr: "Palettes tendance",
        it: "Palette di tendenza",
        ja: "人気パレット",
        ko: "인기 팔레트",
        nl: "Trending paletten",
        pt: "Paletas em alta",
        ru: "Популярные палитры",
        tr: "Trend Paletler",
        zh: "热门配色",
      });
    case "trendingGradients":
      return localizedText(locale, {
        en: "Trending Gradients",
        de: "Beliebte Verlaufe",
        es: "Degradados en tendencia",
        fr: "Degrades tendance",
        it: "Gradienti di tendenza",
        ja: "人気グラデーション",
        ko: "인기 그라디언트",
        nl: "Trending gradients",
        pt: "Gradientes em alta",
        ru: "Популярные градиенты",
        tr: "Trend Gradientler",
        zh: "热门渐变",
      });
    case "trendingMeshGradients":
      return localizedText(locale, {
        en: "Trending mesh gradients",
        de: "Trending Mesh-Verläufe",
        es: "Degradados de malla en tendencia",
        fr: "Degrades mesh tendance",
        it: "Gradienti mesh di tendenza",
        ja: "人気メッシュグラデーション",
        ko: "인기 메시 그라디언트",
        nl: "Trending mesh gradients",
        pt: "Gradientes mesh em alta",
        ru: "Популярные mesh-градиенты",
        tr: "Trend mesh gradyanları",
        zh: "热门网格渐变",
      });
    case "guides":
      return localizedText(locale, {
        en: "Guides",
        de: "Leitfaden",
        es: "Guias",
        fr: "Guides",
        it: "Guide",
        ja: "ガイド",
        ko: "가이드",
        nl: "Gidsen",
        pt: "Guias",
        ru: "Руководства",
        tr: "Rehberler",
        zh: "指南",
      });
    case "tools":
      return localizedText(locale, {
        en: "Tools",
        de: "Werkzeuge",
        es: "Herramientas",
        fr: "Outils",
        it: "Strumenti",
        ja: "ツール",
        ko: "도구",
        nl: "Tools",
        pt: "Ferramentas",
        ru: "Инструменты",
        tr: "Araclar",
        zh: "工具",
      });
    case "blog":
      return localizedText(locale, {
        en: "Blog",
        de: "Blog",
        es: "Blog",
        fr: "Blog",
        it: "Blog",
        ja: "ブログ",
        ko: "블로그",
        nl: "Blog",
        pt: "Blog",
        ru: "Блог",
        tr: "Blog",
        zh: "博客",
      });
    case "privacy":
      return localizedText(locale, {
        en: "Privacy",
        de: "Datenschutz",
        es: "Privacidad",
        fr: "Confidentialite",
        it: "Privacy",
        ja: "プライバシー",
        ko: "개인정보",
        nl: "Privacy",
        pt: "Privacidade",
        ru: "Конфиденциальность",
        tr: "Gizlilik",
        zh: "隐私",
      });
    case "terms":
      return localizedText(locale, {
        en: "Terms",
        de: "AGB",
        es: "Terminos",
        fr: "Conditions",
        it: "Termini",
        ja: "利用規約",
        ko: "약관",
        nl: "Voorwaarden",
        pt: "Termos",
        ru: "Условия",
        tr: "Kosullar",
        zh: "条款",
      });
    case "contactUs":
      return localizedText(locale, {
        en: "Contact us",
        de: "Kontakt",
        es: "Contacto",
        fr: "Contact",
        it: "Contattaci",
        ja: "お問い合わせ",
        ko: "문의",
        nl: "Contact",
        pt: "Contato",
        ru: "Связаться",
        tr: "Iletisim",
        zh: "联系我们",
      });
  }
}

function getLocalizedDescription(
  locale: AppLocale,
  key:
    | "groupConverters"
    | "groupViewers"
    | "groupExcel"
    | "groupDeveloper"
    | "groupPdf"
    | "groupVideo"
    | "groupImage"
    | "groupColor"
    | "csvViewer"
    | "csvCompare"
    | "csvToJson"
    | "jsonToCsv"
    | "csvToParquet"
    | "parquetToCsv"
    | "jsonToParquet"
    | "parquetToJson"
    | "csvToMarkdownTable"
    | "csvToSql"
    | "xlsViewer"
    | "parquetViewer"
    | "csvToExcel"
    | "xlsToCsv"
    | "jsonToExcel"
    | "jsonFormatter"
    | "sqlFormatter"
    | "jsonYamlConverter"
    | "markdownHtmlConverter"
    | "jwtDecoder"
    | "cronParser"
    | "uuidGenerator"
    | "regexTester"
    | "base64Converter"
    | "unixTimestampConverter"
    | "curlConverter"
    | "fetchConverter"
    | "axiosConverter"
    | "pythonRequestsConverter"
    | "httpExplainer"
    | "openapiViewer"
    | "graphqlTools"
    | "webhookViewer"
    | "pdfToWord"
    | "splitPdf"
    | "reorderPdf"
    | "mergePdf"
    | "pdfToImage"
    | "imagesToPdf"
    | "pdfWatermark"
    | "bulkPdfWatermark"
    | "videoCompressor"
    | "imageCompressor"
    | "imageConverter"
    | "imageResize"
    | "faviconGenerator"
    | "gifTools"
    | "heicToJpg"
    | "imageBase64"
    | "linkedinBanner"
    | "ogPreview"
    | "svgToPng"
    | "colorPaletteGenerator"
    | "gradientGenerator"
    | "meshGradientGenerator"
    | "trendingPalettes"
    | "trendingGradients"
    | "trendingMeshGradients"
    | "groupCompany"
    | "guides"
    | "tools"
    | "blog"
    | "privacy"
    | "terms"
    | "contactUs",
) {
  switch (key) {
    case "groupConverters":
      return localizedText(locale, {
        en: "Convert between CSV, JSON, and Parquet instantly.",
        de: "Zwischen CSV, JSON und Parquet sofort konvertieren.",
        es: "Convierte entre CSV, JSON y Parquet al instante.",
        fr: "Convertissez entre CSV, JSON et Parquet instantanement.",
        it: "Converti tra CSV, JSON e Parquet all'istante.",
        ja: "CSV、JSON、Parquet をすぐに変換。",
        ko: "CSV, JSON, Parquet 사이를 즉시 변환합니다.",
        nl: "Converteer direct tussen CSV, JSON en Parquet.",
        pt: "Converta entre CSV, JSON e Parquet na hora.",
        ru: "Мгновенно конвертируйте между CSV, JSON и Parquet.",
        tr: "CSV, JSON ve Parquet arasinda aninda donusturun.",
        zh: "在 CSV、JSON 和 Parquet 之间即时转换。",
      });
    case "groupViewers":
      return localizedText(locale, {
        en: "Open, search, and edit locally—editable grids, specs, and JSON payloads in your browser.",
        de: "Lokal oeffnen, suchen und bearbeiten: editierbare Tabellen, Spezifikationen und JSON-Nutzdaten im Browser.",
        es: "Abre, busca y edita en local: rejillas, especificaciones y JSON en el navegador.",
        fr: "Ouvrez, cherchez et modifiez en local : grilles, specs et JSON dans le navigateur.",
        it: "Apri, cerca e modifica in locale: griglie, spec e payload JSON nel browser.",
        ja: "ブラウザでローカルに開く・検索・編集（表、仕様、JSON）。",
        ko: "브라우저에서 로컬로 열기·검색·편집—편집 가능한 그리드, 스펙, JSON 페이로드.",
        nl: "Open, zoek en bewerk lokaal: bewerkbare grids, specs en JSON in je browser.",
        pt: "Abra, pesquise e edite localmente: grades editaveis, specs e JSON no navegador.",
        ru: "Открывайте, ищите и правьте локально: редактируемые таблицы, спеки и JSON в браузере.",
        tr: "Yerelde acin, arayin ve duzenleyin: tarayicida duzenlenebilir izgaralar, spec ve JSON.",
        zh: "在浏览器本地打开、搜索和编辑—可编辑表格、规格与 JSON 负载。",
      });
    case "groupExcel":
      return localizedText(locale, {
        en: "Import and export between CSV, JSON, and Excel.",
        de: "Import und Export zwischen CSV, JSON und Excel.",
        es: "Importa y exporta entre CSV, JSON y Excel.",
        fr: "Importez et exportez entre CSV, JSON et Excel.",
        it: "Importa ed esporta tra CSV, JSON ed Excel.",
        ja: "CSV、JSON、Excel の入出力。",
        ko: "CSV, JSON, Excel 간 가져오기와 내보내기.",
        nl: "Importeer en exporteer tussen CSV, JSON en Excel.",
        pt: "Importe e exporte entre CSV, JSON e Excel.",
        ru: "Импорт и экспорт между CSV, JSON и Excel.",
        tr: "CSV, JSON ve Excel arasinda ice aktarim ve disa aktarim.",
        zh: "在 CSV、JSON 和 Excel 之间导入导出。",
      });
    case "groupDeveloper":
      return localizedText(locale, {
        en: "API and text utilities for everyday web development.",
        de: "API- und Textwerkzeuge fur die tagliche Webentwicklung.",
        es: "Utilidades de API y texto para el trabajo web diario.",
        fr: "Outils API et texte pour le developpement web quotidien.",
        it: "Utility API e testo per lo sviluppo web quotidiano.",
        ja: "日々のWeb開発向け API とテキストツール。",
        ko: "일상적인 웹 개발을 위한 API 및 텍스트 도구.",
        nl: "API- en tekstdiensten voor dagelijks webwerk.",
        pt: "Ferramentas de API e texto para o desenvolvimento web diario.",
        ru: "API и текстовые утилиты для ежедневной веб-разработки.",
        tr: "Gunluk web gelistirme icin API ve metin araclari.",
        zh: "适用于日常 Web 开发的 API 和文本工具。",
      });
    case "groupPdf":
      return localizedText(locale, {
        en: "PDF tools: convert, split, merge, and watermark locally.",
        de: "PDF-Werkzeuge: lokal konvertieren, teilen, zusammenfugen und wasserzeichnen.",
        es: "Herramientas PDF: convierte, divide, une y marca localmente.",
        fr: "Outils PDF : convertir, diviser, fusionner et filigraner localement.",
        it: "Strumenti PDF: converti, dividi, unisci e aggiungi filigrane in locale.",
        ja: "PDF の変換、分割、結合、透かしをローカルで実行。",
        ko: "PDF 변환, 분할, 병합, 워터마크를 로컬에서 처리합니다.",
        nl: "PDF-tools: lokaal converteren, splitsen, samenvoegen en watermerken.",
        pt: "Ferramentas PDF: converta, divida, junte e adicione marca d'agua localmente.",
        ru: "PDF-инструменты: конвертация, разделение, объединение и водяные знаки локально.",
        tr: "PDF araclari: yerelde donustur, bol, birlestir ve filigran ekle.",
        zh: "PDF 工具：本地转换、拆分、合并和加水印。",
      });
    case "groupVideo":
      return localizedText(locale, {
        en: "Video tools: optimize media directly in the browser.",
        de: "Videowerkzeuge: Medien direkt im Browser optimieren.",
        es: "Herramientas de video: optimiza archivos directamente en el navegador.",
        fr: "Outils video : optimisez vos medias directement dans le navigateur.",
        it: "Strumenti video: ottimizza i media direttamente nel browser.",
        ja: "動画ツール：ブラウザで直接最適化。",
        ko: "비디오 도구: 브라우저에서 바로 미디어 최적화.",
        nl: "Videotools: optimaliseer media direct in de browser.",
        pt: "Ferramentas de video: otimize midia direto no navegador.",
        ru: "Видеоинструменты: оптимизация медиа прямо в браузере.",
        tr: "Video araclari: medyayi dogrudan tarayicida optimize edin.",
        zh: "视频工具：直接在浏览器中优化媒体。",
      });
    case "groupImage":
      return localizedText(locale, {
        en: "Image tools: compress, convert, and resize locally.",
        de: "Bildwerkzeuge: lokal komprimieren, konvertieren und skalieren.",
        es: "Herramientas de imagen: comprime, convierte y cambia tamano localmente.",
        fr: "Outils image : compresser, convertir et redimensionner localement.",
        it: "Strumenti immagine: comprimi, converti e ridimensiona in locale.",
        ja: "画像ツール：ローカルで圧縮、変換、リサイズ。",
        ko: "이미지 도구: 로컬에서 압축, 변환, 크기 조정.",
        nl: "Afbeeldingstools: lokaal comprimeren, converteren en schalen.",
        pt: "Ferramentas de imagem: comprima, converta e redimensione localmente.",
        ru: "Инструменты для изображений: сжатие, конвертация и изменение размера локально.",
        tr: "Gorsel araclari: yerelde sikistir, donustur ve boyutlandir.",
        zh: "图片工具：本地压缩、转换和调整大小。",
      });
    case "groupColor":
      return localizedText(locale, {
        en: "Color tools: generators and trending galleries.",
        de: "Farbwerkzeuge: Generatoren und beliebte Galerien.",
        es: "Herramientas de color: generadores y galerias en tendencia.",
        fr: "Outils couleur : generateurs et galeries tendance.",
        it: "Strumenti colore: generatori e raccolte di tendenza.",
        ja: "色ツール：ジェネレーターと人気ギャラリー。",
        ko: "색상 도구: 생성기와 인기 갤러리.",
        nl: "Kleurtools: generators en populaire galerijen.",
        pt: "Ferramentas de cor: geradores e galerias em alta.",
        ru: "Цветовые инструменты: генераторы и популярные подборки.",
        tr: "Renk araclari: olusturucular ve trend galeriler.",
        zh: "颜色工具：生成器和热门图库。",
      });
    case "groupCompany":
      return localizedText(locale, {
        en: "Docs, hubs, and key pages.",
        de: "Dokumentation, Hubs und wichtige Seiten.",
        es: "Documentacion, hubs y paginas clave.",
        fr: "Documentation, hubs et pages cles.",
        it: "Documentazione, hub e pagine chiave.",
        ja: "ドキュメント、ハブ、主要ページ。",
        ko: "문서, 허브, 주요 페이지.",
        nl: "Documentatie, hubs en belangrijke pagina's.",
        pt: "Documentacao, hubs e paginas principais.",
        ru: "Документация, разделы и ключевые страницы.",
        tr: "Belgeler, merkezler ve onemli sayfalar.",
        zh: "文档、聚合页与关键页面。",
      });
    case "guides":
      return localizedText(locale, {
        en: "Practical guides for CSV workflows.",
        de: "Praktische Leitfaden fur CSV-Workflows.",
        es: "Guias practicas para flujos de trabajo con CSV.",
        fr: "Guides pratiques pour les workflows CSV.",
        it: "Guide pratiche per i flussi di lavoro CSV.",
        ja: "CSVワークフロー向けの実践ガイド。",
        ko: "CSV 워크플로 실용 가이드.",
        nl: "Praktische gidsen voor CSV-workflows.",
        pt: "Guias praticos para fluxos de trabalho com CSV.",
        ru: "Практические руководства по работе с CSV.",
        tr: "CSV is akislari icin pratik rehberler.",
        zh: "CSV 工作流的实用指南。",
      });
    case "tools":
      return localizedText(locale, {
        en: "Browse hubs and landing pages.",
        de: "Hubs und Landingpages durchsuchen.",
        es: "Explora hubs y paginas de aterrizaje.",
        fr: "Parcourir les hubs et pages d'atterrissage.",
        it: "Sfoglia hub e landing page.",
        ja: "ハブとランディングページを見る。",
        ko: "허브와 랜딩 페이지 둘러보기.",
        nl: "Hubs en landingspagina's bekijken.",
        pt: "Navegue por hubs e paginas iniciais.",
        ru: "Обзор разделов и посадочных страниц.",
        tr: "Merkezleri ve acilis sayfalarini gezin.",
        zh: "浏览工具聚合与落地页。",
      });
    case "blog":
      return localizedText(locale, {
        en: "Guides and product insights.",
        de: "Leitfaden und Produkteinblicke.",
        es: "Guias e ideas sobre el producto.",
        fr: "Guides et informations produit.",
        it: "Guide e approfondimenti sul prodotto.",
        ja: "ガイドとプロダクトの洞察。",
        ko: "가이드와 제품 인사이트.",
        nl: "Gidsen en productinzichten.",
        pt: "Guias e insights do produto.",
        ru: "Руководства и заметки о продукте.",
        tr: "Rehberler ve urun icgoruleri.",
        zh: "指南与产品见解。",
      });
    case "privacy":
      return localizedText(locale, {
        en: "How we handle data and privacy.",
        de: "Wie wir Daten und Datenschutz handhaben.",
        es: "Como tratamos los datos y la privacidad.",
        fr: "Comment nous traitons les donnees et la vie privee.",
        it: "Come gestiamo dati e privacy.",
        ja: "データとプライバシーの扱い。",
        ko: "데이터와 개인정보 처리 방식.",
        nl: "Hoe we omgaan met data en privacy.",
        pt: "Como tratamos dados e privacidade.",
        ru: "Как мы обрабатываем данные и конфиденциальность.",
        tr: "Veri ve gizliligi nasil ele aliyoruz.",
        zh: "我们如何处理数据与隐私。",
      });
    case "terms":
      return localizedText(locale, {
        en: "Terms and conditions.",
        de: "Allgemeine Geschaftsbedingungen.",
        es: "Terminos y condiciones.",
        fr: "Conditions generales.",
        it: "Termini e condizioni.",
        ja: "利用規約。",
        ko: "이용 약관.",
        nl: "Algemene voorwaarden.",
        pt: "Termos e condicoes.",
        ru: "Условия использования.",
        tr: "Kosullar ve sartlar.",
        zh: "条款与条件。",
      });
    case "contactUs":
      return localizedText(locale, {
        en: "Questions, feedback, and support by email.",
        de: "Fragen, Feedback und Support per E-Mail.",
        es: "Preguntas, comentarios y soporte por correo.",
        fr: "Questions, retours et support par e-mail.",
        it: "Domande, feedback e supporto via email.",
        ja: "メールでの質問・フィードバック・サポート。",
        ko: "이메일로 문의, 피드백 및 지원.",
        nl: "Vragen, feedback en support per e-mail.",
        pt: "Duvidas, feedback e suporte por e-mail.",
        ru: "Вопросы, отзывы и поддержка по электронной почте.",
        tr: "E-posta ile soru, geri bildirim ve destek.",
        zh: "通过邮件提问、反馈与获取支持。",
      });
    default:
      return localizedText(locale, {
        en: {
          csvViewer:
            "Open CSV in an editable grid, search and export—runs locally in your browser.",
          csvCompare: "Compare two CSV files side by side.",
          csvToJson: "Convert CSV files to JSON.",
          jsonToCsv: "Convert JSON to CSV format.",
          csvToParquet: "Turn CSV data into Parquet files.",
          parquetToCsv: "Convert Parquet files back to CSV.",
          jsonToParquet: "Create Parquet from JSON data.",
          parquetToJson: "Convert Parquet into JSON.",
          csvToMarkdownTable: "Generate Markdown tables from CSV files.",
          csvToSql:
            "Generate CREATE TABLE and INSERT statements from CSV (PostgreSQL, MySQL, SQLite).",
          xlsViewer:
            "Open Excel in an editable grid; edit cells and export locally.",
          parquetViewer:
            "Browse Parquet in an editable grid and export back to .parquet locally.",
          csvToExcel: "Convert CSV to XLSX files.",
          xlsToCsv: "Turn Excel sheets into CSV.",
          jsonToExcel: "Convert JSON into XLSX.",
          jsonFormatter: "Format, minify, and validate JSON locally.",
          sqlFormatter:
            "Pretty-print SQL with dialect-aware parsing; read-only, runs locally.",
          jsonYamlConverter:
            "Convert between JSON and YAML for configs and APIs locally.",
          markdownHtmlConverter:
            "Convert Markdown and HTML with GFM tables, live preview, and safe copy.",
          jwtDecoder:
            "Decode JWT header and payload locally for API debugging.",
          cronParser:
            "Parse cron, preview next runs, and convert simple English phrases to schedules.",
          uuidGenerator:
            "Generate v1, v4, v7, or nil UUIDs in bulk with copy-friendly formats for apps and tests.",
          regexTester:
            "Test JavaScript regular expressions with flags, multiline text, and capture groups locally.",
          base64Converter:
            "Encode UTF-8 or files to Base64; decode to text or download binary.",
          unixTimestampConverter:
            "Convert epoch seconds or milliseconds to human dates and back with IANA timezones locally.",
          curlConverter:
            "Convert cURL request snippets to fetch, axios, or Python.",
          fetchConverter: "Convert fetch snippets to cURL, axios, or Python.",
          axiosConverter: "Convert axios snippets to cURL, fetch, or Python.",
          pythonRequestsConverter:
            "Convert Python requests snippets to cURL, fetch, or axios.",
          httpExplainer: "Explain status codes and common HTTP headers.",
          openapiViewer:
            "Paste or load OpenAPI YAML/JSON, edit the spec, and browse paths and operations.",
          graphqlTools:
            "Write and format GraphQL queries; load schema JSON and inspect types locally.",
          webhookViewer:
            "Paste, edit, prettify JSON payloads, and search with JSONPath locally.",
          pdfToWord: "Convert PDFs to DOCX files.",
          splitPdf: "Split PDF files by page or range.",
          reorderPdf: "Reorder or remove pages, then save a new PDF.",
          mergePdf: "Combine multiple PDFs into one.",
          pdfToImage: "Export PDF pages to PNG, JPG, or WebP.",
          imagesToPdf: "Combine images into a single PDF.",
          pdfWatermark: "Add text or image watermarks to PDFs.",
          bulkPdfWatermark:
            "Apply one watermark to many PDFs and download a ZIP.",
          videoCompressor: "Compress videos locally with bulk uploads.",
          imageCompressor: "Compress images locally in bulk.",
          imageConverter: "Convert to WebP, AVIF, JPG, or PNG.",
          imageResize: "Resize, crop, convert, and rename images in bulk.",
          faviconGenerator:
            "Upload one image; download a ZIP with favicon.ico, PNG sizes, and site.webmanifest.",
          heicToJpg: "Convert HEIC and HEIF photos to JPG or PNG.",
          gifTools:
            "GIF to MP4, video to GIF, frame ZIP, stills to GIF.",
          imageBase64:
            "Data URLs from images and decode back to files locally.",
          linkedinBanner:
            "Design LinkedIn profile and page banners in standard sizes; download PNG, JPEG, or WebP.",
          ogPreview: "Parse meta tags locally (paste HTML or CORS fetch).",
          svgToPng: "Rasterize SVG to multiple square PNGs in one ZIP.",
          colorPaletteGenerator: "Generate palettes and export PNG or JSON.",
          gradientGenerator: "Create gradients and export PNG or JSON.",
          meshGradientGenerator: "Blur mesh blobs and export PNG.",
          trendingPalettes: "Browse curated color palettes.",
          trendingGradients: "Browse curated gradients.",
          trendingMeshGradients: "Browse 500 mesh-style blob gradients.",
        }[key],
      });
  }
}

function getLocalizedGroupTitle(
  locale: AppLocale,
  key:
    | "converters"
    | "viewers"
    | "excel"
    | "developer"
    | "pdf"
    | "video"
    | "image"
    | "color"
    | "company",
) {
  switch (key) {
    case "converters":
      return localizedText(locale, {
        en: "Converters",
        de: "Konverter",
        es: "Conversores",
        fr: "Convertisseurs",
        it: "Convertitori",
        ja: "変換",
        ko: "변환기",
        nl: "Converters",
        pt: "Conversores",
        ru: "Конвертеры",
        tr: "Donusturuculer",
        zh: "转换",
      });
    case "viewers":
      return localizedText(locale, {
        en: "Viewers & editors",
        de: "Viewer & Editoren",
        es: "Visores y editores",
        fr: "Visionneuses et éditeurs",
        it: "Visualizzatori e editor",
        ja: "ビューアとエディタ",
        ko: "뷰어·편집기",
        nl: "Viewers en editors",
        pt: "Visualizadores e editores",
        ru: "Просмотр и редакторы",
        tr: "Goruntuleyiciler ve duzenleyiciler",
        zh: "查看与编辑",
      });
    case "excel":
      return localizedText(locale, {
        en: "Excel",
        de: "Excel",
        es: "Excel",
        fr: "Excel",
        it: "Excel",
        ja: "Excel",
        ko: "Excel",
        nl: "Excel",
        pt: "Excel",
        ru: "Excel",
        tr: "Excel",
        zh: "Excel",
      });
    case "developer":
      return localizedText(locale, {
        en: "Developer",
        de: "Entwickler",
        es: "Desarrollo",
        fr: "Developpeur",
        it: "Sviluppo",
        ja: "開発",
        ko: "개발",
        nl: "Developer",
        pt: "Desenvolvimento",
        ru: "Разработка",
        tr: "Gelistirici",
        zh: "开发",
      });
    case "pdf":
      return "PDF";
    case "video":
      return localizedText(locale, {
        en: "Video",
        de: "Video",
        es: "Video",
        fr: "Video",
        it: "Video",
        ja: "動画",
        ko: "비디오",
        nl: "Video",
        pt: "Video",
        ru: "Видео",
        tr: "Video",
        zh: "视频",
      });
    case "image":
      return localizedText(locale, {
        en: "Image",
        de: "Bild",
        es: "Imagen",
        fr: "Image",
        it: "Immagine",
        ja: "画像",
        ko: "이미지",
        nl: "Afbeelding",
        pt: "Imagem",
        ru: "Изображение",
        tr: "Gorsel",
        zh: "图片",
      });
    case "color":
      return localizedText(locale, {
        en: "Color",
        de: "Farbe",
        es: "Color",
        fr: "Couleur",
        it: "Colore",
        ja: "色",
        ko: "색상",
        nl: "Kleur",
        pt: "Cor",
        ru: "Цвет",
        tr: "Renk",
        zh: "颜色",
      });
    case "company":
      return localizedText(locale, {
        en: "Learn & product",
        de: "Lernen & Produkt",
        es: "Aprender y producto",
        fr: "Apprendre et produit",
        it: "Impara e prodotto",
        ja: "学ぶ・プロダクト",
        ko: "학습 및 제품",
        nl: "Leren en product",
        pt: "Aprender e produto",
        ru: "Обучение и продукт",
        tr: "Ogren ve urun",
        zh: "学习与产品",
      });
  }
}

export function getLocalizedServiceGroups(locale: string): ServiceGroup[] {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return [
    {
      id: "converters",
      title: getLocalizedGroupTitle(safeLocale, "converters"),
      description: getLocalizedDescription(safeLocale, "groupConverters"),
      links: [
        {
          href: "/csv-to-json",
          label: getLocalizedLabel(safeLocale, "csvToJson"),
          description: getLocalizedDescription(safeLocale, "csvToJson"),
        },
        {
          href: "/json-to-csv",
          label: getLocalizedLabel(safeLocale, "jsonToCsv"),
          description: getLocalizedDescription(safeLocale, "jsonToCsv"),
        },
        {
          href: "/csv-to-parquet",
          label: getLocalizedLabel(safeLocale, "csvToParquet"),
          description: getLocalizedDescription(safeLocale, "csvToParquet"),
        },
        {
          href: "/parquet-to-csv",
          label: getLocalizedLabel(safeLocale, "parquetToCsv"),
          description: getLocalizedDescription(safeLocale, "parquetToCsv"),
        },
        {
          href: "/json-to-parquet",
          label: getLocalizedLabel(safeLocale, "jsonToParquet"),
          description: getLocalizedDescription(safeLocale, "jsonToParquet"),
        },
        {
          href: "/parquet-to-json",
          label: getLocalizedLabel(safeLocale, "parquetToJson"),
          description: getLocalizedDescription(safeLocale, "parquetToJson"),
        },
        {
          href: "/csv-to-markdown-table",
          label: getLocalizedLabel(safeLocale, "csvToMarkdownTable"),
          description: getLocalizedDescription(
            safeLocale,
            "csvToMarkdownTable",
          ),
        },
        {
          href: "/csv-to-sql",
          label: getLocalizedLabel(safeLocale, "csvToSql"),
          description: getLocalizedDescription(safeLocale, "csvToSql"),
        },
        {
          href: "/json-yaml-converter",
          label: getLocalizedLabel(safeLocale, "jsonYamlConverter"),
          description: getLocalizedDescription(safeLocale, "jsonYamlConverter"),
        },
        {
          href: "/markdown-html-converter",
          label: getLocalizedLabel(safeLocale, "markdownHtmlConverter"),
          description: getLocalizedDescription(
            safeLocale,
            "markdownHtmlConverter",
          ),
        },
        {
          href: "/base64-converter",
          label: getLocalizedLabel(safeLocale, "base64Converter"),
          description: getLocalizedDescription(safeLocale, "base64Converter"),
        },
        {
          href: "/unix-timestamp-converter",
          label: getLocalizedLabel(safeLocale, "unixTimestampConverter"),
          description: getLocalizedDescription(
            safeLocale,
            "unixTimestampConverter",
          ),
        },
        {
          href: "/curl-converter",
          label: getLocalizedLabel(safeLocale, "curlConverter"),
          description: getLocalizedDescription(safeLocale, "curlConverter"),
        },
        {
          href: "/fetch-converter",
          label: getLocalizedLabel(safeLocale, "fetchConverter"),
          description: getLocalizedDescription(safeLocale, "fetchConverter"),
        },
        {
          href: "/axios-converter",
          label: getLocalizedLabel(safeLocale, "axiosConverter"),
          description: getLocalizedDescription(safeLocale, "axiosConverter"),
        },
        {
          href: "/python-requests-converter",
          label: getLocalizedLabel(safeLocale, "pythonRequestsConverter"),
          description: getLocalizedDescription(
            safeLocale,
            "pythonRequestsConverter",
          ),
        },
      ],
    },
    {
      id: "viewers",
      title: getLocalizedGroupTitle(safeLocale, "viewers"),
      description: getLocalizedDescription(safeLocale, "groupViewers"),
      links: [
        {
          href: "/csv-viewer",
          label: getLocalizedLabel(safeLocale, "csvViewer"),
          description: getLocalizedDescription(safeLocale, "csvViewer"),
        },
        {
          href: "/compare",
          label: getLocalizedLabel(safeLocale, "csvCompare"),
          description: getLocalizedDescription(safeLocale, "csvCompare"),
        },
        {
          href: "/xls-viewer",
          label: getLocalizedLabel(safeLocale, "xlsViewer"),
          description: getLocalizedDescription(safeLocale, "xlsViewer"),
        },
        {
          href: "/parquet-viewer",
          label: getLocalizedLabel(safeLocale, "parquetViewer"),
          description: getLocalizedDescription(safeLocale, "parquetViewer"),
        },
        {
          href: "/jwt-decoder",
          label: getLocalizedLabel(safeLocale, "jwtDecoder"),
          description: getLocalizedDescription(safeLocale, "jwtDecoder"),
        },
        {
          href: "/openapi-viewer",
          label: getLocalizedLabel(safeLocale, "openapiViewer"),
          description: getLocalizedDescription(safeLocale, "openapiViewer"),
        },
        {
          href: "/graphql-tools",
          label: getLocalizedLabel(safeLocale, "graphqlTools"),
          description: getLocalizedDescription(safeLocale, "graphqlTools"),
        },
        {
          href: "/webhook-viewer",
          label: getLocalizedLabel(safeLocale, "webhookViewer"),
          description: getLocalizedDescription(safeLocale, "webhookViewer"),
        },
        {
          href: "/regex-tester",
          label: getLocalizedLabel(safeLocale, "regexTester"),
          description: getLocalizedDescription(safeLocale, "regexTester"),
        },
      ],
    },
    {
      id: "excel",
      title: getLocalizedGroupTitle(safeLocale, "excel"),
      description: getLocalizedDescription(safeLocale, "groupExcel"),
      links: [
        {
          href: "/csv-to-excel",
          label: getLocalizedLabel(safeLocale, "csvToExcel"),
          description: getLocalizedDescription(safeLocale, "csvToExcel"),
        },
        {
          href: "/xls-to-csv",
          label: getLocalizedLabel(safeLocale, "xlsToCsv"),
          description: getLocalizedDescription(safeLocale, "xlsToCsv"),
        },
        {
          href: "/json-to-excel",
          label: getLocalizedLabel(safeLocale, "jsonToExcel"),
          description: getLocalizedDescription(safeLocale, "jsonToExcel"),
        },
      ],
    },
    {
      id: "developer",
      title: getLocalizedGroupTitle(safeLocale, "developer"),
      description: getLocalizedDescription(safeLocale, "groupDeveloper"),
      links: [
        {
          href: "/json-formatter",
          label: getLocalizedLabel(safeLocale, "jsonFormatter"),
          description: getLocalizedDescription(safeLocale, "jsonFormatter"),
        },
        {
          href: "/sql-formatter",
          label: getLocalizedLabel(safeLocale, "sqlFormatter"),
          description: getLocalizedDescription(safeLocale, "sqlFormatter"),
        },
        {
          href: "/cron-parser",
          label: getLocalizedLabel(safeLocale, "cronParser"),
          description: getLocalizedDescription(safeLocale, "cronParser"),
        },
        {
          href: "/uuid-generator",
          label: getLocalizedLabel(safeLocale, "uuidGenerator"),
          description: getLocalizedDescription(safeLocale, "uuidGenerator"),
        },
        {
          href: "/http-explainer",
          label: getLocalizedLabel(safeLocale, "httpExplainer"),
          description: getLocalizedDescription(safeLocale, "httpExplainer"),
        },
      ],
    },
    {
      id: "pdf",
      title: getLocalizedGroupTitle(safeLocale, "pdf"),
      description: getLocalizedDescription(safeLocale, "groupPdf"),
      links: [
        {
          href: "/pdf-to-word",
          label: getLocalizedLabel(safeLocale, "pdfToWord"),
          description: getLocalizedDescription(safeLocale, "pdfToWord"),
        },
        {
          href: "/split-pdf",
          label: getLocalizedLabel(safeLocale, "splitPdf"),
          description: getLocalizedDescription(safeLocale, "splitPdf"),
        },
        {
          href: "/reorder-pdf",
          label: getLocalizedLabel(safeLocale, "reorderPdf"),
          description: getLocalizedDescription(safeLocale, "reorderPdf"),
        },
        {
          href: "/merge-pdf",
          label: getLocalizedLabel(safeLocale, "mergePdf"),
          description: getLocalizedDescription(safeLocale, "mergePdf"),
        },
        {
          href: "/pdf-to-image",
          label: getLocalizedLabel(safeLocale, "pdfToImage"),
          description: getLocalizedDescription(safeLocale, "pdfToImage"),
        },
        {
          href: "/images-to-pdf",
          label: getLocalizedLabel(safeLocale, "imagesToPdf"),
          description: getLocalizedDescription(safeLocale, "imagesToPdf"),
        },
        {
          href: "/pdf-watermark",
          label: getLocalizedLabel(safeLocale, "pdfWatermark"),
          description: getLocalizedDescription(safeLocale, "pdfWatermark"),
        },
        {
          href: "/bulk-pdf-watermark",
          label: getLocalizedLabel(safeLocale, "bulkPdfWatermark"),
          description: getLocalizedDescription(safeLocale, "bulkPdfWatermark"),
        },
      ],
    },
    {
      id: "video",
      title: getLocalizedGroupTitle(safeLocale, "video"),
      description: getLocalizedDescription(safeLocale, "groupVideo"),
      links: [
        {
          href: "/video-compress",
          label: getLocalizedLabel(safeLocale, "videoCompressor"),
          description: getLocalizedDescription(safeLocale, "videoCompressor"),
        },
      ],
    },
    {
      id: "image",
      title: getLocalizedGroupTitle(safeLocale, "image"),
      description: getLocalizedDescription(safeLocale, "groupImage"),
      links: [
        {
          href: "/image-compress",
          label: getLocalizedLabel(safeLocale, "imageCompressor"),
          description: getLocalizedDescription(safeLocale, "imageCompressor"),
        },
        {
          href: "/image-convert",
          label: getLocalizedLabel(safeLocale, "imageConverter"),
          description: getLocalizedDescription(safeLocale, "imageConverter"),
        },
        {
          href: "/image-resize",
          label: getLocalizedLabel(safeLocale, "imageResize"),
          description: getLocalizedDescription(safeLocale, "imageResize"),
        },
        {
          href: "/favicon-generator",
          label: getLocalizedLabel(safeLocale, "faviconGenerator"),
          description: getLocalizedDescription(safeLocale, "faviconGenerator"),
        },
        {
          href: "/heic-to-jpg",
          label: getLocalizedLabel(safeLocale, "heicToJpg"),
          description: getLocalizedDescription(safeLocale, "heicToJpg"),
        },
        {
          href: "/linkedin-banner",
          label: getLocalizedLabel(safeLocale, "linkedinBanner"),
          description: getLocalizedDescription(safeLocale, "linkedinBanner"),
        },
        {
          href: "/gif-tools",
          label: getLocalizedLabel(safeLocale, "gifTools"),
          description: getLocalizedDescription(safeLocale, "gifTools"),
        },
        {
          href: "/image-base64",
          label: getLocalizedLabel(safeLocale, "imageBase64"),
          description: getLocalizedDescription(safeLocale, "imageBase64"),
        },
        {
          href: "/svg-to-png",
          label: getLocalizedLabel(safeLocale, "svgToPng"),
          description: getLocalizedDescription(safeLocale, "svgToPng"),
        },
        {
          href: "/open-graph-preview",
          label: getLocalizedLabel(safeLocale, "ogPreview"),
          description: getLocalizedDescription(safeLocale, "ogPreview"),
        },
      ],
    },
    {
      id: "color",
      title: getLocalizedGroupTitle(safeLocale, "color"),
      description: getLocalizedDescription(safeLocale, "groupColor"),
      links: [
        {
          href: "/palettes/trending",
          label: getLocalizedLabel(safeLocale, "colorPaletteGenerator"),
          description: getLocalizedDescription(
            safeLocale,
            "colorPaletteGenerator",
          ),
        },
        {
          href: "/gradients",
          label: getLocalizedLabel(safeLocale, "gradientGenerator"),
          description: getLocalizedDescription(safeLocale, "gradientGenerator"),
        },
        {
          href: "/gradient-generator",
          label: getLocalizedLabel(safeLocale, "meshGradientGenerator"),
          description: getLocalizedDescription(
            safeLocale,
            "meshGradientGenerator",
          ),
        },
        {
          href: "/gradient-generator/trending",
          label: getLocalizedLabel(safeLocale, "trendingMeshGradients"),
          description: getLocalizedDescription(
            safeLocale,
            "trendingMeshGradients",
          ),
        },
        {
          href: "/palettes/best",
          label: getLocalizedLabel(safeLocale, "trendingPalettes"),
          description: getLocalizedDescription(safeLocale, "trendingPalettes"),
        },
        {
          href: "/gradients/best",
          label: getLocalizedLabel(safeLocale, "trendingGradients"),
          description: getLocalizedDescription(safeLocale, "trendingGradients"),
        },
      ],
    },
    {
      id: "company",
      title: getLocalizedGroupTitle(safeLocale, "company"),
      description: getLocalizedDescription(safeLocale, "groupCompany"),
      links: [
        {
          href: "/guides",
          label: getLocalizedLabel(safeLocale, "guides"),
          description: getLocalizedDescription(safeLocale, "guides"),
        },
        {
          href: "/blog",
          label: getLocalizedLabel(safeLocale, "blog"),
          description: getLocalizedDescription(safeLocale, "blog"),
        },
        {
          href: "/contact",
          label: getLocalizedLabel(safeLocale, "contactUs"),
          description: getLocalizedDescription(safeLocale, "contactUs"),
        },
        {
          href: "/privacy",
          label: getLocalizedLabel(safeLocale, "privacy"),
          description: getLocalizedDescription(safeLocale, "privacy"),
        },
        {
          href: "/terms",
          label: getLocalizedLabel(safeLocale, "terms"),
          description: getLocalizedDescription(safeLocale, "terms"),
        },
      ],
    },
  ];
}
