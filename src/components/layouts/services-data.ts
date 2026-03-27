export interface ServiceLink {
  href: string;
  label: string;
  description: string;
}

export interface ServiceGroup {
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
      ],
    },
    {
      title: services("groupViewersTitle"),
      description: services("groupViewersDescription"),
      links: [
        {
          href: "/",
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
      ],
    },
    {
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
      title: services("groupDeveloperTitle"),
      description: services("groupDeveloperDescription"),
      links: [
        {
          href: "/json-formatter",
          label: services("jsonFormatterLabel"),
          description: services("jsonFormatterDesc"),
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
        {
          href: "/http-explainer",
          label: services("httpExplainerLabel"),
          description: services("httpExplainerDesc"),
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
      ],
    },
    {
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
      title: services("groupVideoTitle"),
      description: services("groupVideoDescription"),
      links: [
        {
          href: "/video-compress",
          label: services("videoCompressorLabel"),
          description: services("videoCompressorDesc"),
        },
      ],
    },
    {
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
          href: "/heic-to-jpg",
          label: services("heicToJpgLabel"),
          description: services("heicToJpgDesc"),
        },
      ],
    },
    {
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
