# BiblioVOS Studio — Multi-Database Bibliometric & Science Mapping Platform

BiblioVOS Studio unifies the quantitative science mapping workflows of **R's `bibliometrix` (`Biblioshiny`)** and the interactive network clustering and density visualizations of **VOSviewer** in a single web workspace. Researchers can import, query, harmonize, and deduplicate bibliographic records from **Scopus, Web of Science, PubMed, OpenAlex, CrossRef, Dimensions, RIS, and BibTeX** into a unified master corpus before running performance analysis, science mapping, and network exploration.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core functional and visual preferences from our clarification step are incorporated below. Review the architecture and click **Proceed** to build the complete application.

- **Confirmed Decision 1 — Universal Database Ingestion & Live Search**: Support local file uploads for Scopus (CSV, BibTeX), Web of Science (Plain Text ISI tags, BibTeX), PubMed (MEDLINE/nbib, CSV), OpenAlex/CrossRef/Dimensions (CSV, JSON), and universal RIS/BibTeX formats, alongside live API querying from **OpenAlex**, **PubMed (NCBI E-utilities)**, and **CrossRef**, plus a pre-loaded multi-database sample corpus for instant exploration.
- **Confirmed Decision 2 — Smart Auto-Merge with Conflict Review Log**: Automatically canonicalize fields into standard Bibliometrix tags (`TI`, `AU`, `SO`, `PY`, `DI`, `TC`, `DE`, `ID`, `AB`, `C1`, `CR`, `DB`) and deduplicate using exact normalized DOI matching plus fuzzy Title/First-Author/Year similarity, paired with an interactive **Deduplication & Conflict Review Drawer** where users can inspect merged records, override matches, or split pairs.
- **Confirmed Decision 3 — Full VOSviewer + Bibliometrix Analytical Suite**: Include all three VOSviewer map layers (**Network**, **Overlay**, **Density**) alongside Bibliometrix modules (**Overview & Three-Field Sankey Plot**, **Bradford's & Lotka's Laws**, **H/G/M-Index & Author Production Over Time**, **Thematic Strategic Map**, **Trend Topics**, **RPYS Spectroscopy**, and **Historiograph**).
- **Confirmed Decision 4 — Academic Light Workspace with Dark-Canvas Network Stage**: Use a crisp, high-contrast academic light theme for data tables, laws, and statistical charts, with a dedicated **Dark/Light Canvas Toggle** on the VOSviewer network stage and global workspace theme support.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates the manual pain of converting and merging incompatible exports from Scopus, Web of Science, PubMed, and OpenAlex. Once merged and deduplicated, the unified dataset immediately powers interactive VOSviewer networks and Bibliometrix statistical reports without writing R scripts or switching desktop tools.
- **Target Audience / Persona**: Academic researchers, systematic review authors, scientometricians, PhD candidates, and research policy analysts conducting literature reviews and domain mapping.
- **Key Value**: Seamless end-to-end pipeline from multi-database ingestion and transparent deduplication to publication-ready network graphs, strategic thematic maps, and exportable harmonized datasets.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Multi-Database Import & Live API Query**:
   - Users land on a pre-loaded multi-database sample corpus (spanning Scopus, Web of Science, PubMed, and OpenAlex records with realistic cross-database overlap) or drop multiple export files (`.csv`, `.bib`, `.ris`, `.txt`, `.nbib`, `.json`) into the **Multi-DB Merger** workspace.
   - Alternatively, users open the **Live Database Search** panel, enter a boolean/keyword query with year bounds, fetch live records from OpenAlex, CrossRef, or PubMed, and append them directly into the active corpus.
2. **Harmonization & Deduplication Review**:
   - The ingestion pipeline parses source-specific schemas into canonical Bibliometrix tags, identifies duplicates via DOI and fuzzy title/year matching, merges complementary fields (e.g., combining Scopus citation counts, WoS cited references, and PubMed MeSH keywords), and logs every merge event.
   - Users inspect the **Conflict & Merge Review Table** to filter by confidence level (Exact DOI vs. Fuzzy Title match), compare source metadata side-by-side, and click **Keep Merged** or **Split Record**, dynamically updating all downstream analyses.
3. **VOSviewer Interactive Mapping**:
   - Users select an analysis type (*Co-occurrence of Keywords*, *Co-authorship of Authors/Countries/Organizations*, *Co-citation*, or *Bibliographic Coupling*), adjust minimum occurrence thresholds, link strength filters, and clustering resolution, and switch seamlessly between **Network Visualization**, **Overlay Visualization** (colored by average publication year or average citations), and **Density Visualization** (Gaussian kernel heatmap in Item or Cluster density mode).
   - Clicking any node isolates its ego-network, displays full node telemetry (Cluster ID, Occurrences, Total Link Strength, Avg. Pub. Year, Avg. Citations), and lists contributing publications.
