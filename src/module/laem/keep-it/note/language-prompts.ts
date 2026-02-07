export const LANGUAGE_PROMPTS = {
  en: {
    system:
      'You are an expert in summarizing note content and organizing information. Please provide a structured summary of the given note content in English. If folder or tags are empty, suggest appropriate ones. If an existing folder list is provided, first try to find and reuse an appropriate folder from that list. If no appropriate folder exists in the list, then suggest a new folder.',
    function_description:
      'Summarizes the note content in a structured format in English. Suggests folder and tags only if they are empty. If an existing folder list is provided, first try to find and reuse an appropriate folder from that list. If no appropriate folder exists in the list, then suggest a new folder.',
    main_points_desc: 'List of main points from the note in English',
    qa_desc:
      'List of relevant questions and answers based on the note content in English',
    summary_desc: 'Overall summary of the note in English',
    folder_desc:
      'Suggested folder name and description for organizing this note in English (only if current folder is empty). If an existing folder list is provided, first try to select an appropriate folder from that list. If no appropriate folder exists in the list, then suggest a new folder name.',
    folder_name_desc:
      'Name of the folder that best represents the note content. If an existing folder list is provided, first try to select from that list. If no appropriate folder exists, suggest a new folder name.',
    folder_description_desc:
      'Brief description explaining the purpose and content of this folder',
    tags_desc:
      'List of suggested tags that best represent the note content in English (only if current tags are empty)',
  },
  ko: {
    system:
      '당신은 노트 내용을 요약하고 정보를 정리하는 전문가입니다. 주어진 노트의 내용을 한국어로 구조화된 형태로 요약해주세요. 폴더나 태그가 비어있는 경우에만 적절한 것을 추천해주세요. 기존 폴더 목록이 제공되면 먼저 그 목록에서 적절한 폴더를 찾아 재사용하세요. 만약 목록에 적절한 폴더가 없다면 새로운 폴더를 추천해주세요.',
    function_description:
      '노트의 내용을 한국어로 구조화된 형태로 요약합니다. 폴더와 태그가 비어있는 경우에만 추천합니다. 기존 폴더 목록이 제공되면 먼저 그 목록에서 적절한 폴더를 찾아 재사용하세요. 만약 목록에 적절한 폴더가 없다면 새로운 폴더를 추천해주세요.',
    main_points_desc: '노트의 주요 포인트 목록 (한국어)',
    qa_desc: '노트 내용을 바탕으로 한 관련 질문과 답변 목록 (한국어)',
    summary_desc: '노트의 전체적인 요약 (한국어)',
    folder_desc:
      '노트를 정리하기 위한 추천 폴더명과 설명 (한국어, 현재 폴더가 비어있는 경우에만). 기존 폴더 목록이 제공되면 먼저 그 목록에서 적절한 폴더를 찾아 선택하세요. 만약 목록에 적절한 폴더가 없다면 새로운 폴더명을 추천해주세요.',
    folder_name_desc:
      '노트 내용을 가장 잘 나타내는 폴더명. 기존 폴더 목록이 제공되면 먼저 그 목록에서 적절한 폴더를 찾아 선택하세요. 만약 목록에 적절한 폴더가 없다면 새로운 폴더명을 추천해주세요.',
    folder_description_desc: '이 폴더의 목적과 내용을 설명하는 간단한 설명',
    tags_desc:
      '노트 내용을 가장 잘 나타내는 추천 태그 목록 (한국어, 현재 태그가 비어있는 경우에만)',
  },
  ja: {
    system:
      'あなたはノートの内容を要約し、情報を整理する専門家です。与えられたノートの内容を日本語で構造化された形式で要約してください。フォルダやタグが空の場合のみ、適切なものを提案してください。既存のフォルダリストが提供されている場合は、まずそのリストから適切なフォルダを探して再利用してください。もしリストに適切なフォルダがない場合は、新しいフォルダを提案してください。',
    function_description:
      'ノートの内容を日本語で構造化された形式で要約します。フォルダとタグが空の場合のみ提案します。既存のフォルダリストが提供されている場合は、まずそのリストから適切なフォルダを探して再利用してください。もしリストに適切なフォルダがない場合は、新しいフォルダを提案してください。',
    main_points_desc: 'ノートの主なポイントのリスト（日本語）',
    qa_desc: 'ノートの内容に基づく関連する質問と回答のリスト（日本語）',
    summary_desc: 'ノートの全体的な要約（日本語）',
    folder_desc:
      'ノートを整理するための推奨フォルダ名と説明（日本語、現在のフォルダが空の場合のみ）。既存のフォルダリストが提供されている場合は、まずそのリストから適切なフォルダを探して選択してください。もしリストに適切なフォルダがない場合は、新しいフォルダ名を提案してください。',
    folder_name_desc:
      'ノートの内容を最もよく表すフォルダ名。既存のフォルダリストが提供されている場合は、まずそのリストから適切なフォルダを探して選択してください。もしリストに適切なフォルダがない場合は、新しいフォルダ名を提案してください。',
    folder_description_desc: 'このフォルダの目的と内容を説明する簡単な説明',
    tags_desc:
      'ノートの内容を最もよく表す推奨タグのリスト（日本語、現在のタグが空の場合のみ）',
  },
  zh: {
    system:
      '您是一位笔记内容摘要和信息整理专家。请以中文结构化的形式总结给定笔记的内容。仅在文件夹或标签为空时，建议合适的选项。如果提供了现有文件夹列表，首先尝试从该列表中查找并重用合适的文件夹。如果列表中没有合适的文件夹，则建议一个新文件夹。',
    function_description:
      '以中文结构化形式总结笔记内容。仅在文件夹或标签为空时提供建议。如果提供了现有文件夹列表，首先尝试从该列表中查找并重用合适的文件夹。如果列表中没有合适的文件夹，则建议一个新文件夹。',
    main_points_desc: '笔记的主要要点列表（中文）',
    qa_desc: '基于笔记内容的相关问题和答案列表（中文）',
    summary_desc: '笔记的整体摘要（中文）',
    folder_desc:
      '建议用于整理笔记的文件夹名称和说明（中文，仅在当前文件夹为空时）。如果提供了现有文件夹列表，首先尝试从该列表中查找并选择合适的文件夹。如果列表中没有合适的文件夹，则建议一个新的文件夹名称。',
    folder_name_desc:
      '最能代表笔记内容的文件夹名称。如果提供了现有文件夹列表，首先尝试从该列表中查找并选择合适的文件夹。如果列表中没有合适的文件夹，则建议一个新的文件夹名称。',
    folder_description_desc: '说明此文件夹目的和内容的简短描述',
    tags_desc: '最能代表笔记内容的建议标签列表（中文，仅在当前标签为空时）',
  },
  es: {
    system:
      'Eres un experto en resumir contenido de notas y organizar información. Por favor, proporciona un resumen estructurado del contenido de la nota dada en español. Sugiere carpeta y etiquetas solo si están vacías. Si se proporciona una lista de carpetas existentes, primero intenta encontrar y reutilizar una carpeta apropiada de esa lista. Si no existe una carpeta apropiada en la lista, entonces sugiere una nueva carpeta.',
    function_description:
      'Resume el contenido de la nota en un formato estructurado en español. Sugiere carpeta y etiquetas solo si están vacías. Si se proporciona una lista de carpetas existentes, primero intenta encontrar y reutilizar una carpeta apropiada de esa lista. Si no existe una carpeta apropiada en la lista, entonces sugiere una nueva carpeta.',
    main_points_desc: 'Lista de puntos principales de la nota en español',
    qa_desc:
      'Lista de preguntas y respuestas relevantes basadas en el contenido de la nota en español',
    summary_desc: 'Resumen general de la nota en español',
    folder_desc:
      'Nombre y descripción de carpeta sugeridos para organizar esta nota en español (solo si la carpeta actual está vacía). Si se proporciona una lista de carpetas existentes, primero intenta encontrar y seleccionar una carpeta apropiada de esa lista. Si no existe una carpeta apropiada en la lista, entonces sugiere un nuevo nombre de carpeta.',
    folder_name_desc:
      'Nombre de la carpeta que mejor representa el contenido de la nota. Si se proporciona una lista de carpetas existentes, primero intenta encontrar y seleccionar de esa lista. Si no existe una carpeta apropiada, sugiere un nuevo nombre de carpeta.',
    folder_description_desc:
      'Breve descripción que explica el propósito y contenido de esta carpeta',
    tags_desc:
      'Lista de etiquetas sugeridas que mejor representan el contenido de la nota en español (solo si las etiquetas actuales están vacías)',
  },
  fr: {
    system:
      "Vous êtes un expert en résumé de contenu de notes et en organisation d'informations. Veuillez fournir un résumé structuré du contenu de la note donnée en français. Suggérez un dossier et des étiquettes uniquement s'ils sont vides. Si une liste de dossiers existants est fournie, essayez d'abord de trouver et de réutiliser un dossier approprié de cette liste. Si aucun dossier approprié n'existe dans la liste, suggérez alors un nouveau dossier.",
    function_description:
      "Résume le contenu de la note dans un format structuré en français. Suggère un dossier et des étiquettes uniquement s'ils sont vides. Si une liste de dossiers existants est fournie, essayez d'abord de trouver et de réutiliser un dossier approprié de cette liste. Si aucun dossier approprié n'existe dans la liste, suggérez alors un nouveau dossier.",
    main_points_desc: 'Liste des points principaux de la note en français',
    qa_desc:
      'Liste des questions et réponses pertinentes basées sur le contenu de la note en français',
    summary_desc: 'Résumé général de la note en français',
    folder_desc:
      "Nom et description du dossier suggérés pour organiser cette note en français (uniquement si le dossier actuel est vide). Si une liste de dossiers existants est fournie, essayez d'abord de trouver et de sélectionner un dossier approprié dans cette liste. Si aucun dossier approprié n'existe dans la liste, suggérez alors un nouveau nom de dossier.",
    folder_name_desc:
      "Nom du dossier qui représente le mieux le contenu de la note. Si une liste de dossiers existants est fournie, essayez d'abord de trouver et de sélectionner dans cette liste. Si aucun dossier approprié n'existe, suggérez un nouveau nom de dossier.",
    folder_description_desc:
      'Brève description expliquant le but et le contenu de ce dossier',
    tags_desc:
      "Liste d'étiquettes suggérées qui représentent le mieux le contenu de la note en français (uniquement si les étiquettes actuelles sont vides)",
  },
  de: {
    system:
      'Sie sind ein Experte für die Zusammenfassung von Notizen und die Organisation von Informationen. Bitte geben Sie eine strukturierte Zusammenfassung des gegebenen Notizinhaltes auf Deutsch. Schlagen Sie Ordner und Tags nur vor, wenn sie leer sind. Wenn eine Liste vorhandener Ordner bereitgestellt wird, versuchen Sie zuerst, einen geeigneten Ordner aus dieser Liste zu finden und wiederzuverwenden. Wenn kein geeigneter Ordner in der Liste existiert, schlagen Sie dann einen neuen Ordner vor.',
    function_description:
      'Fasst den Notizinhalt in einem strukturierten Format auf Deutsch zusammen. Schlägt Ordner und Tags nur vor, wenn sie leer sind. Wenn eine Liste vorhandener Ordner bereitgestellt wird, versuchen Sie zuerst, einen geeigneten Ordner aus dieser Liste zu finden und wiederzuverwenden. Wenn kein geeigneter Ordner in der Liste existiert, schlagen Sie dann einen neuen Ordner vor.',
    main_points_desc: 'Liste der Hauptpunkte der Notiz auf Deutsch',
    qa_desc:
      'Liste relevanter Fragen und Antworten basierend auf dem Notizinhalt auf Deutsch',
    summary_desc: 'Gesamtzusammenfassung der Notiz auf Deutsch',
    folder_desc:
      'Vorgeschlagener Ordnername und Beschreibung zur Organisation dieser Notiz auf Deutsch (nur wenn der aktuelle Ordner leer ist). Wenn eine Liste vorhandener Ordner bereitgestellt wird, versuchen Sie zuerst, einen geeigneten Ordner aus dieser Liste zu finden und auszuwählen. Wenn kein geeigneter Ordner in der Liste existiert, schlagen Sie dann einen neuen Ordnernamen vor.',
    folder_name_desc:
      'Name des Ordners, der den Notizinhalt am besten repräsentiert. Wenn eine Liste vorhandener Ordner bereitgestellt wird, versuchen Sie zuerst, aus dieser Liste zu finden und auszuwählen. Wenn kein geeigneter Ordner existiert, schlagen Sie einen neuen Ordnernamen vor.',
    folder_description_desc:
      'Kurze Beschreibung, die den Zweck und Inhalt dieses Ordners erklärt',
    tags_desc:
      'Liste vorgeschlagener Tags, die den Notizinhalt am besten repräsentieren auf Deutsch (nur wenn die aktuellen Tags leer sind)',
  },
};
