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

export const serviceGroups: ServiceGroup[] = [
  {
    title: "Converters",
    description: "Convert between CSV, JSON, and Parquet instantly.",
    links: [
      { href: "/csv-to-json", label: "CSV to JSON", description: "Convert CSV files to JSON." },
      { href: "/json-to-csv", label: "JSON to CSV", description: "Convert JSON to CSV format." },
      {
        href: "/csv-to-parquet",
        label: "CSV to Parquet",
        description: "Turn CSV data into Parquet files.",
      },
      {
        href: "/parquet-to-csv",
        label: "Parquet to CSV",
        description: "Convert Parquet files back to CSV.",
      },
      {
        href: "/json-to-parquet",
        label: "JSON to Parquet",
        description: "Create Parquet from JSON data.",
      },
      {
        href: "/parquet-to-json",
        label: "Parquet to JSON",
        description: "Convert Parquet into JSON.",
      },
      {
        href: "/csv-to-markdown-table",
        label: "CSV to Markdown Table",
        description: "Generate markdown tables from CSV files.",
      },
    ],
  },
  {
    title: "Viewers",
    description: "Preview and inspect files in your browser.",
    links: [
      { href: "/", label: "CSV Viewer", description: "Open and inspect CSV data quickly." },
      { href: "/compare", label: "CSV Compare", description: "Compare two CSV files side by side." },
      { href: "/xls-viewer", label: "XLS Viewer", description: "View Excel XLS files directly." },
      {
        href: "/parquet-viewer",
        label: "Parquet Viewer",
        description: "Open and browse Parquet files.",
      },
    ],
  },
  {
    title: "Excel",
    description: "Import and export between CSV, JSON, and Excel.",
    links: [
      { href: "/", label: "CSV Viewer", description: "Open and inspect CSV data quickly." },
      { href: "/compare", label: "CSV Compare", description: "Compare two CSV files side by side." },
      {
        href: "/xls-to-csv",
        label: "CSV Converter",
        description: "Convert Excel spreadsheets into CSV files quickly.",
      },
      { href: "/csv-to-excel", label: "CSV to Excel", description: "Convert CSV to XLSX files." },
      { href: "/xls-to-csv", label: "XLS to CSV", description: "Turn Excel sheets into CSV." },
      { href: "/json-to-excel", label: "JSON to Excel", description: "Convert JSON into XLSX." },
    ],
  },
  {
    title: "Developer",
    description: "API and text utilities for everyday web development.",
    links: [
      {
        href: "/json-formatter",
        label: "JSON Formatter",
        description: "Format, minify, and validate JSON locally.",
      },
      {
        href: "/curl-converter",
        label: "cURL Converter",
        description: "Convert cURL request snippets to fetch/axios/Python.",
      },
      {
        href: "/fetch-converter",
        label: "Fetch Converter",
        description: "Convert fetch snippets to cURL/axios/Python.",
      },
      {
        href: "/axios-converter",
        label: "Axios Converter",
        description: "Convert axios snippets to cURL/fetch/Python.",
      },
      {
        href: "/python-requests-converter",
        label: "Python Requests Converter",
        description: "Convert Python requests snippets to cURL/fetch/axios.",
      },
      {
        href: "/http-explainer",
        label: "HTTP Explainer",
        description: "Explain status codes and common HTTP headers.",
      },
      {
        href: "/openapi-viewer",
        label: "OpenAPI Viewer",
        description: "Load OpenAPI specs and browse endpoints.",
      },
      {
        href: "/graphql-tools",
        label: "GraphQL Tools",
        description: "Format queries and inspect schema types.",
      },
      {
        href: "/webhook-viewer",
        label: "Webhook Viewer",
        description: "Pretty-print payloads and search JSONPath.",
      },
    ],
  },
  {
    title: "PDF",
    description: "PDF tools: convert, split, merge, and watermark locally.",
    links: [
      { href: "/pdf-to-word", label: "PDF to Word", description: "Convert PDFs to DOCX files." },
      { href: "/split-pdf", label: "Split PDF", description: "Split PDF files by page or range." },
      {
        href: "/reorder-pdf",
        label: "Reorder PDF Pages",
        description: "Reorder or remove pages, then save a new PDF.",
      },
      { href: "/merge-pdf", label: "Merge PDF", description: "Combine multiple PDFs into one." },
      {
        href: "/pdf-to-image",
        label: "PDF to Image",
        description: "Export PDF pages to PNG/JPG/WebP.",
      },
      {
        href: "/images-to-pdf",
        label: "Images to PDF",
        description: "Combine images into a single PDF.",
      },
      {
        href: "/pdf-watermark",
        label: "PDF Watermark",
        description: "Add text or image watermarks to PDFs.",
      },
      {
        href: "/bulk-pdf-watermark",
        label: "Bulk PDF Watermark",
        description: "Apply one watermark to many PDFs and download ZIP.",
      },
    ],
  },
  {
    title: "Video",
    description: "Video tools: optimize media directly in the browser.",
    links: [
      {
        href: "/video-compress",
        label: "Video Compressor",
        description: "Compress videos locally with bulk uploads.",
      },
    ],
  },
  {
    title: "Image",
    description: "Image tools: compress, convert, and resize locally.",
    links: [
      {
        href: "/image-compress",
        label: "Image Compressor",
        description: "Compress images locally in bulk.",
      },
      {
        href: "/image-convert",
        label: "Image Converter",
        description: "Convert to WebP, AVIF, JPG, or PNG.",
      },
      {
        href: "/image-resize",
        label: "Resize/Crop + Convert",
        description: "Resize, crop, convert, and rename images in bulk.",
      },
      {
        href: "/heic-to-jpg",
        label: "HEIC to JPG/PNG",
        description: "Convert HEIC/HEIF photos to JPG or PNG.",
      },
    ],
  },
  {
    title: "Color",
    description: "Color tools: generators and trending galleries.",
    links: [
      {
        href: "/palettes/trending",
        label: "Color Palette Generator",
        description: "Generate palettes and export PNG/JSON.",
      },
      {
        href: "/gradients",
        label: "Gradient Generator",
        description: "Create gradients and export PNG/JSON.",
      },
      {
        href: "/palettes/best",
        label: "Trending Palettes",
        description: "Browse curated color palettes.",
      },
      {
        href: "/gradients/best",
        label: "Trending Gradients",
        description: "Browse curated gradients.",
      },
    ],
  },
];
