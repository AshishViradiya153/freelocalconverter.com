export interface ServiceLink {
  href: string;
  label: string;
  description: string;
}

export interface ServiceGroup {
  id: string;
  title: string;
  description: string;
  links: ServiceLink[];
}

interface ServiceTranslations {
  nav: (key: string) => string;
  services: (key: string) => string;
}

export function getServiceGroups({
  nav,
  services,
}: ServiceTranslations): ServiceGroup[] {
  return [
    {
      id: "converters",
      title: services("groupConvertersTitle"),
      description: services("groupConvertersDescription"),
      links: [
        {
          href: "/csv-to-json",
          label: nav("csvToJson"),
          description: services("csvToJsonDesc"),
        },
        {
          href: "/json-to-csv",
          label: nav("jsonToCsv"),
          description: services("jsonToCsvDesc"),
        },
        {
          href: "/csv-to-parquet",
          label: nav("csvToParquet"),
          description: services("csvToParquetDesc"),
        },
        {
          href: "/parquet-to-csv",
          label: nav("parquetToCsv"),
          description: services("parquetToCsvDesc"),
        },
        {
          href: "/json-to-parquet",
          label: nav("jsonToParquet"),
          description: services("jsonToParquetDesc"),
        },
        {
          href: "/parquet-to-json",
          label: nav("parquetToJson"),
          description: services("parquetToJsonDesc"),
        },
        {
          href: "/csv-to-markdown-table",
          label: nav("csvToMarkdownTable"),
          description: services("csvToMarkdownTableDesc"),
        },
        {
          href: "/csv-to-sql",
          label: nav("csvToSql"),
          description: services("csvToSqlDesc"),
        },
        {
          href: "/json-yaml-converter",
          label: services("jsonYamlConverterLabel"),
          description: services("jsonYamlConverterDesc"),
        },
        {
          href: "/markdown-html-converter",
          label: services("markdownHtmlConverterLabel"),
          description: services("markdownHtmlConverterDesc"),
        },
        {
          href: "/markdown-to-epub",
          label: services("markdownToEpubLabel"),
          description: services("markdownToEpubDesc"),
        },
        {
          href: "/html-to-text-email",
          label: services("htmlToTextEmailLabel"),
          description: services("htmlToTextEmailDesc"),
        },
        {
          href: "/base64-converter",
          label: services("base64ConverterLabel"),
          description: services("base64ConverterDesc"),
        },
        {
          href: "/unix-timestamp-converter",
          label: services("unixTimestampConverterLabel"),
          description: services("unixTimestampConverterDesc"),
        },
        {
          href: "/curl-converter",
          label: services("curlConverterLabel"),
          description: services("curlConverterDesc"),
        },
        {
          href: "/fetch-converter",
          label: services("fetchConverterLabel"),
          description: services("fetchConverterDesc"),
        },
        {
          href: "/axios-converter",
          label: services("axiosConverterLabel"),
          description: services("axiosConverterDesc"),
        },
        {
          href: "/python-requests-converter",
          label: services("pythonRequestsConverterLabel"),
          description: services("pythonRequestsConverterDesc"),
        },
      ],
    },
    {
      id: "viewers",
      title: services("groupViewersTitle"),
      description: services("groupViewersDescription"),
      links: [
        {
          href: "/csv-viewer",
          label: services("csvViewerLabel"),
          description: services("csvViewerDesc"),
        },
        {
          href: "/compare",
          label: services("csvCompareLabel"),
          description: services("csvCompareDesc"),
        },
        {
          href: "/xls-viewer",
          label: nav("xlsViewer"),
          description: services("xlsViewerDesc"),
        },
        {
          href: "/parquet-viewer",
          label: nav("parquetViewer"),
          description: services("parquetViewerDesc"),
        },
        {
          href: "/jwt-decoder",
          label: services("jwtDecoderLabel"),
          description: services("jwtDecoderDesc"),
        },
        {
          href: "/openapi-viewer",
          label: services("openapiViewerLabel"),
          description: services("openapiViewerDesc"),
        },
        {
          href: "/graphql-tools",
          label: services("graphqlToolsLabel"),
          description: services("graphqlToolsDesc"),
        },
        {
          href: "/webhook-viewer",
          label: services("webhookViewerLabel"),
          description: services("webhookViewerDesc"),
        },
        {
          href: "/regex-tester",
          label: services("regexTesterLabel"),
          description: services("regexTesterDesc"),
        },
      ],
    },
    {
      id: "excel",
      title: services("groupExcelTitle"),
      description: services("groupExcelDescription"),
      links: [
        {
          href: "/csv-to-excel",
          label: nav("csvToExcel"),
          description: services("csvToExcelDesc"),
        },
        {
          href: "/xls-to-csv",
          label: nav("xlsToCsv"),
          description: services("xlsToCsvDesc"),
        },
        {
          href: "/json-to-excel",
          label: nav("jsonToExcel"),
          description: services("jsonToExcelDesc"),
        },
      ],
    },
    {
      id: "developer",
      title: services("groupDeveloperTitle"),
      description: services("groupDeveloperDescription"),
      links: [
        {
          href: "/json-formatter",
          label: services("jsonFormatterLabel"),
          description: services("jsonFormatterDesc"),
        },
        {
          href: "/sql-formatter",
          label: services("sqlFormatterLabel"),
          description: services("sqlFormatterDesc"),
        },
        {
          href: "/cron-parser",
          label: services("cronParserLabel"),
          description: services("cronParserDesc"),
        },
        {
          href: "/uuid-generator",
          label: services("uuidGeneratorLabel"),
          description: services("uuidGeneratorDesc"),
        },
        {
          href: "/http-explainer",
          label: services("httpExplainerLabel"),
          description: services("httpExplainerDesc"),
        },
      ],
    },
    {
      id: "pdf",
      title: services("groupPdfTitle"),
      description: services("groupPdfDescription"),
      links: [
        {
          href: "/pdf-to-word",
          label: services("pdfToWordLabel"),
          description: services("pdfToWordDesc"),
        },
        {
          href: "/split-pdf",
          label: services("splitPdfLabel"),
          description: services("splitPdfDesc"),
        },
        {
          href: "/reorder-pdf",
          label: services("reorderPdfLabel"),
          description: services("reorderPdfDesc"),
        },
        {
          href: "/merge-pdf",
          label: services("mergePdfLabel"),
          description: services("mergePdfDesc"),
        },
        {
          href: "/pdf-to-image",
          label: services("pdfToImageLabel"),
          description: services("pdfToImageDesc"),
        },
        {
          href: "/images-to-pdf",
          label: services("imagesToPdfLabel"),
          description: services("imagesToPdfDesc"),
        },
        {
          href: "/pdf-watermark",
          label: services("pdfWatermarkLabel"),
          description: services("pdfWatermarkDesc"),
        },
        {
          href: "/bulk-pdf-watermark",
          label: services("bulkPdfWatermarkLabel"),
          description: services("bulkPdfWatermarkDesc"),
        },
      ],
    },
    {
      id: "video",
      title: services("groupVideoTitle"),
      description: services("groupVideoDescription"),
      links: [
        {
          href: "/video-compress",
          label: services("videoCompressorLabel"),
          description: services("videoCompressorDesc"),
        },
        {
          href: "/audio-convert",
          label: services("audioConverterLabel"),
          description: services("audioConverterDesc"),
        },
        {
          href: "/srt-to-vtt",
          label: services("subtitleConverterLabel"),
          description: services("subtitleConverterDesc"),
        },
      ],
    },
    {
      id: "image",
      title: services("groupImageTitle"),
      description: services("groupImageDescription"),
      links: [
        {
          href: "/image-compress",
          label: services("imageCompressorLabel"),
          description: services("imageCompressorDesc"),
        },
        {
          href: "/image-convert",
          label: services("imageConverterLabel"),
          description: services("imageConverterDesc"),
        },
        {
          href: "/image-resize",
          label: services("imageResizeLabel"),
          description: services("imageResizeDesc"),
        },
        {
          href: "/favicon-generator",
          label: services("faviconGeneratorLabel"),
          description: services("faviconGeneratorDesc"),
        },
        {
          href: "/heic-to-jpg",
          label: services("heicToJpgLabel"),
          description: services("heicToJpgDesc"),
        },
        {
          href: "/gif-tools",
          label: services("gifToolsLabel"),
          description: services("gifToolsDesc"),
        },
        {
          href: "/image-base64",
          label: services("imageBase64Label"),
          description: services("imageBase64Desc"),
        },
        {
          href: "/svg-to-png",
          label: services("svgToPngLabel"),
          description: services("svgToPngDesc"),
        },
        {
          href: "/open-graph-preview",
          label: services("ogPreviewLabel"),
          description: services("ogPreviewDesc"),
        },
      ],
    },
    {
      id: "color",
      title: services("groupColorTitle"),
      description: services("groupColorDescription"),
      links: [
        {
          href: "/palettes/trending",
          label: services("colorPaletteGeneratorLabel"),
          description: services("colorPaletteGeneratorDesc"),
        },
        {
          href: "/gradients",
          label: services("gradientGeneratorLabel"),
          description: services("gradientGeneratorDesc"),
        },
        {
          href: "/gradient-generator",
          label: services("meshGradientGeneratorLabel"),
          description: services("meshGradientGeneratorDesc"),
        },
        {
          href: "/gradient-generator/trending",
          label: services("trendingMeshGradientsLabel"),
          description: services("trendingMeshGradientsDesc"),
        },
        {
          href: "/palettes/best",
          label: services("trendingPalettesLabel"),
          description: services("trendingPalettesDesc"),
        },
        {
          href: "/gradients/best",
          label: services("trendingGradientsLabel"),
          description: services("trendingGradientsDesc"),
        },
      ],
    },
  ];
}
