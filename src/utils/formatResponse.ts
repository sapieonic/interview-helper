/**
 * Formats a response text by highlighting code blocks
 * @param text The response text to format
 * @returns HTML string with highlighted code blocks
 */
export const formatResponseWithCodeHighlighting = (text: string): string => {
  // Replace code blocks with HTML that includes styling
  return text.replace(/```([\s\S]*?)```/g, 
    '<div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 12px 0; position: relative; font-family: monospace; font-size: 0.875rem;">' +
    '<div style="color: #2563eb; font-size: 0.75rem; font-weight: bold; margin-bottom: 4px;">Code Sample (skipped in speech)</div>' +
    '$&' +
    '</div>'
  );
};

export default formatResponseWithCodeHighlighting; 