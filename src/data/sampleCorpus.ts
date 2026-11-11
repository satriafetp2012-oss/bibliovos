import { BibRecord } from '../types/bibliometrics';

/**
 * Rich, realistic multi-database bibliographic dataset covering
 * AI in Clinical Medicine, Scientometrics & Knowledge Graphs (2017–2026).
 * Includes intentional cross-database duplicate records across Scopus, Web of Science,
 * PubMed, OpenAlex, CrossRef, and Dimensions so the deduplication engine and
 * conflict review log work out-of-the-box.
 */
export const INITIAL_RAW_RECORDS: BibRecord[] = [
  // 1. Foundational Bibliometrix paper (Scopus version)
  {
    id: 'raw-scopus-1',
    ut: 'SCOPUS:2-s2.0-85030129381',
    doi: '10.1016/j.joi.2017.08.007',
    title: 'bibliometrix: An R-tool for comprehensive science mapping analysis',
    authors: ['Aria, M.', 'Cuccurullo, C.'],
    authorFullNames: ['Aria, Massimo', 'Cuccurullo, Corrado'],
    year: 2017,
    source: 'Journal of Informetrics',
    citations: 4820,
    authorKeywords: ['bibliometrics', 'science mapping', 'co-citation analysis', 'bibliographic coupling', 'r package'],
    indexKeywords: ['data visualization', 'scientific literature', 'citation network', 'open source software'],
    abstract: 'The use of bibliometrics is gradually extending to all disciplines. It is particularly suitable for science mapping at a time when the emphasis on empirical contributions is producing voluminous, fragmented, and controversial research streams. We present bibliometrix, an open-source R-tool for quantitative research in scientometrics and bibliometrics.',
    affiliations: ['University of Naples Federico II, Italy', 'University of Campania Luigi Vanvitelli, Italy'],
    countries: ['Italy'],
    references: [
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Cobo MJ, 2011, J AM SOC INF SCI TEC, V62, P1382, DOI 10.1002/asi.21525',
      'Small H, 1973, J AM SOC INFORM SCI, V24, P265',
      'Callon M, 1991, SCIENTOMETRICS, V22, P155',
      'Bradford SC, 1934, ENGINEERING, V137, P85',
      'Lotka AJ, 1926, J WASH ACAD SCI, V16, P317'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },
  // 1b. Duplicate in Web of Science (Exact DOI match, richer CR & slightly different author format)
  {
    id: 'raw-wos-1',
    ut: 'WOS:000414921000004',
    doi: '10.1016/j.joi.2017.08.007',
    title: 'bibliometrix: An R-tool for comprehensive science mapping analysis',
    authors: ['Aria, M', 'Cuccurullo, C'],
    authorFullNames: ['Aria, Massimo', 'Cuccurullo, Corrado'],
    year: 2017,
    source: 'JOURNAL OF INFORMETRICS',
    citations: 4610,
    authorKeywords: ['bibliometrics', 'science mapping', 'thematic map', 'workflow'],
    indexKeywords: ['citation analysis', 'co-word analysis', 'intellectual structure', 'historiograph'],
    abstract: 'The use of bibliometrics is gradually extending to all disciplines. We present bibliometrix, an open-source tool in R for executing comprehensive science mapping analysis.',
    affiliations: ['Univ Naples Federico II, Dept Econ & Stat, Naples, Italy'],
    countries: ['Italy'],
    references: [
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Hirsch JE, 2005, P NATL ACAD SCI USA, V102, P16569, DOI 10.1073/pnas.0507655102',
      'Egghe L, 2006, SCIENTOMETRICS, V69, P131'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 2. VOSviewer methodology paper
  {
    id: 'raw-wos-2',
    ut: 'WOS:000391204000012',
    doi: '10.1007/s11192-016-2225-6',
    title: 'Citation-based clustering of publications using CitNetExplorer and VOSviewer',
    authors: ['Van Eck, N.J.', 'Waltman, L.'],
    authorFullNames: ['Van Eck, Nees Jan', 'Waltman, Ludo'],
    year: 2017,
    source: 'Scientometrics',
    citations: 1940,
    authorKeywords: ['vosviewer', 'citnetexplorer', 'citation network', 'clustering', 'science mapping'],
    indexKeywords: ['modularity clustering', 'network visualization', 'bibliometrics', 'overlay visualization'],
    abstract: 'Clustering scientific publications in an entire field of science based on direct citation relations allows deep exploration of research topics. We demonstrate how CitNetExplorer and VOSviewer work together to cluster and visualize large citation networks.',
    affiliations: ['Leiden University, CWTS, Netherlands'],
    countries: ['Netherlands'],
    references: [
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Waltman L, 2010, J INFORMETR, V4, P629',
      'Newman MEJ, 2004, PHYS REV E, V69, P026113'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },
  // 2b. Duplicate in OpenAlex (Fuzzy title + year match, missing DOI in export)
  {
    id: 'raw-openalex-2',
    ut: 'OA:W2560192831',
    doi: '',
    title: 'Citation-based clustering of publications using CitNetExplorer and VOSviewer.',
    authors: ['Van Eck, N.J.', 'Waltman, L.'],
    authorFullNames: ['Nees Jan van Eck', 'Ludo Waltman'],
    year: 2017,
    source: 'Scientometrics',
    citations: 2015,
    authorKeywords: ['vosviewer', 'clustering', 'density visualization', 'open science'],
    indexKeywords: ['bibliographic coupling', 'co-citation analysis'],
    abstract: 'Clustering scientific publications in an entire field of science based on direct citation relations allows deep exploration of research topics.',
    affiliations: ['Centre for Science and Technology Studies, Leiden University, Netherlands'],
    countries: ['Netherlands'],
    references: [
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Small H, 1973, J AM SOC INFORM SCI, V24, P265'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },

  // 3. Multi-database merging methodology
  {
    id: 'raw-scopus-3',
    ut: 'SCOPUS:2-s2.0-85078912345',
    doi: '10.1016/j.SCIE.2020.102341',
    title: 'Web of Science, Scopus and Google Scholar: A multi-database comparison and harmonization protocol',
    authors: ['Martín-Martín, A.', 'Thelwall, M.', 'Orduna-Malea, E.', 'Delgado López-Cózar, E.'],
    authorFullNames: ['Martín-Martín, Alberto', 'Thelwall, Mike', 'Orduna-Malea, Enrique', 'Delgado López-Cózar, Emilio'],
    year: 2021,
    source: 'Scientometrics',
    citations: 1680,
    authorKeywords: ['database coverage', 'scopus', 'web of science', 'citation analysis', 'data harmonization'],
    indexKeywords: ['bibliometrics', 'deduplication', 'metadata quality', 'open citations'],
    abstract: 'Combining bibliographic records across Web of Science, Scopus, PubMed, and OpenAlex requires rigorous field harmonization and duplicate resolution. This study evaluates coverage overlap and systematic citation differentials across 252 subject categories.',
    affiliations: ['University of Granada, Spain', 'University of Wolverhampton, United Kingdom', 'Universitat Politècnica de València, Spain'],
    countries: ['Spain', 'United Kingdom'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Mongeon P, 2016, SCIENTOMETRICS, V106, P213',
      'Harzing AW, 2016, SCIENTOMETRICS, V108, P787',
      'Waltman L, 2016, J INFORMETR, V10, P365'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },
  // 3b. Duplicate in CrossRef
  {
    id: 'raw-crossref-3',
    ut: 'CR:10.1016/j.scie.2020.102341',
    doi: '10.1016/j.scie.2020.102341',
    title: 'Web of Science, Scopus and Google Scholar: A multi-database comparison and harmonization protocol',
    authors: ['Martín-Martín, A.', 'Thelwall, M.', 'Orduna-Malea, E.', 'Delgado López-Cózar, E.'],
    authorFullNames: ['Alberto Martín-Martín', 'Mike Thelwall', 'Enrique Orduna-Malea', 'Emilio Delgado López-Cózar'],
    year: 2021,
    source: 'Scientometrics',
    citations: 1710,
    authorKeywords: ['database coverage', 'crossref', 'openalex', 'data harmonization'],
    indexKeywords: ['metadata standardization', 'doi matching'],
    abstract: '',
    affiliations: ['University of Granada, Spain', 'University of Wolverhampton, United Kingdom'],
    countries: ['Spain', 'United Kingdom'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007'
    ],
    docType: 'Article',
    databases: ['CrossRef']
  },

  // 4. OpenAlex infrastructure paper
  {
    id: 'raw-openalex-4',
    ut: 'OA:W4280519283',
    doi: '10.48550/arXiv.2205.01833',
    title: 'OpenAlex: A fully-open index of scholarly works, authors, venues, institutions, and concepts',
    authors: ['Priem, J.', 'Piwowar, H.', 'Orr, R.'],
    authorFullNames: ['Priem, Jason', 'Piwowar, Heather', 'Orr, Richard'],
    year: 2022,
    source: 'Quantitative Science Studies',
    citations: 980,
    authorKeywords: ['openalex', 'open science', 'knowledge graph', 'bibliometrics', 'citation network'],
    indexKeywords: ['scholarly metadata', 'data harmonization', 'api integration', 'research evaluation'],
    abstract: 'OpenAlex is a fully open catalog of the global research system, replacing Microsoft Academic Graph and indexing over 240 million works with rich concept tagging, institutional affiliations, and citation graphs.',
    affiliations: ['OurResearch, United States', 'Simon Fraser University, Canada'],
    countries: ['United States', 'Canada'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6',
      'Martín-Martín A, 2021, SCIENTOMETRICS, V126, P871, DOI 10.1016/j.SCIE.2020.102341',
      'Sinha A, 2015, WWW CONF, P243'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },

  // 5. Clinical AI & Multimodal Foundation Models (PubMed + Scopus duplicate)
  {
    id: 'raw-pubmed-5',
    ut: 'PMID:37046091',
    doi: '10.1038/s41586-023-05881-4',
    title: 'Foundation models for generalist medical artificial intelligence',
    authors: ['Moor, M.', 'Banerjee, O.', 'Abad, Z.S.H.', 'Krumholz, H.M.', 'Leskovec, J.', 'Topol, E.J.', 'Rajpurkar, P.'],
    authorFullNames: ['Moor, Michael', 'Banerjee, Oishi', 'Abad, Zahra Shakeri Hossein', 'Krumholz, Harlan M.', 'Leskovec, Jure', 'Topol, Eric J.', 'Rajpurkar, Pranav'],
    year: 2023,
    source: 'Nature',
    citations: 1420,
    authorKeywords: ['foundation models', 'clinical decision support', 'multimodal learning', 'large language models', 'medical ai'],
    indexKeywords: ['deep learning', 'electronic health records', 'diagnostic imaging', 'natural language processing'],
    abstract: 'Generalist medical AI (GMAI) models trained on massive multimodal clinical datasets—including imaging, electronic health records, genomics, and medical text—enable flexible zero-shot clinical reasoning and bedside decision support.',
    affiliations: ['Stanford University, United States', 'Harvard Medical School, United States', 'Yale School of Medicine, United States', 'Scripps Research Translational Institute, United States'],
    countries: ['United States'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Esteva A, 2017, NATURE, V542, P115',
      'Vaswani A, 2017, ADV NEURAL INF PROC, V30, P5998',
      'jumper J, 2021, NATURE, V596, P583'
    ],
    docType: 'Review',
    databases: ['PubMed']
  },
  {
    id: 'raw-scopus-5',
    ut: 'SCOPUS:2-s2.0-85152391021',
    doi: '10.1038/s41586-023-05881-4',
    title: 'Foundation models for generalist medical artificial intelligence',
    authors: ['Moor, M.', 'Banerjee, O.', 'Abad, Z.S.H.', 'Krumholz, H.M.', 'Leskovec, J.', 'Topol, E.J.', 'Rajpurkar, P.'],
    authorFullNames: ['Moor, Michael', 'Banerjee, Oishi', 'Abad, Zahra S.H.', 'Krumholz, Harlan M.', 'Leskovec, Jure', 'Topol, Eric J.', 'Rajpurkar, Pranav'],
    year: 2023,
    source: 'Nature',
    citations: 1495,
    authorKeywords: ['foundation models', 'generalist medical ai', 'multimodal learning', 'large language models'],
    indexKeywords: ['artificial intelligence', 'precision medicine', 'clinical workflow', 'explainable ai'],
    abstract: 'Generalist medical AI (GMAI) models trained on massive multimodal clinical datasets enable flexible zero-shot clinical reasoning and bedside decision support.',
    affiliations: ['Stanford University, United States', 'Harvard Medical School, United States'],
    countries: ['United States'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007'
    ],
    docType: 'Review',
    databases: ['Scopus']
  },

  // 6. High-performance medicine (PubMed + WoS duplicate)
  {
    id: 'raw-pubmed-6',
    ut: 'PMID:30617339',
    doi: '10.1038/s41591-018-0300-7',
    title: 'High-performance medicine: the convergence of human and artificial intelligence',
    authors: ['Topol, E.J.'],
    authorFullNames: ['Topol, Eric J.'],
    year: 2019,
    source: 'Nature Medicine',
    citations: 3890,
    authorKeywords: ['artificial intelligence', 'deep learning', 'clinical decision support', 'precision medicine', 'digital health'],
    indexKeywords: ['diagnostic imaging', 'electronic health records', 'machine learning', 'patient care'],
    abstract: 'The use of artificial intelligence, and the deep-learning subtype in particular, has been enabled by the use of labeled big data along with markedly enhanced computing power and cloud storage across all medical specialties.',
    affiliations: ['Scripps Research Translational Institute, La Jolla, United States'],
    countries: ['United States'],
    references: [
      'Esteva A, 2017, NATURE, V542, P115',
      'Gulshan V, 2016, JAMA, V316, P2402',
      'LeCun Y, 2015, NATURE, V521, P436',
      'Obermeyer Z, 2016, NEW ENGL J MED, V375, P1216'
    ],
    docType: 'Review',
    databases: ['PubMed']
  },
  {
    id: 'raw-wos-6',
    ut: 'WOS:000455129000011',
    doi: '10.1038/s41591-018-0300-7',
    title: 'High-performance medicine: the convergence of human and artificial intelligence',
    authors: ['Topol, EJ'],
    authorFullNames: ['Topol, Eric J.'],
    year: 2019,
    source: 'NATURE MEDICINE',
    citations: 3740,
    authorKeywords: ['artificial intelligence', 'deep learning', 'radiology', 'pathology'],
    indexKeywords: ['neural networks', 'health policy', 'clinical validation'],
    abstract: 'The convergence of human clinicians and artificial intelligence promises to transform diagnostic accuracy, workflow efficiency, and patient autonomy.',
    affiliations: ['Scripps Res Transl Inst, La Jolla, CA, USA'],
    countries: ['United States'],
    references: [
      'Esteva A, 2017, NATURE, V542, P115',
      'LeCun Y, 2015, NATURE, V521, P436'
    ],
    docType: 'Review',
    databases: ['Web of Science']
  },

  // 7. Bibliometric Guidelines paper (Donthu et al. 2021)
  {
    id: 'raw-scopus-7',
    ut: 'SCOPUS:2-s2.0-85105291823',
    doi: '10.1016/j.jbusres.2021.04.070',
    title: 'How to conduct a bibliometric analysis: An overview and guidelines',
    authors: ['Donthu, N.', 'Kumar, S.', 'Mukherjee, D.', 'Pandey, N.', 'Lim, W.M.'],
    authorFullNames: ['Donthu, Naveen', 'Kumar, Satish', 'Mukherjee, Debmalya', 'Pandey, Nitesh', 'Lim, Weng Marc'],
    year: 2021,
    source: 'Journal of Business Research',
    citations: 3450,
    authorKeywords: ['bibliometrics', 'science mapping', 'performance analysis', 'vosviewer', 'co-citation analysis'],
    indexKeywords: ['bibliographic coupling', 'co-occurrence analysis', 'systematic review', 'thematic map'],
    abstract: 'Bibliometric analysis is a popular and rigorous method for exploring and analyzing large volumes of scientific data. It enables us to unpack the evolutionary nuances of a specific field while shedding light on the emerging areas in that field.',
    affiliations: ['Georgia State University, United States', 'Malaviya National Institute of Technology Jaipur, India', 'Swinburne University of Technology, Australia'],
    countries: ['United States', 'India', 'Australia'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Zupic I, 2015, ORGAN RES METHODS, V18, P429',
      'Callon M, 1991, SCIENTOMETRICS, V22, P155',
      'Small H, 1973, J AM SOC INFORM SCI, V24, P265'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },
  // 7b. Fuzzy duplicate in RIS/BibTeX upload
  {
    id: 'raw-ris-7',
    ut: 'RIS:JBR-2021-04070',
    doi: '',
    title: 'How to conduct a bibliometric analysis - An overview and guidelines',
    authors: ['Donthu, N.', 'Kumar, S.', 'Mukherjee, D.', 'Pandey, N.', 'Lim, W.M.'],
    authorFullNames: ['Naveen Donthu', 'Satish Kumar', 'Debmalya Mukherjee', 'Nitesh Pandey', 'Weng Marc Lim'],
    year: 2021,
    source: 'Journal of Business Research',
    citations: 3410,
    authorKeywords: ['bibliometrics', 'science mapping', 'gephi', 'bibliometrix', 'vosviewer'],
    indexKeywords: ['research methodology', 'intellectual structure'],
    abstract: 'Bibliometric analysis is a rigorous method for exploring and analyzing large volumes of scientific data using performance analysis and science mapping techniques.',
    affiliations: ['Georgia State University, United States', 'Swinburne University of Technology, Australia'],
    countries: ['United States', 'Australia'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6'
    ],
    docType: 'Article',
    databases: ['RIS/BibTeX']
  },

  // 8. Cobo et al. Thematic Mapping / Science Mapping Software
  {
    id: 'raw-wos-8',
    ut: 'WOS:000428192000009',
    doi: '10.1016/j.joi.2018.03.002',
    title: 'SciMAT and bibliometrix: Strategic thematic mapping and conceptual evolution in longitudinal corpora',
    authors: ['Cobo, M.J.', 'López-Herrera, A.G.', 'Herrera-Viedma, E.', 'Herrera, F.'],
    authorFullNames: ['Cobo, Manuel J.', 'López-Herrera, Antonio G.', 'Herrera-Viedma, Enrique', 'Herrera, Francisco'],
    year: 2018,
    source: 'Journal of Informetrics',
    citations: 910,
    authorKeywords: ['thematic map', 'science mapping', 'co-word analysis', 'callon centrality', 'bibliometrics'],
    indexKeywords: ['strategic diagram', 'conceptual structure', 'longitudinal evolution', 'clustering'],
    abstract: 'Callon centrality and density metrics allow co-word networks to be projected onto a two-dimensional strategic diagram divided into motor themes, niche themes, emerging or declining themes, and basic transversal themes.',
    affiliations: ['University of Granada, Spain', 'University of Cádiz, Spain'],
    countries: ['Spain'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Cobo MJ, 2011, J AM SOC INF SCI TEC, V62, P1382, DOI 10.1002/asi.21525',
      'Callon M, 1991, SCIENTOMETRICS, V22, P155',
      'Coulter N, 1998, J AM SOC INFORM SCI, V49, P1206'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 9. RPYS Spectroscopy methodology (Bornmann & Marx)
  {
    id: 'raw-wos-9',
    ut: 'WOS:000461029300005',
    doi: '10.1002/asi.24128',
    title: 'Reference Publication Year Spectroscopy (RPYS) in practice: A fast and reliable way to identify historical roots of research fields',
    authors: ['Marx, W.', 'Bornmann, L.', 'Barth, A.', 'Leydesdorff, L.'],
    authorFullNames: ['Marx, Werner', 'Bornmann, Lutz', 'Barth, Andreas', 'Leydesdorff, Loet'],
    year: 2018,
    source: 'Journal of the Association for Information Science and Technology',
    citations: 640,
    authorKeywords: ['rpys', 'historical roots', 'cited references', 'citation analysis', 'bibliometrics'],
    indexKeywords: ['spectroscopy', 'historiograph', 'scientometrics', 'reference analysis'],
    abstract: 'Reference Publication Year Spectroscopy (RPYS) is a quantitative method for identifying the historical roots of research fields and quantifying their impact on current research by plotting cited reference frequencies and 5-year median deviations.',
    affiliations: ['Max Planck Institute for Solid State Research, Germany', 'Max Planck Society, Munich, Germany', 'University of Amsterdam, Netherlands'],
    countries: ['Germany', 'Netherlands'],
    references: [
      'Marx W, 2014, J ASSOC INF SCI TECH, V65, P751',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Garfield E, 1979, CITATION INDEXING, P1',
      'Price DJD, 1965, SCIENCE, V149, P510',
      'Small H, 1973, J AM SOC INFORM SCI, V24, P265'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 10. Explainable AI in Healthcare (Scopus + PubMed duplicate)
  {
    id: 'raw-scopus-10',
    ut: 'SCOPUS:2-s2.0-85089120412',
    doi: '10.1016/j.inffus.2020.08.014',
    title: 'Explainable artificial intelligence (XAI) in clinical decision support: A systematic and bibliometric synthesis',
    authors: ['Holzinger, A.', 'Langs, G.', 'Denk, H.', 'Zatloukal, K.', 'Müller, H.'],
    authorFullNames: ['Holzinger, Andreas', 'Langs, Georg', 'Denk, Helmut', 'Zatloukal, Kurt', 'Müller, Heimo'],
    year: 2020,
    source: 'Information Fusion',
    citations: 1185,
    authorKeywords: ['explainable ai', 'clinical decision support', 'deep learning', 'medical ai', 'trustworthy ai'],
    indexKeywords: ['interpretability', 'electronic health records', 'diagnostic imaging', 'machine learning'],
    abstract: 'While deep learning models achieve dermatologist- and radiologist-level accuracy, clinical adoption requires transparent, auditable, and causally interpretable decision explanations.',
    affiliations: ['Medical University of Graz, Austria', 'Medical University of Vienna, Austria'],
    countries: ['Austria'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Ribeiro MT, 2016, KDD CONF, P1135',
      'Lundberg SM, 2017, ADV NEURAL INF PROC, V30, P4765'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },
  {
    id: 'raw-pubmed-10',
    ut: 'PMID:32901842',
    doi: '10.1016/j.inffus.2020.08.014',
    title: 'Explainable artificial intelligence (XAI) in clinical decision support: A systematic and bibliometric synthesis',
    authors: ['Holzinger, A.', 'Langs, G.', 'Denk, H.', 'Zatloukal, K.', 'Müller, H.'],
    authorFullNames: ['Holzinger, Andreas', 'Langs, Georg', 'Denk, Helmut', 'Zatloukal, Kurt', 'Müller, Heimo'],
    year: 2020,
    source: 'Information Fusion',
    citations: 1120,
    authorKeywords: ['explainable ai', 'shap', 'feature attribution', 'clinical decision support'],
    indexKeywords: ['medical informatics', 'algorithmic transparency', 'human-in-the-loop'],
    abstract: 'Clinical adoption of deep neural networks requires transparent, auditable, and causally interpretable decision explanations.',
    affiliations: ['Medical University of Graz, Austria'],
    countries: ['Austria'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7'
    ],
    docType: 'Article',
    databases: ['PubMed']
  },

  // 11. Federated Learning in Medicine
  {
    id: 'raw-pubmed-11',
    ut: 'PMID:33958792',
    doi: '10.1038/s41746-020-00323-1',
    title: 'The future of digital health with federated learning',
    authors: ['Rieke, N.', 'Hancox, J.', 'Li, W.', 'Milletarì, F.', 'Roth, H.R.', 'Albarqouni, S.', 'ourselin, S.', 'Cardoso, M.J.'],
    authorFullNames: ['Rieke, Nicola', 'Hancox, Jonny', 'Li, Wenqi', 'Milletarì, Fausto', 'Roth, Holger R.', 'Albarqouni, Shadi', 'Ourselin, Sébastien', 'Cardoso, M. Jorge'],
    year: 2020,
    source: 'npj Digital Medicine',
    citations: 1560,
    authorKeywords: ['federated learning', 'privacy-preserving ai', 'digital health', 'deep learning', 'medical ai'],
    indexKeywords: ['differential privacy', 'electronic health records', 'diagnostic imaging', 'multi-center clinical trials'],
    abstract: 'Federated learning enables multiple clinical institutions to collaboratively train deep learning models without exchanging raw patient health records, resolving data governance barriers.',
    affiliations: ['King\'s College London, United Kingdom', 'Technical University of Munich, Germany', 'NVIDIA, United States'],
    countries: ['United Kingdom', 'Germany', 'United States'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'McMahan B, 2017, AISTATS, P1273',
      'Esteva A, 2017, NATURE, V542, P115'
    ],
    docType: 'Article',
    databases: ['PubMed']
  },

  // 12. Knowledge Graphs in Biomedical Discovery (Dimensions + OpenAlex duplicate)
  {
    id: 'raw-dimensions-12',
    ut: 'DIM:pub.1138920192',
    doi: '10.1093/bib/bbab109',
    title: 'Biomedical knowledge graphs and graph neural networks for drug repurposing and precision medicine',
    authors: ['Zitnik, M.', 'Nguyen, F.', 'Wang, B.', 'Leskovec, J.', 'Goldenberg, A.', 'Hoffman, M.M.'],
    authorFullNames: ['Zitnik, Marinka', 'Nguyen, Francis', 'Wang, Bo', 'Leskovec, Jure', 'Goldenberg, Anna', 'Hoffman, Michael M.'],
    year: 2021,
    source: 'Briefings in Bioinformatics',
    citations: 830,
    authorKeywords: ['knowledge graph', 'graph neural networks', 'precision medicine', 'drug discovery', 'multimodal learning'],
    indexKeywords: ['network medicine', 'deep learning', 'bioinformatics', 'link prediction'],
    abstract: 'Biomedical knowledge graphs integrate heterogeneous molecular, pharmacological, and clinical datasets into unified relational networks for graph neural network inference.',
    affiliations: ['Harvard Medical School, United States', 'Stanford University, United States', 'University of Toronto, Canada'],
    countries: ['United States', 'Canada'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Zitnik M, 2018, BIOINFORMATICS, V34, P457',
      'Kipf TN, 2017, ICLR CONF, P1'
    ],
    docType: 'Article',
    databases: ['Dimensions']
  },
  {
    id: 'raw-openalex-12',
    ut: 'OA:W3159283710',
    doi: '10.1093/bib/bbab109',
    title: 'Biomedical knowledge graphs and graph neural networks for drug repurposing and precision medicine',
    authors: ['Zitnik, M.', 'Nguyen, F.', 'Wang, B.', 'Leskovec, J.', 'Goldenberg, A.', 'Hoffman, M.M.'],
    authorFullNames: ['Marinka Zitnik', 'Francis Nguyen', 'Bo Wang', 'Jure Leskovec', 'Anna Goldenberg', 'Michael M. Hoffman'],
    year: 2021,
    source: 'Briefings in Bioinformatics',
    citations: 845,
    authorKeywords: ['knowledge graph', 'graph neural networks', 'precision medicine', 'relational learning'],
    indexKeywords: ['computational biology', 'heterogeneous networks'],
    abstract: 'Biomedical knowledge graphs integrate heterogeneous molecular, pharmacological, and clinical datasets into unified relational networks.',
    affiliations: ['Harvard Medical School, United States', 'University of Toronto, Canada'],
    countries: ['United States', 'Canada'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },

  // 13. Large Language Models in Clinical Practice (2024)
  {
    id: 'raw-pubmed-13',
    ut: 'PMID:37460756',
    doi: '10.1038/s41586-023-06291-2',
    title: 'Large language models encode clinical knowledge',
    authors: ['Singhal, K.', 'Azizi, S.', 'Tu, T.', 'Mahdavi, S.S.', 'Wei, J.', 'Chung, H.W.', 'Topol, E.J.', 'Natarajan, V.'],
    authorFullNames: ['Singhal, Karan', 'Azizi, Shekoofeh', 'Tu, Tao', 'Mahdavi, S. Sara', 'Wei, Jason', 'Chung, Hyung Won', 'Topol, Eric J.', 'Natarajan, Vivek'],
    year: 2023,
    source: 'Nature',
    citations: 2150,
    authorKeywords: ['large language models', 'clinical decision support', 'foundation models', 'medical ai', 'natural language processing'],
    indexKeywords: ['prompt engineering', 'question answering', 'electronic health records', 'clinical evaluation'],
    abstract: 'Large language models demonstrated impressive capabilities on medical question benchmarks, yet safe clinical deployment requires human-clinician evaluation rubrics across bias, comprehension, and harm mitigation.',
    affiliations: ['Google Research, United States', 'Scripps Research Translational Institute, United States', 'Stanford University, United States'],
    countries: ['United States'],
    references: [
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4',
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Vaswani A, 2017, ADV NEURAL INF PROC, V30, P5998',
      'Brown TB, 2020, ADV NEURAL INF PROC, V33, P1877'
    ],
    docType: 'Article',
    databases: ['PubMed']
  },

  // 14. Dimensions database comparison (Thelwall 2018)
  {
    id: 'raw-scopus-14',
    ut: 'SCOPUS:2-s2.0-85046019283',
    doi: '10.1016/j.joi.2018.03.006',
    title: 'Dimensions: A competitor to Scopus and the Web of Science?',
    authors: ['Thelwall, M.'],
    authorFullNames: ['Thelwall, Mike'],
    year: 2018,
    source: 'Journal of Informetrics',
    citations: 590,
    authorKeywords: ['dimensions', 'scopus', 'web of science', 'citation analysis', 'database coverage'],
    indexKeywords: ['bibliometrics', 'research evaluation', 'altmetrics', 'crossref'],
    abstract: 'Digital Science launched the Dimensions scholarly search database including journal articles, citation counts, grant links, and clinical trial linkages, offering a major new data source for scientometric harmonization.',
    affiliations: ['University of Wolverhampton, United Kingdom'],
    countries: ['United Kingdom'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Mongeon P, 2016, SCIENTOMETRICS, V106, P213',
      'Waltman L, 2016, J INFORMETR, V10, P365'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 15. PRISMA 2020 Systematic Reviews + Bibliometric synthesis (Scopus + PubMed duplicate)
  {
    id: 'raw-pubmed-15',
    ut: 'PMID:33782057',
    doi: '10.1136/bmj.n71',
    title: 'The PRISMA 2020 statement: an updated guideline for reporting systematic reviews and multi-database syntheses',
    authors: ['Page, M.J.', 'McKenzie, J.E.', 'Bossuyt, P.M.', 'Boutron, I.', 'Hoffmann, T.C.', 'Mulrow, C.D.', 'Moher, D.'],
    authorFullNames: ['Page, Matthew J.', 'McKenzie, Joanne E.', 'Bossuyt, Patrick M.', 'Boutron, Isabelle', 'Hoffmann, Tammy C.', 'Mulrow, Cynthia D.', 'Moher, David'],
    year: 2021,
    source: 'BMJ',
    citations: 5920,
    authorKeywords: ['systematic review', 'prisma', 'data harmonization', 'deduplication', 'database coverage'],
    indexKeywords: ['evidence synthesis', 'meta-analysis', 'bibliometrics', 'reporting guidelines'],
    abstract: 'The Preferred Reporting Items for Systematic reviews and Meta-Analyses (PRISMA) 2020 statement replaces the 2009 statement and includes new guidance for multi-database search strategies, automated deduplication, and living evidence maps.',
    affiliations: ['Monash University, Australia', 'University of Amsterdam, Netherlands', 'Université Paris Cité, France', 'Ottawa Hospital Research Institute, Canada'],
    countries: ['Australia', 'Netherlands', 'France', 'Canada'],
    references: [
      'Moher D, 2009, PLOS MED, V6, Pe1000097',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Bramer WM, 2016, J MED LIBR ASSOC, V104, P240'
    ],
    docType: 'Article',
    databases: ['PubMed']
  },
  {
    id: 'raw-scopus-15',
    ut: 'SCOPUS:2-s2.0-85103419283',
    doi: '10.1136/bmj.n71',
    title: 'The PRISMA 2020 statement: An updated guideline for reporting systematic reviews and multi-database syntheses',
    authors: ['Page, M.J.', 'McKenzie, J.E.', 'Bossuyt, P.M.', 'Boutron, I.', 'Hoffmann, T.C.', 'Mulrow, C.D.', 'Moher, D.'],
    authorFullNames: ['Page, Matthew J.', 'McKenzie, Joanne E.', 'Bossuyt, Patrick M.', 'Boutron, Isabelle', 'Hoffmann, Tammy C.', 'Mulrow, Cynthia D.', 'Moher, David'],
    year: 2021,
    source: 'BMJ',
    citations: 6140,
    authorKeywords: ['systematic review', 'prisma', 'database coverage', 'automation tools'],
    indexKeywords: ['methodology', 'information retrieval'],
    abstract: 'The PRISMA 2020 statement includes updated guidance for reporting multi-database searches and deduplication.',
    affiliations: ['Monash University, Australia', 'Ottawa Hospital Research Institute, Canada'],
    countries: ['Australia', 'Canada'],
    references: [
      'Moher D, 2009, PLOS MED, V6, Pe1000097'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 16. Automated Deduplication in R / Bibliometrix (Bramer / Aria / Caputo)
  {
    id: 'raw-scopus-16',
    ut: 'SCOPUS:2-s2.0-85129018273',
    doi: '10.1016/j.softx.2022.101092',
    title: 'Synthesizing Scopus, Web of Science, and PubMed records: Automated deduplication and field mapping in R',
    authors: ['Aria, M.', 'Misuraca, M.', 'Spano, M.', 'Cuccurullo, C.'],
    authorFullNames: ['Aria, Massimo', 'Misuraca, Michelangelo', 'Spano, Maria', 'Cuccurullo, Corrado'],
    year: 2022,
    source: 'SoftwareX',
    citations: 410,
    authorKeywords: ['bibliometrics', 'data harmonization', 'deduplication', 'r package', 'scopus'],
    indexKeywords: ['web of science', 'pubmed', 'fuzzy matching', 'science mapping'],
    abstract: 'Researchers conducting comprehensive science mapping frequently combine Scopus, Web of Science, and PubMed exports. We introduce an automated normalization and two-stage duplicate detection pipeline that preserves citation counts and cited reference strings.',
    affiliations: ['University of Naples Federico II, Italy', 'University of Calabria, Italy', 'University of Campania Luigi Vanvitelli, Italy'],
    countries: ['Italy'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Martín-Martín A, 2021, SCIENTOMETRICS, V126, P871, DOI 10.1016/j.SCIE.2020.102341',
      'Bramer WM, 2016, J MED LIBR ASSOC, V104, P240'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 17. LLM-assisted Systematic Reviews & Science Mapping (2024)
  {
    id: 'raw-openalex-17',
    ut: 'OA:W4391827364',
    doi: '10.1007/s11192-024-04981-2',
    title: 'Large language models and knowledge graphs for automated science mapping and thematic clustering',
    authors: ['Waltman, L.', 'Van Eck, N.J.', 'Aria, M.', 'Bornmann, L.'],
    authorFullNames: ['Waltman, Ludo', 'Van Eck, Nees Jan', 'Aria, Massimo', 'Bornmann, Lutz'],
    year: 2024,
    source: 'Scientometrics',
    citations: 315,
    authorKeywords: ['large language models', 'science mapping', 'vosviewer', 'thematic map', 'knowledge graph'],
    indexKeywords: ['bibliometrics', 'clustering', 'citation network', 'natural language processing'],
    abstract: 'Combining semantic embeddings from large language models with citation-based VOSviewer clustering and Callon strategic diagrams improves cluster labeling resolution and emerging topic detection.',
    affiliations: ['Leiden University, CWTS, Netherlands', 'University of Naples Federico II, Italy', 'Max Planck Society, Munich, Germany'],
    countries: ['Netherlands', 'Italy', 'Germany'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6',
      'Priem J, 2022, QUANT SCI STUD, V3, P1, DOI 10.48550/arXiv.2205.01833',
      'Singhal K, 2023, NATURE, V620, P172, DOI 10.1038/s41586-023-06291-2'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },
  // 17b. Duplicate in Web of Science
  {
    id: 'raw-wos-17',
    ut: 'WOS:001189203100001',
    doi: '10.1007/s11192-024-04981-2',
    title: 'Large language models and knowledge graphs for automated science mapping and thematic clustering',
    authors: ['Waltman, L', 'Van Eck, NJ', 'Aria, M', 'Bornmann, L'],
    authorFullNames: ['Waltman, Ludo', 'Van Eck, Nees Jan', 'Aria, Massimo', 'Bornmann, Lutz'],
    year: 2024,
    source: 'SCIENTOMETRICS',
    citations: 298,
    authorKeywords: ['large language models', 'science mapping', 'vosviewer', 'cluster labeling'],
    indexKeywords: ['semantic similarity', 'co-occurrence analysis'],
    abstract: 'Combining semantic embeddings from large language models with citation-based VOSviewer clustering improves cluster labeling resolution.',
    affiliations: ['Leiden Univ, CWTS, Leiden, Netherlands', 'Univ Naples Federico II, Naples, Italy'],
    countries: ['Netherlands', 'Italy'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 18. Deep Learning in Diagnostic Radiology & Oncology
  {
    id: 'raw-pubmed-18',
    ut: 'PMID:30096543',
    doi: '10.1038/s41568-018-0016-5',
    title: 'Artificial intelligence in cancer imaging: Clinical challenges and applications',
    authors: ['Bi, W.L.', 'Hosny, A.', 'Schabath, M.B.', 'Giger, M.L.', 'Birkbak, N.J.', 'Mehrtash, A.', 'Aerts, H.J.W.L.'],
    authorFullNames: ['Bi, Wenya Linda', 'Hosny, Ahmed', 'Schabath, Matthew B.', 'Giger, Maryellen L.', 'Birkbak, Nicolai J.', 'Mehrtash, Alireza', 'Aerts, Hugo J.W.L.'],
    year: 2019,
    source: 'Nature Reviews Cancer',
    citations: 2310,
    authorKeywords: ['artificial intelligence', 'deep learning', 'diagnostic imaging', 'precision medicine', 'medical ai'],
    indexKeywords: ['radiomics', 'oncology', 'clinical decision support', 'convolutional neural networks'],
    abstract: 'Radiographic imaging is integral to oncology detection, staging, and response monitoring. Artificial intelligence and deep radiomics quantify radiographic phenotypes beyond human visual perception.',
    affiliations: ['Harvard Medical School, United States', 'University of Chicago, United States', 'Maastricht University, Netherlands'],
    countries: ['United States', 'Netherlands'],
    references: [
      'Esteva A, 2017, NATURE, V542, P115',
      'LeCun Y, 2015, NATURE, V521, P436',
      'Aerts HJWL, 2014, NAT COMMUN, V5, P4006'
    ],
    docType: 'Review',
    databases: ['PubMed']
  },

  // 19. Bradford & Lotka Laws Revisited in Modern Open Science (2022)
  {
    id: 'raw-wos-19',
    ut: 'WOS:000791823100008',
    doi: '10.1016/j.joi.2022.101289',
    title: 'Scaling laws in modern scientometrics: Revisiting Bradford scattering and Lotka productivity across mega-journals',
    authors: ['Bornmann, L.', 'Haunschild, R.', 'Mutz, R.', 'Thelwall, M.'],
    authorFullNames: ['Bornmann, Lutz', 'Haunschild, Robin', 'Mutz, Rüdiger', 'Thelwall, Mike'],
    year: 2022,
    source: 'Journal of Informetrics',
    citations: 275,
    authorKeywords: ['bibliometrics', 'citation analysis', 'open science', 'performance analysis', 'database coverage'],
    indexKeywords: ['bradford law', 'lotka law', 'scientometrics', 'h-index'],
    abstract: 'Empirical evaluation of Bradford law of scattering and Lotka inverse-square law across 1.8 million OpenAlex, Scopus, and Web of Science records reveals shifts driven by open-access mega-journals and large collaborative consortia.',
    affiliations: ['Max Planck Society, Munich, Germany', 'ETH Zurich, Switzerland', 'University of Wolverhampton, United Kingdom'],
    countries: ['Germany', 'Switzerland', 'United Kingdom'],
    references: [
      'Bradford SC, 1934, ENGINEERING, V137, P85',
      'Lotka AJ, 1926, J WASH ACAD SCI, V16, P317',
      'Hirsch JE, 2005, P NATL ACAD SCI USA, V102, P16569, DOI 10.1073/pnas.0507655102',
      'Egghe L, 2006, SCIENTOMETRICS, V69, P131',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 20. Multimodal EHR + Clinical NLP (2022)
  {
    id: 'raw-scopus-20',
    ut: 'SCOPUS:2-s2.0-85134891204',
    doi: '10.1038/s41591-022-01981-2',
    title: 'Multimodal deep learning for prognostic stratification across electronic health records and histopathology',
    authors: ['Rajpurkar, P.', 'Chen, E.', 'Banerjee, O.', 'Topol, E.J.'],
    authorFullNames: ['Rajpurkar, Pranav', 'Chen, Emma', 'Banerjee, Oishi', 'Topol, Eric J.'],
    year: 2022,
    source: 'Nature Medicine',
    citations: 1190,
    authorKeywords: ['multimodal learning', 'deep learning', 'electronic health records', 'precision medicine', 'medical ai'],
    indexKeywords: ['clinical decision support', 'diagnostic imaging', 'pathology', 'foundation models'],
    abstract: 'Integrating structured electronic health records, unstructured clinical notes, and whole-slide histopathology images via cross-attention transformers substantially improves survival prediction.',
    affiliations: ['Harvard Medical School, United States', 'Stanford University, United States', 'Scripps Research Translational Institute, United States'],
    countries: ['United States'],
    references: [
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Bi WL, 2019, NAT REV CANCER, V19, P530, DOI 10.1038/s41568-018-0016-5',
      'Vaswani A, 2017, ADV NEURAL INF PROC, V30, P5998',
      'Esteva A, 2017, NATURE, V542, P115'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 21. VOSviewer Density & Overlay Algorithms (Waltman & Van Eck 2019)
  {
    id: 'raw-wos-21',
    ut: 'WOS:000478192000003',
    doi: '10.1016/j.joi.2019.05.004',
    title: 'Field-normalized citation overlay maps and kernel density landscapes in VOSviewer',
    authors: ['Waltman, L.', 'Van Eck, N.J.', 'Noyons, E.C.M.'],
    authorFullNames: ['Waltman, Ludo', 'Van Eck, Nees Jan', 'Noyons, Ed C.M.'],
    year: 2019,
    source: 'Journal of Informetrics',
    citations: 720,
    authorKeywords: ['vosviewer', 'science mapping', 'citation network', 'clustering', 'bibliometrics'],
    indexKeywords: ['density visualization', 'overlay visualization', 'co-occurrence analysis', 'data visualization'],
    abstract: 'We formalize the mathematical foundations of VOSviewer item density, cluster density, and temporal/citation overlay maps for large-scale bibliometric networks.',
    affiliations: ['Leiden University, CWTS, Netherlands'],
    countries: ['Netherlands'],
    references: [
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Waltman L, 2010, J INFORMETR, V4, P629'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  },

  // 22. Retrieval-Augmented Generation (RAG) & Clinical Knowledge Graphs (2025)
  {
    id: 'raw-openalex-22',
    ut: 'OA:W4401928371',
    doi: '10.1038/s41746-025-01412-8',
    title: 'Graph-grounded retrieval-augmented generation for verifiable clinical decision support',
    authors: ['Zitnik, M.', 'Moor, M.', 'Rajpurkar, P.', 'Leskovec, J.'],
    authorFullNames: ['Zitnik, Marinka', 'Moor, Michael', 'Rajpurkar, Pranav', 'Leskovec, Jure'],
    year: 2025,
    source: 'npj Digital Medicine',
    citations: 245,
    authorKeywords: ['large language models', 'knowledge graph', 'clinical decision support', 'explainable ai', 'foundation models'],
    indexKeywords: ['retrieval-augmented generation', 'trustworthy ai', 'medical ai', 'graph neural networks'],
    abstract: 'Grounding medical large language models in curated biomedical knowledge graphs reduces clinical hallucination rates by 68% while producing traceable evidence citations.',
    affiliations: ['Harvard Medical School, United States', 'Stanford University, United States', 'ETH Zurich, Switzerland'],
    countries: ['United States', 'Switzerland'],
    references: [
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4',
      'Singhal K, 2023, NATURE, V620, P172, DOI 10.1038/s41586-023-06291-2',
      'Zitnik M, 2021, BRIEF BIOINFORM, V22, Pbbab109, DOI 10.1093/bib/bbab109',
      'Holzinger A, 2020, INFORM FUSION, V71, P28, DOI 10.1016/j.inffus.2020.08.014'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },
  // 22b. Duplicate in PubMed
  {
    id: 'raw-pubmed-22',
    ut: 'PMID:39812049',
    doi: '10.1038/s41746-025-01412-8',
    title: 'Graph-grounded retrieval-augmented generation for verifiable clinical decision support',
    authors: ['Zitnik, M.', 'Moor, M.', 'Rajpurkar, P.', 'Leskovec, J.'],
    authorFullNames: ['Zitnik, Marinka', 'Moor, Michael', 'Rajpurkar, Pranav', 'Leskovec, Jure'],
    year: 2025,
    source: 'npj Digital Medicine',
    citations: 230,
    authorKeywords: ['large language models', 'knowledge graph', 'clinical decision support', 'hallucination mitigation'],
    indexKeywords: ['evidence-based medicine', 'medical informatics'],
    abstract: 'Grounding medical large language models in curated biomedical knowledge graphs reduces clinical hallucination rates while producing traceable citations.',
    affiliations: ['Harvard Medical School, United States', 'Stanford University, United States'],
    countries: ['United States'],
    references: [
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4'
    ],
    docType: 'Article',
    databases: ['PubMed']
  },

  // 23. Privacy-Preserving Federated Foundation Models (2024)
  {
    id: 'raw-scopus-23',
    ut: 'SCOPUS:2-s2.0-85189201928',
    doi: '10.1016/j.inffus.2024.102311',
    title: 'Federated multimodal foundation models across international hospital networks',
    authors: ['Rieke, N.', 'Holzinger, A.', 'Cardoso, M.J.', 'Aerts, H.J.W.L.'],
    authorFullNames: ['Rieke, Nicola', 'Holzinger, Andreas', 'Cardoso, M. Jorge', 'Aerts, Hugo J.W.L.'],
    year: 2024,
    source: 'Information Fusion',
    citations: 360,
    authorKeywords: ['federated learning', 'foundation models', 'privacy-preserving ai', 'explainable ai', 'multimodal learning'],
    indexKeywords: ['digital health', 'diagnostic imaging', 'trustworthy ai', 'electronic health records'],
    abstract: 'We demonstrate cross-border federated fine-tuning of multimodal clinical foundation models across 18 European and North American hospitals under strict differential privacy guarantees.',
    affiliations: ['Technical University of Munich, Germany', 'Medical University of Graz, Austria', 'King\'s College London, United Kingdom', 'Maastricht University, Netherlands'],
    countries: ['Germany', 'Austria', 'United Kingdom', 'Netherlands'],
    references: [
      'Rieke N, 2020, NPJ DIGIT MED, V3, P119, DOI 10.1038/s41746-020-00323-1',
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4',
      'Holzinger A, 2020, INFORM FUSION, V71, P28, DOI 10.1016/j.inffus.2020.08.014',
      'Bi WL, 2019, NAT REV CANCER, V19, P530, DOI 10.1038/s41568-018-0016-5'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 24. Global Scientometric Collaboration & Open Citations (2023)
  {
    id: 'raw-crossref-24',
    ut: 'CR:10.1162/qss_a_00251',
    doi: '10.1162/qss_a_00251',
    title: 'OpenCitations and CrossRef: Democratizing global bibliometric data and citation graphs',
    authors: ['Peroni, S.', 'Shotton, D.', 'Waltman, L.', 'Priem, J.'],
    authorFullNames: ['Peroni, Silvio', 'Shotton, David', 'Waltman, Ludo', 'Priem, Jason'],
    year: 2023,
    source: 'Quantitative Science Studies',
    citations: 495,
    authorKeywords: ['open science', 'citation network', 'crossref', 'openalex', 'bibliometrics'],
    indexKeywords: ['open citations', 'data harmonization', 'science mapping', 'database coverage'],
    abstract: 'With over 1.6 billion open citation links now available through CrossRef and OpenCitations, researchers can reproduce bibliometric indicators and VOSviewer maps transparently.',
    affiliations: ['University of Bologna, Italy', 'University of Oxford, United Kingdom', 'Leiden University, CWTS, Netherlands', 'OurResearch, United States'],
    countries: ['Italy', 'United Kingdom', 'Netherlands', 'United States'],
    references: [
      'Priem J, 2022, QUANT SCI STUD, V3, P1, DOI 10.48550/arXiv.2205.01833',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6',
      'Martín-Martín A, 2021, SCIENTOMETRICS, V126, P871, DOI 10.1016/j.SCIE.2020.102341'
    ],
    docType: 'Article',
    databases: ['CrossRef']
  },

  // 25. Bibliometric Mapping of AI in Medicine (2023)
  {
    id: 'raw-scopus-25',
    ut: 'SCOPUS:2-s2.0-85160192834',
    doi: '10.1016/j.jbi.2023.104412',
    title: 'Mapping the intellectual and conceptual structure of medical artificial intelligence (2010–2023): A multi-database bibliometrix and VOSviewer study',
    authors: ['Aria, M.', 'Cuccurullo, C.', 'Holzinger, A.', 'Kumar, S.'],
    authorFullNames: ['Aria, Massimo', 'Cuccurullo, Corrado', 'Holzinger, Andreas', 'Kumar, Satish'],
    year: 2023,
    source: 'Journal of Biomedical Informatics',
    citations: 530,
    authorKeywords: ['bibliometrics', 'vosviewer', 'medical ai', 'thematic map', 'science mapping'],
    indexKeywords: ['co-citation analysis', 'deep learning', 'clinical decision support', 'three-field plot'],
    abstract: 'By merging 18,400 records from Scopus, Web of Science, and PubMed, we map the shift in medical AI from classical machine learning and radiomics to multimodal foundation models and explainable clinical decision systems.',
    affiliations: ['University of Naples Federico II, Italy', 'University of Campania Luigi Vanvitelli, Italy', 'Medical University of Graz, Austria', 'Swinburne University of Technology, Australia'],
    countries: ['Italy', 'Austria', 'Australia'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6',
      'Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7',
      'Donthu N, 2021, J BUS RES, V133, P285, DOI 10.1016/j.jbusres.2021.04.070',
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4'
    ],
    docType: 'Article',
    databases: ['Scopus']
  },

  // 26. Autonomous Agentic Workflows in Scientific Discovery (2026)
  {
    id: 'raw-openalex-26',
    ut: 'OA:W4412938475',
    doi: '10.1038/s41586-026-07192-1',
    title: 'Autonomous scientific discovery and living literature synthesis with multimodal AI agents',
    authors: ['Rajpurkar, P.', 'Zitnik, M.', 'Waltman, L.', 'Priem, J.', 'Topol, E.J.'],
    authorFullNames: ['Rajpurkar, Pranav', 'Zitnik, Marinka', 'Waltman, Ludo', 'Priem, Jason', 'Topol, Eric J.'],
    year: 2026,
    source: 'Nature',
    citations: 145,
    authorKeywords: ['foundation models', 'large language models', 'science mapping', 'knowledge graph', 'open science'],
    indexKeywords: ['living systematic review', 'bibliometrics', 'medical ai', 'automated deduplication'],
    abstract: 'Continuous multi-database ingestion across OpenAlex, PubMed, CrossRef, and Scopus paired with graph-grounded reasoning enables real-time thematic mapping and hypothesis generation.',
    affiliations: ['Harvard Medical School, United States', 'Leiden University, CWTS, Netherlands', 'Scripps Research Translational Institute, United States'],
    countries: ['United States', 'Netherlands'],
    references: [
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4',
      'Waltman L, 2024, SCIENTOMETRICS, V129, P1420, DOI 10.1007/s11192-024-04981-2',
      'Zitnik M, 2025, NPJ DIGIT MED, V8, P44, DOI 10.1038/s41746-025-01412-8'
    ],
    docType: 'Article',
    databases: ['OpenAlex']
  },

  // 27. Zupic & Cater (2015 -> 2019 Follow-up on Science Mapping in Management & Social Sciences)
  {
    id: 'raw-wos-27',
    ut: 'WOS:000491029300014',
    doi: '10.1177/1094428119861234',
    title: 'Bibliometric methods in management and organization: Co-citation, bibliographic coupling, and co-word workflows',
    authors: ['Zupic, I.', 'Čater, T.', 'Donthu, N.', 'Lim, W.M.'],
    authorFullNames: ['Zupic, Ivan', 'Čater, Tomaž', 'Donthu, Naveen', 'Lim, Weng Marc'],
    year: 2019,
    source: 'Organizational Research Methods',
    citations: 1290,
    authorKeywords: ['bibliometrics', 'co-citation analysis', 'bibliographic coupling', 'science mapping', 'performance analysis'],
    indexKeywords: ['vosviewer', 'co-occurrence analysis', 'systematic review', 'intellectual structure'],
    abstract: 'We provide a rigorous methodological workflow for designing, executing, and interpreting co-citation, bibliographic coupling, and co-word analyses across multidisciplinary databases.',
    affiliations: ['Goldsmiths, University of London, United Kingdom', 'University of Ljubljana, Slovenia', 'Georgia State University, United States'],
    countries: ['United Kingdom', 'Slovenia', 'United States'],
    references: [
      'Zupic I, 2015, ORGAN RES METHODS, V18, P429',
      'Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007',
      'Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523, DOI 10.1007/s11192-009-0146-3',
      'Small H, 1973, J AM SOC INFORM SCI, V24, P265',
      'Kessler MM, 1963, AM DOC, V14, P10'
    ],
    docType: 'Article',
    databases: ['Web of Science']
  }
];

/**
 * Sample raw file strings for instant one-click format testing in the Multi-DB Merger
 */
export const SAMPLE_FORMAT_FILES: Record<string, { filename: string; format: string; content: string }> = {
  scopusCsv: {
    filename: 'scopus_export_batch.csv',
    format: 'Scopus CSV',
    content: `Authors,Author full names,Title,Year,Source title,Cited by,DOI,Author Keywords,Index Keywords,Affiliations,Abstract,References,Document Type,EID
"Aria M.; Cuccurullo C.; Spano M.","Aria, Massimo; Cuccurullo, Corrado; Spano, Maria","Biblioshiny: Interactive science mapping and three-field plots for non-coders",2023,"Journal of Informetrics",385,"10.1016/j.joi.2023.101410","bibliometrics; science mapping; three-field plot; thematic map; r package","data visualization; vosviewer; citation analysis","University of Naples Federico II, Italy; University of Campania Luigi Vanvitelli, Italy","Biblioshiny brings the full analytical suite of the bibliometrix R package to an interactive web interface supporting multi-database imports.","Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007; Van Eck NJ, 2010, SCIENTOMETRICS, V84, P523","Article","2-s2.0-85161122334"
"Topol E.J.; Rajpurkar P.; Moor M.","Topol, Eric J.; Rajpurkar, Pranav; Moor, Michael","Clinical validation of multimodal foundation models in diagnostic medicine",2025,"Nature Medicine",412,"10.1038/s41591-025-02991-0","foundation models; clinical decision support; multimodal learning; medical ai; diagnostic imaging","deep learning; electronic health records; trustworthy ai","Scripps Research Translational Institute, United States; Harvard Medical School, United States; Stanford University, United States","Prospective multi-center trials of multimodal clinical foundation models demonstrate significant reductions in diagnostic turnaround time.","Topol EJ, 2019, NAT MED, V25, P44, DOI 10.1038/s41591-018-0300-7; Moor M, 2023, NATURE, V616, P259, DOI 10.1038/s41586-023-05881-4","Article","2-s2.0-85199887766"`
  },
  wosPlaintext: {
    filename: 'wos_savedrecs.txt',
    format: 'Web of Science ISI Plain Text',
    content: `FN Clarivate Analytics Web of Science
VR 1.0
PT J
AU Waltman, L
   Van Eck, NJ
   Peroni, S
AF Waltman, Ludo
   Van Eck, Nees Jan
   Peroni, Silvio
TI Open bibliometric indicators and VOSviewer clustering using harmonized CrossRef and OpenAlex graphs
SO SCIENTOMETRICS
DE vosviewer; open science; openalex; crossref; citation network
ID bibliometrics; data harmonization; clustering; science mapping
AB Harmonizing citation networks across Web of Science, Scopus, OpenAlex, and CrossRef enables reproducible VOSviewer modularity clustering.
C1 [Waltman, Ludo; Van Eck, Nees Jan] Leiden Univ, CWTS, Leiden, Netherlands.
   [Peroni, Silvio] Univ Bologna, Bologna, Italy.
CR Aria M, 2017, J INFORMETR, V11, P959, DOI 10.1016/j.joi.2017.08.007
   Van Eck NJ, 2017, SCIENTOMETRICS, V111, P1053, DOI 10.1007/s11192-016-2225-6
   Priem J, 2022, QUANT SCI STUD, V3, P1, DOI 10.48550/arXiv.2205.01833
TC 265
PY 2024
DI 10.1007/s11192-024-05112-9
UT WOS:001201928300002
ER
EF`
  },
  pubmedMedline: {
    filename: 'pubmed_clinical_ai.nbib',
    format: 'PubMed MEDLINE',
    content: `PMID- 38912041
OWN - NLM
STAT- MEDLINE
TI  - Clinical validation of multimodal foundation models in diagnostic medicine
PG  - 412-425
LID - 10.1038/s41591-025-02991-0 [doi]
AB  - Prospective multi-center trials of multimodal clinical foundation models demonstrate significant reductions in diagnostic turnaround time and high clinician concordance.
FAU - Topol, Eric J
AU  - Topol EJ
AD  - Scripps Research Translational Institute, La Jolla, United States.
FAU - Rajpurkar, Pranav
AU  - Rajpurkar P
AD  - Harvard Medical School, Boston, United States.
FAU - Moor, Michael
AU  - Moor M
AD  - Stanford University, United States.
JT  - Nature Medicine
DP  - 2025 Feb
MH  - Artificial Intelligence
MH  - Clinical Decision Support Systems
MH  - Electronic Health Records
OT  - foundation models
OT  - multimodal learning
OT  - precision medicine
PT  - Journal Article
SO  - Nat Med. 2025;31(2):412-425.
`
  }
};
