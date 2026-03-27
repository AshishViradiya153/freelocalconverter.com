import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { BulkPdfWatermarkApp } from "@/app/components/bulk-pdf-watermark-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";
import { routing, type AppLocale } from "@/i18n/routing";

const BULK_WATERMARK_SLUG = "/bulk-pdf-watermark";

const PAGE_TITLE_BY_LOCALE: Record<AppLocale, string> = {
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
};

const PAGE_DESCRIPTION_BY_LOCALE: Record<AppLocale, string> = {
  en: "Watermark many PDFs at once in your browser. Same text or image settings on every file; download a ZIP, no uploads.",
  zh: "在浏览器中一次为多个 PDF 添加水印。所有文件使用同一套文字或图片设置；可下载 ZIP，无需上传。",
  es: "Añade marca de agua a muchos PDF de una vez en tu navegador. Mismo texto o imagen para todos; descarga ZIP sin subir archivos.",
  pt: "Adicione marca d'água a vários PDFs de uma vez no navegador. Mesmo texto ou imagem para todos os arquivos; baixe em ZIP, sem upload.",
  fr: "Ajoutez un filigrane à plusieurs PDF d'un coup dans votre navigateur. Même texte ou image pour chaque fichier; téléchargez un ZIP, sans envoi.",
  de: "Füge vielen PDFs gleichzeitig im Browser ein Wasserzeichen hinzu. Gleicher Text oder gleiches Bild für jede Datei; ZIP herunterladen, ohne Upload.",
  nl: "Zet in je browser in een keer een watermerk op veel PDF's. Dezelfde tekst- of afbeeldingsinstellingen voor elk bestand; download als ZIP, zonder upload.",
  it: "Aggiungi filigrana a molti PDF in una volta nel browser. Stesse impostazioni testo o immagine per ogni file; scarica ZIP, senza upload.",
  ja: "ブラウザで複数のPDFに一括で透かしを追加。すべてのファイルに同じ文字または画像設定を適用し、アップロード不要でZIPをダウンロード。",
  tr: "Tarayıcıda aynı anda birçok PDF'ye filigran ekleyin. Her dosyada aynı metin veya görsel ayarları; yükleme yok, ZIP indir.",
  az: "Brauzerdə eyni anda çoxlu PDF faylına su nişanı əlavə edin. Hər fayl üçün eyni mətn və ya şəkil ayarları; yükləmə yoxdur, ZIP endirin.",
  ko: "브라우저에서 여러 PDF에 한 번에 워터마크를 추가하세요. 모든 파일에 동일한 텍스트/이미지 설정을 적용하고 업로드 없이 ZIP으로 다운로드합니다.",
  ar: "أضف علامة مائية إلى عدة ملفات PDF دفعة واحدة داخل المتصفح. نفس إعدادات النص أو الصورة لكل ملف؛ تنزيل ZIP بدون رفع.",
  fa: "در مرورگر به صورت همزمان روی چند PDF واترمارک بگذارید. یک تنظیم متن یا تصویر برای همه فایل‌ها؛ دانلود ZIP بدون آپلود.",
  ru: "Добавляйте водяной знак сразу на много PDF в браузере. Одинаковые настройки текста или изображения для каждого файла; скачивание ZIP без загрузки.",
  he: "הוסיפו סימן מים למספר קובצי PDF בבת אחת בדפדפן. אותן הגדרות טקסט או תמונה לכל קובץ; הורדת ZIP ללא העלאה.",
  el: "Προσθέστε υδατογράφημα σε πολλά PDF ταυτόχρονα στον browser. Ίδιες ρυθμίσεις κειμένου ή εικόνας για κάθε αρχείο· λήψη ZIP χωρίς μεταφόρτωση.",
};

const PAGE_KEYWORDS = [
  "bulk pdf watermark",
  "watermark multiple pdf files",
  "batch pdf watermark tool",
  "add watermark to pdf online",
  "pdf watermark no upload",
  "bulk watermark pdf in browser",
  "watermark pdf with text",
  "watermark pdf with image",
  "zip pdf watermark output",
  "offline pdf watermark tool",
];

function getLocalizedPath(locale: AppLocale) {
  return locale === routing.defaultLocale
    ? BULK_WATERMARK_SLUG
    : `/${locale}${BULK_WATERMARK_SLUG}`;
}

export async function generateMetadata({
  params,
}: BulkPdfWatermarkPageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  const title = `${PAGE_TITLE_BY_LOCALE[safeLocale]} · ${siteConfig.name}`;
  const description = PAGE_DESCRIPTION_BY_LOCALE[safeLocale];
  const pathname = getLocalizedPath(safeLocale);
  const canonical = new URL(pathname, siteConfig.url).toString();
  const languages = Object.fromEntries(
    routing.locales.map((item) => [
      item,
      new URL(getLocalizedPath(item), siteConfig.url).toString(),
    ]),
  );
  languages["x-default"] = new URL(
    BULK_WATERMARK_SLUG,
    siteConfig.url,
  ).toString();

  return {
    title,
    description,
    keywords: PAGE_KEYWORDS,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

interface BulkPdfWatermarkPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BulkPdfWatermarkPage({
  params,
}: BulkPdfWatermarkPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <Suspense
        fallback={
          <div className="container flex flex-col gap-4 py-4">
            <div className="h-10 w-[min(520px,100%)] animate-pulse rounded-md bg-muted/40" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted/30" />
            <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/20" />
          </div>
        }
      >
        <BulkPdfWatermarkApp />
      </Suspense>
    </Shell>
  );
}
