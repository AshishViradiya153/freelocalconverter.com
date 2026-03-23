import { BlogProse } from "../post-prose";
import type { PublishedBlogPost } from "../types";

export const plannedPostsPartC: PublishedBlogPost[] = [
  {
    meta: {
      slug: "csv-viewer-file-and-row-limits",
      title: "File size, row caps, and performance in this CSV viewer",
      description:
        "What the import limits protect, how large files behave in the browser, and when to split data upstream instead of forcing one mega-export.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 7,
      keywords: [
        "csv file size limit",
        "browser csv performance",
        "large csv import",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Browser-based viewers parse files with JavaScript on your device.
            That keeps data local, but it also means{" "}
            <strong>memory and CPU</strong> set the ceiling. This app applies{" "}
            <strong>row and byte caps</strong> on import so typical sessions stay
            responsive. If you hit a cap, the honest fix is usually to split the
            extract by date, region, or entity in your warehouse or source system,
            then review each slice here.
          </p>
          <h2>What to expect</h2>
          <ul>
            <li>
              Very wide files cost more than very tall ones because every visible
              column participates in layout work.
            </li>
            <li>
              Pagination in the grid reduces how many rows the UI treats as active
              at once, which helps scrolling and editing stay smooth.
            </li>
            <li>
              Closing other heavy tabs and using an up-to-date browser improves
              stability on large sessions.
            </li>
          </ul>
          <p>
            Check the in-app hints and import errors when a file is rejected. They
            describe the constraint so you can adjust the export, not guess.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-local-storage-and-clearing-data",
      title: "Where your edits live: browser storage, resume, and Clear",
      description:
        "How this viewer can restore your session after a refresh, why that matters for long cleanup tasks, and how Clear removes data from this device.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "csv viewer local storage",
        "clear browser data",
        "session restore csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            When you load a CSV and edit it, the product can{" "}
            <strong>persist your session</strong> in browser storage so a
            refresh or accidental tab close does not erase hours of fixes. That
            behavior is convenient on a trusted personal machine and should be
            understood on <strong>shared computers</strong>.
          </p>
          <h2>Clear when you are done</h2>
          <ul>
            <li>
              Use <strong>Clear</strong> in the app when you finish on a laptop
              you do not fully control.
            </li>
            <li>
              Clearing removes the saved session for this site in this browser
              profile. It does not erase copies you already downloaded or emailed.
            </li>
            <li>
              Pair this habit with your org policy on PII and regulated exports.
            </li>
          </ul>
          <p>
            Read the Privacy page for how processing relates to your browser, and
            treat local persistence as a feature to manage, not a silent backup of
            record.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-reorder-rows-and-columns",
      title: "Reordering rows and columns before you export",
      description:
        "Drag handles for row order, column reorder for review, and how export order follows what you see in the grid.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "reorder csv columns",
        "drag rows spreadsheet",
        "csv column order export",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Humans often need a different column order than the upstream system
            emitted. You can <strong>reorder columns</strong> for review, then
            download a CSV that reflects the new left-to-right order. Row
            reordering helps when you are preparing a narrative handoff, even if
            the downstream database will resort by keys later.
          </p>
          <h2>Contracts and caution</h2>
          <ul>
            <li>
              Pipelines that map columns <strong>by position</strong> break if you
              change order before load. Prefer name-based loaders when possible.
            </li>
            <li>
              Row order rarely matters to SQL imports, but it can matter for human
              reviewers reading the file top to bottom.
            </li>
            <li>
              Undo and redo apply to many edits, so exploratory reordering stays
              reversible until you are satisfied.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-column-row-menus-and-bulk-actions",
      title: "Column and row menus: insert, delete, copy, paste, and clear",
      description:
        "Context actions for columns and rows, bulk selection, and how clipboard workflows compare to desktop spreadsheets.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 7,
      keywords: [
        "csv insert column",
        "delete rows csv",
        "paste tsv into grid",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Tabular cleanup is not only cell typing. This viewer exposes{" "}
            <strong>column</strong> and <strong>row</strong> menus for insert,
            rename, cut, paste, delete, and clear patterns you would expect in a
            light spreadsheet. Selection across rows pairs with bulk copy, cut,
            delete, or clear when you need to fix a whole cohort.
          </p>
          <h2>Clipboard reality</h2>
          <ul>
            <li>
              Pasting from Excel or Sheets usually arrives as tab-separated
              values. The grid maps tabs into adjacent cells and can grow the table
              when the paste is larger than the selection.
            </li>
            <li>
              Huge clipboard payloads can hit browser limits. Chunk pastes when
              the OS stalls.
            </li>
            <li>
              After aggressive bulk edits, scroll the head and tail of the file
              to confirm shape before export.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-filters-sort-and-view-options",
      title: "Filters, sort, row height, and column visibility in the toolbar",
      description:
        "Using the filter and sort menus, tuning row height for dense review, and hiding columns without deleting data.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "filter csv columns",
        "hide columns csv",
        "data grid row height",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            The toolbar groups the same primitives analysts use daily:{" "}
            <strong>sort</strong> from headers, <strong>filters</strong> for
            subsetting, <strong>row height</strong> for readability on dense files,
            and <strong>view options</strong> to show or hide columns without
            changing the underlying row values until you export.
          </p>
          <h2>Workflow tips</h2>
          <ul>
            <li>
              Sort on a stable key before you spot-check duplicates or sequences.
            </li>
            <li>
              Combine filters when validating joins you already modeled in SQL.
            </li>
            <li>
              Raise row height for demos; compress it when you need more rows on
              screen at once.
            </li>
          </ul>
          <p>
            Remember that search and pagination interact: if you need exhaustive
            literal search, widen page size or clear filters first.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-keyboard-shortcuts-and-focus",
      title: "Keyboard navigation, editing, and undo in the grid",
      description:
        "Moving focus cell to cell, committing edits, search shortcuts, and undo or redo after mistakes.",
      publishedAt: "2025-03-20",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "csv grid keyboard",
        "undo redo table",
        "spreadsheet shortcuts browser",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Power users should open the in-app <strong>keyboard shortcuts</strong>{" "}
            panel. It lists navigation, selection, copy and paste, search, row
            add, delete, and undo or redo chords supported in this build. Focus
            management follows grid semantics so screen readers and keyboard-only
            paths stay coherent.
          </p>
          <h2>Habits that prevent mistakes</h2>
          <ul>
            <li>
              Commit or cancel edits with the same keys you use in spreadsheets
              so muscle memory transfers.
            </li>
            <li>
              After a large paste, hit <strong>undo</strong> once to confirm the
              stack captured the change before doing more work.
            </li>
            <li>
              When search is open, shortcut behavior may prioritize the search
              field. Close search to return focus to the grid for navigation.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
];