4. **Bibliometrix (`Biblioshiny`) Science Mapping & Impact Analysis**:
   - **Overview & Three-Field Plot**: Inspect corpus summary metrics, annual scientific production & citation velocity curves, and an interactive **Three-Field Plot (Sankey diagram)** where users choose any Left, Middle, and Right field (e.g., `Sources` ↔ `Authors` ↔ `Author Keywords`) and node count.
   - **Performance & Laws**: Explore **Bradford's Law** (Core Zone 1 vs. Zone 2/3 source scattering), **Lotka's Law** (observed vs. theoretical inverse-square author productivity), **Author/Source Impact** ($h$-index, $g$-index, $m$-index, Total Citations), and **Top Authors' Production Over Time** (annual output + citation intensity timeline).
   - **Conceptual & Historical Structure**: Analyze Callon's **Thematic Map** (4-quadrant Centrality vs. Density strategic diagram), **Trend Topics Evolution** (keyword lifespan timelines), **RPYS (Reference Publication Year Spectroscopy)** with historical citation peaks, and the chronological **Historiograph** of direct citations.

### Visual Identity & Theme
- **Aesthetic Direction**: Precision empirical laboratory and editorial academic workbench—flat structural surfaces, 1px hairline borders, dense tabular data alignment, and zero decorative clutter.
- **Color Palette & Mood (60-30-10 Allocation)**:
  - *60% Primary Canvas*: Clinical academic alabaster (`#F8FAFC`) and pure white (`#FFFFFF`) panels in light mode; deep slate (`#0B0E17`) for the VOSviewer dark canvas option.
  - *30% Structural Surfaces & Typography*: Slate ink (`#0F172A`), muted metadata slate (`#475569`), and crisp 1px dividers (`#E2E8F0` light / `#1E293B` dark).
  - *10% Precision Accents*: Cobalt Blue (`#2563EB`) for primary interactive controls, paired with scientific color scales (Viridis, Plasma, and VOSviewer categorical cluster palettes) for network clusters and heatmaps.
