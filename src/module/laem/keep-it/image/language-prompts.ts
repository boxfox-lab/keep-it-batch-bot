export const LANGUAGE_PROMPTS = {
  en: {
    system:
      'You are an expert in analyzing and summarizing image content. Please provide a structured analysis of the given image in English.',
    function_description:
      'Analyzes the image content in a structured format in English.',
    main_points_desc:
      'List of main points and key elements visible in the image',
    qa_desc:
      'List of relevant questions and answers about the image content and details',
    summary_desc: 'Overall description and analysis of the image',
  },
  ko: {
    system:
      '당신은 이미지 내용을 분석하고 요약하는 전문가입니다. 주어진 이미지를 한국어로 구조화된 형태로 분석해주세요.',
    function_description:
      '이미지의 내용을 한국어로 구조화된 형태로 분석합니다.',
    main_points_desc: '이미지에서 보이는 주요 포인트와 핵심 요소 목록',
    qa_desc: '이미지 내용과 세부사항에 대한 관련 질문과 답변 목록',
    summary_desc: '이미지의 전체적인 설명과 분석',
  },
  ja: {
    system:
      'あなたは画像の内容を分析し、要約する専門家です。与えられた画像を日本語で構造化された形式で分析してください。',
    function_description: '画像の内容を日本語で構造化された形式で分析します。',
    main_points_desc: '画像に表示されている主なポイントと重要な要素のリスト',
    qa_desc: '画像の内容と詳細に関する関連する質問と回答のリスト',
    summary_desc: '画像の全体的な説明と分析',
  },
  zh: {
    system:
      '您是一位图像内容分析和摘要专家。请以中文结构化的形式分析给定图像。',
    function_description: '以中文结构化形式分析图像内容。',
    main_points_desc: '图像中可见的主要要点和关键元素列表',
    qa_desc: '关于图像内容和细节的相关问题和答案列表',
    summary_desc: '图像的整体描述和分析',
  },
};
