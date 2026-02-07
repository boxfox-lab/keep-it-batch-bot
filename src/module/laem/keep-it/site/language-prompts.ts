export const LANGUAGE_PROMPTS = {
  en: {
    system:
      'You are an expert in summarizing website content. Please provide a structured summary of the given website content in English.',
    function_description:
      'Summarizes the website content in a structured format in English.',
    main_points_desc: 'List of main points from the website in English',
    key_topics_desc: 'Main topics covered in the website in English',
    summary_desc: 'Overall summary of the website in English',
    reading_time_desc: 'Estimated reading time in minutes',
  },
  ko: {
    system:
      '당신은 웹사이트 내용을 요약하는 전문가입니다. 주어진 웹사이트의 내용을 한국어로 구조화된 형태로 요약해주세요.',
    function_description:
      '웹사이트의 내용을 한국어로 구조화된 형태로 요약합니다.',
    main_points_desc: '웹사이트의 주요 포인트 목록 (한국어)',
    key_topics_desc: '웹사이트에서 다루는 주요 주제들 (한국어)',
    summary_desc: '웹사이트의 전체적인 요약 (한국어)',
    reading_time_desc: '예상 읽기 시간(분)',
  },
  ja: {
    system:
      'あなたはウェブサイトの内容を要約する専門家です。与えられたウェブサイトの内容を日本語で構造化された形式で要約してください。',
    function_description:
      'ウェブサイトの内容を日本語で構造化された形式で要約します。',
    main_points_desc: 'ウェブサイトの主なポイントのリスト（日本語）',
    key_topics_desc: 'ウェブサイトで取り上げられている主要なトピック（日本語）',
    summary_desc: 'ウェブサイトの全体的な要約（日本語）',
    reading_time_desc: '推定読書時間（分）',
  },
  zh: {
    system:
      '您是一位网站内容摘要专家。请以中文结构化的形式总结给定网站的内容。',
    function_description: '以中文结构化形式总结网站内容。',
    main_points_desc: '网站的主要要点列表（中文）',
    key_topics_desc: '网站涵盖的主要主题（中文）',
    summary_desc: '网站的整体摘要（中文）',
    reading_time_desc: '预计阅读时间（分钟）',
  },
  es: {
    system:
      'Eres un experto en resumir contenido de sitios web. Por favor, proporciona un resumen estructurado del contenido del sitio web dado en español.',
    function_description:
      'Resume el contenido del sitio web en un formato estructurado en español.',
    main_points_desc: 'Lista de puntos principales del sitio web en español',
    key_topics_desc: 'Temas principales cubiertos en el sitio web en español',
    summary_desc: 'Resumen general del sitio web en español',
    reading_time_desc: 'Tiempo estimado de lectura en minutos',
  },
  fr: {
    system:
      'Vous êtes un expert en résumé de contenu de sites web. Veuillez fournir un résumé structuré du contenu du site web donné en français.',
    function_description:
      'Résume le contenu du site web dans un format structuré en français.',
    main_points_desc: 'Liste des points principaux du site web en français',
    key_topics_desc: 'Sujets principaux couverts dans le site web en français',
    summary_desc: 'Résumé général du site web en français',
    reading_time_desc: 'Temps de lecture estimé en minutes',
  },
  de: {
    system:
      'Sie sind ein Experte für die Zusammenfassung von Website-Inhalten. Bitte geben Sie eine strukturierte Zusammenfassung des gegebenen Website-Inhalts auf Deutsch.',
    function_description:
      'Fasst den Website-Inhalt in einem strukturierten Format auf Deutsch zusammen.',
    main_points_desc: 'Liste der Hauptpunkte der Website auf Deutsch',
    key_topics_desc: 'Hauptthemen der Website auf Deutsch',
    summary_desc: 'Gesamtzusammenfassung der Website auf Deutsch',
    reading_time_desc: 'Geschätzte Lesezeit in Minuten',
  },
};
