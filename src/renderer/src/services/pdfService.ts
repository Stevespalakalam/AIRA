// This assumes pdfjsLib is loaded from a CDN and available globally.
declare const pdfjsLib: any;

export const extractTextFromPage = async (pdfDoc: any, pageNum: number): Promise<string> => {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(' ');
  } catch (error) {
    console.error("Error extracting text from PDF page:", error);
    return "";
  }
};
