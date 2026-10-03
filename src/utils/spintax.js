export function resolveSpintaxClient(text) {
  let result = text || '';
  const regex = /(?<!\{)\{([^{}]+?\|[^{}]+?)\}(?!\})/g;
  while (regex.test(result)) {
    result = result.replace(regex, (_, choices) => {
      const parts = choices.split('|');
      return parts[Math.floor(Math.random() * parts.length)];
    });
  }
  return result;
}