- **Typography & Hierarchy**:
  - *Display & Navigation*: `Plus Jakarta Sans` (SemiBold/Bold, tight tracking) for section titles and workspace structure.
  - *Body & Academic Titles*: `Public Sans` (Regular/Medium) for high legibility across dense bibliographic titles, abstracts, and controls.
  - *Tabular Metrics & Identifiers*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` strictly enforced on all indices ($h$-index, $g$-index, $m$-index, Total Link Strength, Callon Centrality/Density, DOIs, and publication years).
- **Layout & Component Discipline**:
  - **Top Bar Contract**: Strict 3-zone header (`BiblioVOS Studio` wordmark — 5 single-line workspace navigation links: `Data Merger`, `VOSviewer Map`, `Overview & Sankey`, `Sources & Authors`, `Conceptual & RPYS` — 1 primary CTA button: `Export Unified Corpus`).
  - **Zero-Pill Metadata**: Database provenance, publication years, DOIs, and citation counts in tables and document cards render as clean unboxed inline text separated by `·` dividers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Multi-Format Parsing + Live Public REST APIs**
  - *Chosen Approach*: Parse uploaded CSV, BibTeX, RIS, WoS Plain Text, Medline, and JSON directly in the browser using a deterministic parser pipeline, combined with direct client requests to public CORS-enabled endpoints (OpenAlex, CrossRef, and NCBI E-utilities).
  - *Why*: Provides zero-latency file merging and deduplication for thousands of records without file upload size limits or external API key setup.
  - *Alternatives Considered*: Server-only R subprocess execution, which would introduce cold-start latency and fragile environment dependencies.
- **Decision 2: Dual HTML5 Canvas + SVG Rendering for VOSviewer & Bibliometrix**
  - *Chosen Approach*: Render VOSviewer Density heatmaps and force-directed/VOS clustering graphs on high-DPI HTML5 Canvas / interactive SVG layers with spatial hit-testing, pan/zoom matrix transforms, and instant PNG/SVG export.
  - *Why*: Ensures smooth 60fps pan/zoom and real-time kernel density calculation when adjusting node thresholds, link strengths, or kernel bandwidths.
- **Decision 3: Provenance-Preserving Field Harmonization**
  - *Chosen Approach*: When two or more records match across Scopus, Web of Science, PubMed, or OpenAlex, construct a composite master record that preserves the union of keywords (`DE`/`ID`), keeps the richest abstract and cited reference list (`CR`), records source-specific citation counts alongside the unified citation count, and stores the original source records in a `sources` array so any merge can be inspected or reversed in one click.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 TOP BAR (3 ZONES)                                 │
│  [BiblioVOS Studio]   [Data Merger | VOSviewer Map | Overview & Sankey |          │
│                        Sources & Authors | Conceptual & RPYS]   [Export Corpus]   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
┌───────────────────────────────────────┐       ┌───────────────────────────────────┐
│   MULTI-DB INGESTION & DEDUP ENGINE   │       │     UNIFIED BIBLIOMETRIC STORE    │
│ ┌───────────────────────────────────┐ │       │ • Canonical Records (BibItem[])   │
│ │ Format Parsers:                   │ │       │ • Merge Audit Log (MergePair[])   │
│ │ • Scopus (CSV / BibTeX)           │ │──────▶│ • Active Filters (Year, DB, Type) │
│ │ • Web of Science (ISI TXT / BIB)  │ │       │ • Computed Matrices:              │
│ │ • PubMed (MEDLINE / CSV)          │ │       │   - Co-occurrence & Co-authorship │
│ │ • OpenAlex / CrossRef / RIS / JSON│ │       │   - Coupling & Co-citation        │
│ └───────────────────────────────────┘ │       │   - Bradford / Lotka / H-G-M      │
│ ┌───────────────────────────────────┐ │       │   - Callon Thematic & RPYS Series │
│ │ Live API Connector:               │ │       └─────────────────┬─────────────────┘
│ │ • OpenAlex / CrossRef / PubMed API│ │                         │
│ └───────────────────────────────────┘ │                         │
└───────────────────────────────────────┘                         │
                                                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            ACTIVE WORKSPACE VIEWPORT                              │
├───────────────────────────┬───────────────────────────┬───────────────────────────┤
│ 1. DATA MERGER & DEDUP    │ 2. VOSVIEWER MAP STUDIO   │ 3–5. BIBLIOMETRIX SUITE   │
│ • Multi-file Dropzone     │ • Left Control Column:    │ • Main Info & Growth KPI  │
│ • Live API Search Modal   │   - Map Type & Unit       │ • Three-Field Sankey Plot │
│ • Database Overlap Matrix │   - Min Threshold Slider  │ • Bradford's & Lotka's Law│
│ • Conflict Review Table   │   - Cluster Resolution    │ • H/G/M-Index & Author    │
│   (Keep Merged / Split)   │ • Main Interactive Stage: │   Timeline Bubble Plot    │
│ • Master Corpus Explorer  │   - Network / Overlay /   │ • Callon Thematic Map     │
│   with Search & Filtering │     Density Canvas        │ • Trend Topics & RPYS     │
│                           │   - Node Inspector Drawer │ • Citation Historiograph  │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### Data Model & State
- **`BibRecord` (Canonical Bibliometrix Entity)**:
  - `id`: Unique internal ID
  - `ut`: Original database accession IDs
  - `doi`: Normalized lowercase DOI string
  - `title`: Full publication title (`TI`)
  - `authors`: Array of normalized `"Lastname, Initials"` strings (`AU`) and full names (`AF`)
  - `year`: Publication year (`PY`)
  - `source`: Journal or conference title (`SO`)
  - `citations`: Unified times cited count (`TC`)
  - `authorKeywords`: Array of author keywords (`DE`)
  - `indexKeywords`: Array of Keywords Plus / MeSH / indexed terms (`ID`)
  - `abstract`: Full text abstract (`AB`)
  - `affiliations`: Array of institutional affiliations (`C1`) and extracted `countries`
  - `references`: Array of parsed cited references (`CR`) with extracted reference publication years for RPYS and Historiograph matching
  - `docType`: Document classification (`Article`, `Review`, `Proceedings Paper`)
  - `databases`: Array of contributing databases (`['Scopus', 'Web of Science', 'PubMed', 'OpenAlex']`)
  - `mergedFrom`: Optional array of raw source snapshots if created via deduplication
- **`MergeConflictPair`**:
  - Tracks `id`, `primaryRecord`, `duplicateRecord`, `matchReason` (`'Exact DOI'` | `'Fuzzy Title + Year + Author'`), `similarityScore` (0.00–1.00), and `status` (`'merged'` | `'split'`).

### Interactive Component & State Mapping
- **Data Merger View**:
  - Dropping files or executing a Live API search triggers the format auto-detector (`detectAndParseFile`), appends raw items, runs `harmonizeAndDeduplicate()`, and updates both the **Database Overlap Summary** and **Conflict Review Table**.
  - Clicking **Split Record** or **Re-Merge** on any conflict row immediately recalculates the master corpus and updates all VOSviewer and Bibliometrix charts.
- **VOSviewer Map Studio**:
  - Changing the analysis mode (*Co-occurrence*, *Co-authorship*, *Citation*, *Bibliographic Coupling*), unit of analysis (*Keywords*, *Authors*, *Countries*, *Sources*, *Documents*), minimum occurrence threshold, or Louvain/VOS clustering resolution dynamically rebuilds the co-occurrence matrix, computes Total Link Strength (TLS) and cluster assignments, and runs the layout solver.
  - Switching between **Network**, **Overlay** (Year / Citations), and **Density** (Item / Cluster heatmap) updates the rendering layer while preserving pan/zoom coordinates and node selection.
- **Bibliometrix Views (`Overview & Sankey`, `Sources & Authors`, `Conceptual & RPYS`)**:
  - All views subscribe to the filtered master corpus (supporting global filtering by year range, source database, and keyword search).
  - Interactive controls allow switching Three-Field Plot axes (`Sources`, `Authors`, `Keywords`, `Countries`, `Affiliations`), adjusting Bradford/Lotka table sorting, toggling Thematic Map n-gram/keyword source (`Author Keywords` vs. `Index Keywords`), and scrubbing RPYS reference years to inspect landmark historical papers.
